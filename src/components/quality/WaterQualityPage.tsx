import React, { useState } from 'react';
import { useStore } from '../../store';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import {
  FlaskConical,
  AlertTriangle,
  Droplets,
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowDownCircle,
  Activity,
} from 'lucide-react';

export const WaterQualityPage: React.FC = () => {
  const { nodes, latestReadings, triggerScenario } = useStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('NODE-15');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  const reading = latestReadings[selectedNodeId];

  // 24-hour generated water quality history with repressurization spike event
  const hoursData = Array.from({ length: 24 }).map((_, h) => {
    const isMorningSupply = h >= 6 && h <= 8;
    const isEveningSupply = h >= 17 && h <= 19;
    const isSupplyOn = isMorningSupply || isEveningSupply;

    // Simulate repressurization spike right at 06:00 and 17:00
    let tds = 315;
    let voc = 18;

    if (h === 6) {
      // Repressurization spike! Negative pressure suction from surrounding soil
      tds = 560; // 560 ppm spike (>30% jump)
      voc = 145; // 145 ppb VOC spike
    } else if (h === 7) {
      tds = 390;
      voc = 45;
    } else if (h === 8) {
      tds = 325;
      voc = 20;
    } else if (h === 17) {
      tds = 480;
      voc = 95;
    } else if (h === 18) {
      tds = 340;
      voc = 22;
    } else {
      // Idle / negative pressure hours
      tds = 300 + (Math.sin(h) * 15);
      voc = 15 + (Math.cos(h) * 4);
    }

    return {
      time: `${String(h).padStart(2, '0')}:00`,
      tds: Math.round(tds),
      ec: Math.round(tds * 1.56),
      voc: Math.round(voc),
      isSupplyOn,
      isSpike: h === 6 || h === 17,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-600" />
            Water Quality & Back-Siphonage Contamination Ingress
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time TDS, Electrical Conductivity (EC), and Volatile Organic Compounds (VOC) telemetry for intermittent village distribution.
          </p>
        </div>

        <button
          onClick={() => triggerScenario('CONTAMINATION')}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
        >
          <Zap className="w-4 h-4" />
          <span>Simulate Repressurization Contamination</span>
        </button>
      </div>

      {/* Node Selector Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Select Sensor Node:</span>
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
              selectedNodeId === node.id
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {node.id} ({node.name.split(' ')[0]})
          </button>
        ))}
      </div>

      {/* Current Readings Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Total Dissolved Solids (TDS)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {reading ? reading.tdsPpm : 320} <span className="text-xs font-normal text-slate-500">ppm</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            IS 10500 Safe Limit: &lt; 500 ppm
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Electrical Conductivity (EC)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {reading ? reading.ecUsCm : 499} <span className="text-xs font-normal text-slate-500">µS/cm</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Salinity Indicator Ratio: 1.56
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">VOC Index (Contamination)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {reading ? reading.vocIndexPpb : 21} <span className="text-xs font-normal text-slate-500">ppb</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Baseline: 15–30 ppb (Normal)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Repressurization Risk</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {reading && reading.riskState === 'CRITICAL' ? 'High Contamination Risk' : 'Low Suction Ingress'}
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Vulnerable Segment: SEG-14 &amp; SEG-15
          </p>
        </div>
      </div>

      {/* 24-Hour Trend Chart with Supply Window Highlights */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              24-Hour TDS & VOC Profile with Repressurization Jump Events ({selectedNode.id})
            </h3>
            <p className="text-[11px] text-slate-500">
              Blue shaded zones indicate supply hours (06:00–08:30 &amp; 17:00–19:00). Notice the TDS spike upon valve opening.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> TDS (ppm)
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <span className="w-3 h-0.5 bg-amber-500 inline-block" /> VOC (ppb)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hoursData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              {/* Highlight Morning Supply Window */}
              <ReferenceArea x1="06:00" x2="08:00" fill="#3b82f6" fillOpacity={0.1} label={{ value: 'Morning Supply', fontSize: 10, fill: '#3b82f6', position: 'insideTopLeft' }} />
              {/* Highlight Evening Supply Window */}
              <ReferenceArea x1="17:00" x2="19:00" fill="#3b82f6" fillOpacity={0.1} label={{ value: 'Evening Supply', fontSize: 10, fill: '#3b82f6', position: 'insideTopLeft' }} />
              {/* WHO / BIS Desirable TDS Limit */}
              <ReferenceLine y={500} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'BIS Max Permissible (500 ppm)', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }} />

              <Line type="monotone" dataKey="tds" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="voc" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Educational Illustration Card: Back-Siphonage Phenomenon */}
      <div className="bg-gradient-to-br from-slate-900 to-brand-navy text-white rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-extrabold tracking-wide uppercase">
            Technical Insight: Why Intermittent Water Supply Causes Rural Contamination
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-cyan-300">
              <span className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center text-xs">1</span>
              <span>Supply Shutoff &amp; Drainage</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When the pump stops at 08:30 AM, water drains downhill towards tail-end households. This creates a <strong>sub-atmospheric vacuum (-0.2 to -0.6 bar)</strong> inside the distribution pipe.
            </p>
          </div>

          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-xs">2</span>
              <span>Back-Siphonage Ingress</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              If pipes pass through drainage ditches or submerged puddles, the vacuum sucks dirty soil moisture, agricultural nitrates, and microbial pathogens in through loose joint gaskets.
            </p>
          </div>

          <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-emerald-300">
              <span className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center text-xs">3</span>
              <span>Smart-Neer Early Defense</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              On evening repressurization (17:00), Smart-Neer detects the immediate &gt;30% TDS/EC jump within 60 seconds, auto-flags the ingress segment, and alerts the operator to flush lines before domestic consumption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
