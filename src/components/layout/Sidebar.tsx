import React from 'react';
import { useStore, ActiveTab } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  LayoutDashboard,
  MapPin,
  BellRing,
  Waves,
  FlaskConical,
  BarChart3,
  Wrench,
  Cpu,
  Layers,
  ChevronRight, BrainCircuit,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  id: ActiveTab;
  labelKey: keyof typeof import('../../utils/translations').translations.en.nav;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    labelKey: 'overview',
    icon: LayoutDashboard,
    allowedRoles: ['operator', 'vwsc', 'sarpanch', 'engineer'],
  },
  {
    id: 'gisMap',
    labelKey: 'gisMap',
    icon: MapPin,
    allowedRoles: ['operator', 'vwsc', 'sarpanch', 'engineer'],
  },
  {
    id: 'alerts',
    labelKey: 'alerts',
    icon: BellRing,
    allowedRoles: ['operator', 'vwsc', 'sarpanch', 'engineer'],
  },
  {
    id: 'transients',
    labelKey: 'transients',
    icon: Waves,
    allowedRoles: ['engineer'],
    badge: '100Hz',
  },
  {
    id: 'quality',
    labelKey: 'quality',
    icon: FlaskConical,
    allowedRoles: ['vwsc', 'sarpanch', 'engineer'],
  },
  {
    id: 'analytics',
    labelKey: 'analytics',
    icon: BarChart3,
    allowedRoles: ['sarpanch', 'engineer'],
  },
  {
    id: 'planner',
    labelKey: 'planner',
    icon: Wrench,
    allowedRoles: ['operator', 'vwsc', 'sarpanch', 'engineer'],
  },
  {
    id: 'aiPlanning',
    labelKey: 'aiPlanning',
    icon: BrainCircuit,
    allowedRoles: ['sarpanch', 'engineer'],
  },
  {
    id: 'systemHealth',
    labelKey: 'systemHealth',
    icon: Cpu,
    allowedRoles: ['vwsc', 'engineer'],
  },
];

export const Sidebar: React.FC = () => {
  const { currentRole, activeTab, setActiveTab, language, alerts, gatewayStatus } = useStore();
  const t = getTranslation(language);

  const activeAlertsCount = alerts.filter((a) => a.status === 'New').length;
  const filteredItems = NAV_ITEMS.filter((item) => item.allowedRoles.includes(currentRole));

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      {/* Role Pill Banner */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
          <span className="truncate">Role: <strong className="text-brand-blue dark:text-cyan-400">{t.roles[currentRole]}</strong></span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const label = t.nav[item.labelKey];

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                }`} />
                <span className="truncate">{label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {item.id === 'alerts' && activeAlertsCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    {activeAlertsCount}
                  </span>
                )}
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Gateway Telemetry Mini Widget at bottom */}
      <div className="p-3 m-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
          <span>EDGE RPi 4</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {gatewayStatus.cpuPercent}% CPU
          </span>
        </div>
        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
          <span>EPANET Twin:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Synchronized</span>
        </div>
        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between mt-0.5">
          <span>Anomaly Engine:</span>
          <span className="font-semibold text-brand-blue dark:text-cyan-400">Isolation Forest</span>
        </div>
      </div>
    </aside>
  );
};
