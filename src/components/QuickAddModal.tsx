import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { getCurrentDhakaDateString } from '../i18n/formatters';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PEOPLE,
} from '../config/initialData';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, people, createTransaction } = useFinance();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(() => accounts[0]?.id || DEFAULT_ACCOUNTS[0]?.id || '');
  const [destAccountId, setDestAccountId] = useState(() => accounts[1]?.id || DEFAULT_ACCOUNTS[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [transferFee, setTransferFee] = useState('');
  const [date, setDate] = useState(() => getCurrentDhakaDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const effectiveAccounts = activeAccounts.length > 0 ? activeAccounts : DEFAULT_ACCOUNTS;

  const relevantCategories = categories.filter(
    (c) => c.status === 'active' && c.type === (activeTab === 'income' ? 'income' : 'expense')
  );
  const effectiveCategories = relevantCategories.length > 0
    ? relevantCategories
    : (activeTab === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES);

  const activePeople = people.filter((p) => p.status === 'active');
  const effectivePeople = activePeople.length > 0 ? activePeople : DEFAULT_PEOPLE;

  // Auto-sync account selection
  useEffect(() => {
    if (isOpen && effectiveAccounts.length > 0) {
      if (!accountId || !effectiveAccounts.some((a) => a.id === accountId)) {
        setAccountId(effectiveAccounts[0].id);
      }
    }
  }, [isOpen, effectiveAccounts, accountId]);

  // Auto-sync destination account selection for transfers
  useEffect(() => {
    if (isOpen && activeTab === 'transfer' && effectiveAccounts.length > 0) {
      if (!destAccountId || destAccountId === accountId || !effectiveAccounts.some((a) => a.id === destAccountId)) {
        const otherAcc = effectiveAccounts.find((a) => a.id !== accountId) || effectiveAccounts[0];
        setDestAccountId(otherAcc.id);
      }
    }
  }, [isOpen, activeTab, effectiveAccounts, accountId, destAccountId]);

  // Auto-sync category selection
  useEffect(() => {
    if (isOpen && activeTab !== 'transfer' && effectiveCategories.length > 0) {
      if (!categoryId || !effectiveCategories.some((c) => c.id === categoryId)) {
        setCategoryId(effectiveCategories[0].id);
      }
    }
  }, [isOpen, activeTab, effectiveCategories, categoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('invalidAmount'));
      return;
    }

    if (!accountId) {
      setError('Please select an account');
      return;
    }

    if (activeTab === 'transfer' && (!destAccountId || destAccountId === accountId)) {
      setError('Destination account must be different from source account');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'transfer') {
        const fee = parseFloat(transferFee) || 0;
        await createTransaction({
          type: 'transfer',
          amount: Math.round(numAmount),
          accountId,
          destinationAccountId: destAccountId,
          paymentMethod: 'Transfer',
          transferFee: fee,
          occurredAt: date,
          timezone: 'Asia/Dhaka',
          description: description || `Transfer: ${accounts.find((a) => a.id === accountId)?.name} to ${accounts.find((a) => a.id === destAccountId)?.name}`,
          note,
          status: 'posted',
        });
      } else {
        await createTransaction({
          type: activeTab,
          amount: Math.round(numAmount),
          accountId,
          categoryId: categoryId || undefined,
          personId: personId || undefined,
          paymentMethod: accounts.find((a) => a.id === accountId)?.provider || 'Cash',
          occurredAt: date,
          timezone: 'Asia/Dhaka',
          description: description || (activeTab === 'expense' ? 'Daily Expense' : 'Income'),
          note,
          status: 'posted',
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {t('quickAdd')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 p-3 gap-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            {t('typeExpense')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            {t('typeIncome')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'transfer'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            {t('typeTransfer')}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('fieldAmount')} *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Source Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {activeTab === 'transfer' ? t('fieldSourceAccount') : t('fieldAccount')} *
              </label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-all bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.25rem_1.25rem] bg-no-repeat"
              >
                <option value="" disabled className="bg-white dark:bg-slate-800 text-slate-400">
                  {language === 'bn' ? 'অ্যাকাউন্ট নির্বাচন করুন' : 'Select Account'}
                </option>
                {effectiveAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1.5 font-medium">
                    {acc.name} ({acc.provider}) — ৳{acc.currentBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account for Transfer */}
            {activeTab === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldDestinationAccount')} *
                </label>
                <select
                  required
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-all bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.25rem_1.25rem] bg-no-repeat"
                >
                  <option value="" disabled className="bg-white dark:bg-slate-800 text-slate-400">
                    {language === 'bn' ? 'গন্তব্য অ্যাকাউন্ট নির্বাচন করুন' : 'Select Destination'}
                  </option>
                  {effectiveAccounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1.5 font-medium">
                        {acc.name} ({acc.provider}) — ৳{acc.currentBalance.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              /* Category for Income/Expense */
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldCategory')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-all bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.25rem_1.25rem] bg-no-repeat"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-400">
                    {language === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select Category'}
                  </option>
                  {effectiveCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1.5 font-medium">
                      {language === 'bn' ? c.nameBn : c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Person (for expense or income) */}
          {activeTab !== 'transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldPerson')}
                </label>
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-400 dark:hover:border-slate-500 transition-all bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2310b981%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.25rem_1.25rem] bg-no-repeat"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-400">
                    {language === 'bn' ? 'ব্যক্তি নির্বাচন (ঐচ্ছিক / ব্যক্তিগত)' : 'None / Self'}
                  </option>
                  {effectivePeople.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 py-1.5 font-medium">
                      {language === 'bn' ? p.nameBn : p.name} ({p.relationship})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldDate')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Transfer Fee & Date for Transfer */}
          {activeTab === 'transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldTransferFee')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={transferFee}
                  onChange={(e) => setTransferFee(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldDate')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('fieldDescription')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery shopping, Salary, bKash cash out"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20"
            >
              {isSubmitting ? 'Saving...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
