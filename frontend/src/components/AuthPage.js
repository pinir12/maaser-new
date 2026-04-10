import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, currencies } from '../lib/validation';
import { useAuth } from '../lib/auth-context';
import { LogIn, UserPlus, Mail, Lock, User, DollarSign } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      base_currency: 'USD'
    }
  });

  const activeForm = isLogin ? loginForm : registerForm;

  const onSubmit = async (data) => {
    setError('');
    
    if (isLogin) {
      const { error } = await signIn(data.email, data.password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(data.email, data.password, data.name, data.base_currency);
      if (error) setError(error);
    }
  };

  return (
    <div 
      data-testid="auth-page"
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1615716038854-58e352eee1db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNvZnQlMjBncmFkaWVudCUyMGJhY2tncm91bmQlMjBzYW5kJTIwcGFzdGVsJTIwZ3JlZW58ZW58MHx8fHwxNzc1Nzg0OTY2fDA&ixlib=rb-4.1.0&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#181C1A] tracking-tight">
            Finance Tracker
          </h1>
          <p className="text-[#68706B] mt-2">
            Track your gives and lends with ease
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab Toggle */}
          <div className="flex border-b border-white/20">
            <button
              data-testid="login-tab"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-all ${
                isLogin 
                  ? 'text-[#1E3F32] bg-white/50' 
                  : 'text-[#68706B] hover:bg-white/20'
              }`}
            >
              <LogIn className="w-4 h-4 inline-block mr-2" />
              Sign In
            </button>
            <button
              data-testid="register-tab"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-all ${
                !isLogin 
                  ? 'text-[#1E3F32] bg-white/50' 
                  : 'text-[#68706B] hover:bg-white/20'
              }`}
            >
              <UserPlus className="w-4 h-4 inline-block mr-2" />
              Register
            </button>
          </div>

          {/* Form */}
          <form 
            onSubmit={activeForm.handleSubmit(onSubmit)} 
            className="p-6 space-y-5"
          >
            {/* Error Message */}
            {error && (
              <div 
                data-testid="auth-error"
                className="p-3 bg-[#C2574A]/10 border border-[#C2574A]/30 rounded-xl text-[#C2574A] text-sm"
              >
                {error}
              </div>
            )}

            {/* Name (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                  <input
                    data-testid="register-name-input"
                    type="text"
                    {...registerForm.register('name')}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A] placeholder:text-[#68706B]/50"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-[#C2574A]">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                <input
                  data-testid={isLogin ? "login-email-input" : "register-email-input"}
                  type="email"
                  {...activeForm.register('email')}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A] placeholder:text-[#68706B]/50"
                />
              </div>
              {activeForm.formState.errors.email && (
                <p className="mt-1 text-sm text-[#C2574A]">
                  {activeForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                <input
                  data-testid={isLogin ? "login-password-input" : "register-password-input"}
                  type="password"
                  {...activeForm.register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A] placeholder:text-[#68706B]/50"
                />
              </div>
              {activeForm.formState.errors.password && (
                <p className="mt-1 text-sm text-[#C2574A]">
                  {activeForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                  <input
                    data-testid="register-confirm-password-input"
                    type="password"
                    {...registerForm.register('confirmPassword')}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A] placeholder:text-[#68706B]/50"
                  />
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-[#C2574A]">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {/* Base Currency (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#68706B] mb-2">
                  Base Currency
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68706B]" />
                  <select
                    data-testid="register-currency-select"
                    {...registerForm.register('base_currency')}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl focus:ring-2 focus:ring-[#1E3F32]/50 focus:bg-white transition-all text-[#181C1A]"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              data-testid={isLogin ? "login-submit-btn" : "register-submit-btn"}
              type="submit"
              disabled={activeForm.formState.isSubmitting}
              className="w-full py-3 bg-[#1E3F32] text-white font-semibold rounded-xl hover:bg-[#152e24] shadow-md transition-all disabled:opacity-50"
            >
              {activeForm.formState.isSubmitting 
                ? 'Please wait...' 
                : isLogin ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
