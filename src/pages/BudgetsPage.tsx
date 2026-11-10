import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Budget } from '../types/finance';
import { formatBDT, getCurrentDhakaDateString } from '../i18n/formatters';
import { Target, Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { budgets, categories, transactions, createBudget } = useFinance();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('overall');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const currentMonthStr = getCurrentDhakaDateString().substring(0, 7); // YYYY-MM

  // Calculate Net Spent per category for current month
  const currentMonthTx = transactions.filter(
    (tx) =>
      !tx.deletedAt &&
      tx.status !== 'cancelled' &&
      tx.occurredAt.substring(0, 7) === currentMonthStr
  );

  const spentByCategory: Record<string, number> = {};
  let totalOverallSpent = 0;

  for (const tx of currentMonthTx) {
    if (tx.type === 'expense') {
      const net = tx.netExpense ?? tx.amount;
      totalOverallSpent += net;
      if (tx.categoryId) {
        spentByCategory[tx.categoryId] = (spentByCategory[tx.categoryId] || 0) + net;
      }
    }
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return;

    try {
      await createBudget({
        categoryId,
        period,
        month: period === 'monthly' ? currentMonthStr : undefined,
        year: new Date().getFullYear(),
        amount: Math.round(numAmt),
        alertThresholds: [70, 85, 100],
      });

      setIsModalOpen(false);
      setAmount('');
    } catch (err: any) {
      alert(err.message || 'Failed to set budget');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navBudgets')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set and track spending limits with 70%, 85%, and 100% threshold alerts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addBudget')}</span>
        </button>
      </div>

      {/* Budgets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No budgets configured yet. Click Set Budget to cap your monthly or category expenses!
          </div>
        ) : (
          budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const title = b.categoryId === 'overall' ? 'Overall Monthly Budget' : (cat ? (language === 'bn' ? cat.nameBn : cat.name) : 'Category Budget');
            const spent = b.categoryId === 'overall' ? totalOverallSpent : (spentByCategory[b.categoryId] || 0);
            const remaining = Math.max(0, b.amount - spent);
            const percent = Math.round((spent / b.amount) * 100);
            const isExceeded = spent > b.amount;
            const isWarning = percent >= 85 && !isExceeded;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4 ${
                  isExceeded
                    ? 'border-rose-400 dark:border-rose-800'
                    : isWarning
                    ? 'border-amber-400 dark:border-amber-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {b.period} • {b.month || b.year}
                    </p>
                  </div>
                  {isExceeded ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                      <AlertTriangle className="w-3 h-3" />
                      {t('budgetExceeded')}
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                      <AlertTriangle className="w-3 h-3" />
                      {t('budgetWarning')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      {percent}%
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Spent:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatBDT(spent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Budget Limit:</span>
                    <span>{formatBDT(b.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Remaining:</span>
                    <span className={isExceeded ? 'text-rose-600 font-bold' : 'font-bold'}>
                      {formatBDT(remaining)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('addBudget')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Budget Target Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="overall">Overall Monthly Budget (All Expenses)</option>
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'bn' ? c.nameBn : c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('budgetAmount')} (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="8000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
