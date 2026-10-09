import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Pill, MapPin, Phone, Mail, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { AvailabilityBadge, VendorTypeBadge } from '../../components/common/Badge';
import { Disclaimer } from '../../components/common/Disclaimer';
import api from '../../services/api';

export const MedicineDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchDetails();
  }, [id]);

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
            
            {medicine.manufacturer && (
              <div className="text-left md:text-right text-xs">
                <span className="text-slate-400">Manufacturer</span>
                <div className="font-semibold text-slate-800">{medicine.manufacturer}</div>
              </div>
            )}
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
            <div className="py-10 text-center text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">Currently unavailable at all registered pharmacies and agencies.</p>
              <p>You can set up a "Notify Me" alert from the search results page to receive email updates when restocked.</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};
