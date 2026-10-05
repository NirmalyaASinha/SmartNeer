"""
Smart-Neer (स्मार्ट-नीर) Edge Gateway API Backend (Production)
"""

import asyncio
import json
import math
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from .database import users_collection, nodes_collection, telemetry_collection, alerts_collection, tickets_collection, db
from .models import UserCreate, UserInDB, Token, TokenData, AlertCreate, TicketCreate, AIPlanRequest, AIPlanResponse
from .auth import get_password_hash, verify_password, create_access_token, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI(
    title="Smart-Neer Edge Gateway API",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationState:
    def __init__(self):
        self.scenario: str = "NORMAL"
        self.active_clients: Set[WebSocket] = set()

state = SimulationState()

# Predefined Nodes Setup
NODE_BASELINES = {
    "NODE-01": {"p_on": 3.2, "p_tol": 0.25, "f_on": 420.0, "name": "ESR Main Tank Outlet", "type": "esr"},
    "NODE-02": {"p_on": 3.5, "p_tol": 0.30, "f_on": 440.0, "name": "Raw Water Pump House", "type": "pump_house"},
    "NODE-03": {"p_on": 2.9, "p_tol": 0.20, "f_on": 390.0, "name": "Gram Panchayat Edge Gateway Hub", "type": "gateway"},
    "NODE-04": {"p_on": 2.6, "p_tol": 0.20, "f_on": 180.0, "name": "North Main Distribution Junction", "type": "router"},
    "NODE-05": {"p_on": 2.3, "p_tol": 0.18, "f_on": 120.0, "name": "Gaothan North Ward Sub-branch", "type": "leaf"},
    "NODE-06": {"p_on": 1.9, "p_tol": 0.15, "f_on": 75.0, "name": "Maruti Galli Flow Meter", "type": "leaf"},
    "NODE-07": {"p_on": 1.4, "p_tol": 0.15, "f_on": 40.0, "name": "North Anganwadi Tail-End", "type": "leaf"},
    "NODE-08": {"p_on": 2.5, "p_tol": 0.22, "f_on": 210.0, "name": "Central Bazar Peth Junction", "type": "router"},
    "NODE-09": {"p_on": 2.2, "p_tol": 0.18, "f_on": 140.0, "name": "Primary Health Centre (PHC) Node", "type": "leaf"},
    "NODE-10": {"p_on": 1.8, "p_tol": 0.15, "f_on": 90.0, "name": "ZP High School Compound Node", "type": "leaf"},
    "NODE-11": {"p_on": 1.5, "p_tol": 0.14, "f_on": 60.0, "name": "Chhatrapati Shivaji Chowk Junction", "type": "leaf"},
    "NODE-12": {"p_on": 1.1, "p_tol": 0.12, "f_on": 35.0, "name": "West Ward Tail-End Post", "type": "leaf"},
    "NODE-13": {"p_on": 2.4, "p_tol": 0.20, "f_on": 160.0, "name": "South Sector Distribution Router", "type": "router"},
    "NODE-14": {"p_on": 2.0, "p_tol": 0.18, "f_on": 110.0, "name": "Ambedkar Nagar Main Road Branch", "type": "leaf"},
    "NODE-15": {"p_on": 1.6, "p_tol": 0.15, "f_on": 70.0, "name": "Samata Nagar Crossline Junction", "type": "leaf"},
    "NODE-16": {"p_on": 1.2, "p_tol": 0.14, "f_on": 45.0, "name": "Krishi Seva Kendra Branch", "type": "leaf"},
    "NODE-17": {"p_on": 0.9, "p_tol": 0.12, "f_on": 28.0, "name": "South Wasti Tail-End Terminal", "type": "leaf"},
    "NODE-18": {"p_on": 0.8, "p_tol": 0.10, "f_on": 22.0, "name": "East Agricultural Farmland Standpost", "type": "leaf"},
}

@app.on_event("startup")
async def startup_event():
    # Seed default users if empty
    admin = await users_collection.find_one({"username": "admin"})
    if not admin:
        default_users = [
            {"username": "admin", "email": "admin@smartneer.in", "role": "DISTRICT_ENGINEER", "hashed_password": get_password_hash("admin123")},
            {"username": "sarpanch", "email": "sarpanch@smartneer.in", "role": "SARPANCH", "hashed_password": get_password_hash("sarpanch123")},
            {"username": "operator", "email": "operator@smartneer.in", "role": "PUMP_OPERATOR", "hashed_password": get_password_hash("operator123")}
        ]
        await users_collection.insert_many(default_users)
    
    # Seed nodes if empty
    node_count = await nodes_collection.count_documents({})
    if node_count == 0:
        docs = [{"node_id": k, **v} for k, v in NODE_BASELINES.items()]
        await nodes_collection.insert_many(docs)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    return {"username": current_user["username"], "email": current_user["email"], "role": current_user["role"]}

def is_supply_active(dt: datetime) -> bool:
    t = dt.hour + dt.minute / 60.0
    return (6.0 <= t <= 8.5) or (17.0 <= t <= 19.0)

def generate_telemetry_batch() -> Dict[str, dict]:
    now = datetime.now(timezone.utc)
    supply_on = is_supply_active(now)
    readings = {}
    
    for node_id, cfg in NODE_BASELINES.items():
        base_p = cfg["p_on"] if supply_on else 0.05
        base_f = cfg["f_on"] if supply_on else 0.0
        p = max(0.01, base_p + (random.random() - 0.5) * 0.08)
        f = max(0.0, base_f + (random.random() - 0.5) * 3.0)
        tds = 310 + int(math.sin(now.timestamp() / 15 + hash(node_id) % 10) * 15)
        
        readings[node_id] = {
            "nodeId": node_id,
            "timestamp": now.isoformat(),
            "pressureBar": round(p, 2),
            "flowLpm": round(f, 1),
            "tdsPpm": tds,
            "ecUsCm": int(tds * 1.56),
            "vocIndexPpb": 18 + int(random.random() * 6),
            "vibrationG": round(0.04 + random.random() * 0.03, 3),
            "batteryPct": 92 if node_id != "NODE-12" else 65,
            "rssiDb": -58 if node_id != "NODE-07" else -78,
            "epanetExpectedPressureBar": round(base_p, 2),
            "epanetExpectedFlowLpm": round(base_f, 1),
            "anomalyScore": round(0.08 + random.random() * 0.08, 2),
            "riskState": "NORMAL",
            "eventType": "Normal Flow",
            "flags": [],
        }
    return readings

@app.get("/api/nodes")
async def get_nodes(current_user: dict = Depends(get_current_active_user)):
    nodes = await nodes_collection.find().to_list(100)
    for n in nodes:
        n["id"] = n["node_id"]
        del n["_id"]
    return nodes

@app.get("/api/telemetry")
async def get_telemetry(current_user: dict = Depends(get_current_active_user)):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "readings": generate_telemetry_batch(),
    }

