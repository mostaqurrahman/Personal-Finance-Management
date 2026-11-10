import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Account, AccountType } from '../types/finance';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import {
  Wallet,
  Coins,
  Building2,
  Smartphone,
  Plus,
  Edit2,
  SlidersHorizontal,
  Archive,
  History,
  X,
  PiggyBank,
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const { accounts, transactions, createAccount, updateAccount, adjustAccountBalance } = useFinance();
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  // Balance Adjustment Modal state
  const [adjustingAcc, setAdjustingAcc] = useState<Account | null>(null);
  const [newAdjustBalance, setNewAdjustBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Selected account for ledger inspection
  const [selectedLedgerAcc, setSelectedLedgerAcc] = useState<Account | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as AccountType,
    provider: '',
    accountNumber: '',
    openingBalance: '',
    openingBalanceDate: getCurrentDhakaDateString(),
    description: '',
  });

  const openCreateModal = () => {
    setEditingAcc(null);
    setFormData({
      name: '',
      type: 'cash',
      provider: 'Cash',
      accountNumber: '',
      openingBalance: '',
      openingBalanceDate: getCurrentDhakaDateString(),
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAcc(acc);
    setFormData({
      name: acc.name,
      type: acc.type,
      provider: acc.provider,
      accountNumber: acc.accountNumber || '',
      openingBalance: acc.openingBalance.toString(),
      openingBalanceDate: acc.openingBalanceDate,
      description: acc.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingAcc) {
        await updateAccount({
          ...editingAcc,
          name: formData.name,
          type: formData.type,
          provider: formData.provider,
          accountNumber: formData.accountNumber,
          description: formData.description,
        });
      } else {
        await createAccount({
          name: formData.name,
          type: formData.type,
          provider: formData.provider || formData.name,
          accountNumber: formData.accountNumber,
          openingBalance: parseFloat(formData.openingBalance) || 0,
          openingBalanceDate: formData.openingBalanceDate,
          currency: 'BDT',
          status: 'active',
          description: formData.description,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save account');
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAcc) return;
    if (!adjustReason.trim()) {
      alert('Mandatory adjustment reason note is required for audit history.');
      return;
    }

    const targetBal = parseFloat(newAdjustBalance);
    if (isNaN(targetBal)) return;

    try {
      await adjustAccountBalance(adjustingAcc.id, targetBal, adjustReason.trim());
      setAdjustingAcc(null);
      setNewAdjustBalance('');
      setAdjustReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to adjust balance');
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'mobile_banking':
        return <Smartphone className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'savings_account':
      case 'dps':
      case 'fdr':
        return <PiggyBank className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      default:
        return <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  // Transactions for selected ledger
  const ledgerTx = selectedLedgerAcc
    ? transactions.filter(
        (t) =>
          !t.deletedAt &&
          t.status !== 'cancelled' &&
          (t.accountId === selectedLedgerAcc.id || t.destinationAccountId === selectedLedgerAcc.id)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navAccounts')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cash, Banks, Mobile Wallets, and Savings Accounts
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addAccount')}</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          return (
            <div
              key={acc.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {acc.name}
                    </h3>
                    <p className="text-xs text-slate-400 capitalize">
                      {acc.provider} • {acc.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(acc)}
                    title="Edit"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      updateAccount({
                        ...acc,
                        status: acc.status === 'active' ? 'archived' : 'active',
                      });
                    }}
                    title={acc.status === 'active' ? 'Archive' : 'Activate'}
                    className={`p-1.5 rounded-lg text-xs ${
                      acc.status === 'active'
                        ? 'text-slate-400 hover:text-amber-600'
                        : 'text-amber-600'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Current Balance</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatBDT(acc.currentBalance)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Opening: {formatBDT(acc.openingBalance)}</span>
                  <span>{formatDhakaDate(acc.openingBalanceDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustingAcc(acc);
                    setNewAdjustBalance(acc.currentBalance.toString());
                    setAdjustReason('');
                  }}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Adjust</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLedgerAcc(acc)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ledger</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Ledger Modal */}
      {selectedLedgerAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Account Ledger: {selectedLedgerAcc.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Current Balance: {formatBDT(selectedLedgerAcc.currentBalance)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLedgerAcc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {ledgerTx.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  No transactions recorded for this account.
                </p>
              ) : (
                ledgerTx.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDhakaDate(tx.occurredAt)} • {tx.type}
                      </p>
                    </div>
                    <span
                      className={`font-bold ${
                        tx.type === 'income' || tx.type === 'loan_received' || tx.destinationAccountId === selectedLedgerAcc.id
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' || tx.type === 'loan_received' || tx.destinationAccountId === selectedLedgerAcc.id
                        ? '+'
                        : '-'}
                      {formatBDT(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {adjustingAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {t('adjustBalance')}
              </h3>
              <button onClick={() => setAdjustingAcc(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Adjust balance for <strong>{adjustingAcc.name}</strong>. A balance adjustment transaction with audit history will be created.
            </p>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  New Actual Balance (৳) *
                </label>
                <input
                  type="number"
                  required
                  value={newAdjustBalance}
                  onChange={(e) => setNewAdjustBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('adjustmentReason')} *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Bank charge reconciliation, cash count difference"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingAcc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {editingAcc ? t('editAccount') : t('addAccount')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('accountName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Personal bKash, DBBL Salary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('accountType')} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Account</option>
                    <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                    <option value="savings_account">Savings Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('accountProvider')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="e.g. bKash, DBBL, Cash"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              {!editingAcc && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {t('openingBalance')} (৳)
                    </label>
                    <input
                      type="number"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {t('openingBalanceDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.openingBalanceDate}
                      onChange={(e) =>
                        setFormData({ ...formData, openingBalanceDate: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('accountNumber')}
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Optional account/card/wallet number"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
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
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
