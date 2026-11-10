import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Loan, LoanType } from '../types/finance';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  History,
} from 'lucide-react';

export const LoansPage: React.FC = () => {
  const { loans, loanRepayments, accounts, createLoan, addLoanRepayment } = useFinance();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<LoanType>('given');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [repayingLoan, setRepayingLoan] = useState<Loan | null>(null);
  const [selectedLoanHistory, setSelectedLoanHistory] = useState<Loan | null>(null);

  // New Loan Form
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [startDate, setStartDate] = useState(() => getCurrentDhakaDateString());
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Repayment Form
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccountId, setRepayAccountId] = useState(accounts[0]?.id || '');
  const [repayDate, setRepayDate] = useState(() => getCurrentDhakaDateString());
  const [repayNote, setRepayNote] = useState('');

  const todayStr = getCurrentDhakaDateString();

  const filteredLoans = loans.filter((l) => !l.deletedAt && l.type === activeTab);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    try {
      await createLoan({
        type: activeTab,
        personName: personName.trim(),
        originalAmount: Math.round(numAmt),
        startDate,
        dueDate: dueDate || undefined,
        accountId,
        description,
      });

      setIsCreateModalOpen(false);
      setPersonName('');
      setAmount('');
      setDescription('');
      setDueDate('');
    } catch (err: any) {
      alert(err.message || 'Failed to record loan');
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingLoan) return;

    const numAmt = parseFloat(repayAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    if (numAmt > repayLoanMaxRemaining(repayingLoan)) {
      alert(`Repayment cannot exceed remaining balance of ৳${repayLoanMaxRemaining(repayingLoan)}`);
      return;
    }

    try {
      await addLoanRepayment({
        loanId: repayingLoan.id,
        loanType: repayingLoan.type,
        amount: Math.round(numAmt),
        accountId: repayAccountId,
        date: repayDate,
        note: repayNote,
      });

      setRepayingLoan(null);
      setRepayAmount('');
      setRepayNote('');
    } catch (err: any) {
      alert(err.message || 'Failed to record repayment');
    }
  };

  const repayLoanMaxRemaining = (loan: Loan) => {
    const priorRepaid = loanRepayments
      .filter((r) => r.loanId === loan.id)
      .reduce((sum, r) => sum + r.amount, 0);
    return Math.max(0, loan.originalAmount - priorRepaid);
  };

  const getLoanStatus = (loan: Loan) => {
    const remaining = repayLoanMaxRemaining(loan);
    if (remaining === 0) return { label: t('statusCompleted'), color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' };
    if (loan.dueDate && loan.dueDate < todayStr) {
      return { label: t('statusOverdue'), color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' };
    }
    if (remaining < loan.originalAmount) {
      return { label: t('statusPartial'), color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' };
    }
    return { label: t('statusPending'), color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navLoans')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Single source of truth for Loan Receivables (Given) and Loan Liabilities (Taken)
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addLoan')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('given')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'given'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t('loanGiven')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('taken')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'taken'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>{t('loanTaken')}</span>
        </button>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLoans.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No {activeTab === 'given' ? 'loans given' : 'loans taken'} recorded.
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const remaining = repayLoanMaxRemaining(loan);
            const repaid = loan.originalAmount - remaining;
            const status = getLoanStatus(loan);
            const progress = Math.min(100, Math.round((repaid / loan.originalAmount) * 100));

            return (
              <div
                key={loan.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {loan.personName}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Started: {formatDhakaDate(loan.startDate)}
                        {loan.dueDate ? ` • Due: ${formatDhakaDate(loan.dueDate)}` : ''}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {loan.description && (
                    <p className="text-xs text-slate-500 mb-3">{loan.description}</p>
                  )}

                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Remaining</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatBDT(remaining)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Original: {formatBDT(loan.originalAmount)}</span>
                      <span>Paid: {formatBDT(repaid)} ({progress}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${
                          activeTab === 'given' ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedLoanHistory(loan)}
                    className="flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>
                  <button
                    type="button"
                    disabled={remaining === 0}
                    onClick={() => {
                      setRepayingLoan(loan);
                      setRepayAmount(remaining.toString());
                    }}
                    className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-xs font-semibold text-white shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Repay</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Repayment Modal */}
      {repayingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record {repayingLoan.type === 'given' ? 'Received Repayment' : 'Paid Repayment'}
              </h3>
              <button onClick={() => setRepayingLoan(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Loan Person: <strong>{repayingLoan.personName}</strong> • Remaining Balance: ৳
              {repayLoanMaxRemaining(repayingLoan).toLocaleString()}
            </p>

            <form onSubmit={handleRecordRepayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Repayment Amount (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={repayLoanMaxRemaining(repayingLoan)}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Account (Funds received in / paid from) *
                </label>
                <select
                  required
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Repayment Date *
                </label>
                <input
                  type="date"
                  required
                  value={repayDate}
                  onChange={(e) => setRepayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder="e.g. 1st installment via bKash"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepayingLoan(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan History Modal */}
      {selectedLoanHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Repayment History: {selectedLoanHistory.personName}
              </h3>
              <button onClick={() => setSelectedLoanHistory(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loanRepayments.filter((r) => r.loanId === selectedLoanHistory.id).length === 0 ? (
                <p className="text-center py-6 text-slate-400">No installments repaid yet.</p>
              ) : (
                loanRepayments
                  .filter((r) => r.loanId === selectedLoanHistory.id)
                  .map((r) => (
                    <div key={r.id} className="py-2 flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {formatDhakaDate(r.date)}
                        </p>
                        <p className="text-[10px] text-slate-400">{r.note || 'Repayment'}</p>
                      </div>
                      <span className="font-bold text-emerald-600">{formatBDT(r.amount)}</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Loan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'given' ? 'Lend Money (Loan Given)' : 'Borrow Money (Loan Taken)'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('borrowerOrLender')} *
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Rahim, Friend, Bank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('originalAmount')} (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Funding Account *
                  </label>
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('startDate')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('dueDate')} (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Record Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
