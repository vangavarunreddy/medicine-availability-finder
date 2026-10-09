import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email token...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing email verification token.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Email verified successfully! You can now access all features.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Failed to verify email. Token may be invalid or expired.');
      });
  }, [token, verifyEmail]);

  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="text-center p-8">
          {status === 'verifying' && (
            <div className="space-y-4">
              <RefreshCw className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-navy-900">Verifying Email</h2>
              <p className="text-xs text-slate-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="text-xl font-bold text-navy-900">Email Verified!</h2>
              <p className="text-xs text-slate-600">{message}</p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="primary" className="w-full">Proceed to Login</Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-bold text-navy-900">Verification Failed</h2>
              <p className="text-xs text-slate-600">{message}</p>
              <div className="pt-4 space-y-2">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">Return to Login</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
