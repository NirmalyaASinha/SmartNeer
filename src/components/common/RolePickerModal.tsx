import React from 'react';
import { useStore } from '../../store';
import { UserRole } from '../../types';
import { getTranslation } from '../../utils/translations';
import {
  Shield,
  Wrench,
  Users,
  Award,
  Cpu,
  CheckCircle2,
  X,
} from 'lucide-react';

interface RoleOption {
  role: UserRole;
  titleKey: 'operator' | 'vwsc' | 'sarpanch' | 'engineer';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge: string;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'operator',
    titleKey: 'operator',
    icon: Wrench,
    description: 'Field & Pump House Operator: High-contrast status banner, quick alert acknowledgment, "Mark Repaired" buttons, and node list. No financial analytics.',
    badge: 'Field Technician',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    role: 'vwsc',
    titleKey: 'vwsc',
    icon: Users,
    description: 'Village Water & Sanitation Committee: Operator view plus maintenance work orders, node battery health, and water quality contamination tracking.',
    badge: 'Panchayat Committee',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    role: 'sarpanch',
    titleKey: 'sarpanch',
    icon: Award,
    description: 'Gram Panchayat Sarpanch: Executive summary, Non-Revenue Water (NRW) %, water and money saved in ₹, alert logs, and printable official audit reports.',
    badge: 'Elected Leadership',
    color: 'from-amber-600 to-orange-600',
  },
  {
    role: 'engineer',
    titleKey: 'engineer',
    icon: Cpu,
    description: 'District Jal-Nigam Engineer: Full unrestricted access, EPANET digital twin residuals, 100 Hz water hammer waveform, ML internals, and Demo Lab.',
    badge: 'Chief Technical Officer',
    color: 'from-purple-600 to-indigo-600',
  },
];

export const RolePickerModal: React.FC = () => {
  const { currentRole, setRole, isRolePickerOpen, toggleRolePicker, language } = useStore();
  const t = getTranslation(language);

  if (!isRolePickerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-blue text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Demo Role-Based Access Control (RBAC) Switcher
              </h2>
              <p className="text-xs text-slate-500">
                Switch user persona to demonstrate tailored dashboards for rural stakeholders.
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleRolePicker(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="space-y-3">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = currentRole === opt.role;

            return (
              <button
                key={opt.role}
                onClick={() => {
                  setRole(opt.role);
                  toggleRolePicker(false);
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition flex items-start space-x-3.5 ${
                  isSelected
                    ? 'border-brand-blue bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-brand-blue/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${opt.color} text-white shadow-xs shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {t.roles[opt.titleKey]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
          <button
            onClick={() => toggleRolePicker(false)}
            className="px-4 py-1.5 rounded-xl bg-brand-blue hover:bg-brand-blueLight text-white font-bold text-xs shadow-xs"
          >
            Apply &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
};
