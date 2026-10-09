import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, Filter, Edit, Trash2, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

export const AdminMedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formFilter, setFormFilter] = useState('ALL');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    generic_name: '',
    dosage: '',
    form: 'Tablet',
    manufacturer: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useNotification();

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (formFilter !== 'ALL') params.set('form', formFilter);

      const res = await api.get(`/medicines?${params.toString()}`);
      setMedicines(res.data.medicines);
    } catch (err) {
      showToast(err.message || 'Failed to fetch catalog medicines.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [formFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      brand: '',
      generic_name: '',
      dosage: '',
      form: 'Tablet',
      manufacturer: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (med) => {
    setEditingMedicine(med);
    setFormData({
      name: med.name,
      brand: med.brand,
      generic_name: med.generic_name,
      dosage: med.dosage,
      form: med.form,
      manufacturer: med.manufacturer || '',
      description: med.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingMedicine) {
        const res = await api.patch(`/medicines/${editingMedicine.id}`, formData);
        showToast(res.message, 'success');
      } else {
        const res = await api.post('/medicines', formData);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchMedicines();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (med) => {
    if (!window.confirm(`Are you sure you want to deactivate "${med.name} (${med.brand})"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/medicines/${med.id}`);
      showToast(res.message, 'success');
      fetchMedicines();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formOptions = [
    { value: 'ALL', label: 'All Forms' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Capsule', label: 'Capsule' },
    { value: 'Syrup', label: 'Syrup' },
    { value: 'Injection', label: 'Injection' },
    { value: 'Cream', label: 'Cream' },
    { value: 'Ointment', label: 'Ointment' },
    { value: 'Drops', label: 'Drops' },
    { value: 'Powder', label: 'Powder' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Centralized Medicine Catalog</h2>
          <p className="text-slate-600 text-xs mt-0.5">Manage master medicine specifications available for vendor stock listing.</p>
        </div>
        <Button onClick={handleOpenAddModal} variant="primary" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Master Medicine
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-3.5 bg-slate-50 border border-slate-300 rounded-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine name, brand, or generic compound..."
              className="w-full py-2 bg-transparent text-slate-900 placeholder-slate-400 text-xs focus:outline-none"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-500"
            >
              {formOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <Button type="submit" variant="secondary" size="sm" className="gap-1.5 shrink-0">
            <Search className="w-3.5 h-3.5" />
            Filter
          </Button>
        </form>
      </Card>

      {/* Medicines Table */}
      <Card header={<h3 className="font-bold text-slate-800 text-sm">Master Catalog Directory</h3>}>
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
            Loading catalog records...
          </div>
        ) : medicines.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <Pill className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700">No catalog medicines found.</p>
            <p>Click "Add Master Medicine" to populate the central directory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Medicine & Brand</th>
                  <th className="py-3 px-3">Generic Compound</th>
                  <th className="py-3 px-3">Dosage / Form</th>
                  <th className="py-3 px-3">Manufacturer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-navy-900">{med.name}</div>
                      <div className="text-[11px] text-slate-500">Brand: <span className="font-medium text-slate-700">{med.brand}</span></div>
                    </td>
                    <td className="py-3.5 px-3 italic text-slate-700">{med.generic_name}</td>
                    <td className="py-3.5 px-3 font-mono">
                      {med.dosage} • <span className="text-slate-600">{med.form}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{med.manufacturer || '—'}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        med.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {med.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(med)}
                        className="text-teal-600 font-medium hover:underline px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeactivate(med)}
                        className="text-red-600 font-medium hover:underline px-2 py-1"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-navy-900">
              {editingMedicine ? 'Edit Catalog Medicine' : 'Add Master Catalog Medicine'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Medicine Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paracetamol"
                />
                <Input
                  label="Brand Name"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Calpol 500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Generic Name"
                  required
                  value={formData.generic_name}
                  onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  placeholder="e.g. Acetaminophen"
                />
                <Input
                  label="Dosage Strength"
                  required
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g. 500mg, 10mg/ml"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Pharmaceutical Form"
                  required
                  options={formOptions.filter(o => o.value !== 'ALL')}
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                />
                <Input
                  label="Manufacturer (Optional)"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g. GSK, Cipla"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional indications, notes, or therapeutic category..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  {editingMedicine ? 'Update Specification' : 'Add to Catalog'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
