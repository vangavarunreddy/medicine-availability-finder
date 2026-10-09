import React from 'react';

export const Card = ({ children, className = '', header, footer }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-card overflow-hidden ${className}`}>
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
};
