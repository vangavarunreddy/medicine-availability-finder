import React from 'react';

export const AvailabilityBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'AVAILABLE') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600"></span>
        Available
      </span>
    );
  }

  if (normalized === 'LOW_STOCK' || normalized === 'LOW STOCK') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600"></span>
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-600"></span>
      Out of Stock
    </span>
  );
};

export const VendorTypeBadge = ({ type }) => {
  const isPharmacy = (type || '').toUpperCase() === 'PHARMACY';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      isPharmacy ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
    }`}>
      {isPharmacy ? 'Pharmacy' : 'Medical Agency'}
    </span>
  );
};

export const DemoDataBadge = () => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-300 font-mono">
      DEMO DATA
    </span>
  );
};
