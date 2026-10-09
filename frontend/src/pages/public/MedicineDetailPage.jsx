import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pill, MapPin, Phone, Mail, ArrowLeft, RefreshCw, AlertCircle, Bell, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AvailabilityBadge, VendorTypeBadge } from '../../components/common/Badge';
import { Disclaimer } from '../../components/common/Disclaimer';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

export const MedicineDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useNotification();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reservation Modal state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [requestedQty, setRequestedQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  // Subscribing state
  const [isSubscribing, setIsSubscribing] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/medicines/${id}`);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load medicine details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleOpenRequestModal = (vendor) => {
    if (!isAuthenticated) {
      showToast('Please log in as a Patient to submit a reservation request.', 'info');
      navigate('/login');
      return;
    }
    if (user?.role !== 'PATIENT') {
      showToast('Reservation requests can only be submitted from Patient accounts.', 'error');
      return;
    }
    setSelectedVendor(vendor);
    setRequestedQty(1);
    setNotes('');
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    setIsSubmittingReq(true);
    try {
      const res = await api.post('/requests', {
        vendor_id: selectedVendor.vendor_id,
        medicine_id: id,
        requested_quantity: requestedQty,
        notes
      });
      showToast(res.message, 'success');
      setSelectedVendor(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const handleSubscribeNotifyMe = async (vendorId = null) => {
    if (!isAuthenticated) {
      showToast('Please log in to receive availability alerts.', 'info');
      navigate('/login');
      return;
    }
    if (user?.role !== 'PATIENT') {
      showToast('Restock alerts can only be set up for Patient accounts.', 'error');
      return;
    }

    setIsSubscribing(true);
    try {
      const res = await api.post('/notify', {
        medicine_id: id,
        vendor_id: vendorId
      });
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="flex items-center gap-2.5 text-slate-600 text-sm font-medium">
          <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
          Loading medicine specifications and verified vendor availability...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy-900">Medicine Not Found</h2>
          <p className="text-slate-600 text-xs mt-1 mb-6">{error || 'The requested medicine specification does not exist.'}</p>
          <Link to="/search">
            <Button variant="primary" size="sm">Back to Medicine Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { medicine, approvedVendors } = data;

  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <Link to="/search" className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Availability Search
        </Link>

        {/* Medicine Specifications Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Pill className="w-6 h-6 text-teal-600" />
                <h1 className="text-2xl font-bold text-navy-900">{medicine.name}</h1>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono">{medicine.dosage}</span>
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded font-semibold">{medicine.form}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Brand: <strong className="text-slate-800">{medicine.brand}</strong> | Generic Compound: <span className="italic text-slate-700 font-medium">{medicine.generic_name}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSubscribeNotifyMe(null)}
                variant="outline"
                size="sm"
                isLoading={isSubscribing}
                className="gap-1.5"
              >
                <Bell className="w-4 h-4 text-teal-600" />
                Notify Me When Available
              </Button>
            </div>
          </div>

          {medicine.description && (
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-md border border-slate-100">
              <strong>Clinical Description / Therapeutic Info:</strong> {medicine.description}
            </div>
          )}
        </div>

        {/* Legal Disclaimer */}
        <Disclaimer />

        {/* Approved Vendors Availability List */}
        <Card header={
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Verified Suppliers Offering Stock</h3>
            <span className="text-xs text-slate-500">{approvedVendors.length} Verified Sources Found</span>
          </div>
        }>
          {approvedVendors.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 space-y-3">
              <p className="font-medium text-slate-700">Currently unavailable at all registered pharmacies and agencies.</p>
              <Button onClick={() => handleSubscribeNotifyMe(null)} variant="primary" size="sm" className="gap-1.5 mx-auto">
                <Bell className="w-4 h-4" />
                Subscribe for Restock Notification
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Supplier Name & Type</th>
                    <th className="py-3 px-3">Location Address</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Available Quantity</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Reservation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedVendors.map((v) => (
                    <tr key={v.inventory_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-navy-900">{v.business_name}</div>
                        <VendorTypeBadge type={v.vendor_type} />
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{v.address}, {v.city}, {v.state} ({v.pincode})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {v.phone}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400"><Mail className="w-3 h-3 text-slate-400" /> {v.email}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800">{v.stock_quantity} units</td>
                      <td className="py-3.5 px-3 font-bold text-navy-900">₹{parseFloat(v.price).toFixed(2)}</td>
                      <td className="py-3.5 px-3">
                        <AvailabilityBadge status={v.stock_status} />
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {v.stock_status === 'OUT_OF_STOCK' ? (
                          <Button
                            onClick={() => handleSubscribeNotifyMe(v.vendor_id)}
                            variant="secondary"
                            size="sm"
                            className="text-[11px] px-2.5 py-1"
                          >
                            Notify Me
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleOpenRequestModal(v)}
                            variant="primary"
                            size="sm"
                            className="text-[11px] px-2.5 py-1"
                          >
                            Reserve Stock
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

        {/* Reservation Request Modal */}
        {selectedVendor && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <h3 className="font-bold text-base text-navy-900">Submit Reservation Request</h3>
              <p className="text-xs text-slate-600">
                Reserve <strong>{medicine.name} ({medicine.brand})</strong> from <strong>{selectedVendor.business_name}</strong>.
              </p>

              <form onSubmit={handleReservationSubmit} className="space-y-4">
                <Input
                  label="Quantity Needed"
                  type="number"
                  min="1"
                  max={selectedVendor.stock_quantity || 100}
                  required
                  value={requestedQty}
                  onChange={(e) => setRequestedQty(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes for Pharmacy/Agency (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Urgent prescription requirement or pickup time window..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedVendor(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingReq}>
                    Submit Request
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
