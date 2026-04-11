'use client';

import { useState } from 'react';
import { AuthPage } from './AuthPage';
import { Heart, HandCoins, CalendarDays, TrendingUp, Shield, FileSpreadsheet, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Maaser done right',
    desc: 'Log your income — maaser gets worked out on the spot. Set your own percentage, split between give and lend if you want to.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: HandCoins,
    title: 'Tzedakah & gemachs in one place',
    desc: 'Every donation and every loan, tracked separately. You\'ll always know exactly where you hold.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: CalendarDays,
    title: 'Works with the Jewish calendar',
    desc: 'Toggle between Hebrew and English dates. Browse by Jewish months — Tishrei, Cheshvan, Kislev — however you think about time.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: FileSpreadsheet,
    title: 'Import bank statements',
    desc: 'Drop in a CSV from your bank and it picks out the relevant transactions. Review, edit, and import in a few clicks.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: TrendingUp,
    title: 'See how you\'re doing',
    desc: 'Monthly email recaps and period-over-period comparisons. Watch your giving grow over time.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Shield,
    title: 'Your data stays private',
    desc: 'All amounts and names are encrypted before they even reach the database. We can\'t read your data — and neither can anyone else.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

export function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const [defaultTab, setDefaultTab] = useState('login');

  if (showAuth) {
    return <AuthPage defaultTab={defaultTab} onBack={() => setShowAuth(false)} />;
  }

  return (
    <div data-testid="home-page" className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Maaser Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <button data-testid="nav-login-btn" onClick={() => { setDefaultTab('login'); setShowAuth(true); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Sign In
            </button>
            <button data-testid="nav-register-btn" onClick={() => { setDefaultTab('register'); setShowAuth(true); }}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-4">For the frum community</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-3xl mx-auto">
          Stop guessing. <span className="text-blue-600">Know</span> where you hold with maaser.
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
          No more spreadsheets. No more losing track. Just log your income, and the app does the rest.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button data-testid="hero-register-btn" onClick={() => { setDefaultTab('register'); setShowAuth(true); }}
            className="flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
            Start tracking for free <ChevronRight className="w-4 h-4" />
          </button>
          <button data-testid="hero-login-btn" onClick={() => { setDefaultTab('login'); setShowAuth(true); }}
            className="px-8 py-3.5 text-base font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all">
            I have an account
          </button>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-slate-400 font-medium">Your dashboard</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
            <div className="p-2 sm:p-4 bg-emerald-50 rounded-xl text-center">
              <p className="text-[9px] sm:text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-1">Income</p>
              <p className="text-sm sm:text-xl font-bold text-emerald-700">$12,450</p>
            </div>
            <div className="p-2 sm:p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-[9px] sm:text-[10px] text-blue-600 uppercase tracking-wider font-semibold mb-1">Give</p>
              <p className="text-sm sm:text-xl font-bold text-blue-700">$245.00</p>
            </div>
            <div className="p-2 sm:p-4 bg-violet-50 rounded-xl text-center">
              <p className="text-[9px] sm:text-[10px] text-violet-600 uppercase tracking-wider font-semibold mb-1">Lend</p>
              <p className="text-sm sm:text-xl font-bold text-violet-700">$380.00</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { type: 'Income', desc: 'Monthly salary', amount: '+$5,200', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { type: 'Give', desc: 'Keren HaTorah', amount: '-$260', color: 'text-blue-600', bg: 'bg-blue-50' },
              { type: 'Lend', desc: 'Gemach contribution', amount: '-$500', color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 sm:py-2.5 px-3 sm:px-4 bg-slate-50/80 rounded-xl gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 ${t.bg} ${t.color}`}>{t.type}</span>
                  <span className="text-xs sm:text-sm text-slate-700 truncate">{t.desc}</span>
                </div>
                <span className={`text-xs sm:text-sm font-semibold shrink-0 ${t.color}`}>{t.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <h2 className="text-center text-base sm:text-lg font-bold text-slate-900 mb-2">What it actually does</h2>
        <p className="text-center text-sm text-slate-400 mb-10 max-w-md mx-auto">Built by someone who got tired of tracking maaser in a spreadsheet. Here&apos;s what&apos;s inside.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} data-testid={`feature-card-${i}`} className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:shadow-md hover:border-slate-300/80 transition-all">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-3xl mx-auto px-5 pb-20 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200/60">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed italic">
            &ldquo;I used to track maaser in a spreadsheet and always lost track. This makes it so poshut &mdash;
            I log my income, it calculates everything, and I always know exactly where I hold.&rdquo;
          </p>
          <p className="mt-4 text-sm text-slate-400 font-medium">&mdash; A happy user</p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-5 pb-20 text-center">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">It&apos;s free. Takes half a minute.</h2>
        <p className="text-sm text-slate-500 mb-6">No credit card. No nonsense. Just sign up and start.</p>
        <button data-testid="bottom-register-btn" onClick={() => { setDefaultTab('register'); setShowAuth(true); }}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
          Create your account <ChevronRight className="w-4 h-4" />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">M</span>
            </div>
            <span className="text-sm text-slate-500">Maaser Tracker</span>
          </div>
          <p className="text-xs text-slate-400">All data encrypted. We never see or share your information.</p>
        </div>
      </footer>
    </div>
  );
}
