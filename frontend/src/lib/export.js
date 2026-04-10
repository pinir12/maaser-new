'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getCurrencySymbol, TRANSACTION_TYPES, getRecurringLabel } from '../lib/validation';

/**
 * Export transactions to CSV
 */
export function exportToCSV(transactions, baseCurrency, filename = 'transactions') {
  const symbol = getCurrencySymbol(baseCurrency);
  
  // CSV Headers
  const headers = [
    'Date',
    'Type',
    'Description',
    'Amount',
    'Currency',
    'Amount (Base)',
    'Maaser %',
    'Maaser Amount',
    'Recipient',
    'Recurring',
    'Hebrew Date'
  ];
  
  // Convert transactions to CSV rows
  const rows = transactions.map(t => {
    const normalizedAmount = t.currency === baseCurrency 
      ? t.amount 
      : t.amount * (t.exchange_rate_to_base || 1);
    const maaserAmount = t.type === TRANSACTION_TYPES.INCOME 
      ? normalizedAmount * ((t.maaser_percentage || 10) / 100) 
      : '';
    
    return [
      new Date(t.date).toLocaleDateString(),
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.description,
      t.amount.toFixed(2),
      t.currency,
      normalizedAmount.toFixed(2),
      t.type === TRANSACTION_TYPES.INCOME ? `${t.maaser_percentage || 10}%` : '',
      maaserAmount ? maaserAmount.toFixed(2) : '',
      t.recipient_name || '',
      t.is_recurring ? getRecurringLabel(t.recurring_frequency) : 'One-time',
      t.hebrew_date || ''
    ];
  });
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

/**
 * Export transactions to PDF
 */
export function exportToPDF(transactions, stats, maaserBalance, baseCurrency, userName, filename = 'transactions') {
  const symbol = getCurrencySymbol(baseCurrency);
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(30, 63, 50); // #1E3F32
  doc.text('Finance Tracker Report', 14, 22);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(104, 112, 107); // #68706B
  doc.text(`Generated for ${userName} on ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Summary Section
  doc.setFontSize(14);
  doc.setTextColor(24, 28, 26); // #181C1A
  doc.text('Summary (All Time)', 14, 45);
  
  doc.setFontSize(10);
  const summaryY = 52;
  const col1 = 14;
  const col2 = 70;
  const col3 = 126;
  
  doc.setTextColor(104, 112, 107);
  doc.text('Total Income:', col1, summaryY);
  doc.text('Maaser Owed:', col2, summaryY);
  doc.text('Maaser Balance:', col3, summaryY);
  
  doc.setTextColor(24, 28, 26);
  doc.setFontSize(12);
  doc.text(`${symbol}${stats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, col1, summaryY + 6);
  doc.text(`${symbol}${stats.totalMaaserOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, col2, summaryY + 6);
  doc.text(`${symbol}${Math.abs(maaserBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}${maaserBalance < 0 ? ' (over)' : ''}`, col3, summaryY + 6);
  
  doc.setFontSize(10);
  doc.setTextColor(104, 112, 107);
  doc.text('Total Given:', col1, summaryY + 16);
  doc.text('Total Lent:', col2, summaryY + 16);
  doc.text('Transactions:', col3, summaryY + 16);
  
  doc.setTextColor(24, 28, 26);
  doc.setFontSize(12);
  doc.text(`${symbol}${stats.totalGiven.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, col1, summaryY + 22);
  doc.text(`${symbol}${stats.totalLent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, col2, summaryY + 22);
  doc.text(`${transactions.length}`, col3, summaryY + 22);
  
  // Transactions Table
  doc.setFontSize(14);
  doc.setTextColor(24, 28, 26);
  doc.text('Transactions', 14, summaryY + 40);
  
  // Prepare table data
  const tableData = transactions.map(t => {
    const normalizedAmount = t.currency === baseCurrency 
      ? t.amount 
      : t.amount * (t.exchange_rate_to_base || 1);
    
    return [
      new Date(t.date).toLocaleDateString(),
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.description.substring(0, 30) + (t.description.length > 30 ? '...' : ''),
      `${getCurrencySymbol(t.currency)}${t.amount.toFixed(2)}`,
      `${symbol}${normalizedAmount.toFixed(2)}`,
      t.recipient_name || '-'
    ];
  });
  
  autoTable(doc, {
    startY: summaryY + 45,
    head: [['Date', 'Type', 'Description', 'Amount', 'Base Amount', 'Recipient']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 63, 50],
      textColor: 255,
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [245, 245, 240]
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 50 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 30 }
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(104, 112, 107);
    doc.text(
      `Page ${i} of ${pageCount} | Finance Tracker`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export component with buttons
 */
import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

export function ExportButtons({ transactions, stats, maaserBalance, baseCurrency, userName }) {
  const handleExportCSV = () => {
    exportToCSV(transactions, baseCurrency, `finance_tracker_${userName}`);
  };
  
  const handleExportPDF = () => {
    exportToPDF(transactions, stats, maaserBalance, baseCurrency, userName, `finance_tracker_${userName}`);
  };
  
  if (transactions.length === 0) {
    return null;
  }
  
  return (
    <div className="flex gap-2">
      <button
        data-testid="export-csv-btn"
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors text-sm font-medium"
      >
        <FileSpreadsheet className="w-4 h-4" />
        CSV
      </button>
      <button
        data-testid="export-pdf-btn"
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors text-sm font-medium"
      >
        <FileText className="w-4 h-4" />
        PDF
      </button>
    </div>
  );
}
