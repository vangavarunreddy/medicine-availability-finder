import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, MapPin, Pill, ShieldCheck, Building2, Store, ArrowRight, CheckCircle2, 
  Clock, AlertCircle, Sparkles, Activity, HeartPulse, RefreshCw, UserCheck
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AvailabilityBadge, VendorTypeBadge, DemoDataBadge } from '../../components/common/Badge';
import { Disclaimer } from '../../components/common/Disclaimer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [featuredListings, setFeaturedListings] = useState([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoadingFeatured(true);
      setFeaturedError(null);
      try {
        const response = await api.get('/search?limit=6&sortBy=availability');
        setFeaturedListings(response.data.results || []);
      } catch (err) {
        console.error('Failed to load featured listings:', err.message);
        setFeaturedError('Database service connecting... Load live catalog from search.');
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (locationQuery.trim()) params.set('location', locationQuery.trim());
    navigate(`/search?${params.toString()}`);
  };

  const categories = [
    { title: 'Pain & Fever', term: 'Paracetamol', icon: HeartPulse, color: 'bg-red-50 text-red-600 border-red-200', count: 'Dolo, Crocin, Combiflam' },
    { title: 'Antibiotics', term: 'Amoxicillin', icon: Pill, color: 'bg-blue-50 text-blue-600 border-blue-200', count: 'Mox 500, Azee, Ciplox' },
    { title: 'Antidiabetics', term: 'Metformin', icon: Activity, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', count: 'Glycomet, Metformin' },
    { title: 'Hypertension', term: 'Telmisartan', icon: ShieldCheck, color: 'bg-purple-50 text-purple-600 border-purple-200', count: 'Amlokind, Telma, Losar' },
    { title: 'Gastrointestinal', term: 'Pantoprazole', icon: Sparkles, color: 'bg-amber-50 text-amber-600 border-amber-200', count: 'Pantocid, Omez, Pan 40' },
    { title: 'Allergy & Cold', term: 'Cetirizine', icon: Clock, color: 'bg-teal-50 text-teal-600 border-teal-200', count: 'Okacet, Montair, Benadryl' },
  ];

  return (
    <div className="flex-1 bg-slate-50">
      
      {/* Role-based Quick Banner */}
      {isAuthenticated && user && (
        <div className="bg-gradient-to-r from-navy-900 to-teal-900 text-white py-2.5 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Signed in as <strong className="text-teal-200">{user.full_name || user.email}</strong> ({user.role})</span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              {user.role === 'PATIENT' && (
                <Link to="/patient/dashboard" className="text-teal-300 hover:text-white underline flex items-center gap-1">
                  View My Reservation Requests &rarr;
                </Link>
              )}
              {(user.role === 'PHARMACY' || user.role === 'MEDICAL_AGENCY') && (
                <Link to="/vendor/dashboard" className="text-teal-300 hover:text-white underline flex items-center gap-1">
                  Manage Vendor Inventory &rarr;
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin/dashboard" className="text-teal-300 hover:text-white underline flex items-center gap-1">
                  Open Admin Dashboard &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-navy-900 text-white border-b border-navy-800 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Local Pharmacy & Medical Agency Directory
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Find the Medicines You Need, <span className="text-teal-400">Faster.</span>
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Check real-time stock availability, exact prices, stock quantities, and location addresses across registered pharmacies and medical agencies in Hyderabad and surrounding regions.
            </p>
          </div>

          {/* Core Search Form */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-xl shadow-2xl border border-slate-200 flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine name, brand, generic (e.g. Paracetamol, Amoxicillin, Cetirizine)..."
                className="w-full py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            
            <div className="w-full md:w-64 flex items-center gap-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition-all">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City, area, or pincode (e.g. Jubilee Hills)..."
                className="w-full py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            
            <Button type="submit" variant="primary" size="lg" className="shrink-0 gap-2 font-semibold">
              <Search className="w-4 h-4" />
              Search Availability
            </Button>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span className="text-slate-400 font-medium">Popular searches:</span>
            {[
              { label: 'Paracetamol 500mg', q: 'Paracetamol' },
              { label: 'Amoxicillin 500mg', q: 'Amoxicillin' },
              { label: 'Cetirizine 10mg', q: 'Cetirizine' },
              { label: 'Dolo 650', q: 'Dolo' },
              { label: 'Metformin 500mg', q: 'Metformin' },
              { label: 'Pantoprazole 40mg', q: 'Pantoprazole' }
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setSearchQuery(chip.q);
                  navigate(`/search?q=${encodeURIComponent(chip.q)}`);
                }}
                className="bg-navy-800/80 hover:bg-teal-700/60 text-slate-200 border border-navy-700 hover:border-teal-500/50 px-3 py-1 rounded-md transition-all font-medium"
              >
                {chip.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Medical Disclaimer Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <Disclaimer />
      </div>

      {/* Popular Categories Grid */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Popular Medicine Categories</h2>
            <p className="text-slate-600 text-xs mt-0.5">Explore availability by therapeutic use and common formulations</p>
          </div>
          <Link to="/search" className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1">
            Browse Full Directory &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            return (
              <button
                key={cat.title}
                onClick={() => navigate(`/search?q=${encodeURIComponent(cat.term)}`)}
                className="bg-white border border-slate-200 rounded-lg p-4 text-left hover:border-teal-500 hover:shadow-card transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border mb-3 ${cat.color}`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-navy-900 text-xs group-hover:text-teal-600 transition-colors">{cat.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{cat.count}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Medicine Availability Section (Live API Feed) */}
      <section className="py-10 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-navy-900">Featured Medicine Availability</h2>
                <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-teal-600" /> Live Database Feed
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-0.5">Recently updated stock lines from verified pharmacies and medical agencies</p>
            </div>

            <Link to="/search">
              <Button variant="secondary" size="sm" className="gap-1">
                View All {featuredListings.length > 0 ? `(${featuredListings.length}+ Listings)` : ''}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-50 border border-slate-200 rounded-lg p-5 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : featuredError ? (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-center text-xs text-slate-500">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">{featuredError}</p>
              <Link to="/search" className="inline-block mt-3 text-teal-600 font-semibold hover:underline">
                Open Medicine Search Directory &rarr;
              </Link>
            </div>
          ) : featuredListings.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 p-8 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700 text-sm">No active inventory listings found.</p>
              <p className="mt-1">Run `npm run db:seed` in the backend directory to populate sample medicines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.slice(0, 6).map((item) => (
                <div key={item.inventory_id} className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 hover:border-teal-500/50 hover:shadow-card transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/medicines/${item.medicine_id}`} className="font-bold text-base text-navy-900 hover:text-teal-600 transition-colors line-clamp-1">
                          {item.medicine_name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          Brand: <span className="font-semibold text-slate-700">{item.brand}</span> | Form: <span className="text-slate-700">{item.form}</span>
                        </p>
                      </div>
                      <span className="text-xs font-mono font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 shrink-0">
                        {item.dosage}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <AvailabilityBadge status={item.stock_status} />
                        <VendorTypeBadge type={item.vendor_type} />
                        {(item.is_demo || item.vendor_is_demo) && <DemoDataBadge />}
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-navy-900">₹{parseFloat(item.price).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-200/80 space-y-1">
                      <p className="font-semibold text-slate-800 truncate">{item.vendor_name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {item.address}, {item.city} ({item.pincode})
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Available Stock: <strong className="text-slate-700">{item.stock_quantity} units</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link to={`/medicines/${item.medicine_id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1 justify-center">
                        View Supplier & Reserve
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Verified Partner Vendors Network */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-navy-900">Verified Vendor Network (Hyderabad & Telangana)</h2>
          <p className="text-slate-600 text-xs mt-1">Pharmacies and Medical Agencies undergo administrator license verification before publishing stock</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Apollo Pharmacy', type: 'PHARMACY', area: 'Road No 36, Jubilee Hills', city: 'Hyderabad', license: 'HYD-PHARM-001' },
            { name: 'MedPlus Pharmacy', type: 'PHARMACY', area: 'Road No 12, Banjara Hills', city: 'Hyderabad', license: 'HYD-PHARM-002' },
            { name: 'Wellness Forever', type: 'PHARMACY', area: 'Hitech City Rd, Madhapur', city: 'Hyderabad', license: 'HYD-PHARM-003' },
            { name: 'Standard Medical Agency', type: 'MEDICAL_AGENCY', area: 'RP Road, Secunderabad', city: 'Hyderabad', license: 'HYD-AGNC-001' }
          ].map((v) => (
            <div key={v.license} className="bg-white border border-slate-200 rounded-lg p-5 shadow-card hover:border-slate-300 transition-colors text-left space-y-3">
              <div className="flex items-center justify-between">
                <VendorTypeBadge type={v.type} />
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Admin Verified
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy-900">{v.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {v.area}, {v.city}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2">
                License: {v.license}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100/70 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy-900">How Medicine Availability Finder Works</h2>
            <p className="text-slate-600 text-xs mt-1">Connecting patients with verified stock sources in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-xl text-left shadow-card">
              <div className="w-10 h-10 bg-teal-50 text-teal-700 font-bold rounded-lg flex items-center justify-center text-lg mb-4 border border-teal-100">
                1
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-2">Search Stock Directory</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Enter medicine name, brand, or generic compound to scan nearby registered inventories instantly using fuzzy trigram matching.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl text-left shadow-card">
              <div className="w-10 h-10 bg-teal-50 text-teal-700 font-bold rounded-lg flex items-center justify-center text-lg mb-4 border border-teal-100">
                2
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-2">Compare Prices & Locations</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                View verified stock counts, exact prices, location addresses, and last updated timestamps from Pharmacies and Medical Agencies.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl text-left shadow-card">
              <div className="w-10 h-10 bg-teal-50 text-teal-700 font-bold rounded-lg flex items-center justify-center text-lg mb-4 border border-teal-100">
                3
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-2">Reserve Stock or Request Alert</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Submit a medicine reservation request directly to the supplier or set up automated Brevo email alerts for restock notifications.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
