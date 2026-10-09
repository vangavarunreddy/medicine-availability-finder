import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const { showToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email);
      showToast(res.message, 'success');
      setIsSubmitted(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-navy-900">Forgot Password</h2>
          <p className="text-xs text-slate-600 mt-1">Enter your registered email to receive a password reset link</p>
        </div>

        <Card>
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
              <p className="text-xs text-slate-700 leading-relaxed">
                If an account with <strong>{email}</strong> exists in our system, we have sent a password reset link. Please check your inbox.
              </p>
              <Link to="/login">
                <Button variant="secondary" className="w-full mt-2">Return to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />

              <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-teal-600 hover:underline">
                  Back to Log in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
