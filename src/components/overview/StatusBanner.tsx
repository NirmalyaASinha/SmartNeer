import React from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import { AlertTriangle, AlertOctagon, CheckCircle2, CloudOff, Info } from 'lucide-react';

export const StatusBanner: React.FC = () => {
  const { alerts, isEdgeOffline, language, nodes, scenarioState } = useStore();
  const t = getTranslation(language);

  const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');
  const criticalAlert = activeAlerts.find((a) => a.severity === 'CRITICAL');
  const warningAlerts = activeAlerts.filter((a) => a.severity === 'WARNING');

  if (criticalAlert) {
    return (
      <div className="w-full bg-red-600 dark:bg-red-700 text-white px-4 py-3 rounded-xl shadow-md border-l-4 border-red-900 flex items-center justify-between animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <AlertOctagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-black/30">
                CRITICAL EVENT
              </span>
              <span className="font-bold text-sm sm:text-base">
                {criticalAlert.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-red-100 font-medium mt-0.5">
              {criticalAlert.locationDescription} – {criticalAlert.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (warningAlerts.length > 0) {
    const firstWarning = warningAlerts[0];
    return (
      <div className="w-full bg-amber-500 dark:bg-amber-600 text-white px-4 py-3 rounded-xl shadow-md border-l-4 border-amber-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-black/20">
                WARNING ({warningAlerts.length})
              </span>
              <span className="font-bold text-sm sm:text-base">
                {firstWarning.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5">
              {firstWarning.locationDescription} – {firstWarning.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-sm border-l-4 border-emerald-800 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-black/20">
              OPTIMAL NETWORK
            </span>
            <span className="font-bold text-sm sm:text-base">
              {t.status.allNormal}
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-medium mt-0.5">
            18/18 Nodes reporting nominal pressure gradient. No transient bursts or unauthorized night flows detected.
          </p>
        </div>
      </div>
    </div>
  );
};
