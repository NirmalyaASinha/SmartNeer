import { create } from 'zustand';
import {
  UserRole,
  Language,
  SensorNode,
  PipeSegment,
  Alert,
  Ticket,
  SMSLog,
  GatewayStatus,
  NodeTelemetry,
  VillageKpis,
  SimulationControlState,
  TransientDataPoint,
} from '../types';
import {
  INITIAL_NODES,
  INITIAL_PIPE_SEGMENTS,
  INITIAL_ALERTS,
  INITIAL_TICKETS,
  INITIAL_SMS_LOGS,
  INITIAL_GATEWAY_STATUS,
  HISTORICAL_TRANSIENT_EVENTS,
} from '../mock/seedData';
import { simulator, SimulatorEvent } from '../mock/simulator';
import { getNextSupplyWindowInfo, isWaterSupplyScheduled } from '../mock/epanetBaselines';
import { soundManager } from '../utils/audio';

export type ActiveTab =
  | 'overview'
  | 'gisMap'
  | 'alerts'
  | 'transients'
  | 'quality'
  | 'analytics'
  | 'planner'
  | 'systemHealth'
  | 'aiPlanning';

interface AppStore {
  // Navigation & Role
  currentRole: UserRole;
  language: Language;
  activeTab: ActiveTab;
  darkMode: boolean;
  isDemoControlsOpen: boolean;
  isRolePickerOpen: boolean;
  soundAlertsEnabled: boolean;

  // Selected entities
  selectedNodeId: string | null;
  selectedSegmentId: string | null;

  // State data
  nodes: SensorNode[];
  pipeSegments: PipeSegment[];
  alerts: Alert[];
  tickets: Ticket[];
  smsLogs: SMSLog[];
  gatewayStatus: GatewayStatus;
  latestReadings: Record<string, NodeTelemetry>;
  historyReadings: Record<string, NodeTelemetry[]>; // Last 30-45 readings per node
  transientWaveform: TransientDataPoint[];

  // Edge offline sync simulation
  isEdgeOffline: boolean;
  isSyncingToCloud: boolean;
  queuedSyncRecords: number;

  // Financial & KPI configs
  tariffPerKiloliterInr: number;
  scenarioState: SimulationControlState;

  // Toasts
  activeToast: { id: string; title: string; message: string; severity: 'CRITICAL' | 'WARNING' | 'INFO' } | null;

  // Actions
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: ActiveTab) => void;
  toggleDarkMode: () => void;
  toggleDemoControls: (open?: boolean) => void;
  toggleRolePicker: (open?: boolean) => void;
  toggleSoundAlerts: () => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedSegmentId: (id: string | null) => void;
  setTariffRate: (rate: number) => void;

  // Operation Actions
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  createTicketFromAlert: (alertId: string) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  addNewTicket: (ticket: Partial<Ticket>) => void;
  sendManualSms: (sms: Omit<SMSLog, 'id' | 'sentAt'>) => void;

  // Offline Sync Toggle
  toggleEdgeOfflineMode: () => void;

  // Demo Controls
  triggerScenario: (scenario: SimulationControlState['currentScenario']) => void;
  resetAllToNormal: () => void;

  // Getters
  getVillageKpis: () => VillageKpis;
  dismissToast: () => void;
}

