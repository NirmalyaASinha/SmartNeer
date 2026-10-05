import React, { useEffect } from 'react';
import { useStore } from '../../store';
import { AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { activeToast, dismissToast, setSelectedNodeId } = useStore();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const isCritical = activeToast.severity === 'CRITICAL';

  return (
    <div className="fixed top-16 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top duration-300">
      <div className={`p-4 rounded-xl shadow-2xl border flex items-start space-x-3 ${
        isCritical
          ? 'bg-red-600 text-white border-red-700'
          : 'bg-amber-500 text-white border-amber-600'
      }`}>
        <div className="p-1 rounded-lg bg-black/20 shrink-0">
          {isCritical ? (
            <AlertOctagon className="w-5 h-5 text-white animate-bounce" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-xs tracking-tight truncate">
            {activeToast.title}
          </h4>
          <p className="text-[11px] text-white/90 mt-0.5 line-clamp-2">
            {activeToast.message}
          </p>
        </div>

        <button
          onClick={dismissToast}
          className="text-white/80 hover:text-white p-1 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
