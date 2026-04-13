'use client';

import { useState, useRef, useEffect } from 'react';
import { apiForgotPassword, apiResetPassword } from '../lib/api';
import { KeyRound, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Lock, Mail } from 'lucide-react';

export function ForgotPassword({ onBack, onSuccess }) {
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'newPassword'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [codeStr, setCodeStr] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email'); return; }
    setError(''); setLoading(true);
    try {
      await apiForgotPassword(email);
      setSuccess('Reset code sent! Check your email.');
      setCooldown(60);
      setStep('code');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      const full = newCode.join('');
      if (full.length === 6) { setCodeStr(full); setStep('newPassword'); }
      return;
    }
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const full = newCode.join('');
    if (full.length === 6 && newCode.every(d => d)) { setCodeStr(full); setStep('newPassword'); }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) handleCodeChange(0, pasted);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      const data = await apiResetPassword(email, codeStr, null, newPassword);
      setSuccess('Password reset!');
      setTimeout(() => onSuccess(data), 800);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="forgot-password-page" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button data-testid="forgot-back-btn" onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to sign in
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Maaser Tracker</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-center">
            <KeyRound className="w-6 h-6 text-white mx-auto mb-2" />
            <h2 className="text-lg font-bold text-white">
              {step === 'email' ? 'Reset your password' : step === 'code' ? 'Enter reset code' : 'Set new password'}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div data-testid="forgot-error" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {success && (
              <div data-testid="forgot-success" className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendReset} className="space-y-4">
                <p className="text-sm text-slate-500">Enter your email and we'll send you a reset code.</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="forgot-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
                </div>
                <button data-testid="forgot-send-btn" type="submit" disabled={loading}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send reset code'}
                </button>
              </form>
            )}

            {step === 'code' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 text-center">Enter the 6-digit code from your email</p>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input key={i} ref={el => inputRefs.current[i] = el}
                      data-testid={`forgot-code-input-${i}`} type="text" inputMode="numeric" maxLength={1}
                      value={digit} onChange={e => handleCodeChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                      className="w-11 text-center text-xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
                      style={{ height: '52px' }} />
                  ))}
                </div>
                <div className="text-center">
                  <button data-testid="forgot-resend-btn" type="button" onClick={handleSendReset} disabled={loading || cooldown > 0}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors">
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}

            {step === 'newPassword' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-slate-500">Code verified. Choose a new password.</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="forgot-new-password-input" type="password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} placeholder="New password" autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="forgot-confirm-password-input" type="password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
                </div>
                <button data-testid="forgot-reset-btn" type="submit" disabled={loading}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
