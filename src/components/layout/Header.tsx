import React from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut } from 'lucide-react';
import {
  Activity,
  Bell,
  CloudOff,
  Cloud,
  RefreshCw,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Sliders,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserRole, Language } from '../../types';

export const Header: React.FC = () => {
  const {
    currentRole,
    setRole,
    language,
    setLanguage,
    darkMode,
    toggleDarkMode,
    isEdgeOffline,
    isSyncingToCloud,
    queuedSyncRecords,
    toggleEdgeOfflineMode,
    toggleDemoControls,
    soundAlertsEnabled,
    toggleSoundAlerts,
    alerts,
    getVillageKpis,
    setActiveTab,
  } = useStore();

  const { logout } = useAuthStore();
  const t = getTranslation(language);
  const kpis = getVillageKpis();
  const unacknowledgedAlerts = alerts.filter((a) => a.status === 'New');

  return (
    <header className="sticky top-0 z-40 bg-brand-navy dark:bg-slate-900 text-white shadow-md border-b border-brand-navyLight dark:border-slate-800">
      {/* Offline Sync Banner if edge offline or syncing */}
      {(isEdgeOffline || isSyncingToCloud) && (
        <div className={`px-4 py-1.5 text-xs font-medium flex items-center justify-between transition-colors ${
          isSyncingToCloud
            ? 'bg-blue-600 text-white animate-pulse'
            : 'bg-amber-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {isSyncingToCloud ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudOff className="w-3.5 h-3.5" />
            )}
            <span>
              {isSyncingToCloud
                ? `Syncing telemetry to State Jal-Jeevan Cloud via MQTT... Remaining queue: ${queuedSyncRecords} records`
                : `${t.status.offlineMode} – Queued in SQLite/MQTT buffer: ${queuedSyncRecords.toLocaleString()} records`}
            </span>
          </div>
          <button
            onClick={toggleEdgeOfflineMode}
            className="px-2 py-0.5 text-xs bg-white/20 hover:bg-white/30 rounded font-semibold transition"
          >
            {isSyncingToCloud ? 'Syncing...' : 'Switch to Cloud Online'}
          </button>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-cyan-400 text-white shadow-md shadow-brand-blue/30">
            <Activity className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                {t.appTitle}

              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-300 font-medium">
              {t.villageName}
            </p>
          </div>
        </div>

        {/* Center: Status Pill & Supply Window Countdown */}
        <div className="hidden lg:flex items-center space-x-3 bg-black/20 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-white/10">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              kpis.criticalAlertsCount > 0
                ? 'bg-red-500 animate-ping-slow'
                : kpis.warningAlertsCount > 0
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`} />
            <span className="text-xs font-semibold">
              {kpis.criticalAlertsCount > 0
                ? `${kpis.criticalAlertsCount} Critical Burst / Hammer`
                : kpis.warningAlertsCount > 0
                ? `${kpis.warningAlertsCount} Leak Warnings`
                : 'Pipes Pressurized & Normal'}
            </span>
          </div>
          <span className="text-slate-400">|</span>
          <div className="text-xs text-slate-300 flex items-center space-x-1.5">
            <span className="font-medium text-cyan-300">
              {kpis.isSupplyWindowActive ? '● SUPPLY ON' : '○ SUPPLY IDLE'}
            </span>
            <span className="text-slate-400">({kpis.countdownToNextSupply})</span>
          </div>
        </div>

        {/* Right: Controls & Switchers */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Offline/Online Gateway Simulation Toggle */}
          <button
            onClick={toggleEdgeOfflineMode}
            title={isEdgeOffline ? 'Internet Down (Running on Gateway RPi)' : 'Online Cloud MQTT Bridge'}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              isEdgeOffline
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isEdgeOffline ? <CloudOff className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isEdgeOffline ? 'Local RPi' : 'Cloud Sync'}</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={toggleSoundAlerts}
            title={soundAlertsEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            {soundAlertsEnabled ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-white/10 dark:bg-slate-800 text-xs text-white rounded-lg px-2 py-1.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
            </select>
          </div>

          

          {/* Unread Alert Bell Badge */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Active Alerts"
          >
            <Bell className="w-4 h-4" />
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