export const useStore = create<AppStore>((set, get) => {
  // Initialize dark mode from localStorage or system preference
  const initialDarkMode =
    typeof window !== 'undefined'
      ? localStorage.getItem('smartneer_theme') === 'dark' ||
        (!('smartneer_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : false;

  return {
    currentRole: 'engineer', // Default to District Engineer for rich initial evaluation
    language: 'en',
    activeTab: 'overview',
    darkMode: initialDarkMode,
    isDemoControlsOpen: false,
    isRolePickerOpen: false,
    soundAlertsEnabled: true,

    selectedNodeId: null,
    selectedSegmentId: null,

    nodes: INITIAL_NODES,
    pipeSegments: INITIAL_PIPE_SEGMENTS,
    alerts: INITIAL_ALERTS,
    tickets: INITIAL_TICKETS,
    smsLogs: INITIAL_SMS_LOGS,
    gatewayStatus: INITIAL_GATEWAY_STATUS,
    latestReadings: {},
    historyReadings: {},
    transientWaveform: simulator.getTransientWaveform(),

    isEdgeOffline: false,
    isSyncingToCloud: false,
    queuedSyncRecords: 0,

    tariffPerKiloliterInr: 18.5,
    scenarioState: simulator.getScenarioState(),

    activeToast: null,

    setRole: (role) => set({ currentRole: role }),
    setLanguage: (lang) => set({ language: lang }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    toggleDarkMode: () => {
      const nextMode = !get().darkMode;
      if (typeof window !== 'undefined') {
        if (nextMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('smartneer_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('smartneer_theme', 'light');
        }
      }
      set({ darkMode: nextMode });
    },

    toggleDemoControls: (open) =>
      set((state) => ({ isDemoControlsOpen: open !== undefined ? open : !state.isDemoControlsOpen })),

    toggleRolePicker: (open) =>
      set((state) => ({ isRolePickerOpen: open !== undefined ? open : !state.isRolePickerOpen })),

    toggleSoundAlerts: () => {
      const next = !get().soundAlertsEnabled;
      soundManager.setMuted(!next);
      set({ soundAlertsEnabled: next });
    },

    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setSelectedSegmentId: (id) => set({ selectedSegmentId: id }),
    setTariffRate: (rate) => set({ tariffPerKiloliterInr: rate }),

    acknowledgeAlert: (alertId) => {
      soundManager.playAcknowledgeChime();
      set((state) => ({
        alerts: state.alerts.map((alt) =>
          alt.id === alertId ? { ...alt, status: 'Acknowledged', acknowledgedAt: new Date().toISOString() } : alt
        ),
      }));
    },

    resolveAlert: (alertId) => {
      set((state) => ({
        alerts: state.alerts.map((alt) =>
          alt.id === alertId
            ? {
                ...alt,
                status: 'Resolved',
                resolvedAt: new Date().toISOString(),
                timeToResolveSec: Math.round((Date.now() - new Date(alt.detectedAt).getTime()) / 1000),
              }
            : alt
        ),
      }));
    },

    createTicketFromAlert: (alertId) => {
      const alert = get().alerts.find((a) => a.id === alertId);
      if (!alert) return;

      const newTicket: Ticket = {
        id: `TCK-${Date.now().toString().slice(-4)}`,
        alertId: alert.id,
        title: `Repair ${alert.type} at ${alert.locationDescription.split('-')[0].trim()}`,
        nodeId: alert.nodeId,
        segmentId: alert.segmentId,
        status: 'Open',
        priority: alert.severity === 'CRITICAL' ? 'Emergency' : 'High',
        assignedTechnician: 'Suresh Patil (GP Fitter)',
        assignedTechnicianPhone: '+91 98224 51102',
        createdAt: new Date().toISOString(),
        targetResolutionDate: 'Today, within 4 hours',
        notes: [
          `Auto-created from Alert ${alert.id} (${alert.title}).`,
          `Detected at: ${new Date(alert.detectedAt).toLocaleTimeString()}`,
          `Confidence: ${alert.confidencePct}%`,
        ],
        costEstimateInr: alert.severity === 'CRITICAL' ? 2400 : 850,
      };

      set((state) => ({
        tickets: [newTicket, ...state.tickets],
        activeTab: 'planner',
      }));
    },

    updateTicketStatus: (ticketId, status) => {
      set((state) => ({
        tickets: state.tickets.map((tck) => (tck.id === ticketId ? { ...tck, status } : tck)),
      }));
    },

    addNewTicket: (ticket) => {
      const fullTicket: Ticket = {
        id: `TCK-${Date.now().toString().slice(-4)}`,
        title: ticket.title || 'Pipeline Inspection',
        nodeId: ticket.nodeId || 'NODE-01',
        segmentId: ticket.segmentId,
        status: ticket.status || 'Open',
        priority: ticket.priority || 'Medium',
        assignedTechnician: ticket.assignedTechnician || 'Suresh Patil (GP Fitter)',
        assignedTechnicianPhone: ticket.assignedTechnicianPhone || '+91 98224 51102',
        createdAt: new Date().toISOString(),
        targetResolutionDate: ticket.targetResolutionDate || 'Tomorrow',
        notes: ticket.notes || ['Manual maintenance request'],
        costEstimateInr: ticket.costEstimateInr || 500,
      };
      set((state) => ({ tickets: [fullTicket, ...state.tickets] }));
    },

    sendManualSms: (smsData) => {
      const newSms: SMSLog = {
        ...smsData,
        id: `SMS-${Date.now().toString().slice(-4)}`,
        sentAt: new Date().toISOString(),
      };
      set((state) => ({
        smsLogs: [newSms, ...state.smsLogs],
      }));
    },

    toggleEdgeOfflineMode: () => {
      const currentlyOffline = get().isEdgeOffline;

      if (!currentlyOffline) {
        // Go offline
        set({
          isEdgeOffline: true,
          gatewayStatus: {
            ...get().gatewayStatus,
            isCloudConnected: false,
          },
        });
      } else {
        // Go online with sync animation
        set({ isSyncingToCloud: true });

        // Countdown sync interval
        const initialQueue = get().queuedSyncRecords;
        let remaining = initialQueue;
        const syncInterval = window.setInterval(() => {
          remaining = Math.max(0, remaining - Math.ceil(initialQueue / 6));
          set({ queuedSyncRecords: remaining });

          if (remaining <= 0) {
            clearInterval(syncInterval);
            set({
              isEdgeOffline: false,
              isSyncingToCloud: false,
              queuedSyncRecords: 0,
              gatewayStatus: {
                ...get().gatewayStatus,
                isCloudConnected: true,
                lastCloudSyncTimestamp: new Date().toISOString(),
              },
            });
          }
        }, 300);
      }
    },

    triggerScenario: (scenario) => {
      simulator.setScenario(scenario);
      set({ scenarioState: simulator.getScenarioState() });
    },

    resetAllToNormal: () => {
      simulator.setScenario('NORMAL');
      set({
        scenarioState: simulator.getScenarioState(),
        selectedNodeId: null,
        selectedSegmentId: null,
      });
    },

    dismissToast: () => set({ activeToast: null }),

    getVillageKpis: () => {
      const { nodes, alerts, latestReadings, tariffPerKiloliterInr, scenarioState } = get();
      const now = new Date();
      const isSupplyOn = scenarioState.currentScenario === 'NIGHT_MNF_LEAK' ? false : isWaterSupplyScheduled(now);
      const supplyInfo = getNextSupplyWindowInfo(now);

      const totalNodes = nodes.length;
      const onlineNodes = nodes.filter((n) => n.status !== 'OFFLINE').length;
      const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');
      const criticalCount = activeAlerts.filter((a) => a.severity === 'CRITICAL').length;
      const warningCount = activeAlerts.filter((a) => a.severity === 'WARNING').length;

      // Sum current flow
      let totalFlow = 0;
      let pressureSum = 0;
      let tdsSum = 0;
      let count = 0;

      for (const node of nodes) {
        const reading = latestReadings[node.id];
        if (reading) {
          totalFlow += reading.flowLpm;
          pressureSum += reading.pressureBar;
          tdsSum += reading.tdsPpm;
          count++;
        }
      }

      const avgPressure = count > 0 ? Number((pressureSum / count).toFixed(2)) : 2.1;
      const avgTds = count > 0 ? Math.round(tdsSum / count) : 320;

      // Water lost calculation: base leak flow + burst flow (in Liters)
      let leakFlowMultiplier = 1.0;
      if (scenarioState.currentScenario === 'BURST') leakFlowMultiplier = 3.8;
      else if (scenarioState.currentScenario === 'LEAK_SMALL') leakFlowMultiplier = 1.6;

      const waterLostTodayLiters = Math.round(1850 * leakFlowMultiplier);
      const moneyLostTodayInr = Math.round((waterLostTodayLiters / 1000) * tariffPerKiloliterInr);

      // Monthly savings by early detection
      const waterSavedThisMonthLiters = 485000; // 485 kL saved
      const moneySavedThisMonthInr = Math.round((waterSavedThisMonthLiters / 1000) * tariffPerKiloliterInr);

      return {
        totalNodes,
        onlineNodes,
        activeAlertsCount: activeAlerts.length,
        criticalAlertsCount: criticalCount,
        warningAlertsCount: warningCount,
        currentTotalFlowLpm: Math.round(totalFlow),
        villageAvgPressureBar: avgPressure,
        villageAvgTdsPpm: avgTds,
        isSupplyWindowActive: isSupplyOn,
        nextSupplyTimeText: supplyInfo.nextTimeStr,
        countdownToNextSupply: supplyInfo.countdownStr,
        waterLostTodayLiters,
        moneyLostTodayInr,
        waterSavedThisMonthLiters,
        moneySavedThisMonthInr,
        tariffPerKiloliterInr,
        nrwPercent: scenarioState.currentScenario === 'BURST' ? 24.8 : 12.4,
        meanTimeToDetectMinutes: 2.4,
        meanTimeToRepairHours: 3.1,
        pumpingHoursSavedMonth: 42,
        electricityCostSavedMonthInr: 16800,
      };
    },
  };
});

// Subscribe Zustand store to real-time simulator events
export function initializeSimulatorBridge() {
  const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
  ws.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data);
      const store = useStore.getState();
      if (event.type === 'TELEMETRY_BATCH') {
        const updatedNodes = store.nodes.map((node) => {
          const reading = event.readings[node.id];
          if (!reading) return node;
          return { ...node, status: reading.riskState, isOnline: reading.riskState !== 'OFFLINE', activeEventType: reading.eventType };
        });
        useStore.setState({ nodes: updatedNodes, latestReadings: event.readings });
      }
    } catch (e) {}
  };
  ws.onclose = () => setTimeout(initializeSimulatorBridge, 5000);
  return;

  simulator.subscribe((event: SimulatorEvent) => {
    const store = useStore.getState();

    if (event.type === 'TELEMETRY_BATCH') {
      const updatedNodes = store.nodes.map((node) => {
        const reading = event.readings[node.id];
        if (!reading) return node;
        return {
          ...node,
          status: reading.riskState,
          isOnline: reading.riskState !== 'OFFLINE',
          activeEventType: reading.eventType,
        };
      });

      // Update pipe segment risk if connected nodes have high anomaly
      const updatedSegments = store.pipeSegments.map((seg) => {
        const fromNode = updatedNodes.find((n) => n.id === seg.fromNodeId);
        const toNode = updatedNodes.find((n) => n.id === seg.toNodeId);

        let risk: PipeSegment['currentRisk'] = 'NORMAL';
        let hasLeak = false;
        let confidence = 0;

        if (
          (seg.id === 'SEG-14' && store.scenarioState.currentScenario === 'BURST') ||
          (fromNode?.status === 'CRITICAL' && toNode?.status === 'CRITICAL')
        ) {
          risk = 'CRITICAL';
          hasLeak = true;
          confidence = 96;
        } else if (
          (seg.id === 'SEG-14' && store.scenarioState.currentScenario === 'LEAK_SMALL') ||
          (seg.id === 'SEG-05') ||
          fromNode?.status === 'WARNING' ||
          toNode?.status === 'WARNING'
        ) {
          risk = 'WARNING';
          hasLeak = true;
          confidence = 82;
        }

        return {
          ...seg,
          currentRisk: risk,
          hasLeak,
          leakConfidencePct: hasLeak ? confidence : undefined,
          estimatedLeakOffsetPct: hasLeak ? 48 : undefined,
        };
      });

      // Append to history buffer
      const newHistory: Record<string, NodeTelemetry[]> = { ...store.historyReadings };
      for (const [nodeId, reading] of Object.entries(event.readings)) {
        const list = newHistory[nodeId] ? [...newHistory[nodeId], reading] : [reading];
        // Keep max 45 points (~1.5 minutes live stream)
        newHistory[nodeId] = list.slice(-45);
      }

      // If Edge Offline, accumulate sync queue
      let newQueue = store.queuedSyncRecords;
      if (store.isEdgeOffline) {
        newQueue += Object.keys(event.readings).length;
      }

      useStore.setState({
        nodes: updatedNodes,
        pipeSegments: updatedSegments,
        latestReadings: event.readings,
        historyReadings: newHistory,
        queuedSyncRecords: newQueue,
      });
    } else if (event.type === 'NEW_ALERT') {
      if (store.soundAlertsEnabled && event.alert.severity === 'CRITICAL') {
        soundManager.playCriticalAlertBeep();
      }

      useStore.setState({
        alerts: [event.alert, ...store.alerts],
        activeToast: {
          id: event.alert.id,
          title: `${event.alert.severity}: ${event.alert.title}`,
          message: event.alert.locationDescription,
          severity: event.alert.severity,
        },
      });
    } else if (event.type === 'NEW_SMS') {
      useStore.setState({
        smsLogs: [event.sms, ...store.smsLogs],
      });
    } else if (event.type === 'TRANSIENT_SPIKE') {
      useStore.setState({
        transientWaveform: event.waveform,
      });
    } else if (event.type === 'SCENARIO_CHANGED') {
      useStore.setState({
        scenarioState: simulator.getScenarioState(),
      });
    }
  });

  simulator.start();
}
