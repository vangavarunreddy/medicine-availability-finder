import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export const Toast = ({ id, type = 'info', message, onClose }) => {
  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-lg border shadow-lg max-w-md w-full transition-all animate-in fade-in slide-in-from-top-2 ${
      isSuccess
        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
        : isError
        ? 'bg-red-50 text-red-900 border-red-200'
        : 'bg-slate-900 text-white border-slate-800'
    }`}>
      <div className="flex items-center gap-2.5 text-xs font-medium">
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
        {isError && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-4 h-4 text-teal-400 shrink-0" />}
        <span>{message}</span>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
