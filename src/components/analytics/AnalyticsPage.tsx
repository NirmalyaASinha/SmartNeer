import React from 'react';
import { useStore } from '../../store';
import { getTranslation } from '../../utils/translations';
import {
  BarChart3,
  TrendingDown,
  Download,
  Printer,
  ShieldCheck,
  Zap,
  Clock,
  Droplets,
  IndianRupee,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { nodes, getVillageKpis, language, latestReadings } = useStore();
  const t = getTranslation(language);
  const kpis = getVillageKpis();

  // EPANET vs Actual Residual Bar Chart Data
  const residualData = nodes.map((n) => {
    const reading = latestReadings[n.id];
    const actualP = reading ? reading.pressureBar : 2.0;
    const epanetP = reading ? reading.epanetExpectedPressureBar : 2.0;
    const residual = Number((actualP - epanetP).toFixed(2));

    return {
      nodeId: n.id.replace('NODE-', 'N'),
      actualPressure: actualP,
      epanetPressure: epanetP,
      residual,
      isAnomalous: Math.abs(residual) > 0.35,
    };
  });

  // EPANET vs Actual Scatter Plot Data
  const scatterData = nodes.map((n) => {
    const reading = latestReadings[n.id];
    return {
      epanet: reading ? reading.epanetExpectedPressureBar : 2.0,
      actual: reading ? reading.pressureBar : 2.0,
      nodeId: n.id,
    };
  });

  // Minimum Night Flow (MNF) Data by Village Zone (01:00 to 04:00 AM)
  const mnfZoneData = [
    { zone: 'Zone A (North)', nightFlowLpm: 4.2, allowableThreshold: 12.0, status: 'Normal' },
    { zone: 'Zone B (Central)', nightFlowLpm: 8.5, allowableThreshold: 15.0, status: 'Normal' },
    { zone: 'Zone C (Tail-End)', nightFlowLpm: 34.0, allowableThreshold: 10.0, status: 'BREACH' },
    { zone: 'Intake Rising Main', nightFlowLpm: 1.1, allowableThreshold: 5.0, status: 'Normal' },
  ];

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = ['Node ID', 'Name', 'Pressure (bar)', 'Expected (bar)', 'Flow (L/min)', 'TDS (ppm)', 'Risk State', 'Anomaly Score'];
    const rows = nodes.map((n) => {
      const r = latestReadings[n.id];
      return [
        n.id,
        `"${n.name}"`,
        r ? r.pressureBar : '',
        r ? r.epanetExpectedPressureBar : '',
        r ? r.flowLpm : '',
        r ? r.tdsPpm : '',
        r ? r.riskState : '',
        r ? r.anomalyScore : '',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_neer_telemetry_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Print handler
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 printable-report">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-blue" />
            Jal-Jeevan Mission Executive Analytics &amp; NRW Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Certified Non-Revenue Water auditing, EPANET hydraulic residual metrics, and financial recovery indicators.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.actions.exportCsv}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-1.5 rounded-xl bg-brand-blue hover:bg-brand-blueLight text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.actions.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Official Audit Title for Print */}
      <div className="hidden print:block p-4 border-b border-black text-center mb-4">
        <h2 className="text-xl font-bold uppercase">Government of Maharashtra | Jal Jeevan Mission</h2>
        <h3 className="text-lg font-bold">Smart-Neer Rural Water Pipeline Leak & NRW Audit Report</h3>
        <p className="text-xs">Village: Shivrajpur Gram Panchayat | Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Executive Key Indicators Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">NRW Water Loss</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.nrwPercent}%
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Benchmarked vs 15% Target
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Water Saved (Month)</span>
          <div className="text-2xl font-black text-brand-blue dark:text-cyan-400 mt-1">
            {(kpis.waterSavedThisMonthLiters / 1000).toFixed(0)} <span className="text-xs font-normal text-slate-500">kL</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {kpis.waterSavedThisMonthLiters.toLocaleString()} Litres
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Savings (Month)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{kpis.moneySavedThisMonthInr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tariff ₹{kpis.tariffPerKiloliterInr}/kL
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Mean Time to Detect</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.meanTimeToDetectMinutes} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            vs 48 hrs manual walk
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Mean Time to Repair</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.meanTimeToRepairHours} <span className="text-xs font-normal text-slate-500">hours</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Target SLA &lt; 6.0 hrs
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 block">Pumping Energy Saved</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ₹{kpis.electricityCostSavedMonthInr.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {kpis.pumpingHoursSavedMonth} pump hrs saved
          </p>
        </div>
      </div>

      {/* Minimum Night Flow (MNF) Analysis Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Minimum Night Flow (MNF) Analysis (01:00 – 04:00 AM Zero-Demand Window)
            </h3>
            <p className="text-[11px] text-slate-500">
              Flow exceeding background threshold during midnight indicates subsurface leaks or illicit unauthorized tapping.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Zone C Breach Flagged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {mnfZoneData.map((z) => (
            <div
              key={z.zone}
              className={`p-3 rounded-xl border ${
                z.status === 'BREACH'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {z.zone}
              </span>
              <div className="text-xl font-bold font-mono mt-1 text-slate-900 dark:text-white">
                {z.nightFlowLpm} <span className="text-xs font-normal text-slate-500">L/min</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500">Limit: {z.allowableThreshold} L/m</span>
                <span className={`font-bold ${z.status === 'BREACH' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {z.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EPANET Digital Twin vs Actual Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Residual Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Per-Node EPANET Pressure Residuals (Actual − Expected)
            </h3>
            <p className="text-[11px] text-slate-500">
              Deviations greater than ±0.35 bar trigger automated Isolation Forest anomaly alerts.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={residualData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="nodeId" tick={{ fontSize: 9 }} tickLine={false} />
                <YAxis unit=" bar" tick={{ fontSize: 9 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  formatter={(val) => [`${val} bar`, 'Residual']}
                />
                <ReferenceLine y={0.35} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={-0.35} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar
                  dataKey="residual"
                  fill="#1F6FB5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EPANET vs Actual Scatter Plot */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              EPANET Model vs Sensor Scatter Correlation
            </h3>
            <p className="text-[11px] text-slate-500">
              Ideal 45° parity line represents 100% calibration fit between digital twin &amp; real pipes.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" dataKey="epanet" name="Expected (EPANET)" unit=" bar" domain={[0, 4]} tick={{ fontSize: 9 }} />
                <YAxis type="number" dataKey="actual" name="Actual Sensor" unit=" bar" domain={[0, 4]} tick={{ fontSize: 9 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0B2A4A', borderColor: '#1F6FB5', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                />
                {/* 45 degree line */}
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 4, y: 4 }]} stroke="#10b981" strokeWidth={1.5} />
                <Scatter name="Sensor Nodes" data={scatterData} fill="#06b6d4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