@app.get("/api/kpis")
async def get_kpis(current_user: dict = Depends(get_current_active_user)):
    readings = generate_telemetry_batch()
    total_flow = sum(r["flowLpm"] for r in readings.values())
    avg_pressure = sum(r["pressureBar"] for r in readings.values()) / len(readings)
    return {
        "totalNodes": len(NODE_BASELINES),
        "onlineNodes": len(NODE_BASELINES),
        "totalFlowLpm": round(total_flow, 1),
        "avgPressureBar": round(avg_pressure, 2),
        "criticalAlerts": 0,
        "warningAlerts": 0,
        "activeScenario": "NORMAL",
        "isSupplyActive": is_supply_active(datetime.now(timezone.utc)),
    }

@app.post("/api/ai/plan", response_model=AIPlanResponse)
async def ai_plan(req: AIPlanRequest, current_user: dict = Depends(get_current_active_user)):
    # Mock AI endpoint for Planning tab
    plan = f"Based on the query '{req.query}', the AI suggests extending the pipeline by 200m towards the East agricultural sector. The estimated cost is ₹1,20,000, and it will serve 45 new households. The required pipes are 90mm HDPE."
    return {"plan": plan}

@app.websocket("/ws/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket):
    await websocket.accept()
    state.active_clients.add(websocket)
    try:
        while True:
            batch = generate_telemetry_batch()
            message = {
                "type": "TELEMETRY_BATCH",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "scenario": state.scenario,
                "readings": batch,
            }
            await websocket.send_text(json.dumps(message))
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        state.active_clients.remove(websocket)
    except Exception as e:
        if websocket in state.active_clients:
            state.active_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
