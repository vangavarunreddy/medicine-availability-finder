import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Building2, Store, ArrowRight, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Disclaimer } from '../../components/common/Disclaimer';

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="flex-1 bg-slate-50">
      {/* Search Hero Section */}
      <section className="bg-navy-900 text-white border-b border-navy-800 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Find the medicine you need, from available sources near you.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Real-time availability, stock quantities, pricing, and locations across registered pharmacies and medical agencies.
            </p>
          </div>

          {/* Core Search Bar Component */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-lg shadow-lg border border-slate-200 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2.5 px-3 bg-slate-50 border border-slate-200 rounded-md">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine name, generic name, brand, or dosage (e.g. Paracetamol 500mg)..."
                className="w-full py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <div className="w-full md:w-64 flex items-center gap-2.5 px-3 bg-slate-50 border border-slate-200 rounded-md">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City, area, or pincode..."
                className="w-full py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="shrink-0 gap-2">
              <Search className="w-4 h-4" />
              Search Availability
            </Button>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span className="text-slate-400">Popular searches:</span>
            {['Paracetamol 500mg', 'Amoxicillin 250mg', 'Metformin 500mg', 'Cetirizine 10mg'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  navigate(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 px-2.5 py-1 rounded transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Disclaimer Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Disclaimer />
      </div>

      {/* Key Benefits / How It Works */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-navy-900">How Medicine Finder Works</h2>
          <p className="text-slate-600 text-sm mt-1">Connecting patients with verified suppliers in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-lg text-left shadow-card">
            <div className="w-10 h-10 bg-teal-50 text-teal-700 font-bold rounded-md flex items-center justify-center text-lg mb-4 border border-teal-100">
              1
            </div>
            <h3 className="font-semibold text-navy-900 text-base mb-2">Search Stock</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Enter medicine brand, dosage, or generic compound to scan nearby registered inventories instantly.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-lg text-left shadow-card">
            <div className="w-10 h-10 bg-teal-50 text-teal-700 font-bold rounded-md flex items-center justify-center text-lg mb-4 border border-teal-100">
              2
            </div>
            <h3 className="font-semibold text-navy-900 text-base mb-2">Compare Vendors</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              View verified stock counts, exact prices, location addresses, and last updated timestamps from Pharmacies and Agencies.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-lg text-left shadow-card">
            <div className="w-10 h-10 bg-teal-50 text-teal-700 font-bold rounded-md flex items-center justify-center text-lg mb-4 border border-teal-100">
              3
            </div>
            <h3 className="font-semibold text-navy-900 text-base mb-2">Reserve or Request</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Submit a medicine request or set up "Notify Me" email alerts when out-of-stock items become available.
            </p>
          </div>
        </div>
      </section>

      {/* User / Vendor Roles Overview */}
      <section className="bg-white border-t border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border border-slate-200 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-navy-900">For Registered Pharmacies</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Maintain accurate stock quantities, set minimum stock alerts, receive customer reservation requests, and reduce phone inquiries.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 mb-5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Admin-verified vendor badge
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Automated low-stock email warnings
                </li>
              </ul>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg bg-slate-50/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-navy-900">For Medical Agencies</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Publish wholesale/agency medicine catalogs, manage large inventory lines, and serve both direct inquiries and partner networks.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 mb-5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Bulk stock management options
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Direct reservation notification system
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
