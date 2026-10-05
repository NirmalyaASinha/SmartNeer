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
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import {
  Waves,
  AlertOctagon,
  Zap,
  Info,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { HISTORICAL_TRANSIENT_EVENTS } from '../../mock/seedData';

export const WaveformViewer: React.FC = () => {
  const { transientWaveform, triggerScenario } = useStore();
  const [selectedEventId, setSelectedEventId] = useState<string>('TR-901');

  // Find max peak in waveform
  const peakPoint = transientWaveform.reduce(
    (max, pt) => (pt.pressureBar > max.pressureBar ? pt : max),
    transientWaveform[0] || { pressureBar: 3.5, timeOffsetMs: 1800 }
  );

  const baseline = 3.5;
  const multiplier = Number((peakPoint.pressureBar / baseline).toFixed(2));

  // Format data for chart (sample every 2 points = 500 points for smooth DOM rendering)
  const chartData = transientWaveform
    .filter((_, idx) => idx % 2 === 0)
    .map((pt) => ({
      timeSec: Number((pt.timeOffsetMs / 1000).toFixed(2)),
      pressure: pt.pressureBar,
      isPeak: pt.timeOffsetMs === peakPoint.timeOffsetMs,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Waves className="w-6 h-6 text-brand-blue" />
            High-Frequency Hydraulic Transient & Water Hammer Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Piezo-resistive pressure transducer sampled at 100 Hz (10,000 ms sliding window) to capture destructive Joukowsky pressure shocks.
          </p>
        </div>

        <button
          onClick={() => triggerScenario('WATER_HAMMER')}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
        >
          <Zap className="w-4 h-4" />
          <span>Trigger Real-Time Surge Shock</span>
        </button>
      </div>

      {/* KPI Cards for Current Transient */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Transient Peak Surge</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {peakPoint.pressureBar} <span className="text-xs font-normal text-slate-500">bar</span>
          </div>
          <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
            {multiplier}× Above Baseline ({baseline} bar)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Waveform Rise Time</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            &lt; 0.42 <span className="text-xs font-normal text-slate-500">seconds</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
            Joukowsky Shock Velocity ~980 m/s
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Root-Cause Analysis</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            Pump Power Trip
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Grid voltage dip + fast non-return closure
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Pipe Stress Vulnerability</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            92% <span className="text-xs font-normal text-slate-500">of hoop limit</span>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
            HDPE PN-6 design limit: 6.0 bar
          </p>
        </div>
      </div>

      {/* 100 Hz Interactive Waveform Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              10-Second 100 Hz Transient Pressure Waveform (Node 02 Rising Main)
            </h3>
            <p className="text-[11px] text-slate-500">
              High-rate pressure sensor capture demonstrating damped harmonic pressure wave oscillation
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center gap-1 font-mono text-red-500 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping-slow"></span>
              Peak: {peakPoint.pressureBar} bar @ {(peakPoint.timeOffsetMs / 1000).toFixed(2)}s
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="timeSec"
                unit="s"
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                unit=" bar"
                domain={[0, 9]}
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                formatter={(val) => [`${val} bar`, 'Pressure']}
                labelFormatter={(label) => `Time: ${label}s`}
              />
              {/* Nominal Baseline */}
              <ReferenceLine y={baseline} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Nominal Baseline (3.5 bar)', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
              {/* HDPE PN-6 Rating Limit */}
              <ReferenceLine y={6.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'HDPE PN-6 Pipe Burst Limit (6.0 bar)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />

              <Line
                type="monotone"
                dataKey="pressure"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Transient Events & Engineering Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Transient Events Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Recent Transient Events Log
          </h3>

          <div className="space-y-2">
            {HISTORICAL_TRANSIENT_EVENTS.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedEventId === evt.id
                    ? 'border-brand-blue bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {evt.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Node: {evt.nodeId}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      evt.severity === 'Severe'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {evt.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(evt.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Cause: <strong>{evt.probableCause}</strong></span>
                  <span className="font-mono text-red-600 font-bold">
                    Peak: {evt.peakPressureBar} bar ({evt.peakMultiplier}x)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Engineering Countermeasures & Mitigation Advisory */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Prescribed Countermeasures & Surge Protection
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                1. Staggered Pump Deceleration Ramp (VFD)
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Increase motor soft-stop ramp down from 3 seconds to 25 seconds. Prevents immediate separation of the water column in the rising main.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                2. Install Bladder Surge Vessel at Pump House
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Pre-charged nitrogen bladder surge vessel (200 Litres, 2.8 bar pre-charge) dampens pressure oscillation by absorbing positive peaks and replenishing sub-atmospheric dips.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                3. Kinetic Air-Relief Vacuum Breaker Valves
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Install dual-orifice air release valves at peak topological summits (Node 04, Node 08) to avoid pipe vacuum collapse and prevent back-siphonage ingress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
