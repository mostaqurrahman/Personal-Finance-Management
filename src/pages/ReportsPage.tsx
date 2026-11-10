import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import {
  exportTransactionsToExcel,
  exportTransactionsToPdf,
  createFullJsonBackup,
} from '../services/exportService';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Database,
  TrendingUp,
  TrendingDown,
  PieChart,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    people,
    loans,
    savingsProducts,
    assets,
    liabilities,
    summary,
  } = useFinance();
  const { t, language } = useLanguage();

  const [reportType, setReportType] = useState<string>('income_expense');
  const [startDate, setStartDate] = useState(() => {
    const today = getCurrentDhakaDateString();
    return today.substring(0, 8) + '01';
  });
  const [endDate, setEndDate] = useState(() => getCurrentDhakaDateString());

  // Filter transactions for report period
  const periodTx = transactions.filter((t) => {
    if (t.deletedAt || t.status === 'cancelled') return false;
    const d = t.occurredAt.substring(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const handleExportExcel = () => {
    exportTransactionsToExcel(periodTx, accounts, categories, people, `${startDate}_to_${endDate}`);
  };

  const handleExportPdf = () => {
    exportTransactionsToPdf(periodTx, accounts, categories, `PFM Financial Report (${startDate} to ${endDate})`);
  };

  const handleJsonBackup = () => {
    createFullJsonBackup({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      accounts,
      transactions,
      categories,
      people,
      loans,
      savingsProducts,
      assets,
      liabilities,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navReports')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate and export daily, monthly, yearly, category-wise, and net worth reports
          </p>
        </div>

        {/* Working Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleJsonBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-md"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Date & Filter controls */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing {periodTx.length} transactions for selected window
        </div>
      </div>

      {/* Summary KPI Cards for this Report */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Period Income</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatBDT(
              periodTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
            )}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Period Expense</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatBDT(
              periodTx
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + (t.netExpense ?? t.amount), 0)
            )}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 block mb-1">Period Net Savings / Flow</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {formatBDT(
              periodTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                periodTx
                  .filter((t) => t.type === 'expense')
                  .reduce((sum, t) => sum + (t.netExpense ?? t.amount), 0)
            )}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20">
          <span className="text-xs text-emerald-100 block mb-1">Current Net Worth</span>
          <span className="text-xl font-bold">{formatBDT(summary.netWorth)}</span>
        </div>
      </div>

      {/* Transactions in Period Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Filtered Transactions Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {periodTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No transactions in this date range.
                  </td>
                </tr>
              ) : (
                periodTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-500">{formatDhakaDate(tx.occurredAt)}</td>
                    <td className="py-2 px-3 uppercase text-[10px] font-bold">{tx.type}</td>
                    <td className="py-2 px-3 text-slate-900 dark:text-white">{tx.description}</td>
                    <td className="py-2 px-3 text-slate-500">
                      {accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-rose-600' : 'text-blue-600'
                      }`}
                    >
                      {formatBDT(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
