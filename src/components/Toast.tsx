import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Zap, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 end-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const colorMap = {
          success: 'border-emerald-500/50 bg-slate-900 text-emerald-300 shadow-emerald-500/10',
          warning: 'border-amber-500/50 bg-slate-900 text-amber-300 shadow-amber-500/10',
          danger: 'border-rose-500/50 bg-slate-900 text-rose-300 shadow-rose-500/10',
          info: 'border-indigo-500/50 bg-slate-900 text-indigo-200 shadow-indigo-500/10'
        };

        const IconComponent = {
          success: CheckCircle2,
          warning: AlertTriangle,
          danger: XCircle,
          info: Zap
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium transition-all duration-300 animate-in slide-in-from-bottom-2 ${colorMap[toast.type]}`}
          >
            <div className="flex items-center gap-2.5">
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
