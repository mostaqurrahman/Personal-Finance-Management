import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { SavingsGoal, SavingsProduct } from '../types/finance';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import { PiggyBank, Target, Plus, CheckCircle2, X, Building, Calendar } from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const { savingsGoals, savingsProducts, accounts, createSavingsGoal, createSavingsProduct } = useFinance();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'goals' | 'products'>('goals');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Goal Form
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentSaved, setCurrentSaved] = useState('');
  const [deadline, setDeadline] = useState('');
  const [goalDesc, setGoalDesc] = useState('');

  // Product Form
  const [institutionName, setInstitutionName] = useState('');
  const [productName, setProductName] = useState('');
  const [prodType, setProdType] = useState<'dps' | 'fdr'>('dps');
  const [principal, setPrincipal] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [maturityValue, setMaturityValue] = useState('');
  const [startDate, setStartDate] = useState(() => getCurrentDhakaDateString());
  const [maturityDate, setMaturityDate] = useState('');

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) return;

    try {
      await createSavingsGoal({
        name: goalName.trim(),
        targetAmount: Math.round(target),
        currentSavedAmount: parseFloat(currentSaved) || 0,
        startDate: getCurrentDhakaDateString(),
        deadline: deadline || undefined,
        description: goalDesc,
        status: 'active',
      });
      setIsGoalModalOpen(false);
      setGoalName('');
      setTargetAmount('');
      setCurrentSaved('');
      setDeadline('');
      setGoalDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const princ = parseFloat(principal);
    if (isNaN(princ) || princ <= 0) return;

    try {
      await createSavingsProduct({
        institutionName: institutionName.trim(),
        productName: productName.trim(),
        type: prodType,
        principal: Math.round(princ),
        currentValue: parseFloat(currentValue) || Math.round(princ),
        maturityValue: maturityValue ? parseFloat(maturityValue) : undefined,
        startDate,
        maturityDate,
        status: 'active',
      });
      setIsProductModalOpen(false);
      setInstitutionName('');
      setProductName('');
      setPrincipal('');
      setCurrentValue('');
      setMaturityValue('');
      setMaturityDate('');
    } catch (err: any) {
      alert(err.message || 'Failed to add savings product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navSavings')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Savings goals and fixed investment products (DPS, FDR)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'goals' ? (
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addGoal')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addSavingsProduct')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'goals'
              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{t('savingsGoals')}</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>{t('savingsProducts')}</span>
        </button>
      </div>

      {/* Tab 1: Savings Goals */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No savings goals created yet. Click Create Savings Goal to set one up!
            </div>
          ) : (
            savingsGoals.map((g) => {
              const progress = Math.min(
                100,
                Math.round((g.currentSavedAmount / g.targetAmount) * 100)
              );
              return (
                <div
                  key={g.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {g.name}
                      </h3>
                      {g.deadline && (
                        <p className="text-[11px] text-slate-400">
                          Deadline: {formatDhakaDate(g.deadline)}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                      {progress}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Saved: {formatBDT(g.currentSavedAmount)}</span>
                      <span className="text-slate-900 dark:text-white">
                        Target: {formatBDT(g.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {g.description && <p className="text-xs text-slate-500">{g.description}</p>}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: DPS / FDR Products */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              No DPS or FDR products recorded yet.
            </div>
          ) : (
            savingsProducts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {p.productName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {p.institutionName} • {p.type.toUpperCase()}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 uppercase">
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Value:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {formatBDT(p.currentValue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Principal Deposited:</span>
                    <span>{formatBDT(p.principal)}</span>
                  </div>
                  {p.maturityValue && (
                    <div className="flex justify-between text-slate-400">
                      <span>Maturity Expected:</span>
                      <span>{formatBDT(p.maturityValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Maturity Date:</span>
                    <span className="font-semibold">{formatDhakaDate(p.maturityDate)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('addGoal')}
              </h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Buy a Laptop, Hajj Fund"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('targetAmount')} (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('currentSaved')} (৳)
                  </label>
                  <input
                    type="number"
                    value={currentSaved}
                    onChange={(e) => setCurrentSaved(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('targetDate')}
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('addSavingsProduct')}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Bank / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. City Bank, BRAC Bank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Scheme Type *
                  </label>
                  <select
                    value={prodType}
                    onChange={(e) => setProdType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="dps">DPS (Monthly Deposit)</option>
                    <option value="fdr">FDR (Fixed Deposit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. 5-Year Millionaire Scheme"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Principal (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Current Value (৳)
                  </label>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Maturity Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('maturityValue')} (৳)
                  </label>
                  <input
                    type="number"
                    value={maturityValue}
                    onChange={(e) => setMaturityValue(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
