import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrencySymbol, getRecurringLabel, TRANSACTION_TYPES } from '../lib/validation';
import { Pencil, Trash2, Repeat, TrendingUp, Heart, HandCoins, Calendar, Save, X } from 'lucide-react';

export function RecurringManager({ userId, baseCurrency, onBack }) {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchRecurring = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_recurring', true)
        .order('date', { ascending: false });
      if (error) throw error;

      // Deduplicate: keep only the earliest entry per description+type+frequency
      const uniqueMap = new Map();
      const sorted = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
      sorted.forEach(t => {
        const key = `${t.description}|${t.type}|${t.recurring_frequency}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, t);
      });
      setRecurring(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchRecurring(); }, [fetchRecurring]);

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      description: t.description,
      amount: t.amount,
      recurring_frequency: t.recurring_frequency,
      recurring_end_date: t.recurring_end_date || '',
      recipient_name: t.recipient_name || ''
    });
  };

  const saveEdit = async (t) => {
    try {
      // Update ALL instances of this recurring transaction template
      await supabase
        .from('transactions')
        .update({
          description: editForm.description,
          amount: Number(editForm.amount),
          recurring_frequency: editForm.recurring_frequency,
          recurring_end_date: editForm.recurring_end_date || null,
          recipient_name: editForm.recipient_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('description', t.description)
        .eq('type', t.type)
        .eq('is_recurring', true);

      setEditingId(null);
      await fetchRecurring();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteRecurring = async (t) => {
    const choice = window.confirm(
      `Delete ALL instances of "${t.description}" (${getRecurringLabel(t.recurring_frequency)})?\n\nThis will remove all past and future entries for this recurring transaction.`
    );
    if (!choice) return;

    try {
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('description', t.description)
        .eq('type', t.type)
        .eq('is_recurring', true);

      await fetchRecurring();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const stopRecurring = async (t) => {
    try {
      // Mark end date as today to stop future occurrences
      await supabase
        .from('transactions')
        .update({
          recurring_end_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('description', t.description)
        .eq('type', t.type)
        .eq('is_recurring', true);

      await fetchRecurring();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getIcon = (type) => {
    if (type === TRANSACTION_TYPES.INCOME) return <TrendingUp className="w-4 h-4" />;
    if (type === TRANSACTION_TYPES.GIVE) return <Heart className="w-4 h-4" />;
    return <HandCoins className="w-4 h-4" />;
  };

  const getColor = (type) => {
    if (type === TRANSACTION_TYPES.INCOME) return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
    if (type === TRANSACTION_TYPES.GIVE) return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' };
    return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' };
  };

  const isExpired = (t) => {
    if (!t.recurring_end_date) return false;
    return new Date(t.recurring_end_date) < new Date();
  };

  return (
    <div data-testid="recurring-manager" className="space-y-4">
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : recurring.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recurring transactions</p>
          <p className="text-sm mt-1">Add a recurring transaction from the main dashboard</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurring.map(t => {
            const colors = getColor(t.type);
            const expired = isExpired(t);
            const editing = editingId === t.id;

            return (
              <div
                key={t.id}
                data-testid={`recurring-item-${t.id}`}
                className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all ${expired ? 'opacity-60' : ''}`}
              >
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.amount}
                          onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Frequency</label>
                        <select
                          value={editForm.recurring_frequency}
                          onChange={e => setEditForm(prev => ({ ...prev, recurring_frequency: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
                        <input
                          type="date"
                          value={editForm.recurring_end_date}
                          onChange={e => setEditForm(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Recipient</label>
                        <input
                          type="text"
                          value={editForm.recipient_name}
                          onChange={e => setEditForm(prev => ({ ...prev, recipient_name: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(t)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.badge}`}>
                        {getIcon(t.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{t.description}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {t.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            {getRecurringLabel(t.recurring_frequency)}
                          </span>
                          {t.recipient_name && <span>To: {t.recipient_name}</span>}
                          {t.recurring_end_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Ends: {new Date(t.recurring_end_date).toLocaleDateString()}
                            </span>
                          )}
                          {expired && <span className="text-amber-600 font-medium">Expired</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${colors.text} text-lg`}>
                        {getCurrencySymbol(t.currency || baseCurrency)}{t.amount?.toLocaleString()}
                      </span>
                      <div className="flex gap-1">
                        <button
                          data-testid={`edit-recurring-${t.id}`}
                          onClick={() => startEdit(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                          title="Edit recurring"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!expired && (
                          <button
                            data-testid={`stop-recurring-${t.id}`}
                            onClick={() => stopRecurring(t)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
                            title="Stop recurring"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          data-testid={`delete-recurring-${t.id}`}
                          onClick={() => deleteRecurring(t)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                          title="Delete all instances"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
