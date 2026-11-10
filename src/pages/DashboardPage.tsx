import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  Building2,
  Smartphone,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Gem,
  Scale,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Receipt,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { summary, transactions, accounts, categories, people, loans, budgets, recurring, dateRange, setDateRange } = useFinance();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const todayStr = getCurrentDhakaDateString();

  // Date Filter Helpers
  const handleFilterSelect = (type: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date();
    const todayFormatted = getCurrentDhakaDateString();

    if (type === 'today') {
      setDateRange({ startDate: todayFormatted, endDate: todayFormatted });
    } else if (type === 'week') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      const startStr = d.toISOString().substring(0, 10);
      setDateRange({ startDate: startStr, endDate: todayFormatted });
    } else if (type === 'month') {
      const startStr = todayFormatted.substring(0, 8) + '01';
      setDateRange({ startDate: startStr, endDate: todayFormatted });
    } else if (type === 'year') {
      const startStr = todayFormatted.substring(0, 4) + '-01-01';
      setDateRange({ startDate: startStr, endDate: todayFormatted });
    }
  };

  // Recent 6 transactions
  const recentTx = transactions
    .filter((t) => !t.deletedAt && t.status !== 'cancelled')
    .slice(0, 6);

  // Category breakdown for chart
  const categoryExpenses: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && !tx.deletedAt) {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const name = cat ? (language === 'bn' ? cat.nameBn : cat.name) : 'Other';
      categoryExpenses[name] = (categoryExpenses[name] || 0) + tx.amount;
    }
  }

  // Active alerts
  const overdueLoans = loans.filter((l) => !l.deletedAt && l.dueDate && l.dueDate < todayStr && l.status !== 'completed');
  const dueRecurring = recurring.filter((r) => r.status === 'active' && r.nextDueDate <= todayStr);

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-1" />
          <button
            onClick={() => handleFilterSelect('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              dateRange.startDate === todayStr && dateRange.endDate === todayStr
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('filterToday')}
          </button>
          <button
            onClick={() => handleFilterSelect('week')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {t('filterThisWeek')}
          </button>
          <button
            onClick={() => handleFilterSelect('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              dateRange.startDate?.endsWith('-01')
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('filterThisMonth')}
          </button>
          <button
            onClick={() => handleFilterSelect('year')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {t('filterThisYear')}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{dateRange.startDate ? formatDhakaDate(dateRange.startDate) : 'Start'}</span>
          <span>→</span>
          <span>{dateRange.endDate ? formatDhakaDate(dateRange.endDate) : 'Today'}</span>
        </div>
      </div>

      {/* 12 Key Financial Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Income */}
        <div
          onClick={() => navigate('/transactions?type=income')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('totalIncome')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatBDT(summary.totalIncome, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Selected Period</span>
        </div>

        {/* 2. Total Expense */}
        <div
          onClick={() => navigate('/transactions?type=expense')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('totalExpense')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatBDT(summary.totalExpense, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Net after refunds</span>
        </div>

        {/* 3. Available Balance */}
        <div
          onClick={() => navigate('/accounts')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('availableBalance')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {formatBDT(summary.availableBalance, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Liquid funds</span>
        </div>

        {/* 4. Cash Balance */}
        <div
          onClick={() => navigate('/accounts')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('cashBalance')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {formatBDT(summary.cashBalance, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cash in hand</span>
        </div>

        {/* 5. Bank Balance */}
        <div
          onClick={() => navigate('/accounts')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('bankBalance')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {formatBDT(summary.bankBalance, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Bank accounts</span>
        </div>

        {/* 6. Mobile Banking */}
        <div
          onClick={() => navigate('/accounts')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('mobileBankingBalance')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {formatBDT(summary.mobileBankingBalance, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">bKash, Nagad, Rocket</span>
        </div>

        {/* 7. Total Savings */}
        <div
          onClick={() => navigate('/savings')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('totalSavings')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
            {formatBDT(summary.totalSavings, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Savings & DPS/FDR</span>
        </div>

        {/* 8. Loan Given Outstanding */}
        <div
          onClick={() => navigate('/loans')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('loanGivenOutstanding')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {formatBDT(summary.loanGivenOutstanding, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Receivable assets</span>
        </div>

        {/* 9. Loan Taken Outstanding */}
        <div
          onClick={() => navigate('/loans')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('loanTakenOutstanding')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {formatBDT(summary.loanTakenOutstanding, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Payable debts</span>
        </div>

        {/* 10. Total Assets */}
        <div
          onClick={() => navigate('/assets')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('totalAssets')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 flex items-center justify-center">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
            {formatBDT(summary.totalAssets, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cash + Assets + Loans Given</span>
        </div>

        {/* 11. Total Liabilities */}
        <div
          onClick={() => navigate('/liabilities')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('totalLiabilities')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
            {formatBDT(summary.totalLiabilities, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Loans + Obligations</span>
        </div>

        {/* 12. Net Worth */}
        <div
          onClick={() => navigate('/reports')}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-100">
              {t('netWorth')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight">
            {formatBDT(summary.netWorth, { isBengali: language === 'bn' })}
          </div>
          <span className="text-[10px] text-emerald-200 mt-1 block">Assets - Liabilities</span>
        </div>
      </div>

      {/* Alerts & Warnings Section */}
      {(overdueLoans.length > 0 || dueRecurring.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{t('alertsTitle')}</span>
          </div>
          <div className="space-y-1 text-xs">
            {overdueLoans.map((l) => (
              <div key={l.id} className="flex items-center justify-between">
                <span>
                  Overdue Loan: {l.personName} ({l.type === 'given' ? 'Receivable' : 'Payable'}) — Due: {l.dueDate}
                </span>
                <button
                  onClick={() => navigate('/loans')}
                  className="font-bold underline text-amber-700 dark:text-amber-300"
                >
                  View
                </button>
              </div>
            ))}
            {dueRecurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span>Recurring Reminder Due: {r.name} (৳{r.amount.toLocaleString()})</span>
                <button
                  onClick={() => navigate('/recurring')}
                  className="font-bold underline text-amber-700 dark:text-amber-300"
                >
                  Confirm & Post
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Visual Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Expense Breakdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {t('chartExpenseByCategory')}
            </h3>
            <button
              onClick={() => navigate('/categories')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Categories
            </button>
          </div>

          <div className="space-y-3">
            {Object.keys(categoryExpenses).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No expense recorded yet</p>
            ) : (
              Object.entries(categoryExpenses)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, val]) => {
                  const percent = summary.totalExpense > 0 ? Math.round((val / summary.totalExpense) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300">{name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ৳{val.toLocaleString()} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>{t('recentTransactions')}</span>
            </h3>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>{t('viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTx.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent transactions. Click Quick Add or Bengali Voice Entry to add one!
              </div>
            ) : (
              recentTx.map((tx) => {
                const acc = accounts.find((a) => a.id === tx.accountId);
                const isIncome = tx.type === 'income';
                const isExpense = tx.type === 'expense';
                const isTransfer = tx.type === 'transfer';

                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                            : isExpense
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : '⇄'}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDhakaDate(tx.occurredAt)} • {acc?.name || 'Account'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-bold text-sm ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpense
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isIncome ? '+' : isExpense ? '-' : ''}
                        ৳{tx.amount.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
