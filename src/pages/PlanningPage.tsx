import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { BrainCircuit, Send, Loader2, Database, History, TrendingUp, Droplets, ArrowRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// Mock data to represent 10 years of historical water demand & supply
const historicalData = [
  { year: '2016', demand: 120000, supply: 110000, rainfall: 850 },
  { year: '2017', demand: 125000, supply: 125000, rainfall: 920 },
  { year: '2018', demand: 130000, supply: 115000, rainfall: 780 },
  { year: '2019', demand: 135000, supply: 140000, rainfall: 1050 },
  { year: '2020', demand: 142000, supply: 142000, rainfall: 980 },
  { year: '2021', demand: 150000, supply: 135000, rainfall: 810 },
  { year: '2022', demand: 158000, supply: 160000, rainfall: 1120 },
  { year: '2023', demand: 165000, supply: 150000, rainfall: 850 },
  { year: '2024', demand: 172000, supply: 155000, rainfall: 790 },
  { year: '2025', demand: 180000, supply: 165000, rainfall: 880 },
];

export default function PlanningPage() {
  const token = useAuthStore(state => state.token);
  const [query, setQuery] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [optimizedSchedule, setOptimizedSchedule] = useState<{time: string, action: string, rationale: string}[] | null>(null);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !token) return;
    
    setLoading(true);
    setSimulationActive(true);
    try {
      // Simulate API call for the plan
      const res = await axios.post('http://localhost:8000/api/ai/plan', 
        { query },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Override backend mock with our specific logic for water regulation
      setTimeout(() => {
        setPlan("Based on 10 years of historical demand vs. supply data, the AI has generated an optimized water regulation plan to maximize early utilization. The predictive model indicates a 15% increase in demand during summer months, offset by strategic early-morning pumping schedules to reduce evaporation and pipeline pressure stress.");
        setOptimizedSchedule([
          { time: "04:30 AM - 06:00 AM", action: "Main ESR Pumping", rationale: "Lowest evaporation loss, utilizes off-peak electricity tariffs." },
          { time: "06:00 AM - 08:30 AM", action: "Gravity Distribution (Zone A & B)", rationale: "Peak morning household demand." },
          { time: "08:30 AM - 04:00 PM", action: "Pipeline Resting & Leak Audit", rationale: "System depressurized. Anomaly models active for leak detection." },
          { time: "04:00 PM - 05:00 PM", action: "Secondary ESR Top-up", rationale: "Prepare for evening distribution." },
          { time: "05:00 PM - 07:00 PM", action: "Gravity Distribution (Zone C & D)", rationale: "Evening household utilization." }
        ]);
        setLoading(false);
      }, 1500); // simulate thinking
      
    } catch (err) {
      console.error(err);
      setPlan("An error occurred while generating the plan.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-gradient-to-br from-brand-blue to-cyan-500 rounded-xl shadow-lg">
          <BrainCircuit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Water Regulation & Planning</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Trained on 10 years of historical village data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Context & Query */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Database className="w-4 h-4 mr-2 text-brand-blue" />
              Dataset Context
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start">
                <History className="w-4 h-4 mr-2 mt-0.5 text-slate-400" />
                <span>Analyzed 10 years (2016-2025) of local climate, population growth, and consumption data.</span>
              </li>
              <li className="flex items-start">
                <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-emerald-500" />
                <span>Demand has grown by 50% over the decade, stressing current ESR capacity.</span>
              </li>
              <li className="flex items-start">
                <Droplets className="w-4 h-4 mr-2 mt-0.5 text-cyan-500" />
                <span>Objective: Optimize supply schedules to ensure water reaches all households at the earliest without pressure drops.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Run Simulation & Plan</h3>
            <form onSubmit={handleAskAI} className="space-y-4">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. 'Generate a supply schedule to maximize early utilization while minimizing leaks during summer...'"
                className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm h-32 resize-none"
              />
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full bg-gradient-to-r from-brand-blue to-cyan-600 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5 mr-2" />}
                {loading ? 'Simulating 10-Year Data...' : 'Generate Regulation Plan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Visualization & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-brand-blue" />
                10-Year Historical Demand vs. Supply (kL)
             </h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#A32A2A" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#A32A2A" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#1F6FB5" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#1F6FB5" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                   <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val/1000}k`} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}
                     itemStyle={{ color: '#e2e8f0' }}
                   />
                   <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                   <Area type="monotone" dataKey="demand" name="Total Demand" stroke="#A32A2A" strokeWidth={2} fillOpacity={1} fill="url(#colorDemand)" />
                   <Area type="monotone" dataKey="supply" name="Water Supplied" stroke="#1F6FB5" strokeWidth={2} fillOpacity={1} fill="url(#colorSupply)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          {plan && optimizedSchedule && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-5 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-400 mb-3 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI Regulation Strategy
              </h3>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed mb-6">
                {plan}
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recommended Daily Schedule</h4>
                {optimizedSchedule.map((step, idx) => (
                  <div key={idx} className="flex items-start bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex-shrink-0 w-24 sm:w-32 text-xs font-bold text-brand-blue dark:text-cyan-400 mt-0.5">
                      {step.time}
                    </div>
                    <div className="hidden sm:flex flex-shrink-0 mr-4 mt-0.5">
                       <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{step.action}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
