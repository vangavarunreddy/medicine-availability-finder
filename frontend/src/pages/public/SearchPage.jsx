import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, MapPin, RefreshCw, Bell, Info } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AvailabilityBadge, VendorTypeBadge, DemoDataBadge } from '../../components/common/Badge';
import { Disclaimer } from '../../components/common/Disclaimer';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';

  const [query, setQuery] = useState(initialQuery);
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [vendorType, setVendorType] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [dosageFilter, setDosageFilter] = useState('ALL');
  const [formFilter, setFormFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('availability');

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const { showToast } = useNotification();

  const fetchSearchResults = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (locationFilter) params.set('location', locationFilter);
      if (vendorType !== 'ALL') params.set('vendor_type', vendorType);
      if (availabilityFilter !== 'ALL') params.set('availability', availabilityFilter);
      if (dosageFilter !== 'ALL') params.set('dosage', dosageFilter);
      if (formFilter !== 'ALL') params.set('form', formFilter);
      if (sortBy) params.set('sortBy', sortBy);

      const response = await api.get(`/search?${params.toString()}`);
      setResults(response.data.results || []);
    } catch (err) {
      console.error('Search error:', err.message);
      setApiError(err.message || 'Unable to connect to medicine availability database.');
      showToast(err.message || 'Failed to search medicine availability.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, [searchParams, vendorType, availabilityFilter, dosageFilter, formFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (locationFilter) params.set('location', locationFilter);
    setSearchParams(params);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">Medicine Availability Directory</h1>
          <p className="text-slate-600 text-sm">Search real-time inventory from verified local pharmacies and medical agencies.</p>
        </div>

        {/* Disclaimer */}
        <Disclaimer className="mb-6" />

        {/* Main Search Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-3.5 bg-slate-50 border border-slate-300 rounded-md">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search medicine name, brand, generic, or dosage..."
                className="w-full py-2.5 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <div className="w-full md:w-64 flex items-center gap-2 px-3.5 bg-slate-50 border border-slate-300 rounded-md">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="City, area, or pincode"
                className="w-full py-2.5 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" className="gap-2 shrink-0">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-card h-fit space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-navy-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                Refine Search
              </h3>
              <button
                onClick={() => {
                  setVendorType('ALL');
                  setAvailabilityFilter('ALL');
                  setDosageFilter('ALL');
                  setFormFilter('ALL');
                  setSortBy('availability');
                  setQuery('');
                  setLocationFilter('');
                  setSearchParams({});
                }}
                className="text-xs text-teal-600 hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Vendor Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Vendor Source
              </label>
              <select
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Vendors (Pharmacies & Agencies)</option>
                <option value="PHARMACY">Pharmacy Only</option>
                <option value="MEDICAL_AGENCY">Medical Agency Only</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Stock Status
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">Show All Statuses</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="LOW_STOCK">Low Stock Only</option>
                <option value="OUT_OF_STOCK">Out of Stock Only</option>
              </select>
            </div>

            {/* Form Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Medicine Form
              </label>
              <select
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Forms</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Drops">Drops</option>
                <option value="Powder">Powder</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Sort Results By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
              >
                <option value="availability">Stock Availability</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="recent">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Search Results List */}
          <div className="lg:col-span-3 space-y-4">
            
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-100/70 px-4 py-2.5 rounded-md border border-slate-200">
              <span>Showing <strong>{results.length}</strong> availability listings from verified vendors</span>
              <span className="flex items-center gap-1 text-slate-500">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Live PostgreSQL feed
              </span>
            </div>

            {apiError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-xs text-red-700 space-y-3">
                <Info className="w-8 h-8 text-red-500 mx-auto" />
                <p className="font-bold text-sm">Database Service Connection Issue</p>
                <p className="text-red-600">{apiError}</p>
                <Button onClick={fetchSearchResults} variant="secondary" size="sm" className="mx-auto gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Connection
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white border border-slate-200 rounded-lg p-5 shadow-card animate-pulse space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-xs text-slate-500 space-y-2">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-800 text-sm">No medicine availability matching your query.</p>
                <p className="text-slate-500">Try broadening your search term or adjusting filters.</p>
              </div>
            ) : (
              results.map((item) => (
                <div key={item.inventory_id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-card hover:border-teal-500/40 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/medicines/${item.medicine_id}`} className="font-bold text-lg text-navy-900 hover:text-teal-600 transition-colors">
                          {item.medicine_name}
                        </Link>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">{item.dosage}</span>
                        <VendorTypeBadge type={item.vendor_type} />
                        {(item.is_demo || item.vendor_is_demo) && <DemoDataBadge />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Brand: <span className="font-medium text-slate-700">{item.brand}</span> | Generic: <span className="italic text-slate-700">{item.generic_name}</span> | Form: <span className="text-slate-700">{item.form}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <AvailabilityBadge status={item.stock_status} />
                      <div className="text-right">
                        <div className="text-lg font-bold text-navy-900">₹{parseFloat(item.price).toFixed(2)}</div>
                        <div className="text-[11px] text-slate-400">per unit/pack</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
                    <div className="space-y-1 text-slate-600">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {item.vendor_name}
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.address}, {item.city}, {item.state} ({item.pincode})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Stock Quantity: <strong className="text-slate-700">{item.stock_quantity} units</strong> • Updated: {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 md:pt-0">
                      <Link to={`/medicines/${item.medicine_id}`}>
                        <Button variant="primary" size="sm" className="w-full md:w-auto gap-1">
                          View Details & Vendors
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
