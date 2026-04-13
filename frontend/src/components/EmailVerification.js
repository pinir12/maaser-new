'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function EmailVerification({ email, onVerified, onBack }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    
    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      const focusIdx = Math.min(digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
      // Auto-submit if all 6 digits pasted
      if (digits.length === 6) {
        submitCode(newCode.join(''));
      }
      return;
    }

    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    
    // Auto-submit when all digits entered
    const fullCode = newCode.join('');
    if (fullCode.length === 6 && newCode.every(d => d !== '')) {
      submitCode(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) handleChange(0, pasted);
  };

  const submitCode = async (codeStr) => {
    setError('');
    setSuccess('');
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed');
      
      setSuccess('Email verified!');
      setTimeout(() => onVerified(data), 800);
    } catch (err) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to resend');
      setSuccess('New verification code sent!');
      setCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    submitCode(fullCode);
  };

  return (
    <div data-testid="email-verification-page" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button data-testid="verification-back-btn" onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to sign in
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Maaser Tracker</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Check your email</h2>
            <p className="text-blue-100 text-sm mt-1">
              We sent a verification code to
            </p>
            <p data-testid="verification-email-display" className="text-white font-semibold text-sm mt-0.5">{email}</p>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div data-testid="verification-error" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {success && (
              <div data-testid="verification-success" className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3 block text-center">
                Enter 6-digit code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    data-testid={`verification-code-input-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    disabled={verifying}
                    className="w-11 h-13 text-center text-xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                    style={{ height: '52px' }}
                  />
                ))}
              </div>
            </div>

            <button data-testid="verify-code-submit-btn" type="submit" disabled={verifying || code.join('').length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {verifying ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Verifying...</>
              ) : (
                'Verify Email'
              )}
            </button>

            <div className="text-center pt-1">
              <p className="text-xs text-slate-400 mb-2">Didn't receive the email? Check your spam folder or</p>
              <button data-testid="resend-verification-btn" type="button" onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
                {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
