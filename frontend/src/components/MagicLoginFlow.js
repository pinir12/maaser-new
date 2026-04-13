'use client';

import { useState, useRef, useEffect } from 'react';
import { apiRequestMagicLogin, apiVerifyMagicLogin } from '../lib/api';
import { Wand2, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export function MagicLoginFlow({ onBack, onSuccess }) {
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendLink = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { setError('Enter your email'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const data = await apiRequestMagicLogin(email);
      if (data.sent) {
        setSuccess('Login code sent! Check your email.');
        setCooldown(60);
        setStep('code');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const submitCode = async (codeStr) => {
    setError(''); setSuccess(''); setVerifying(true);
    try {
      const data = await apiVerifyMagicLogin(email, codeStr, null);
      setSuccess('Signed in!');
      setTimeout(() => onSuccess(data), 800);
    } catch (err) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      if (digits.length === 6) submitCode(newCode.join(''));
      return;
    }
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const full = newCode.join('');
    if (full.length === 6 && newCode.every(d => d)) submitCode(full);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) handleCodeChange(0, pasted);
  };

  return (
    <div data-testid="magic-login-page" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button data-testid="magic-login-back-btn" onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to sign in
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Maaser Tracker</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-center">
            <Wand2 className="w-6 h-6 text-white mx-auto mb-2" />
            <h2 className="text-lg font-bold text-white">
              {step === 'email' ? 'Sign in with email' : 'Enter login code'}
            </h2>
            {step === 'code' && <p className="text-emerald-100 text-sm mt-1">{email}</p>}
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div data-testid="magic-login-error" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {success && (
              <div data-testid="magic-login-success" className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
              </div>
            )}

            {step === 'email' && (
              <form onSubmit={handleSendLink} className="space-y-4">
                <p className="text-sm text-slate-500">We'll email you a code to sign in — no password needed.</p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="magic-login-email-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button data-testid="magic-login-send-btn" type="submit" disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send login code'}
                </button>
              </form>
            )}

            {step === 'code' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 text-center">Enter the 6-digit code from your email</p>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input key={i} ref={el => inputRefs.current[i] = el}
                      data-testid={`magic-login-code-input-${i}`} type="text" inputMode="numeric" maxLength={1}
                      value={digit} onChange={e => handleCodeChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                      disabled={verifying}
                      className="w-11 text-center text-xl font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
                      style={{ height: '52px' }} />
                  ))}
                </div>
                <button data-testid="magic-login-verify-btn" type="button" disabled={verifying || code.join('').length !== 6}
                  onClick={() => submitCode(code.join(''))}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {verifying ? <><RefreshCw className="w-4 h-4 animate-spin" />Verifying...</> : 'Sign In'}
                </button>
                <div className="text-center">
                  <button data-testid="magic-login-resend-btn" type="button" onClick={handleSendLink} disabled={loading || cooldown > 0}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition-colors">
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
