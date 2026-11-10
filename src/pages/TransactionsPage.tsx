import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Transaction, TransactionType, SplitLine } from '../types/finance';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import { validateSplitTransaction, validateRefund } from '../services/ledgerEngine';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CornerDownLeft,
  X,
  Split,
  Layers,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { exportTransactionsToExcel, exportTransactionsToPdf } from '../services/exportService';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    people,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const { t, language } = useLanguage();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [refundingTx, setRefundingTx] = useState<Transaction | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    accountId: accounts[0]?.id || '',
    destinationAccountId: '',
    categoryId: '',
    personId: '',
    occurredAt: getCurrentDhakaDateString(),
    description: '',
    note: '',
    transferFee: '',
    isSplit: false,
    splitLines: [] as SplitLine[],
  });

  // Refund Form states
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.deletedAt || tx.status === 'cancelled') return false;

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Account filter
      if (accountFilter !== 'all' && tx.accountId !== accountFilter && tx.destinationAccountId !== accountFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        const amt = tx.amount.toString();
        const id = tx.id.toLowerCase();
        if (!desc.includes(q) && !note.includes(q) && !amt.includes(q) && !id.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, accountFilter, categoryFilter, searchQuery]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTx(null);
    setFormData({
      type: 'expense',
      amount: '',
      accountId: accounts[0]?.id || '',
      destinationAccountId: accounts[1]?.id || '',
      categoryId: categories.find((c) => c.type === 'expense')?.id || '',
      personId: '',
      occurredAt: getCurrentDhakaDateString(),
      description: '',
      note: '',
      transferFee: '',
      isSplit: false,
      splitLines: [],
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      accountId: tx.accountId,
      destinationAccountId: tx.destinationAccountId || '',
      categoryId: tx.categoryId || '',
      personId: tx.personId || '',
      occurredAt: tx.occurredAt.substring(0, 10),
      description: tx.description,
      note: tx.note || '',
      transferFee: tx.transferFee ? tx.transferFee.toString() : '',
      isSplit: Boolean(tx.splitLines && tx.splitLines.length > 0),
      splitLines: tx.splitLines || [],
    });
    setIsCreateModalOpen(true);
  };

  // Split management
  const addSplitLine = () => {
    setFormData((prev) => ({
      ...prev,
      splitLines: [
        ...prev.splitLines,
        {
          id: 'split_' + Date.now() + Math.random(),
          categoryId: categories.find((c) => c.type === prev.type)?.id || '',
          personId: '',
          amount: 0,
        },
      ],
    }));
  };

  const removeSplitLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      splitLines: prev.splitLines.filter((_, i) => i !== index),
    }));
  };

  const updateSplitLine = (index: number, field: keyof SplitLine, value: any) => {
    const updated = [...formData.splitLines];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, splitLines: updated }));
  };

  // Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t('invalidAmount'));
      return;
    }

    if (formData.isSplit && formData.splitLines.length > 0) {
      const splitCheck = validateSplitTransaction(numAmount, formData.splitLines);
      if (!splitCheck.isValid) {
        alert(
          `${t('splitTotalMustMatch')}. Current split sum: ৳${splitCheck.currentSum}, Difference: ৳${splitCheck.difference}`
        );
        return;
      }
    }

    try {
      const payload: any = {
        type: formData.type,
        amount: Math.round(numAmount),
        accountId: formData.accountId,
        destinationAccountId: formData.type === 'transfer' ? formData.destinationAccountId : undefined,
        categoryId: formData.categoryId || undefined,
        personId: formData.personId || undefined,
        occurredAt: formData.occurredAt,
        timezone: 'Asia/Dhaka',
        description: formData.description || formData.type,
        note: formData.note,
        paymentMethod: accounts.find((a) => a.id === formData.accountId)?.provider || 'Cash',
        transferFee: formData.transferFee ? parseFloat(formData.transferFee) : undefined,
        splitLines: formData.isSplit ? formData.splitLines : undefined,
        status: 'posted',
      };

      if (editingTx) {
        await updateTransaction({ ...editingTx, ...payload });
      } else {
        await createTransaction(payload);
      }

      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save transaction');
    }
  };

  // Handle Refund
  const handleSaveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingTx) return;

    const numRefund = parseFloat(refundAmount);
    const validation = validateRefund(refundingTx, transactions, numRefund);
    if (!validation.isValid) {
      setRefundError(validation.error || 'Invalid refund amount');
      return;
    }

    try {
      await createTransaction({
        type: 'refund',
        amount: Math.round(numRefund),
        accountId: refundingTx.accountId,
        originalExpenseId: refundingTx.id,
        paymentMethod: refundingTx.paymentMethod,
        occurredAt: getCurrentDhakaDateString(),
        timezone: 'Asia/Dhaka',
        description: `Refund for: ${refundingTx.description}`,
        note: refundNote,
        status: 'posted',
      });

      // Update original transaction refundedAmount
      const updatedOrig: Transaction = {
        ...refundingTx,
        refundedAmount: (refundingTx.refundedAmount || 0) + Math.round(numRefund),
        netExpense: Math.max(0, refundingTx.amount - ((refundingTx.refundedAmount || 0) + Math.round(numRefund))),
      };
      await updateTransaction(updatedOrig);

      setRefundingTx(null);
      setRefundAmount('');
      setRefundNote('');
      setRefundError(null);
    } catch (err: any) {
      setRefundError(err.message || 'Failed to process refund');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navTransactions')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredTransactions.length} recorded transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsToExcel(filteredTransactions, accounts, categories, people)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => exportTransactionsToPdf(filteredTransactions, accounts, categories)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="expense">{t('typeExpense')}</option>
            <option value="income">{t('typeIncome')}</option>
            <option value="transfer">{t('typeTransfer')}</option>
            <option value="loan_given">{t('typeLoanGiven')}</option>
            <option value="loan_received">{t('typeLoanReceived')}</option>
            <option value="loan_repayment_received">{t('typeLoanRepayReceived')}</option>
            <option value="loan_repayment_paid">{t('typeLoanRepayPaid')}</option>
            <option value="savings_deposit">{t('typeSavingsDeposit')}</option>
            <option value="savings_withdrawal">{t('typeSavingsWithdraw')}</option>
            <option value="asset_purchase">{t('typeAssetPurchase')}</option>
            <option value="asset_sale">{t('typeAssetSale')}</option>
            <option value="refund">{t('typeRefund')}</option>
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {language === 'bn' ? c.nameBn : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Person</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const destAcc = tx.destinationAccountId
                    ? accounts.find((a) => a.id === tx.destinationAccountId)
                    : null;
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const person = people.find((p) => p.id === tx.personId);

                  const isIncome = tx.type === 'income' || tx.type === 'loan_received';
                  const isExpense = tx.type === 'expense' || tx.type === 'loan_given';
                  const isRefund = tx.type === 'refund';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDhakaDate(tx.occurredAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isExpense
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : isRefund
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-semibold max-w-xs truncate">
                        {tx.description}
                        {tx.splitLines && tx.splitLines.length > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                            <Split className="w-3 h-3" />
                            {tx.splitLines.length} splits
                          </span>
                        )}
                        {tx.refundedAmount && tx.refundedAmount > 0 ? (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                            Refunded ৳{tx.refundedAmount} (Net: ৳{tx.netExpense})
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {cat ? (language === 'bn' ? cat.nameBn : cat.name) : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {person ? (language === 'bn' ? person.nameBn : person.name) : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {acc?.name || tx.accountId}
                        {destAcc ? ` → ${destAcc.name}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : isRefund
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatBDT(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Refund trigger for expenses */}
                          {tx.type === 'expense' && (
                            <button
                              onClick={() => {
                                setRefundingTx(tx);
                                setRefundAmount('');
                                setRefundError(null);
                              }}
                              title="Process Refund"
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <CornerDownLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(tx)}
                            title="Edit"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Move transaction to trash?')) {
                                deleteTransaction(tx);
                              }
                            }}
                            title="Delete"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Transaction Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {editingTx ? 'Edit Transaction' : 'Record New Transaction'}
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Transaction Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  >
                    <option value="expense">{t('typeExpense')}</option>
                    <option value="income">{t('typeIncome')}</option>
                    <option value="transfer">{t('typeTransfer')}</option>
                    <option value="loan_given">{t('typeLoanGiven')}</option>
                    <option value="loan_received">{t('typeLoanReceived')}</option>
                    <option value="loan_repayment_received">{t('typeLoanRepayReceived')}</option>
                    <option value="loan_repayment_paid">{t('typeLoanRepayPaid')}</option>
                    <option value="savings_deposit">{t('typeSavingsDeposit')}</option>
                    <option value="savings_withdrawal">{t('typeSavingsWithdraw')}</option>
                    <option value="asset_purchase">{t('typeAssetPurchase')}</option>
                    <option value="asset_sale">{t('typeAssetSale')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('fieldAmount')} (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {formData.type === 'transfer' ? t('fieldSourceAccount') : t('fieldAccount')} *
                  </label>
                  <select
                    required
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type === 'transfer' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {t('fieldDestinationAccount')} *
                    </label>
                    <select
                      required
                      value={formData.destinationAccountId}
                      onChange={(e) =>
                        setFormData({ ...formData, destinationAccountId: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {accounts
                        .filter((a) => a.id !== formData.accountId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {t('fieldCategory')}
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="">None / Uncategorized</option>
                      {categories
                        .filter((c) => c.status === 'active')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {language === 'bn' ? c.nameBn : c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('fieldPerson')}
                  </label>
                  <select
                    value={formData.personId}
                    onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">None / Self</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {language === 'bn' ? p.nameBn : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('fieldDate')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.occurredAt}
                    onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('fieldDescription')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Bazar, Tuition fee, Lunch"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Split Transaction Checkbox */}
              {formData.type === 'expense' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSplit}
                        onChange={(e) => setFormData({ ...formData, isSplit: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600 rounded"
                      />
                      <span>{t('fieldSplitTransaction')}</span>
                    </label>

                    {formData.isSplit && (
                      <button
                        type="button"
                        onClick={addSplitLine}
                        className="text-[11px] font-bold text-emerald-600 hover:underline"
                      >
                        {t('addSplitLine')}
                      </button>
                    )}
                  </div>

                  {formData.isSplit && (
                    <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      {formData.splitLines.map((line, idx) => (
                        <div key={line.id} className="flex items-center gap-2">
                          <select
                            value={line.categoryId}
                            onChange={(e) => updateSplitLine(idx, 'categoryId', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {language === 'bn' ? c.nameBn : c.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={line.personId || ''}
                            onChange={(e) => updateSplitLine(idx, 'personId', e.target.value)}
                            className="w-28 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="">Person</option>
                            {people.map((p) => (
                              <option key={p.id} value={p.id}>
                                {language === 'bn' ? p.nameBn : p.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={line.amount || ''}
                            onChange={(e) =>
                              updateSplitLine(idx, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                          />
                          <button
                            type="button"
                            onClick={() => removeSplitLine(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <div className="text-[11px] text-right font-bold text-slate-600 dark:text-slate-300 pt-1">
                        Split Total: ৳
                        {formData.splitLines
                          .reduce((sum, l) => sum + (Number(l.amount) || 0), 0)
                          .toLocaleString()}
                        &nbsp; / Goal: ৳{formData.amount || 0}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {refundingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Record Refund
              </h3>
              <button
                onClick={() => setRefundingTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-white truncate">
                Original: {refundingTx.description}
              </p>
              <p className="text-slate-500">
                Original Amount: ৳{refundingTx.amount.toLocaleString()}
              </p>
              <p className="text-slate-500">
                Already Refunded: ৳{(refundingTx.refundedAmount || 0).toLocaleString()}
              </p>
              <p className="font-bold text-emerald-600">
                Max Refundable: ৳
                {(
                  refundingTx.amount - (refundingTx.refundedAmount || 0)
                ).toLocaleString()}
              </p>
            </div>

            {refundError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {refundError}
              </div>
            )}

            <form onSubmit={handleSaveRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Refund Amount (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={refundingTx.amount - (refundingTx.refundedAmount || 0)}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Refund Reason / Note
                </label>
                <input
                  type="text"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="e.g., Returned shirt, cancelled order"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRefundingTx(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20"
                >
                  Record Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
