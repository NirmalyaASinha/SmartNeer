import React from 'react';
import { useStore } from '../../store';
import { StatusBanner } from './StatusBanner';
import { KpiGrid } from './KpiGrid';
import { MiniTrendCharts } from './MiniTrendCharts';
import { LiveAlertFeed } from './LiveAlertFeed';
import { GisNetworkMap } from '../map/GisNetworkMap';
import { ArrowUpRight, Radio, Battery, Wifi, ExternalLink } from 'lucide-react';

export const LiveOverviewPage: React.FC = () => {
  const { nodes, setSelectedNodeId, latestReadings, currentRole, setActiveTab } = useStore();

  const isOperator = currentRole === 'operator';

  return (
    <div className="space-y-4">
      {/* 1. Top Village Status Banner */}
      <StatusBanner />

      {/* 2. KPI Cards Grid */}
      <KpiGrid />

      {/* 3. Center Section: GIS Map (60%) + Live Alert Feed (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container (approx 60-65% width on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Interactive Village GIS Pipeline Network</span>
              <span className="text-[10px] font-mono text-slate-400">
                (Click nodes/pipes for telemetry)
              </span>
            </h3>

            <button
              onClick={() => setActiveTab('gisMap')}
              className="text-xs text-brand-blue dark:text-cyan-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Full Screen Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <GisNetworkMap />
        </div>

        {/* Live Alert Feed (approx 35-40% width) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <LiveAlertFeed />
        </div>
      </div>

      {/* 4. Bottom Section: 3 Small Live Line Charts (Last 30 min) */}
      <div className="pt-1">
        <MiniTrendCharts />
      </div>

      {/* 5. Simplified Node Summary Table for Pump Operator */}
      {isOperator && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Pump Operator Sensor Nodes Quick Status (18 Nodes)
            </h3>
            <span className="text-xs text-slate-500 font-medium">Field Operator View</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {nodes.map((node) => {
              const reading = latestReadings[node.id];
              const isCrit = node.status === 'CRITICAL';
              const isWarn = node.status === 'WARNING';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isCrit
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-300'
                      : isWarn
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {node.id}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        isCrit ? 'bg-red-500 text-white' : isWarn ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {node.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[170px] mt-0.5">
                      {node.name}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {reading ? `${reading.pressureBar} bar` : '2.1 bar'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {reading ? `${reading.flowLpm} L/m` : '110 L/m'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
