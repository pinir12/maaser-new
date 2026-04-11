'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Check, Trash2, Pencil, FileSpreadsheet, Zap, AlertCircle } from 'lucide-react';
import { getCurrencySymbol, TRANSACTION_TYPES } from '../lib/validation';
import { apiImportTransactions } from '../lib/api';

// UK bank date formats
function parseDate(str) {
  if (!str) return null;
  const s = str.trim();
  // ISO: 2026-04-11
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // UK: 11/04/2026 or 11-04-2026
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // UK: 11 Apr 2026
  m = s.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (m) {
    const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
    const mo = months[m[2].toLowerCase().slice(0,3)];
    if (mo) return `${m[3]}-${String(mo).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  // Try native Date parse as last resort
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return null;
}

function parseAmount(str) {
  if (str == null) return null;
  const cleaned = String(str).replace(/[£$€₪,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Auto-detect column mappings from headers
function autoDetectColumns(headers) {
  const map = { date: -1, description: -1, amount: -1, credit: -1, debit: -1 };
  const lower = headers.map(h => h.toLowerCase().trim());

  for (let i = 0; i < lower.length; i++) {
    const h = lower[i];
    if (map.date === -1 && /(date|trans.*date|posting.*date|value.*date)/i.test(h)) map.date = i;
    if (map.description === -1 && /(desc|narr|detail|memo|reference|transaction.*desc|payee|merchant)/i.test(h)) map.description = i;
    if (map.amount === -1 && /^(amount|value|sum)$/i.test(h)) map.amount = i;
    if (map.credit === -1 && /(^credit$|money.*in|paid.*in|^cr$)/i.test(h)) map.credit = i;
    if (map.debit === -1 && /(^debit$|money.*out|paid.*out|^dr$|withdrawal)/i.test(h)) map.debit = i;
  }

  // Fallback: if no specific matches, guess by position (common UK format: Date, Type, Description, Debit, Credit, Balance)
  if (map.date === -1 && lower.length >= 3) map.date = 0;
  if (map.description === -1 && lower.length >= 3) map.description = Math.min(2, lower.length - 1);

  return map;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };

  // Detect separator
  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1).map(line => {
    const cols = [];
    let inQuote = false, current = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === sep && !inQuote) { cols.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    cols.push(current.trim());
    return cols;
  }).filter(r => r.some(c => c));

  return { headers, rows };
}

// Smart match against user's existing transactions
function smartMatch(description, pastTransactions) {
  if (!description || !pastTransactions.length) return null;
  const lower = description.toLowerCase();

  // Exact description match
  for (const pt of pastTransactions) {
    if ((pt.description || '').toLowerCase() === lower) return pt;
  }

  // Partial match (description contains or is contained)
  for (const pt of pastTransactions) {
    const ptDesc = (pt.description || '').toLowerCase();
    if (ptDesc && (lower.includes(ptDesc) || ptDesc.includes(lower))) return pt;
  }

  // Word overlap match (3+ words in common)
  const words = new Set(lower.split(/\s+/).filter(w => w.length > 2));
  let bestMatch = null, bestScore = 0;
  for (const pt of pastTransactions) {
    const ptWords = (pt.description || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const overlap = ptWords.filter(w => words.has(w)).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      bestMatch = pt;
    }
  }
  return bestMatch;
}

const STEPS = { UPLOAD: 0, MAP: 1, REVIEW: 2, RESULT: 3 };

export function CSVImportModal({ isOpen, onClose, onImported, baseCurrency, pastTransactions = [], defaultMaaserPercentage = 10 }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [rawData, setRawData] = useState(null);
  const [colMap, setColMap] = useState({ date: -1, description: -1, amount: -1, credit: -1, debit: -1 });
  const [parsedRows, setParsedRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const fileRef = useRef(null);

  const sym = getCurrencySymbol(baseCurrency || 'GBP');

  const resetState = useCallback(() => {
    setStep(STEPS.UPLOAD);
    setRawData(null);
    setColMap({ date: -1, description: -1, amount: -1, credit: -1, debit: -1 });
    setParsedRows([]);
    setSelected(new Set());
    setImporting(false);
    setResult(null);
    setEditingIdx(null);
  }, []);

  const handleClose = () => { resetState(); onClose(); };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const { headers, rows } = parseCSV(text);
      if (!headers.length || !rows.length) return;
      const detected = autoDetectColumns(headers);
      setRawData({ headers, rows });
      setColMap(detected);
      setStep(STEPS.MAP);
    };
    reader.readAsText(file);
  };

  const processRows = useCallback(() => {
    if (!rawData) return;
    const rows = rawData.rows.map((cols, i) => {
      const dateStr = colMap.date >= 0 ? cols[colMap.date] : null;
      const desc = colMap.description >= 0 ? (cols[colMap.description] || '').trim() : '';
      let amount = 0;

      if (colMap.amount >= 0) {
        amount = Math.abs(parseAmount(cols[colMap.amount]) || 0);
      } else if (colMap.credit >= 0 || colMap.debit >= 0) {
        const cr = colMap.credit >= 0 ? parseAmount(cols[colMap.credit]) : null;
        const dr = colMap.debit >= 0 ? parseAmount(cols[colMap.debit]) : null;
        if (cr && cr > 0) amount = cr;
        else if (dr && dr > 0) amount = dr;
        else if (cr != null) amount = Math.abs(cr);
        else if (dr != null) amount = Math.abs(dr);
      }

      const date = parseDate(dateStr);
      if (!date || amount === 0) return null;

      // Determine if income or outgoing
      let isIncome = false;
      if (colMap.credit >= 0 && colMap.debit >= 0) {
        const cr = parseAmount(cols[colMap.credit]);
        isIncome = cr != null && cr > 0;
      } else if (colMap.amount >= 0) {
        isIncome = parseAmount(cols[colMap.amount]) > 0;
      }

      // Smart match
      const match = smartMatch(desc, pastTransactions);
      let type = isIncome ? TRANSACTION_TYPES.INCOME : TRANSACTION_TYPES.GIVE;
      let recipient = '';
      let maaserPct = defaultMaaserPercentage;

      if (match) {
        type = match.type || type;
        recipient = match.recipient_name || '';
        if (match.maaser_percentage) maaserPct = match.maaser_percentage;
      }

      return {
        id: i,
        date,
        description: desc,
        amount: Math.round(amount * 100) / 100,
        type,
        recipient_name: recipient,
        maaser_percentage: maaserPct,
        currency: baseCurrency || 'GBP',
        exchange_rate_to_base: 1,
        matched: !!match,
        matchedFrom: match?.description || null,
      };
    }).filter(Boolean);

    setParsedRows(rows);
    setSelected(new Set(rows.map(r => r.id)));
    setStep(STEPS.REVIEW);
  }, [rawData, colMap, pastTransactions, baseCurrency, defaultMaaserPercentage]);

  const handleImport = async () => {
    const toImport = parsedRows.filter(r => selected.has(r.id)).map(r => ({
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      exchange_rate_to_base: r.exchange_rate_to_base,
      type: r.type,
      recipient_name: r.recipient_name,
      date: r.date,
      maaser_percentage: r.maaser_percentage,
    }));

    if (!toImport.length) return;
    setImporting(true);
    try {
      const res = await apiImportTransactions(toImport);
      setResult(res);
      setStep(STEPS.RESULT);
    } catch (e) {
      setResult({ imported: 0, errors: [{ error: e.message }], total: toImport.length });
      setStep(STEPS.RESULT);
    }
    setImporting(false);
  };

  const toggleAll = () => {
    if (selected.size === parsedRows.length) setSelected(new Set());
    else setSelected(new Set(parsedRows.map(r => r.id)));
  };

  const toggleRow = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const removeRow = (id) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const updateRow = (id, field, value) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  if (!isOpen) return null;

  return (
    <div data-testid="csv-import-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Import from CSV</h2>
          </div>
          <button data-testid="csv-close-btn" onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 text-[10px] uppercase tracking-wider font-semibold shrink-0">
          {['Upload', 'Map Columns', 'Review', 'Done'].map((label, i) => (
            <div key={i} className={`flex items-center gap-1 ${i <= step ? 'text-blue-600' : 'text-slate-300'}`}>
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Step 0: Upload */}
          {step === STEPS.UPLOAD && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-base font-semibold text-slate-900 mb-1">Upload your bank statement</p>
              <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">CSV files from UK banks (Barclays, HSBC, Lloyds, Monzo, Starling, NatWest, etc.)</p>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFile} />
              <button data-testid="csv-upload-btn" onClick={() => fileRef.current?.click()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors">
                Choose CSV File
              </button>
            </div>
          )}

          {/* Step 1: Column Mapping */}
          {step === STEPS.MAP && rawData && (
            <div>
              <p className="text-sm text-slate-600 mb-4">We auto-detected your columns. Adjust if needed, or skip to continue.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'description', label: 'Description' },
                  { key: 'amount', label: 'Amount (single column)' },
                  { key: 'credit', label: 'Credit / Money In' },
                  { key: 'debit', label: 'Debit / Money Out' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1 block">{label}</label>
                    <select data-testid={`col-map-${key}`}
                      value={colMap[key]}
                      onChange={e => setColMap(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900">
                      <option value={-1}>— Not used —</option>
                      {rawData.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {/* Preview */}
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">Preview (first 3 rows)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50">{rawData.headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>)}</tr></thead>
                  <tbody>{rawData.rows.slice(0, 3).map((row, ri) => <tr key={ri} className="border-t border-slate-100">{row.map((c, ci) => <td key={ci} className="px-3 py-2 text-slate-700">{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setStep(STEPS.UPLOAD)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Back</button>
                <button data-testid="csv-skip-mapping-btn" onClick={processRows}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === STEPS.REVIEW && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{parsedRows.length} transactions found. <span className="font-medium">{selected.size} selected</span> for import.</p>
                <div className="flex items-center gap-2">
                  <button onClick={toggleAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    {selected.size === parsedRows.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {parsedRows.map(row => {
                  const isEditing = editingIdx === row.id;
                  const isSelected = selected.has(row.id);
                  const typeColors = {
                    income: 'bg-emerald-50 text-emerald-600',
                    give: 'bg-blue-50 text-blue-600',
                    lend: 'bg-violet-50 text-violet-600',
                  };

                  return (
                    <div key={row.id} data-testid={`import-row-${row.id}`}
                      className={`rounded-xl border p-3 transition-all ${isSelected ? 'border-blue-200 bg-white' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 shrink-0" />

                        {isEditing ? (
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={row.description} onChange={e => updateRow(row.id, 'description', e.target.value)}
                                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg" placeholder="Description" />
                              <input value={row.recipient_name} onChange={e => updateRow(row.id, 'recipient_name', e.target.value)}
                                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg" placeholder="Recipient" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" step="0.01" value={row.amount} onChange={e => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                              <select value={row.type} onChange={e => updateRow(row.id, 'type', e.target.value)}
                                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                                <option value="income">Income</option>
                                <option value="give">Give</option>
                                <option value="lend">Lend</option>
                              </select>
                              <input type="date" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)}
                                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg" />
                            </div>
                            <button onClick={() => setEditingIdx(null)} className="text-xs text-blue-600 font-medium">Done editing</button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md ${typeColors[row.type] || typeColors.give}`}>
                                  {row.type}
                                </span>
                                <span className="text-sm font-medium text-slate-900 truncate">{row.description}</span>
                                {row.matched && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                                    <Zap className="w-2.5 h-2.5" />matched
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                <span>{row.date}</span>
                                {row.recipient_name && <span>{row.recipient_name}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={`text-sm font-semibold ${row.type === 'income' ? 'text-emerald-600' : row.type === 'lend' ? 'text-violet-600' : 'text-blue-600'}`}>
                                {row.type === 'income' ? '+' : '-'}{sym}{row.amount.toFixed(2)}
                              </span>
                              <button onClick={() => setEditingIdx(row.id)} className="p-1 text-slate-300 hover:text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => removeRow(row.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {parsedRows.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">No valid transactions found in the CSV.</div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button onClick={() => setStep(STEPS.MAP)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Back to mapping</button>
                <button data-testid="csv-import-btn" onClick={handleImport} disabled={importing || selected.size === 0}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                  {importing ? 'Importing...' : `Import ${selected.size} Transaction${selected.size !== 1 ? 's' : ''}`}
                  {!importing && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === STEPS.RESULT && result && (
            <div className="flex flex-col items-center justify-center py-12">
              {result.imported > 0 ? (
                <>
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 mb-1">Import Complete</p>
                  <p className="text-sm text-slate-500 mb-6">{result.imported} of {result.total} transactions imported successfully.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-base font-semibold text-slate-900 mb-1">Import Failed</p>
                  <p className="text-sm text-slate-500 mb-6">{result.errors?.[0]?.error || 'Unknown error'}</p>
                </>
              )}
              <button data-testid="csv-done-btn" onClick={() => { handleClose(); if (result.imported > 0) onImported?.(); }}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
