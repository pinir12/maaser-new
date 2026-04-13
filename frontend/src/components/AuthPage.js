'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, currencies } from '../lib/validation';
import { useAuth } from '../lib/auth-context';
import { EmailVerification } from './EmailVerification';
import { ForgotPassword } from './ForgotPassword';
import { MagicLoginFlow } from './MagicLoginFlow';
import { apiRequestMagicLogin } from '../lib/api';
import { LogIn, UserPlus, Mail, Lock, User, DollarSign, ArrowLeft, Wand2 } from 'lucide-react';

export function AuthPage({ defaultTab = 'login', onBack = null }) {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login');
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showMagicLogin, setShowMagicLogin] = useState(false);
  const [showPasswordlessSignup, setShowPasswordlessSignup] = useState(false);
  const { signIn, signUp } = useAuth();

  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const registerForm = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '', base_currency: 'USD' } });
  const form = isLogin ? loginForm : registerForm;

  const onSubmit = async (data) => {
    setError('');
    const result = isLogin
      ? await signIn(data.email, data.password)
      : await signUp(data.email, data.password, data.name, data.base_currency);
    if (result.needsVerification) {
      setVerificationEmail(result.email);
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
  };

  // Passwordless signup
  const [passwordlessName, setPasswordlessName] = useState('');
  const [passwordlessEmail, setPasswordlessEmail] = useState('');
  const [passwordlessCurrency, setPasswordlessCurrency] = useState('USD');
  const [passwordlessLoading, setPasswordlessLoading] = useState(false);

  const handlePasswordlessSignup = async (e) => {
    e.preventDefault();
    if (!passwordlessName.trim() || !passwordlessEmail.trim()) {
      setError('Name and email are required');
      return;
    }
    setError('');
    setPasswordlessLoading(true);
    const result = await signUp(passwordlessEmail, null, passwordlessName, passwordlessCurrency);
    setPasswordlessLoading(false);
    if (result.needsVerification) {
      setVerificationEmail(result.email);
      return;
    }
    if (result.error) {
      setError(result.error);
    }
  };

  const handleVerified = (data) => {
    if (data.token && data.user) {
      localStorage.setItem('finance_token', data.token);
      localStorage.setItem('finance_user', JSON.stringify(data.user));
      window.location.reload();
    }
  };

  // Show verification screen
  if (verificationEmail) {
    return (
      <EmailVerification
        email={verificationEmail}
        onVerified={handleVerified}
        onBack={() => { setVerificationEmail(null); setIsLogin(true); setShowPasswordlessSignup(false); }}
      />
    );
  }

  // Show forgot password
  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} onSuccess={handleVerified} />;
  }

  // Show magic login
  if (showMagicLogin) {
    return <MagicLoginFlow onBack={() => setShowMagicLogin(false)} onSuccess={handleVerified} />;
  }

  // Passwordless signup form
  if (showPasswordlessSignup) {
    return (
      <div data-testid="passwordless-signup-page" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <button data-testid="passwordless-back-btn" onClick={() => { setShowPasswordlessSignup(false); setIsLogin(false); setError(''); }}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to register
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Maaser Tracker</h1>
            <p className="text-slate-500 mt-2">Sign up with just your email</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 text-center">
              <Wand2 className="w-6 h-6 text-white mx-auto mb-1" />
              <p className="text-white text-sm font-medium">No password needed — we'll email you a code</p>
            </div>
            <form onSubmit={handlePasswordlessSignup} className="p-6 space-y-4">
              {error && <div data-testid="auth-error" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="passwordless-name-input" type="text" value={passwordlessName} onChange={e => setPasswordlessName(e.target.value)}
                    placeholder="Your name" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="passwordless-email-input" type="email" value={passwordlessEmail} onChange={e => setPasswordlessEmail(e.target.value)}
                    placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Base Currency</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select data-testid="passwordless-currency-select" value={passwordlessCurrency} onChange={e => setPasswordlessCurrency(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500">
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <button data-testid="passwordless-submit-btn" type="submit" disabled={passwordlessLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50">
                {passwordlessLoading ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="auth-page" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {onBack && (
            <button data-testid="auth-back-btn" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to home
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900">Maaser Tracker</h1>
          <p className="text-slate-500 mt-2">Track your maaser with ease</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button data-testid="login-tab" onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${isLogin ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}>
              <LogIn className="w-4 h-4 inline mr-2" />Sign In
            </button>
            <button data-testid="register-tab" onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${!isLogin ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}>
              <UserPlus className="w-4 h-4 inline mr-2" />Register
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
            {error && <div data-testid="auth-error" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

            {!isLogin && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input data-testid="register-name-input" type="text" {...registerForm.register('name')} placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
                </div>
                {registerForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input data-testid={isLogin ? "login-email-input" : "register-email-input"} type="email" {...form.register('email')} placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
              </div>
              {form.formState.errors.email && <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input data-testid={isLogin ? "login-password-input" : "register-password-input"} type="password" {...form.register('password')} placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
              </div>
              {form.formState.errors.password && <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input data-testid="register-confirm-password-input" type="password" {...registerForm.register('confirmPassword')} placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {registerForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Base Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select data-testid="register-currency-select" {...registerForm.register('base_currency')}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500">
                      {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button data-testid={isLogin ? "login-submit-btn" : "register-submit-btn"} type="submit" disabled={form.formState.isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50">
              {form.formState.isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {/* Secondary actions */}
            <div className="space-y-2 pt-1">
              {isLogin ? (
                <>
                  <button data-testid="forgot-password-btn" type="button" onClick={() => setShowForgotPassword(true)}
                    className="w-full text-sm text-slate-500 hover:text-blue-600 transition-colors py-1">
                    Forgot password?
                  </button>
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-[11px] text-slate-400 font-medium">or</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                  <button data-testid="magic-login-btn" type="button" onClick={() => setShowMagicLogin(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                    <Wand2 className="w-4 h-4" />Sign in with email link
                  </button>
                </>
              ) : (
                <>
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-[11px] text-slate-400 font-medium">or</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>
                  <button data-testid="passwordless-signup-btn" type="button" onClick={() => { setShowPasswordlessSignup(true); setError(''); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                    <Wand2 className="w-4 h-4" />Sign up with email only
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
