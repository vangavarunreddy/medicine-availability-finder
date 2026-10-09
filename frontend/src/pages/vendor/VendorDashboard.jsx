import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle, Plus, ShieldAlert, Clock, RefreshCw, Search, FileText, Check, X } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { AvailabilityBadge } from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

export const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'requests'
  const [vendor, setVendor] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    availableCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    medicine_id: '',
    stock_quantity: 10,
    price: 0,
    min_stock_level: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const fetchVendorData = async () => {
    setIsLoading(true);
    try {
      const profileRes = await api.get('/vendors/me');
      const vData = profileRes.data.vendor;
      setVendor(vData);

      if (vData.status === 'APPROVED') {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (statusFilter !== 'ALL') params.set('statusFilter', statusFilter);

        const [invRes, statsRes, catRes, reqRes] = await Promise.all([
          api.get(`/inventory?${params.toString()}`),
          api.get('/inventory/stats'),
          api.get('/medicines?limit=200'),
          api.get('/requests')
        ]);

        setInventory(invRes.data.inventory);
        setStats(statsRes.data.stats);
        setCatalogMedicines(catRes.data.medicines);
        setRequests(reqRes.data.requests);
      }
    } catch (err) {
      console.error('Failed to load vendor inventory:', err.message);
      showToast(err.message || 'Could not load vendor status details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [statusFilter, activeTab]);

  const isApproved = vendor?.status === 'APPROVED';
  const isPending = vendor?.status === 'PENDING';
  const isRejected = vendor?.status === 'REJECTED';

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      medicine_id: catalogMedicines.length > 0 ? catalogMedicines[0].id : '',
      stock_quantity: 20,
      price: 50.00,
      min_stock_level: 5
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      medicine_id: item.medicine_id,
      stock_quantity: item.stock_quantity,
      price: item.price,
      min_stock_level: item.min_stock_level
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingItem) {
        const res = await api.patch(`/inventory/${editingItem.id}`, {
          stock_quantity: formData.stock_quantity,
          price: formData.price,
          min_stock_level: formData.min_stock_level
        });
        showToast(res.message, 'success');
      } else {
        const res = await api.post('/inventory', formData);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchVendorData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.medicine_name}" from your active inventory?`)) {
      return;
    }

    try {
      const res = await api.delete(`/inventory/${item.id}`);
      showToast(res.message, 'success');
      fetchVendorData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await api.patch(`/requests/${requestId}/status`, { status: newStatus });
      showToast(res.message, 'success');
      fetchVendorData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-navy-900">{vendor?.business_name || 'Vendor Portal'}</h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                isApproved ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {vendor?.vendor_type === 'PHARMACY' ? 'Pharmacy' : 'Medical Agency'} • {vendor?.status}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1">
              License No: <strong className="font-mono text-slate-800">{vendor?.license_number}</strong> • City: {vendor?.city}, {vendor?.state}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'inventory' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Stock Inventory
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'requests' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                Customer Requests
                {requests.filter(r => r.status === 'PENDING').length > 0 && (
                  <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {requests.filter(r => r.status === 'PENDING').length}
                  </span>
                )}
              </button>
            </div>

            <Button 
              onClick={handleOpenAddModal}
              variant="primary" 
              disabled={!isApproved}
              title={!isApproved ? 'Account must be approved before adding medicine stock' : ''}
              className="gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Stock Line
            </Button>
          </div>
        </div>

        {/* Dynamic Verification Status Banners */}
        {isPending && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-950">Awaiting Administrator Approval</h4>
              <p className="mt-0.5 leading-relaxed">
                Your vendor account is currently <strong>PENDING</strong> verification by a platform administrator. During this period, you can view dashboard metrics, but inventory listings cannot be published or made publicly searchable.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-900">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">Vendor Verified & Active</h4>
              <p className="mt-0.5 leading-relaxed">
                Your vendor credentials have been approved by the platform administrator. Your listed medicines and real-time inventory are now publicly searchable by patients.
              </p>
            </div>
          </div>
        )}

        {/* Stock Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">{stats.totalItems}</div>
              <div className="text-xs text-slate-500">Total Medicines</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">{stats.availableCount}</div>
              <div className="text-xs text-slate-500">Available Stock Lines</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-700">{stats.lowStockCount}</div>
              <div className="text-xs text-slate-500">Low Stock Alert</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-700 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-700">{stats.outOfStockCount}</div>
              <div className="text-xs text-slate-500">Out of Stock</div>
            </div>
          </Card>
        </div>

        {activeTab === 'requests' ? (
          <Card header={<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" /> Patient Reservation Requests</h3>}>
            {requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No patient reservation requests received yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Patient Name</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Medicine Requested</th>
                      <th className="py-3 px-3">Qty</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Update Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-navy-900">{r.patient_name}</td>
                        <td className="py-3.5 px-3 text-slate-600">
                          <div>{r.patient_phone}</div>
                          <div className="text-[11px] text-slate-400">{r.patient_email}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800">{r.medicine_name}</div>
                          <div className="text-[11px] text-slate-500">Brand: {r.brand} ({r.dosage})</div>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{r.requested_quantity} units</td>
                        <td className="py-3.5 px-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.status === 'FULFILLED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-1.5">
                          {r.status !== 'FULFILLED' && (
                            <Button
                              onClick={() => handleUpdateRequestStatus(r.id, 'FULFILLED')}
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2 py-0.5"
                            >
                              Fulfill
                            </Button>
                          )}
                          {r.status !== 'CANCELLED' && (
                            <Button
                              onClick={() => handleUpdateRequestStatus(r.id, 'CANCELLED')}
                              variant="secondary"
                              size="sm"
                              className="text-xs px-2 py-0.5"
                            >
                              Cancel
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
        ) : (
          /* Inventory Table */
          <Card
            header={
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-bold text-slate-800 text-sm">Active Inventory Directory</h3>

                {isApproved && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {['ALL', 'AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                          statusFilter === tab
                            ? 'bg-navy-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab === 'ALL' ? 'All Stock' : tab === 'LOW_STOCK' ? 'Low Stock' : tab === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Available'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            {!isApproved ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-700">Inventory Publishing Restricted</p>
                <p>You will be able to manage inventory stock, set pricing, and publish medicine lines once your account is approved.</p>
              </div>
            ) : isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                Loading inventory records...
              </div>
            ) : inventory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-700">No inventory lines found.</p>
                <p>Click "Add Stock Line" to publish your first inventory entry from the master catalog.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Medicine & Brand</th>
                      <th className="py-3 px-3">Dosage / Form</th>
                      <th className="py-3 px-3">Stock Quantity</th>
                      <th className="py-3 px-3">Min Level</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Last Updated</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-slate-900">
                          <div>{item.medicine_name}</div>
                          <div className="text-[11px] font-normal text-slate-500">Brand: {item.brand}</div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono">
                          {item.dosage} / {item.form}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                          {item.stock_quantity} units
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 font-mono">{item.min_stock_level} units</td>
                        <td className="py-3.5 px-3 font-bold text-navy-900">₹{parseFloat(item.price).toFixed(2)}</td>
                        <td className="py-3.5 px-3">
                          <AvailabilityBadge status={item.stock_status} />
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                          {new Date(item.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="text-teal-600 font-medium hover:underline px-1.5 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 font-medium hover:underline px-1.5 py-1"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Add/Edit Inventory Line Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="font-bold text-base text-navy-900">
                {editingItem ? 'Edit Stock Details' : 'Add Medicine to Inventory'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingItem ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Master Catalog Medicine <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.medicine_id}
                      onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
                    >
                      {catalogMedicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.brand}) - {m.dosage} [{m.form}]
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
                    <span className="text-slate-500">Medicine:</span> <strong className="text-navy-900">{editingItem.medicine_name}</strong> ({editingItem.brand})
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Available Quantity"
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                  <Input
                    label="Unit Price (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <Input
                  label="Minimum Stock Threshold (Low Stock Alert)"
                  type="number"
                  min="0"
                  required
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  helperText="When stock drops to or below this count, a Low Stock alert will trigger."
                />

                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                    {editingItem ? 'Update Stock' : 'Publish to Inventory'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
