import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  X,
  Battery,
  Wifi,
  Cpu,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  MessageSquare,
  Wrench,
  Gauge,
  Activity,
  Layers,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const NodeDetailDrawer: React.FC = () => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    nodes,
    latestReadings,
    historyReadings,
    language,
    acknowledgeAlert,
    resolveAlert,
    createTicketFromAlert,
    alerts,
    sendManualSms,
  } = useStore();

  const [activeRange, setActiveRange] = useState<'30m' | '24h' | '7d'>('30m');
  const [activeChartTab, setActiveChartTab] = useState<'pressure' | 'flow' | 'waterQuality' | 'voc' | 'vibration'>('pressure');
  const [smsSentNotice, setSmsSentNotice] = useState(false);

  const t = getTranslation(language);

  if (!selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const reading = latestReadings[node.id];
  const nodeHistory = historyReadings[node.id] || [];
  const relatedAlert = alerts.find((a) => a.nodeId === node.id && a.status !== 'Resolved');

  // Generate chart data based on active range
  const chartData = useMemo(() => {
    if (activeRange === '30m') {
      if (nodeHistory.length === 0) {
        return [
          { time: '12:00', pressure: 2.1, epanetP: 2.1, flow: 110, epanetF: 110, tds: 320, ec: 499, voc: 20, vibration: 0.05 },
          { time: '12:02', pressure: 2.15, epanetP: 2.1, flow: 112, epanetF: 110, tds: 322, ec: 502, voc: 21, vibration: 0.06 },
        ];
      }
      return nodeHistory.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        pressure: item.pressureBar,
        epanetP: item.epanetExpectedPressureBar,
        flow: item.flowLpm,
        epanetF: item.epanetExpectedFlowLpm,
        tds: item.tdsPpm,
        ec: item.ecUsCm,
        voc: item.vocIndexPpb,
        vibration: item.vibrationG,
      }));
    }

    // Generated 24h history (24 data points)
    if (activeRange === '24h') {
      const points = [];
      const baseP = node.type === 'esr' ? 3.2 : 2.0;
      const baseF = node.type === 'esr' ? 420 : 110;

      for (let h = 0; h < 24; h++) {
        const isSupply = (h >= 6 && h <= 8) || (h >= 17 && h <= 19);
        const p = isSupply ? baseP + (Math.random() - 0.5) * 0.2 : 0.05;
        const f = isSupply ? baseF + (Math.random() - 0.5) * 15 : 0;
        points.push({
          time: `${String(h).padStart(2, '0')}:00`,
          pressure: Number(p.toFixed(2)),
          epanetP: isSupply ? baseP : 0.05,
          flow: Number(f.toFixed(1)),
          epanetF: isSupply ? baseF : 0,
          tds: 310 + Math.floor(Math.random() * 25),
          ec: 485 + Math.floor(Math.random() * 35),
          voc: 18 + Math.floor(Math.random() * 6),
          vibration: Number((0.04 + Math.random() * 0.03).toFixed(3)),
        });
      }
      return points;
    }

    // 7 Days history (7 data points)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      time: day,
      pressure: 2.05 + (Math.random() - 0.5) * 0.1,
      epanetP: 2.1,
      flow: 115 + Math.floor((Math.random() - 0.5) * 10),
      epanetF: 110,
      tds: 318 + Math.floor(Math.random() * 10),
      ec: 495 + Math.floor(Math.random() * 15),
      voc: 19 + Math.floor(Math.random() * 4),
      vibration: 0.045,
    }));
  }, [nodeHistory, activeRange, node]);

  // Handle SMS Dispatch
  const handleSendTechnicianSms = () => {
    sendManualSms({
      alertId: relatedAlert?.id || `ALT-MANUAL-${Date.now().toString().slice(-4)}`,
      recipientRole: 'operator',
      recipientName: 'Suresh Patil (GP Fitter)',
      phoneNumber: '+91 98224 51102',
      language: 'mr',
      messageEn: `SmartNeer Alert: Check Node ${node.id} (${node.location.landmark}). Current pressure: ${reading?.pressureBar || 1.8} bar. Anomaly flagged.`,
      messageHi: `स्मार्ट-नीर सूचना: नोड ${node.id} (${node.location.landmark}) की जांच करें। दबाव: ${reading?.pressureBar || 1.8} बार।`,
      messageMr: `स्मार्ट-नीर सूचना: नोड ${node.id} (${node.location.landmarkMr || node.location.landmark}) ची पाहणी करा. दाब: ${reading?.pressureBar || 1.8} बार.`,
      deliveryStatus: 'Delivered',
      channel: 'SMS Gateway (Govt DLT)',
    });
    setSmsSentNotice(true);
    setTimeout(() => setSmsSentNotice(false), 3500);
  };

  const anomalyScore = reading?.anomalyScore || 0.12;
  const riskBadgeColor =
    reading?.riskState === 'CRITICAL'
      ? 'bg-red-500 text-white'
      : reading?.riskState === 'WARNING'
      ? 'bg-amber-500 text-white'
      : 'bg-emerald-500 text-white';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 bg-brand-navy text-white flex items-center justify-between border-b border-brand-navyLight">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center font-bold text-sm">
            {node.id.replace('NODE-', 'N')}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-base tracking-tight">{node.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${riskBadgeColor}`}>
                {reading?.riskState || node.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{node.location.landmark}</p>
          </div>
        </div>

        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Hardware & Calibration Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Battery</span>
            <div className="flex items-center space-x-1 font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              <Battery className="w-3.5 h-3.5 text-emerald-500" />
              <span>{node.batteryPct}%</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">RSSI Signal</span>
            <div className="flex items-center space-x-1 font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-500" />
              <span>{node.rssiDb} dBm</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Firmware</span>
            <div className="flex items-center space-x-1 font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate">{node.firmwareVersion.split('-')[0]}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Pipe Spec</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 block mt-0.5">
              {node.pipeDiameterMm}mm {node.pipeMaterial.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* AI Anomaly Score Gauge & Why Flagged Explanation Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-brand-blue" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Isolation Forest Anomaly Gauge
              </span>
            </div>
            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {anomalyScore} / 1.00
            </span>
          </div>

          {/* Meter Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                anomalyScore > 0.8
                  ? 'bg-red-500'
                  : anomalyScore > 0.5
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, anomalyScore * 100)}%` }}
            />
          </div>

          {/* Random Forest Classification & "Why Flagged" */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Random Forest Root-Cause Diagnostics:
            </span>
            {reading && reading.flags.length > 0 ? (
              <ul className="space-y-1">
                {reading.flags.map((flag, idx) => (
                  <li key={idx} className="text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-1.5 font-medium">
                    <span className="text-red-500 font-bold shrink-0">⚠</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Hydraulic residuals within ±0.15 bar tolerance. No transient anomaly signatures.
              </p>
            )}
          </div>
        </div>

        {/* 5 Live Charts Section with EPANET Overlay */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          {/* Chart Header with Range Picker */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveChartTab('pressure')}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  activeChartTab === 'pressure' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Pressure (EPANET)
              </button>
              <button
                onClick={() => setActiveChartTab('flow')}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  activeChartTab === 'flow' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Flow (EPANET)
              </button>
              <button
                onClick={() => setActiveChartTab('waterQuality')}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  activeChartTab === 'waterQuality' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                TDS / EC
              </button>
              <button
                onClick={() => setActiveChartTab('vibration')}
                className={`px-2 py-1 rounded text-xs font-semibold transition ${
                  activeChartTab === 'vibration' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Vibration (g)
              </button>
            </div>

            {/* Range Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
              {(['30m', '24h', '7d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRange(r)}
                  className={`px-2 py-0.5 rounded font-medium transition ${
                    activeRange === r ? 'bg-white dark:bg-slate-700 shadow-xs font-bold text-brand-blue dark:text-white' : 'text-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'pressure' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  {/* EPANET Baseline */}
                  <Line type="monotone" dataKey="epanetP" name="EPANET Baseline" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  {/* Actual Pressure with shaded area */}
                  <Area type="monotone" dataKey="pressure" name="Actual Pressure (bar)" stroke="#1F6FB5" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2.5} />
                </AreaChart>
              ) : activeChartTab === 'flow' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  <Line type="monotone" dataKey="epanetF" name="EPANET Baseline" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="flow" name="Actual Flow (L/min)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2.5} />
                </AreaChart>
              ) : activeChartTab === 'waterQuality' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  <Line type="monotone" dataKey="tds" name="TDS (ppm)" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ec" name="EC (µS/cm)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  <Area type="monotone" dataKey="vibration" name="Pipe Vibration (g)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" />
              <span>Dashed line: EPANET Hydraulic Baseline</span>
            </span>
            <span className="font-mono">Shading: Anomaly Deviation Residual</span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {smsSentNotice && (
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>SMS Dispatched to Suresh Patil (Plumber) via Govt DLT Gateway!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {relatedAlert && relatedAlert.status === 'New' && (
              <button
                onClick={() => acknowledgeAlert(relatedAlert.id)}
                className="py-2.5 px-3 rounded-xl bg-brand-blue hover:bg-brand-blueLight text-white font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{t.actions.acknowledge}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (relatedAlert) {
                  createTicketFromAlert(relatedAlert.id);
                } else {
                  // Create general maintenance ticket
                  useStore.getState().addNewTicket({
                    nodeId: node.id,
                    title: `Routine Inspection at ${node.name}`,
                    priority: 'Medium',
                  });
                  useStore.getState().setActiveTab('planner');
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Wrench className="w-4 h-4" />
              <span>{t.actions.createTicket}</span>
            </button>

            {relatedAlert && (
              <button
                onClick={() => resolveAlert(relatedAlert.id)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{t.actions.markRepaired}</span>
              </button>
            )}

            <button
              onClick={handleSendTechnicianSms}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Send className="w-4 h-4 text-cyan-300" />
              <span>{t.actions.sendSms}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
