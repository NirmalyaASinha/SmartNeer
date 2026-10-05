"""
Smart-Neer (स्मार्ट-नीर) Edge Gateway API Backend
Smart India Hackathon 2026 | PS 26254 | Team TRISHULI
FastAPI + WebSocket + MQTT Telemetry Server
"""

import asyncio
import json
import math
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Smart-Neer Edge Gateway API",
    description="IoT Rural Water-Pipeline Leak Detection & Hydraulic Health Monitoring Gateway",
    version="2.6.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Simulation & Edge Gateway State
class SimulationState:
    def __init__(self):
        self.scenario: str = "NORMAL"
        self.burst_node_id: Optional[str] = None
        self.scenario_start_time: float = asyncio.get_event_loop().time() if asyncio.get_event_loop().is_running() else 0
        self.active_clients: Set[WebSocket] = set()

state = SimulationState()

# Hydraulic baselines for 18 nodes
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

def is_supply_active(dt: datetime) -> bool:
    t = dt.hour + dt.minute / 60.0
    return (6.0 <= t <= 8.5) or (17.0 <= t <= 19.0)

def generate_telemetry_batch() -> Dict[str, dict]:
    now = datetime.now(timezone.utc)
    supply_on = is_supply_active(now) if state.scenario != "NIGHT_MNF_LEAK" else False
    readings = {}

    for node_id, cfg in NODE_BASELINES.items():
        base_p = cfg["p_on"] if supply_on else 0.05
        base_f = cfg["f_on"] if supply_on else 0.0

        noise_p = (random.random() - 0.5) * 0.08
        noise_f = (random.random() - 0.5) * 3.0

        p = max(0.01, base_p + noise_p)
        f = max(0.0, base_f + noise_f)
        tds = 310 + int(math.sin(now.timestamp() / 15 + hash(node_id) % 10) * 15)
        ec = int(tds * 1.56)
        voc = 18 + int(random.random() * 6)
        vibration = round(0.04 + random.random() * 0.03, 3)
        anomaly_score = round(0.08 + random.random() * 0.08, 2)
        risk_state = "NORMAL"
        event_type = "Normal Flow"
        flags = []

        # Fault scenario overrides
        if state.scenario == "BURST":
            if node_id == "NODE-14":
                p = round(0.18 + random.random() * 0.04, 2)
                f = round(cfg["f_on"] * 1.75, 1)
                vibration = round(0.82 + random.random() * 0.15, 3)
                anomaly_score = 0.98
                risk_state = "CRITICAL"
                event_type = "Burst"
                flags.append("EPANET residual -1.82 bar (Pipe collapse)")
                flags.append("Mass acoustic vibration > 0.8g")
            elif node_id == "NODE-15":
                p = round(0.22 + random.random() * 0.05, 2)
                f = round(12.0 + random.random() * 4.0, 1)
                anomaly_score = 0.86
                risk_state = "CRITICAL"
                event_type = "Burst"
                flags.append("Downstream pressure starvation")

        elif state.scenario == "LEAK_SMALL" and node_id == "NODE-14":
            p = round(max(0.6, base_p - 0.52), 2)
            f = round(base_f + 25.0, 1)
            vibration = 0.28
            anomaly_score = 0.76
            risk_state = "WARNING"
            event_type = "Background Leak"
            flags.append("Developing pinhole leak signature")

        elif state.scenario == "WATER_HAMMER" and node_id == "NODE-02":
            p = round(5.8 + random.random() * 0.6, 2)
            vibration = 0.68
            anomaly_score = 0.96
            risk_state = "CRITICAL"
            event_type = "Water Hammer"
            flags.append("Transient pressure shock > 2x baseline")

        elif state.scenario == "CONTAMINATION" and node_id in ("NODE-14", "NODE-15"):
            tds = 650 + int(random.random() * 50)
            ec = int(tds * 1.62)
            voc = 390 + int(random.random() * 40)
            anomaly_score = 0.93
            risk_state = "CRITICAL"
            event_type = "Contamination Ingress"
            flags.append("Back-siphonage suction: TDS jump +54%")

        elif state.scenario == "NIGHT_MNF_LEAK" and node_id in ("NODE-09", "NODE-10"):
            p = 0.48
            f = 34.0
            anomaly_score = 0.85
            risk_state = "WARNING"
            event_type = "Unauthorized Tapping"
            flags.append("MNF breach: Flow detected during zero-demand window")

        elif state.scenario == "NODE_FAILURE" and node_id == "NODE-04":
            p = 0.0
            f = 0.0
            risk_state = "OFFLINE"
            event_type = "Node Disconnected"
            flags.append("Heartbeat lost (>60s)")

        elif node_id == "NODE-06":
            p = round(max(0.05, base_p - 0.32), 2)
            f = round(base_f + 12.0, 1)
            anomaly_score = 0.68
            risk_state = "WARNING"
            event_type = "Background Leak"
            flags.append("Minor pressure residual (-0.32 bar)")

        readings[node_id] = {
            "nodeId": node_id,
            "timestamp": now.isoformat(),
            "pressureBar": round(p, 2),
            "flowLpm": round(f, 1),
            "tdsPpm": tds,
            "ecUsCm": ec,
            "vocIndexPpb": voc,
            "vibrationG": vibration,
            "batteryPct": 92 if node_id != "NODE-12" else 65,
            "rssiDb": -58 if node_id != "NODE-07" else -78,
            "epanetExpectedPressureBar": round(base_p, 2),
            "epanetExpectedFlowLpm": round(base_f, 1),
            "anomalyScore": anomaly_score,
            "riskState": risk_state,
            "eventType": event_type,
            "flags": flags,
        }

    return readings

