import React, { useState, useEffect } from 'react';
import { Users, Store, Building2, ShieldAlert, CheckCircle, XCircle, RefreshCw, Filter, Pill } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { AdminMedicinesPage } from './AdminMedicinesPage';
import api from '../../services/api';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'medicines'
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pharmacyCount: 0,
    agencyCount: 0
  });
  const [vendors, setVendors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionModalVendor, setRejectionModalVendor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { showToast } = useNotification();

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, vendorsRes] = await Promise.all([
        api.get('/admin/vendors/stats'),
        api.get(`/admin/vendors${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`)
      ]);
      setStats(statsRes.data.stats);
      setVendors(vendorsRes.data.vendors);
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
      showToast(err.message || 'Could not load vendor data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchAdminData();
    }
  }, [statusFilter, activeTab]);

  const handleApprove = async (vendor) => {
    if (!window.confirm(`Are you sure you want to approve "${vendor.business_name}" (${vendor.vendor_type})?`)) {
      return;
    }

    try {
      const res = await api.patch(`/admin/vendors/${vendor.id}/approve`);
      showToast(res.message, 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionModalVendor) return;

    setIsProcessing(true);
    try {
      const res = await api.patch(`/admin/vendors/${rejectionModalVendor.id}/reject`, {
        reason: rejectionReason
      });
      showToast(res.message, 'success');
      setRejectionModalVendor(null);
      setRejectionReason('');
      fetchAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Title & Section Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Administrator Console</h1>
            <p className="text-slate-600 text-xs mt-0.5">Verify vendor accounts and manage central medicine catalog specifications.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'vendors' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              Vendor Approvals
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'medicines' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <Pill className="w-4 h-4 text-teal-600" />
              Medicine Catalog
            </button>
          </div>
        </div>

        {activeTab === 'medicines' ? (
          <AdminMedicinesPage />
        ) : (
          <>
            {/* System Totals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-navy-900">{stats.totalVendors}</div>
                  <div className="text-xs text-slate-500">Total Registered Vendors</div>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-700">{stats.pendingCount}</div>
                  <div className="text-xs text-slate-500">Pending Approvals</div>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-emerald-700">{stats.approvedCount}</div>
                  <div className="text-xs text-slate-500">Approved Vendors</div>
                </div>
              </Card>

              <Card className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-red-700">{stats.rejectedCount}</div>
                  <div className="text-xs text-slate-500">Rejected Vendors</div>
                </div>
              </Card>
            </div>

            {/* Vendor Filter Tabs & Table */}
            <Card
              header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Filter className="w-4 h-4 text-teal-600" />
                    Vendor Verification Queue
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-xs">
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                          statusFilter === tab
                            ? 'bg-navy-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab === 'ALL' ? 'All Vendors' : tab}
                      </button>
                    ))}
                  </div>
                </div>
              }
            >
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                  Loading vendor verification table...
                </div>
              ) : vendors.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                  <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-medium text-slate-700">No {statusFilter.toLowerCase()} vendors found.</p>
                  <p>Registered vendors will appear here for administrative verification.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">Business Name</th>
                        <th className="py-3 px-3">Vendor Type</th>
                        <th className="py-3 px-3">Owner / Email</th>
                        <th className="py-3 px-3">License No.</th>
                        <th className="py-3 px-3">Location</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Verification Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-navy-900">{v.business_name}</div>
                            <div className="text-[11px] text-slate-400">Reg: {new Date(v.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              v.vendor_type === 'PHARMACY' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {v.vendor_type === 'PHARMACY' ? 'Pharmacy' : 'Medical Agency'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-800">{v.owner_name}</div>
                            <div className="text-[11px] text-slate-500">{v.owner_email} ({v.phone})</div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-700">{v.license_number}</td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {v.city}, {v.state} ({v.pincode})
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              v.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : v.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right space-x-2">
                            {v.status !== 'APPROVED' && (
                              <Button
                                onClick={() => handleApprove(v)}
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5 py-1"
                              >
                                Approve
                              </Button>
                            )}

                            {v.status !== 'REJECTED' && (
                              <Button
                                onClick={() => setRejectionModalVendor(v)}
                                variant="secondary"
                                size="sm"
                                className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                              >
                                Reject
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Rejection Modal Dialog */}
            {rejectionModalVendor && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
                  <h3 className="font-bold text-base text-navy-900">Reject Vendor Registration</h3>
                  <p className="text-xs text-slate-600">
                    You are about to reject <strong>{rejectionModalVendor.business_name}</strong> ({rejectionModalVendor.license_number}). An email notice will be dispatched to the owner.
                  </p>
                  
                  <form onSubmit={handleRejectSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason for Rejection (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Invalid drug license documentation or address mismatch..."
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRejectionModalVendor(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="danger"
                        size="sm"
                        isLoading={isProcessing}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
