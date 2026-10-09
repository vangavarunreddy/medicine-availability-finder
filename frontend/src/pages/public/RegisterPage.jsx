import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Store, Building2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const RegisterPage = () => {
  const [role, setRole] = useState('PATIENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    licenseNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        role,
        ...(role !== 'PATIENT' && {
          business_name: formData.businessName,
          license_number: formData.licenseNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          vendor_type: role
        })
      };

      const res = await register(payload);
      showToast(res.message || 'Registration successful! Verification email sent.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-navy-900">Create Platform Account</h2>
          <p className="text-xs text-slate-600 mt-1">Select your role to begin registration</p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRole('PATIENT')}
            className={`p-3 rounded-lg border text-center transition-all ${
              role === 'PATIENT'
                ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5 mx-auto mb-1 text-teal-600" />
            <span className="text-xs">Patient / User</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('PHARMACY')}
            className={`p-3 rounded-lg border text-center transition-all ${
              role === 'PHARMACY'
                ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <span className="text-xs">Pharmacy</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('MEDICAL_AGENCY')}
            className={`p-3 rounded-lg border text-center transition-all ${
              role === 'MEDICAL_AGENCY'
                ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-5 h-5 mx-auto mb-1 text-purple-600" />
            <span className="text-xs">Medical Agency</span>
          </button>
        </div>

        {/* Vendor Approval Notice */}
        {role !== 'PATIENT' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Administrative Approval Required:</strong> Pharmacy and Medical Agency accounts remain in <strong>PENDING</strong> status upon creation. Inventory listings will become publicly searchable once verified by an Administrator.
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
              />
              <Input
                label="Phone Number"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
            />

            {/* Vendor Specific Credentials */}
            {role !== 'PATIENT' && (
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {role === 'PHARMACY' ? 'Pharmacy Credentials' : 'Medical Agency Credentials'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Name"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder={role === 'PHARMACY' ? 'e.g. HealthPlus Pharmacy' : 'e.g. Apex Pharma Agency'}
                  />
                  <Input
                    label="License / Drug Reg Number"
                    name="licenseNumber"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="DL-12345-X"
                  />
                </div>

                <Input
                  label="Street Address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Building, Shop No., Street"
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="City"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New Delhi"
                  />
                  <Input
                    label="State"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Delhi"
                  />
                  <Input
                    label="Pincode"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="110001"
                  />
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full mt-4">
              Register Account
            </Button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Log in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
