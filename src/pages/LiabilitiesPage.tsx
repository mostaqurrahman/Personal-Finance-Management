import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Liability } from '../types/finance';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import { Scale, Plus, X, AlertCircle } from 'lucide-react';

export const LiabilitiesPage: React.FC = () => {
  const { liabilities, createLiability } = useFinance();
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Liability['category']>('unpaid_bill');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(() => getCurrentDhakaDateString());
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const activeLiabilities = liabilities.filter((l) => !l.deletedAt && l.status === 'active');
  const totalLiab = activeLiabilities.reduce((sum, l) => sum + (l.remainingAmount ?? l.originalAmount), 0);

  const handleSaveLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return;

    try {
      await createLiability({
        name: name.trim(),
        category,
        originalAmount: Math.round(numAmt),
        paidAmount: 0,
        remainingAmount: Math.round(numAmt),
        startDate,
        dueDate: dueDate || undefined,
        description,
        status: 'active',
      });

      setIsModalOpen(false);
      setName('');
      setAmount('');
      setDueDate('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to save liability');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navLiabilities')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unpaid bills, commercial debts, and obligations (Excludes loan taken to prevent double-counting)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addLiability')}</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-600 to-pink-700 text-white shadow-lg shadow-rose-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-200">
            Total Other Liabilities
          </span>
          <div className="text-3xl font-extrabold mt-1">
            {formatBDT(totalLiab)}
          </div>
        </div>
        <div className="text-xs text-rose-100 max-w-xs">
          Personal loans borrowed are strictly managed in the Loans module to maintain a single source of truth.
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeLiabilities.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No pending other liabilities recorded.
          </div>
        ) : (
          activeLiabilities.map((l) => (
            <div
              key={l.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{l.name}</h3>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {l.category.replace('_', ' ')}
                    {l.dueDate ? ` • Due: ${formatDhakaDate(l.dueDate)}` : ''}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 uppercase">
                  {l.status}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Remaining Obligation:</span>
                  <span className="font-bold text-rose-600">
                    {formatBDT(l.remainingAmount ?? l.originalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Original:</span>
                  <span>{formatBDT(l.originalAmount)}</span>
                </div>
              </div>

              {l.description && <p className="text-xs text-slate-500">{l.description}</p>}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('addLiability')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLiability} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Liability Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Unpaid Hospital Bill, Contractor Due"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('liabilityCategory')} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="unpaid_bill">Unpaid Bill</option>
                  <option value="bank_loan">Bank Loan / Mortgage</option>
                  <option value="family_debt">Family / Friend Debt</option>
                  <option value="other">Other Liability</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md"
                >
                  Save Liability
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
