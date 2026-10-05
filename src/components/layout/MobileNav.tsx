import React from 'react';
import { useStore, ActiveTab } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  LayoutDashboard,
  MapPin,
  BellRing,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, language, alerts } = useStore();
  const t = getTranslation(language);

  const activeAlertsCount = alerts.filter((a) => a.status === 'New').length;

  const mobileTabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'gisMap', label: 'Map', icon: MapPin },
    { id: 'alerts', label: 'Alerts', icon: BellRing },
    { id: 'planner', label: 'Planner', icon: Wrench },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center">
      {mobileTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-semibold transition relative ${
              isActive
                ? 'text-brand-blue dark:text-cyan-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" />
              {tab.id === 'alerts' && activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {activeAlertsCount}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* Extra menu tab for remaining features */}
      <button
        onClick={() => setActiveTab('systemHealth')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
          activeTab === 'systemHealth' || activeTab === 'analytics' || activeTab === 'transients' || activeTab === 'quality'
            ? 'text-brand-blue dark:text-cyan-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <MoreHorizontal className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
};
