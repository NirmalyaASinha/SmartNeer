import React from 'react';
import { Activity, ShieldCheck, Terminal, Heart } from 'lucide-react';
import { useStore } from '../../store';

export const Footer: React.FC = () => {
  const { gatewayStatus, isEdgeOffline } = useStore();

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        {/* Left: Branding & Hackathon tag */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Activity className="w-4 h-4 text-brand-blue" />
            <span>Smart-Neer</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            @TRISHULI | Smart India Hackathon 2026 | PS 26254
          </span>
        </div>

        {/* Center/Right: Edge Gateway Status & Security */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 font-mono">
            <span className={`w-2 h-2 rounded-full ${isEdgeOffline ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
            Edge: {gatewayStatus.gatewayId} ({gatewayStatus.temperatureC.toFixed(1)}°C)
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            EPANET v2.2 Engine & Random Forest Guard Active
          </span>
        </div>
      </div>
    </footer>
  );
};
