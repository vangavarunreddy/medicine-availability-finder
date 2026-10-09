import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, FileText, CheckCircle2, RefreshCw, XCircle, Trash2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { AvailabilityBadge } from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

export const PatientDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useNotification();

  const fetchPatientData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, subRes, histRes] = await Promise.all([
        api.get('/requests'),
        api.get('/notify'),
        api.get('/search/history')
      ]);
      setRequests(reqRes.data.requests);
      setSubscriptions(subRes.data.subscriptions);
      setSearchHistory(histRes.data.history);
    } catch (err) {
      console.error('Failed to load patient dashboard:', err.message);
      showToast(err.message || 'Could not load patient records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const handleUnsubscribe = async (subId) => {
    try {
      const res = await api.delete(`/notify/${subId}`);
      showToast(res.message, 'success');
      fetchPatientData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fulfilledCount = requests.filter(r => r.status === 'FULFILLED').length;

  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Patient Portal</h1>
            <p className="text-slate-600 text-xs mt-0.5">Track your search activity, availability notifications, and reservation requests.</p>
          </div>
          <Button onClick={fetchPatientData} variant="secondary" size="sm" className="gap-1.5 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Portal
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-lg">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">{searchHistory.length}</div>
              <div className="text-xs text-slate-500">Recent Searches</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">{subscriptions.length}</div>
              <div className="text-xs text-slate-500">Active Restock Alerts</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">{requests.length}</div>
              <div className="text-xs text-slate-500">Submitted Requests</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-700">{fulfilledCount}</div>
              <div className="text-xs text-slate-500">Fulfilled Reservations</div>
            </div>
          </Card>
        </div>

        {/* Submitted Reservation Requests */}
        <Card header={<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" /> Medicine Reservation Requests</h3>}>
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 text-teal-600 animate-spin mx-auto mb-2" />
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No reservation requests submitted yet. Search medicines to reserve stock with local suppliers.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Medicine & Brand</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Qty Requested</th>
                    <th className="py-3 px-3">Submitted On</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-navy-900">{req.medicine_name}</div>
                        <div className="text-[11px] text-slate-500">Brand: {req.brand} ({req.dosage})</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        <div>{req.vendor_name}</div>
                        <div className="text-[11px] text-slate-500">{req.city}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{req.requested_quantity} units</td>
                      <td className="py-3.5 px-3 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          req.status === 'FULFILLED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Search History & Active Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card header={<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" /> Recent Search History</h3>}>
            {searchHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No recent search history.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {searchHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{item.query_text}</div>
                      <div className="text-[11px] text-slate-400">Location: {item.selected_location || 'All Locations'} • Results: {item.results_count}</div>
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(item.searched_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card header={<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-blue-600" /> Active "Notify Me" Alerts</h3>}>
            {subscriptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No active restock subscriptions.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{sub.medicine_name} ({sub.brand})</div>
                      <div className="text-[11px] text-slate-400">{sub.vendor_name ? `Target: ${sub.vendor_name}` : 'Target: Any Supplier'}</div>
                    </div>
                    <button
                      onClick={() => handleUnsubscribe(sub.id)}
                      className="text-red-600 font-medium hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Unsubscribe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
