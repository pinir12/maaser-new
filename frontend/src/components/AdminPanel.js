'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGetAdminUsers, apiUpdateAdminUser, apiDeleteAdminUser, apiRotateEncryptionKey } from '../lib/api';
import { ArrowLeft, Users, Shield, ShieldOff, Trash2, Search, RefreshCw, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showKeyRotation, setShowKeyRotation] = useState(false);
  const [oldKey, setOldKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [rotationLoading, setRotationLoading] = useState(false);
  const [rotationResult, setRotationResult] = useState(null);
  const [rotationError, setRotationError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetAdminUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleAdmin = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      await apiUpdateAdminUser(userId, { is_admin: !currentStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
    } catch (err) {
      console.error('Error toggling admin:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(userId);
    try {
      await apiDeleteAdminUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateKey = async () => {
    if (!oldKey.trim() || !newKey.trim()) { setRotationError('Both keys are required'); return; }
    if (oldKey === newKey) { setRotationError('New key must be different'); return; }
    if (!window.confirm('This will re-encrypt ALL transaction data with the new key. Make sure you have the new key saved. Continue?')) return;
    setRotationError('');
    setRotationResult(null);
    setRotationLoading(true);
    try {
      const result = await apiRotateEncryptionKey(oldKey, newKey);
      setRotationResult(result);
    } catch (e) {
      setRotationError(e.message);
    } finally {
      setRotationLoading(false);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-testid="admin-panel" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button data-testid="admin-back-btn" onClick={onBack} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900">User Management</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{users.length} users</span>
            <button onClick={fetchUsers} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input data-testid="admin-search-input" type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>

        {loading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Currency</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} data-testid={`admin-user-row-${u.id}`} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 text-sm">{u.name || 'Unnamed'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">{u.base_currency || 'USD'}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"><Shield className="w-3 h-3" /> Admin</span>
                        ) : (<span className="text-xs text-slate-400">User</span>)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button data-testid={`toggle-admin-${u.id}`} onClick={() => toggleAdmin(u.id, u.is_admin)} disabled={actionLoading === u.id}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.is_admin ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                            title={u.is_admin ? 'Remove admin' : 'Make admin'}>
                            {u.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                          <button data-testid={`delete-user-${u.id}`} onClick={() => deleteUser(u.id, u.email)} disabled={actionLoading === u.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete user">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key Rotation - Admin Only */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button data-testid="toggle-key-rotation" onClick={() => setShowKeyRotation(!showKeyRotation)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <KeyRound className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 text-sm">Encryption Key Rotation</p>
                <p className="text-xs text-slate-400">Re-encrypt all transaction data with a new key</p>
              </div>
            </div>
            <span className="text-slate-400 text-xs">{showKeyRotation ? 'Hide' : 'Show'}</span>
          </button>

          {showKeyRotation && (
            <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold mb-1">Before rotating:</p>
                  <ol className="list-decimal ml-4 space-y-0.5">
                    <li>Enter your current encryption key</li>
                    <li>Enter the new key (save it somewhere safe!)</li>
                    <li>After rotation, update <code className="bg-amber-100 px-1 rounded">ENCRYPTION_KEY</code> in Vercel env vars to the new key</li>
                    <li>Redeploy on Vercel</li>
                  </ol>
                </div>
              </div>

              {rotationError && (
                <div data-testid="rotation-error" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{rotationError}</div>
              )}
              {rotationResult && (
                <div data-testid="rotation-result" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" />Key rotation complete
                  </div>
                  <p className="text-emerald-600 text-xs">{rotationResult.reEncrypted} re-encrypted, {rotationResult.failed} failed out of {rotationResult.total} total</p>
                  <p className="text-amber-600 text-xs font-semibold mt-2">Now update ENCRYPTION_KEY in Vercel and redeploy!</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Current Key</label>
                <input data-testid="rotation-old-key" type="password" value={oldKey} onChange={e => setOldKey(e.target.value)}
                  placeholder="Your current ENCRYPTION_KEY"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">New Key</label>
                <input data-testid="rotation-new-key" type="password" value={newKey} onChange={e => setNewKey(e.target.value)}
                  placeholder="New encryption key"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500" />
              </div>
              <button data-testid="rotation-submit-btn" onClick={handleRotateKey} disabled={rotationLoading || !oldKey || !newKey}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {rotationLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Re-encrypting all data...</> : 'Rotate Encryption Key'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
