export type UserRole = 'operator' | 'vwsc' | 'sarpanch' | 'engineer';

export type Language = 'en' | 'hi' | 'mr';

export type NodeType = 'esr' | 'pump_house' | 'gateway' | 'router' | 'leaf';

export type RiskState = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export type EventType =
  | 'Normal Flow'
  | 'Background Leak'
  | 'Burst'
  | 'Water Hammer'
  | 'Contamination Ingress'
  | 'Unauthorized Tapping'
  | 'Node Disconnected';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertStatus = 'New' | 'Acknowledged' | 'Resolved';

export type TicketStatus = 'Open' | 'In Progress' | 'Fixed';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface NodeLocation {
  lat: number;
  lng: number;
  elevationM: number;
  landmark: string;
  landmarkHi: string;
  landmarkMr: string;
}

export interface SensorNode {
  id: string; // e.g. "NODE-01"
  name: string;
  nameHi: string;
  nameMr: string;
  type: NodeType;
  zone: 'Zone A (North)' | 'Zone B (Central)' | 'Zone C (Tail-End)' | 'ESR Core';
  location: NodeLocation;
  parentRouterId?: string; // For mesh routing
  firmwareVersion: string;
  installedDate: string;
  lastCalibratedDate: string;
  pipeDiameterMm: number;
  pipeMaterial: 'HDPE PN-6' | 'PVC Class-3' | 'DI K-9';
  status: RiskState;
  batteryPct: number;
  rssiDb: number;
  isOnline: boolean;
  activeEventType: EventType;
}

export interface NodeTelemetry {
  nodeId: string;
  timestamp: string; // ISO string
  pressureBar: number;
  flowLpm: number;
  tdsPpm: number;
  ecUsCm: number;
  vocIndexPpb: number;
  vibrationG: number;
  batteryPct: number;
  rssiDb: number;
  epanetExpectedPressureBar: number;
  epanetExpectedFlowLpm: number;
  anomalyScore: number; // 0.00 to 1.00 (Isolation Forest)
  riskState: RiskState; // Random Forest
  eventType: EventType;
  flags: string[];
}

export interface PipeSegment {
  id: string; // e.g. "SEG-01"
  fromNodeId: string;
  toNodeId: string;
  lengthMeters: number;
  diameterMm: number;
  material: string;
  roughnessC: number; // Hazen-Williams C factor
  currentRisk: RiskState;
  hasLeak: boolean;
  leakConfidencePct?: number;
  estimatedLeakOffsetPct?: number; // 0 to 100 along the pipe from fromNodeId
}

export interface Alert {
  id: string;
  timestamp: string;
  nodeId: string;
  segmentId?: string;
  severity: AlertSeverity;
  type: EventType;
  riskState: RiskState;
  status: AlertStatus;
  confidencePct: number;
  title: string;
  titleHi: string;
  titleMr: string;
  description: string;
  descriptionHi: string;
  descriptionMr: string;
  locationDescription: string;
  locationDescriptionHi: string;
  locationDescriptionMr: string;
  telemetrySnapshot: {
    pressureBar: number;
    expectedPressureBar: number;
    flowLpm: number;
    expectedFlowLpm: number;
    anomalyScore: number;
  };
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  timeToDetectSec: number;
  timeToResolveSec?: number;
  assignedTo?: string;
}

export interface SMSLog {
  id: string;
  alertId: string;
  recipientRole: UserRole;
  recipientName: string;
  phoneNumber: string;
  language: Language;
  messageEn: string;
  messageHi: string;
  messageMr: string;
  sentAt: string;
  deliveryStatus: 'Sent' | 'Delivered' | 'Failed';
  channel: 'SMS Gateway (Govt DLT)' | 'WhatsApp Business API';
}

export interface Ticket {
  id: string;
  alertId?: string;
  title: string;
  nodeId: string;
  segmentId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTechnician: string;
  assignedTechnicianPhone: string;
  createdAt: string;
  targetResolutionDate: string;
  notes: string[];
  photoPlaceholderUrl?: string;
  costEstimateInr: number;
}

export interface EpanetBaseline {
  nodeId: string;
  hourOfDay: number; // 0 to 23
  isSupplyOn: boolean;
  expectedPressureBar: number;
  tolerancePressureBar: number;
  expectedFlowLpm: number;
  toleranceFlowLpm: number;
}

export interface GatewayStatus {
  gatewayId: string; // "RPI4-GP-SHIVRAJPUR-01"
  model: string;
  cpuPercent: number;
  ramPercent: number;
  temperatureC: number;
  uptimeHours: number;
  isCloudConnected: boolean; // Internet state
  queuedRecordsCount: number;
  mqttBrokerHost: string;
  epanetEngineStatus: 'Active' | 'Calibrating' | 'Degraded';
  isolationForestStatus: 'Active' | 'Retraining' | 'Degraded';
  rfClassifierStatus: 'Active' | 'Retraining' | 'Degraded';
  lastCloudSyncTimestamp: string;
  packetDropRatePct: number;
}

export interface TransientDataPoint {
  timeOffsetMs: number; // 0 to 10,000 (100 Hz = 1000 points)
  pressureBar: number;
  isPeak: boolean;
}

export interface TransientEvent {
  id: string;
  timestamp: string;
  nodeId: string;
  peakPressureBar: number;
  baselinePressureBar: number;
  peakMultiplier: number;
  durationMs: number;
  probableCause: 'Pump Trip' | 'Rapid Valve Closure' | 'Air Release Defect';
  severity: 'Severe' | 'Moderate' | 'Mild';
  recommendations: string[];
  waveform: TransientDataPoint[];
}

export interface VillageKpis {
  totalNodes: number;
  onlineNodes: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  warningAlertsCount: number;
  currentTotalFlowLpm: number;
  villageAvgPressureBar: number;
  villageAvgTdsPpm: number;
  isSupplyWindowActive: boolean;
  nextSupplyTimeText: string;
  countdownToNextSupply: string;
  waterLostTodayLiters: number;
  moneyLostTodayInr: number;
  waterSavedThisMonthLiters: number;
  moneySavedThisMonthInr: number;
  tariffPerKiloliterInr: number;
  nrwPercent: number; // Non-Revenue Water %
  meanTimeToDetectMinutes: number;
  meanTimeToRepairHours: number;
  pumpingHoursSavedMonth: number;
  electricityCostSavedMonthInr: number;
}

export interface SimulationControlState {
  currentScenario:
    | 'NORMAL'
    | 'LEAK_SMALL'
    | 'BURST'
    | 'WATER_HAMMER'
    | 'CONTAMINATION'
    | 'NIGHT_MNF_LEAK'
    | 'NODE_FAILURE';
  simulatedTimeOverride?: string;
  burstNodeId?: string;
  leakSegmentId?: string;
  offlineNodeId?: string;
}
