import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const Disclaimer = ({ className = '' }) => {
  return (
    <div className={`bg-amber-50/70 border border-amber-200/80 rounded-md p-3.5 text-xs text-amber-900 flex items-start gap-2.5 ${className}`}>
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <span className="font-semibold text-amber-950">Important Health Disclaimer:</span> This platform provides stock and availability information from registered pharmacies and medical agencies. It does not provide medical diagnosis, prescription advice, or treatment recommendations. Always consult a qualified healthcare professional or physician before taking any medication.
      </div>
    </div>
  );
};
