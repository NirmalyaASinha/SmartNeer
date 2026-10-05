import React, { useState } from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Clock,
  MessageSquare,
  Search,
  Filter,
  Send,
  Smartphone,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { AlertSeverity, EventType, AlertStatus, Language } from '../../types';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    smsLogs,
    acknowledgeAlert,
    resolveAlert,
    setSelectedNodeId,
    language,
    sendManualSms,
    createTicketFromAlert,
  } = useStore();

  const t = getTranslation(language);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // SMS Panel State
  const [smsLang, setSmsLang] = useState<Language>('mr');
  const [editableTemplate, setEditableTemplate] = useState<string>(
    'SmartNeer CRITICAL: Burst detected at {node} ({location}). Pressure {pressure} bar. Please inspect & shut valve SV-04.'
  );

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity !== 'ALL' && alert.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && alert.status !== selectedStatus) return false;
    if (selectedType !== 'ALL' && alert.type !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        alert.id.toLowerCase().includes(q) ||
        alert.nodeId.toLowerCase().includes(q) ||
        alert.title.toLowerCase().includes(q) ||
        alert.locationDescription.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pipeline Alerts & DLT SMS Dispatch Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automated acoustic leak warnings, burst triages, and multilingual SMS dispatch to field fitters.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            {alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'Resolved').length} Critical
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            {alerts.filter((a) => a.severity === 'WARNING' && a.status !== 'Resolved').length} Warnings
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            {alerts.filter((a) => a.status === 'Resolved').length} Resolved
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Node ID, alert type, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Event Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="Burst">Pipe Burst</option>
            <option value="Background Leak">Background Leak</option>
            <option value="Water Hammer">Water Hammer</option>
            <option value="Contamination Ingress">Contamination Ingress</option>
            <option value="Unauthorized Tapping">Unauthorized Tapping</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Alerts Table (Left 65%) + SMS Dispatch Panel (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Alerts Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Pipeline Incident Log ({filteredAlerts.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Edge Anomaly Engine</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <th className="py-2.5 px-3">Alert ID</th>
                  <th className="py-2.5 px-3">Event & Severity</th>
                  <th className="py-2.5 px-3">Node</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Detect / Resolve</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAlerts.map((alert) => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isWarning = alert.severity === 'WARNING';

                  return (
                    <tr
                      key={alert.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {alert.id}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {alert.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          {alert.locationDescription}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedNodeId(alert.nodeId)}
                          className="font-mono font-bold text-brand-blue dark:text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          {alert.nodeId}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          <span>{alert.confidencePct}%</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">
                        <div>Det: {alert.timeToDetectSec}s</div>
                        {alert.timeToResolveSec && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Res: {Math.round(alert.timeToResolveSec / 60)}m
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alert.status === 'New'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : alert.status === 'Acknowledged'
                              ? 'bg-blue-100 text-brand-blue dark:bg-blue-950/60 dark:text-cyan-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {alert.status === 'New' && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="px-2 py-1 rounded bg-brand-blue hover:bg-brand-blueLight text-white font-medium text-[10px] transition"
                            >
                              Ack
                            </button>
                          )}
                          {alert.status !== 'Resolved' && (
                            <>
                              <button
                                onClick={() => createTicketFromAlert(alert.id)}
                                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[10px] transition"
                                title="Create Maintenance Ticket"
                              >
                                Ticket
                              </button>
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] transition"
                                title="Mark Repaired"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: SMS Gateway & Multi-lingual Dispatch Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-brand-blue" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  DLT SMS & WhatsApp Gateway
                </h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold">
                DLT Active
              </span>
            </div>

            {/* Language Switcher for SMS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Template Language:
                </span>
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setSmsLang('en')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      smsLang === 'en' ? 'bg-white dark:bg-slate-700 font-bold text-brand-blue shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSmsLang('mr')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      smsLang === 'mr' ? 'bg-white dark:bg-slate-700 font-bold text-brand-blue shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    onClick={() => setSmsLang('hi')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      smsLang === 'hi' ? 'bg-white dark:bg-slate-700 font-bold text-brand-blue shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              {/* Sample SMS Preview Card (Mobile Phone Appearance) */}
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Sender: <strong className="font-mono">MH-JALNIG</strong></span>
                  <span>Recipient: <strong className="text-slate-800 dark:text-slate-200">Suresh Patil (+91 98224 51102)</strong></span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs font-sans text-slate-800 dark:text-slate-100 shadow-xs">
                  {smsLang === 'mr' ? (
                    <p>
                      स्मार्ट-नीर इशारा: नोड १४ (आंबेडकर नगर साकव) वर मुख्य जलवाहिनी फुटल्याचा (Burst) गंभीर इशारा! दाब ०.१८ बार. व्हॉल्व SV-०४ त्वरित बंद करा!
                    </p>
                  ) : smsLang === 'hi' ? (
                    <p>
                      स्मार्ट-नीर चेतावनी: नोड 14 (आंबेडकर नगर) पर मुख्य पाइप फटने (Burst) का गंभीर अलर्ट! दबाव 0.18 बार। तुरंत स्लुइस वाल्व SV-04 बंद करें!
                    </p>
                  ) : (
                    <p>
                      SmartNeer CRITICAL: Pipe Burst detected at Node 14 (Ambedkar Nagar Culvert). Pressure 0.18 bar. Close sluice valve SV-04 immediately!
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  <span>✓ Delivered in 1.4s</span>
                  <span>DLT Template ID: 1407168923</span>
                </div>
              </div>
            </div>

            {/* Editable Template textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Editable Burst SMS Template:
              </label>
              <textarea
                value={editableTemplate}
                onChange={(e) => setEditableTemplate(e.target.value)}
                rows={2}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          {/* Past SMS Dispatch Feed */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Recent Dispatches ({smsLogs.length}):
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {smsLogs.map((sms) => (
                <div
                  key={sms.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-[11px]"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-0.5">
                    <span>{sms.recipientName} ({sms.recipientRole})</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sms.deliveryStatus}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 truncate">
                    {sms.messageEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
