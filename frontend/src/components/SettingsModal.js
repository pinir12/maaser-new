'use client';

import { useState } from 'react';
import { currencies } from '../lib/validation';
import { X, User, DollarSign, Calendar, Eye, Percent, PieChart } from 'lucide-react';

export function SettingsModal({ isOpen, onClose, user, updateUser }) {
  const [saving, setSaving] = useState(false);
  const [maaserPct, setMaaserPct] = useState(user?.default_maaser_percentage ?? 10);
  const [giveRatio, setGiveRatio] = useState(user?.give_ratio ?? 50);
  const [lendRatio, setLendRatio] = useState(user?.lend_ratio ?? 50);

  if (!isOpen) return null;

  const handleUpdate = async (key, value) => {
    setSaving(true);
    await updateUser({ [key]: value });
    setSaving(false);
  };

  const handleMaaserSave = async () => {
    setSaving(true);
    await updateUser({ default_maaser_percentage: Number(maaserPct) });
    setSaving(false);
  };

  const handleRatioSave = async () => {
    setSaving(true);
    await updateUser({ give_ratio: Number(giveRatio), lend_ratio: Number(lendRatio) });
    setSaving(false);
  };

  const handleGiveRatioChange = (val) => {
    const v = Math.min(100, Math.max(0, Number(val)));
    setGiveRatio(v);
    setLendRatio(100 - v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <button data-testid="close-settings-btn" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
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

          {/* Default Maaser Percentage */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Percent className="w-4 h-4" />
              Default Maaser Percentage
            </label>
            <div className="flex items-center gap-2">
              <input
                data-testid="settings-maaser-pct"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={maaserPct}
                onChange={e => setMaaserPct(e.target.value)}
                className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="text-sm text-slate-500">%</span>
              <button
                data-testid="settings-maaser-save-btn"
                onClick={handleMaaserSave}
                disabled={saving || Number(maaserPct) === (user?.default_maaser_percentage ?? 10)}
                className="ml-auto px-3 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Applied as default when adding new income</p>
          </div>

          {/* Give/Lend Ratio - only show when distribution mode is "both" */}
          {user?.distribution_mode === 'both' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <PieChart className="w-4 h-4" />
                Give / Lend Ratio
              </label>
              <div className="p-3 bg-slate-50 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-blue-600 font-medium mb-1 block">Give</label>
                    <div className="flex items-center gap-1">
                      <input
                        data-testid="settings-give-ratio"
                        type="number"
                        min="0"
                        max="100"
                        value={giveRatio}
                        onChange={e => handleGiveRatioChange(e.target.value)}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="text-slate-300 pt-5">/</div>
                  <div className="flex-1">
                    <label className="text-xs text-rose-600 font-medium mb-1 block">Lend</label>
                    <div className="flex items-center gap-1">
                      <input
                        data-testid="settings-lend-ratio"
                        type="number"
                        min="0"
                        max="100"
                        value={lendRatio}
                        onChange={e => {
                          const v = Math.min(100, Math.max(0, Number(e.target.value)));
                          setLendRatio(v);
                          setGiveRatio(100 - v);
                        }}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-2 rounded-full overflow-hidden flex bg-slate-200">
                  <div className="bg-blue-500 transition-all duration-300" style={{ width: `${giveRatio}%` }} />
                  <div className="bg-rose-500 transition-all duration-300" style={{ width: `${lendRatio}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Give: {giveRatio}%</span>
                  <span>Lend: {lendRatio}%</span>
                </div>
                <button
                  data-testid="settings-ratio-save-btn"
                  onClick={handleRatioSave}
                  disabled={saving || (Number(giveRatio) === (user?.give_ratio ?? 50) && Number(lendRatio) === (user?.lend_ratio ?? 50))}
                  className="w-full py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  Save Ratio
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Suggested split of maaser between giving and lending
              </p>
            </div>
          )}

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
