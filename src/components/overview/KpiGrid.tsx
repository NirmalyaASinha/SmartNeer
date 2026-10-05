import React, { useState } from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  Radio,
  AlertTriangle,
  Droplets,
  Clock,
  TrendingDown,
  IndianRupee,
  Edit2,
  Check,
} from 'lucide-react';

export const KpiGrid: React.FC = () => {
  const { currentRole, language, getVillageKpis, tariffPerKiloliterInr, setTariffRate } = useStore();
  const t = getTranslation(language);
  const kpis = getVillageKpis();

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(tariffPerKiloliterInr.toString());

  const handleSaveRate = () => {
    const val = parseFloat(rateInput);
    if (!isNaN(val) && val >= 0) {
      setTariffRate(val);
    }
    setIsEditingRate(false);
  };

  const isOperator = currentRole === 'operator';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Active Nodes */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">{t.kpis.activeNodes}</span>
          <Radio className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {kpis.onlineNodes} <span className="text-sm font-normal text-slate-500">/ {kpis.totalNodes}</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            {kpis.onlineNodes === kpis.totalNodes ? '100% Mesh Health' : `${kpis.totalNodes - kpis.onlineNodes} Node Isolated`}
          </p>
        </div>
      </div>

      {/* 2. Active Alerts */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">{t.kpis.activeAlerts}</span>
          <AlertTriangle className={`w-4 h-4 ${kpis.activeAlertsCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
        </div>
        <div className="mt-2">
          <div className={`text-xl sm:text-2xl font-bold tracking-tight ${
            kpis.criticalAlertsCount > 0 ? 'text-red-600 dark:text-red-400' : kpis.warningAlertsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
          }`}>
            {kpis.activeAlertsCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {kpis.criticalAlertsCount} Critical, {kpis.warningAlertsCount} Warning
          </p>
        </div>
      </div>

      {/* 3. Current Flow */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">{t.kpis.currentFlow}</span>
          <Droplets className="w-4 h-4 text-brand-blue" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {kpis.currentTotalFlowLpm} <span className="text-xs font-normal text-slate-500">L/min</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Avg Pressure: {kpis.villageAvgPressureBar} bar
          </p>
        </div>
      </div>

      {/* 4. Supply Status */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">{t.kpis.supplyStatus}</span>
          <Clock className="w-4 h-4 text-cyan-500" />
        </div>
        <div className="mt-2">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${kpis.isSupplyWindowActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {kpis.isSupplyWindowActive ? 'SUPPLY ON' : 'IDLE / OFF'}
            </span>
          </div>
          <p className="text-[11px] text-brand-blue dark:text-cyan-400 font-medium mt-0.5 truncate" title={kpis.nextSupplyTimeText}>
            {kpis.countdownToNextSupply}
          </p>
        </div>
      </div>

      {/* 5. Water Lost Today */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">{t.kpis.waterLostToday}</span>
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
            {kpis.waterLostTodayLiters.toLocaleString()} <span className="text-xs font-normal text-slate-500">L</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            NRW: {kpis.nrwPercent}% of intake
          </p>
        </div>
      </div>

      {/* 6. Money Lost Today (Hidden for Pump Operator) */}
      {!isOperator ? (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t.kpis.moneyLostToday}</span>
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ₹{kpis.moneyLostTodayInr.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isEditingRate ? (
                <div className="flex items-center space-x-1">
                  <span className="text-[10px]">₹</span>
                  <input
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="w-12 px-1 py-0.5 text-[10px] rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                    step="0.5"
                  />
                  <button onClick={handleSaveRate} className="text-emerald-500 hover:text-emerald-600">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span>@ ₹{tariffPerKiloliterInr}/kL</span>
                  <button
                    onClick={() => setIsEditingRate(true)}
                    className="text-slate-400 hover:text-brand-blue"
                    title="Edit water tariff rate"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Alternative card for Pump Operator: Technician On Duty */
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Duty Shift</span>
            <Radio className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-slate-900 dark:text-white truncate">
              Morning Shift
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Operator: Suresh Patil
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
