import React from 'react';
import { useStore } from '../../store';
import {
  Cpu,
  HardDrive,
  Thermometer,
  Clock,
  Wifi,
  Battery,
  CloudOff,
  Cloud,
  CheckCircle,
  Server,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const {
    gatewayStatus,
    nodes,
    isEdgeOffline,
    isSyncingToCloud,
    queuedSyncRecords,
    toggleEdgeOfflineMode,
    latestReadings,
  } = useStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-brand-blue" />
            Edge Gateway Computing &amp; Mesh Telemetry Infrastructure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Hardware health of the Gram Panchayat Raspberry Pi edge unit, painlessMesh router topology, and solar battery endurance.
          </p>
        </div>

        {/* Offline Simulation Button */}
        <button
          onClick={toggleEdgeOfflineMode}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm ${
            isEdgeOffline
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isEdgeOffline ? <CloudOff className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
          <span>{isEdgeOffline ? 'Reconnect to Cloud MQTT' : 'Simulate Internet Outage'}</span>
        </button>
      </div>

      {/* Gateway Hardware Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Raspberry Pi 4 CPU</span>
            <Cpu className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {gatewayStatus.cpuPercent}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-brand-blue h-full"
              style={{ width: `${gatewayStatus.cpuPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Quad-core Cortex-A72 @ 1.5GHz</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>RAM Utilization</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {gatewayStatus.ramPercent}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-500 h-full"
              style={{ width: `${gatewayStatus.ramPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">1.64 GB / 4.00 GB LPDDR4</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>SoC Core Temp</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {gatewayStatus.temperatureC.toFixed(1)}°C
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">
            ✓ Passive aluminum heat-sink optimal
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Continuous Uptime</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {Math.floor(gatewayStatus.uptimeHours / 24)}d {gatewayStatus.uptimeHours % 24}h
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Solar LiFePO4 battery uninterrupted
          </p>
        </div>
      </div>

      {/* Sync Status & Offline Buffer Architecture Box */}
      <div className={`p-4 rounded-xl border transition ${
        isEdgeOffline
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
          : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isEdgeOffline ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
              {isSyncingToCloud ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : isEdgeOffline ? (
                <CloudOff className="w-6 h-6" />
              ) : (
                <Server className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isSyncingToCloud
                  ? 'Active Telemetry Sync in Progress...'
                  : isEdgeOffline
                  ? 'Edge Island Mode Active (Local Gateway Autonomy)'
                  : 'Full Cloud Synchronized (State Jal-Jeevan Cloud Active)'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {isEdgeOffline
                  ? `Internet connection to state datacenter interrupted. Edge Gateway is caching all 18 nodes to local SQLite & Mosquitto buffer (${queuedSyncRecords.toLocaleString()} telemetry packets queued). All ML leak detection continues offline!`
                  : `All readings, alerts, and tickets synced via encrypted MQTT over TLS (Port 8883). SQLite queue depth: 0.`}
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="text-slate-500">Local SQLite Queue:</div>
            <div className="font-extrabold text-base text-slate-900 dark:text-white">
              {queuedSyncRecords.toLocaleString()} records
            </div>
          </div>
        </div>
      </div>

      {/* Mesh Sensor Nodes Battery Health & Predictive Lifetime Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Mesh Telemetry Health &amp; Battery Lifetime Predictor
            </h3>
            <p className="text-[11px] text-slate-500">
              Solar MPPT charging status, ESP-NOW RF link budget, and days left before battery depletion
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600">
            18/18 Transceivers Online
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-2.5 px-3">Node ID</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">RSSI Signal</th>
                <th className="py-2.5 px-3">Battery %</th>
                <th className="py-2.5 px-3">Estimated Days Left</th>
                <th className="py-2.5 px-3">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {nodes.map((n) => {
                const daysLeft = Math.round((n.batteryPct / 100) * 180);
                const isLow = n.batteryPct < 25;

                return (
                  <tr key={n.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {n.id}
                    </td>
                    <td className="py-2.5 px-3 capitalize font-sans text-slate-700 dark:text-slate-300">
                      {n.type.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {n.type === 'leaf' ? 'ESP-NOW (2.4GHz)' : 'painlessMesh (2.4GHz)'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-cyan-500" />
                        {n.rssiDb} dBm
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <Battery className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-emerald-500'}`} />
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}`}>
                          {n.batteryPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-sans">
                      {n.type === 'pump_house' ? (
                        <span className="text-emerald-600 font-bold">Grid Backed</span>
                      ) : (
                        <span>~{daysLeft} days (Solar Top-up)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 font-sans">
                      {n.status === 'OFFLINE' ? (
                        <span className="text-red-500 font-bold">Timeout (&gt;60s)</span>
                      ) : (
                        <span>Just now (&lt;2s)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
