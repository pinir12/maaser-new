'use client';

import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { HomePage } from '../components/HomePage';
import { Dashboard } from '../components/Dashboard';
import { EmailVerification } from '../components/EmailVerification';

function AppContent() {
  const { user, loading, verifyEmail } = useAuth();
  const [magicLinkVerifying, setMagicLinkVerifying] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState('');

  // Handle magic link verification from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify');
    if (!verifyToken) return;

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

    setMagicLinkVerifying(true);
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token && data.user) {
          localStorage.setItem('finance_token', data.token);
          localStorage.setItem('finance_user', JSON.stringify(data.user));
          window.location.reload();
        } else {
          setMagicLinkError(data.detail || 'Verification failed');
          setMagicLinkVerifying(false);
        }
      })
      .catch(() => {
        setMagicLinkError('Verification failed. Please try again.');
        setMagicLinkVerifying(false);
      });
  }, []);

  if (loading || magicLinkVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">
            {magicLinkVerifying ? 'Verifying your email...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (magicLinkError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-sm text-slate-500 mb-6">{magicLinkError}</p>
            <button onClick={() => { setMagicLinkError(''); }} 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <HomePage />;
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
