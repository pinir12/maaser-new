'use client';

import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { HomePage } from '../components/HomePage';
import { Dashboard } from '../components/Dashboard';
import { ForgotPassword } from '../components/ForgotPassword';

function AppContent() {
  const { user, loading } = useAuth();
  const [magicLinkState, setMagicLinkState] = useState(null); // null | 'verifying' | 'reset' | { error }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const verifyToken = params.get('verify');
    const loginToken = params.get('login');
    const resetToken = params.get('reset');

    const token = verifyToken || loginToken;
    const endpoint = verifyToken ? '/api/auth/verify-email' : loginToken ? '/api/auth/verify-magic-login' : null;

    // Clean URL
    if (verifyToken || loginToken || resetToken) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Password reset magic link → show reset form
    if (resetToken) {
      setMagicLinkState({ type: 'reset', token: resetToken });
      return;
    }

    // Verify or login magic link → auto-verify
    if (token && endpoint) {
      setMagicLinkState('verifying');
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.token && data.user) {
            localStorage.setItem('finance_token', data.token);
            localStorage.setItem('finance_user', JSON.stringify(data.user));
            window.location.reload();
          } else {
            setMagicLinkState({ type: 'error', message: data.detail || 'Verification failed' });
          }
        })
        .catch(() => {
          setMagicLinkState({ type: 'error', message: 'Verification failed. Please try again.' });
        });
    }
  }, []);

  if (loading || magicLinkState === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">
            {magicLinkState === 'verifying' ? 'Verifying...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Password reset from magic link
  if (magicLinkState?.type === 'reset') {
    const handleResetSuccess = (data) => {
      if (data.token && data.user) {
        localStorage.setItem('finance_token', data.token);
        localStorage.setItem('finance_user', JSON.stringify(data.user));
        window.location.reload();
      }
    };
    return <ResetFromLink token={magicLinkState.token} onSuccess={handleResetSuccess} onBack={() => setMagicLinkState(null)} />;
  }

  if (magicLinkState?.type === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Link Expired</h2>
            <p className="text-sm text-slate-500 mb-6">{magicLinkState.message}</p>
            <button onClick={() => setMagicLinkState(null)}
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

// Inline reset-from-link component (used when user clicks password reset magic link)
function ResetFromLink({ token, onSuccess, onBack }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed');
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Maaser Tracker</h1>
          <p className="text-slate-500 mt-2">Set your new password</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-center">
            <h2 className="text-lg font-bold text-white">New Password</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="New password" autoFocus
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Resetting...' : 'Set Password'}
            </button>
            <button type="button" onClick={onBack} className="w-full text-sm text-slate-500 hover:text-blue-600 transition-colors py-1">Cancel</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