# REST Endpoints
@app.get("/")
def get_root():
    return {
        "service": "Smart-Neer Edge Gateway API",
        "team": "TRISHULI (SIH 2026 PS 26254)",
        "village": "Shivrajpur Gram Panchayat, Maharashtra",
        "gateway_id": "RPI4-GP-SHIVRAJPUR-01",
        "status": "online",
        "active_scenario": state.scenario,
        "connected_ws_clients": len(state.active_clients),
        "docs": "/docs",
    }

@app.get("/api/nodes")
def get_nodes():
    return [
        {"id": k, **v} for k, v in NODE_BASELINES.items()
    ]

@app.get("/api/telemetry")
def get_telemetry():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "readings": generate_telemetry_batch(),
    }

@app.get("/api/kpis")
def get_kpis():
    readings = generate_telemetry_batch()
    total_flow = sum(r["flowLpm"] for r in readings.values())
    avg_pressure = sum(r["pressureBar"] for r in readings.values()) / len(readings)
    critical_count = sum(1 for r in readings.values() if r["riskState"] == "CRITICAL")
    warning_count = sum(1 for r in readings.values() if r["riskState"] == "WARNING")

    return {
        "totalNodes": len(NODE_BASELINES),
        "onlineNodes": len(NODE_BASELINES) - (1 if state.scenario == "NODE_FAILURE" else 0),
        "totalFlowLpm": round(total_flow, 1),
        "avgPressureBar": round(avg_pressure, 2),
        "criticalAlerts": critical_count,
        "warningAlerts": warning_count,
        "activeScenario": state.scenario,
        "isSupplyActive": is_supply_active(datetime.now(timezone.utc)),
    }

class ScenarioRequest(BaseModel):
    scenario: str

@app.post("/api/simulate")
def set_scenario(req: ScenarioRequest):
    allowed = ["NORMAL", "LEAK_SMALL", "BURST", "WATER_HAMMER", "CONTAMINATION", "NIGHT_MNF_LEAK", "NODE_FAILURE"]
    if req.scenario not in allowed:
        return {"error": f"Invalid scenario. Allowed: {allowed}"}
    state.scenario = req.scenario
    return {"status": "success", "active_scenario": state.scenario}

# Real-Time WebSocket Streaming Endpoint
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
