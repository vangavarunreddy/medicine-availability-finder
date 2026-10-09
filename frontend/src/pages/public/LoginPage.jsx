import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.full_name}!`, 'success');

      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }

      // Role-based navigation redirect
      if (user.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (user.role === 'PHARMACY' || user.role === 'MEDICAL_AGENCY') {
        navigate('/vendor/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-navy-900">Sign in to Platform</h2>
          <p className="text-xs text-slate-600 mt-1">Access Patient Portal, Vendor Dashboard, or Administrator Console</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Secure JWT Authentication</span>
              <Link to="/forgot-password" className="text-teal-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-teal-600 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
