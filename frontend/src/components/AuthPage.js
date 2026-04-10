'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, currencies } from '../lib/validation';
import { useAuth } from '../lib/auth-context';
import { LogIn, UserPlus, Mail, Lock, User, DollarSign, ArrowLeft } from 'lucide-react';

export function AuthPage({ defaultTab = 'login', onBack = null }) {
  const [isLogin, setIsLogin] = useState(defaultTab === 'login');
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const registerForm = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', password: '', confirmPassword: '', base_currency: 'USD' } });
  const form = isLogin ? loginForm : registerForm;

  const onSubmit = async (data) => {
    setError('');
    const result = isLogin ? await signIn(data.email, data.password) : await signUp(data.email, data.password, data.name, data.base_currency);
    if (result.error) setError(result.error);
  };

  return (
    <div data-testid="auth-page" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {onBack && (
            <button data-testid="auth-back-btn" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to home
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900">Finance Tracker</h1>
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
          </form>
        </div>
      </div>
    </div>
  );
}
