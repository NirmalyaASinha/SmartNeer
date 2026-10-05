import React from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Clock,
  ArrowRight,
  Wrench,
  Check,
} from 'lucide-react';
import { AlertSeverity } from '../../types';

export const LiveAlertFeed: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    resolveAlert,
    setSelectedNodeId,
    language,
    currentRole,
    createTicketFromAlert,
  } = useStore();
  const t = getTranslation(language);

  // Newest on top
  const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Live Alert Feed ({activeAlerts.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Edge Event Bus</span>
      </div>

      {/* Alert List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[360px] lg:max-h-[460px]">
        {activeAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Active Pipeline Alerts</p>
            <p className="text-[11px] text-slate-400">All 18 sensor nodes operating within baseline tolerances</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isAcknowledged = alert.status === 'Acknowledged';

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                  isCritical
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center space-x-1.5">
                      {isCritical ? (
                        <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span className={`text-[11px] font-bold ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {alert.type}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-white/70 dark:bg-black/40 text-slate-700 dark:text-slate-300">
                        {alert.confidencePct}% Conf
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {alert.title}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {alert.locationDescription}
                  </p>
                </div>

                {/* Telemetry pill */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    P: <strong className="text-slate-900 dark:text-white">{alert.telemetrySnapshot.pressureBar} bar</strong> | ML: {alert.telemetrySnapshot.anomalyScore}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {alert.status === 'New' && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2 py-1 rounded bg-brand-blue hover:bg-brand-blueLight text-white font-medium text-[10px] transition"
                      >
                        {t.actions.acknowledge}
                      </button>
                    )}

                    {isAcknowledged && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-brand-blue dark:text-cyan-300 font-semibold text-[10px]">
                        Ack'd
                      </span>
                    )}

                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] transition"
                      title="Mark as Repaired"
                    >
                      {t.actions.markRepaired}
                    </button>

                    <button
                      onClick={() => setSelectedNodeId(alert.nodeId)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Inspect Node"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
