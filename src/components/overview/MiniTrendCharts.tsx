import React from 'react';
import { useStore } from '../../store';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Gauge, Droplet, FlaskConical } from 'lucide-react';

export const MiniTrendCharts: React.FC = () => {
  const { historyReadings, nodes } = useStore();

  // Aggregate time series across all nodes
  const node01History = historyReadings['NODE-01'] || [];

  const trendData = node01History.map((pt, idx) => {
    // Calculate aggregate village stats at this index
    let totalFlow = 0;
    let avgPressure = 0;
    let avgTds = 0;
    let count = 0;

    for (const node of nodes) {
      const nodePts = historyReadings[node.id];
      if (nodePts && nodePts[idx]) {
        totalFlow += nodePts[idx].flowLpm;
        avgPressure += nodePts[idx].pressureBar;
        avgTds += nodePts[idx].tdsPpm;
        count++;
      }
    }

    const timeLabel = new Date(pt.timestamp).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      time: timeLabel,
      pressure: count > 0 ? Number((avgPressure / count).toFixed(2)) : 2.1,
      expectedPressure: 2.1,
      flow: count > 0 ? Math.round(totalFlow) : 410,
      tds: count > 0 ? Math.round(avgTds / count) : 320,
    };
  });

  // Fallback if empty history yet
  const displayData = trendData.length > 0 ? trendData : [
    { time: '12:00', pressure: 2.1, flow: 420, tds: 315 },
    { time: '12:02', pressure: 2.15, flow: 425, tds: 318 },
    { time: '12:04', pressure: 2.08, flow: 418, tds: 312 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Village Pressure Trend */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-brand-blue" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Village Avg Pressure
            </span>
          </div>
          <span className="text-[11px] font-mono text-brand-blue dark:text-cyan-400 font-semibold">
            {displayData[displayData.length - 1]?.pressure} bar
          </span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="pressure" stroke="#1F6FB5" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Total Flow Trend */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Total Village Inflow
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
            {displayData[displayData.length - 1]?.flow} L/min
          </span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="flow" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Average TDS Trend */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Average Water TDS
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            {displayData[displayData.length - 1]?.tds} ppm
          </span>
        </div>
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="tds" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
