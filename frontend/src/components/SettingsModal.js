import { useState } from 'react';
import { currencies } from '../lib/validation';
import { X, User, DollarSign, Calendar, Eye } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, user, updateUser }) {
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async (key, value) => {
    setSaving(true);
    await updateUser({ [key]: value });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          {/* Base Currency */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <DollarSign className="w-4 h-4" />
              Base Currency
            </label>
            <select
              data-testid="settings-base-currency"
              value={user?.base_currency || 'USD'}
              onChange={(e) => handleUpdate('base_currency', e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Default View */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Eye className="w-4 h-4" />
              Default View
            </label>
            <select
              data-testid="settings-default-view"
              value={user?.default_view || 'month'}
              onChange={(e) => handleUpdate('default_view', e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all_time">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Calendar Mode */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4" />
              Calendar Mode
            </label>
            <div className="flex gap-2">
              <button
                data-testid="settings-calendar-gregorian"
                onClick={() => handleUpdate('use_hebrew_calendar', false)}
                disabled={saving}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  !user?.use_hebrew_calendar
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Gregorian
              </button>
              <button
                data-testid="settings-calendar-hebrew"
                onClick={() => handleUpdate('use_hebrew_calendar', true)}
                disabled={saving}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  user?.use_hebrew_calendar
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hebrew
              </button>
            </div>
          </div>

          {/* Distribution Mode */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Distribution Mode</label>
            <div className="flex gap-2">
              <button
                data-testid="settings-mode-both"
                onClick={() => handleUpdate('distribution_mode', 'both')}
                disabled={saving}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  user?.distribution_mode === 'both'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Give & Lend
              </button>
              <button
                data-testid="settings-mode-give"
                onClick={() => handleUpdate('distribution_mode', 'give_only')}
                disabled={saving}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  user?.distribution_mode === 'give_only'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Give Only
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {user?.distribution_mode === 'give_only' ? 'Lend tracking is hidden' : 'Track both gives and lends'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
