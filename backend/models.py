from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str # PUMP_OPERATOR, VWSC_MEMBER, SARPANCH, DISTRICT_ENGINEER

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class NodeBaseline(BaseModel):
    node_id: str
    name: str
    type: str # esr, pump_house, gateway, router, leaf
    p_on: float
    p_tol: float
    f_on: float

class TelemetryReading(BaseModel):
    nodeId: str
    timestamp: str
    pressureBar: float
    flowLpm: float
    tdsPpm: float
    ecUsCm: float
    vocIndexPpb: float
    vibrationG: float
    batteryPct: int
    rssiDb: int
    epanetExpectedPressureBar: float
    epanetExpectedFlowLpm: float
    anomalyScore: float
    riskState: str # NORMAL, WARNING, CRITICAL
    eventType: str
    flags: List[str]

class AlertCreate(BaseModel):
    node_id: str
    type: str
    severity: str
    message: str
    timestamp: str

class TicketCreate(BaseModel):
    title: str
    description: str
    assignee: str
    status: str
    priority: str
    node_id: str

class AIPlanRequest(BaseModel):
    query: str
    context: Optional[str] = None

class AIPlanResponse(BaseModel):
    plan: str
