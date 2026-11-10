import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFinance } from '../context/FinanceContext';
import { saveUserSettings } from '../services/dbService';
import { hashSecret, generateSalt } from '../config/securityLock';
import { getCurrentDhakaDateString } from '../i18n/formatters';
import {
  CheckCircle2,
  Wallet,
  Globe,
  Shield,
  Layers,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react';

interface SetupAccountRow {
  name: string;
  type: 'cash' | 'bank' | 'mobile_banking';
  provider: string;
  openingBalance: number;
}

export const FirstTimeSetupWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, setSettingsState } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { createAccount, seedInitialDataIfEmpty } = useFinance();

  const [step, setStep] = useState(1);
  const [openingDate, setOpeningDate] = useState(() => getCurrentDhakaDateString());

  // Setup Accounts
  const [setupAccounts, setSetupAccounts] = useState<SetupAccountRow[]>([
    { name: 'Personal Cash', type: 'cash', provider: 'Cash', openingBalance: 10000 },
    { name: 'DBBL Bank', type: 'bank', provider: 'DBBL', openingBalance: 30000 },
    { name: 'Personal bKash', type: 'mobile_banking', provider: 'bKash', openingBalance: 5000 },
    { name: 'Personal Nagad', type: 'mobile_banking', provider: 'Nagad', openingBalance: 2000 },
  ]);

  // Security config
  const [enablePin, setEnablePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [isFinishing, setIsFinishing] = useState(false);

  const addAccountRow = () => {
    setSetupAccounts((prev) => [
      ...prev,
      { name: '', type: 'cash', provider: 'Cash', openingBalance: 0 },
    ]);
  };

  const removeAccountRow = (index: number) => {
    setSetupAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinishSetup = async () => {
    if (!user) return;
    setIsFinishing(true);

    try {
      // 1. Create accounts
      for (const acc of setupAccounts) {
        if (acc.name.trim()) {
          await createAccount({
            name: acc.name,
            type: acc.type,
            provider: acc.provider,
            openingBalance: acc.openingBalance || 0,
            openingBalanceDate: openingDate,
            currency: 'BDT',
            status: 'active',
          });
        }
      }

      // 2. Seed default categories & people
      await seedInitialDataIfEmpty();

      // 3. Save security & general settings
      let pinHash = undefined;
      let pinSalt = undefined;
      if (enablePin && pinCode.trim()) {
        pinSalt = generateSalt(16);
        pinHash = await hashSecret(pinCode.trim(), pinSalt);
      }

      const newSettings = {
        language,
        currency: 'BDT' as const,
        timezone: 'Asia/Dhaka',
        theme: 'light' as const,
        pinEnabled: enablePin,
        pinHash,
        pinSalt,
        passwordEnabled: false,
        autoLockMinutes,
        budgetAlertThresholds: [70, 85, 100],
        isSetupCompleted: true,
      };

      await saveUserSettings(user.uid, newSettings);
      setSettingsState(newSettings);
      onComplete();
    } catch (err) {
      console.error('Error completing setup wizard:', err);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-200">
              Setup Wizard • Step {step} of 4
            </span>
            <h1 className="text-xl font-bold mt-0.5">
              {step === 1 && 'Welcome & Language Preference'}
              {step === 2 && 'Financial Accounts & Opening Balances'}
              {step === 3 && 'Security PIN & Auto-Lock'}
              {step === 4 && 'Categories & Confirmation'}
            </h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            {step === 1 && <Globe className="w-6 h-6 text-white" />}
            {step === 2 && <Wallet className="w-6 h-6 text-white" />}
            {step === 3 && <Shield className="w-6 h-6 text-white" />}
            {step === 4 && <CheckCircle2 className="w-6 h-6 text-white" />}
          </div>
        </div>

        {/* Wizard Content */}
        <div className="p-8 space-y-6">
          {/* Step 1: Language */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Please select your primary language. You can change this at any time in Settings.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    language === 'bn'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl font-bold text-slate-900 dark:text-white block mb-1">
                    বাংলা (Bengali)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ডিফল্ট ভাষা হিসেবে বাংলা ব্যবহার করুন
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    language === 'en'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl font-bold text-slate-900 dark:text-white block mb-1">
                    English
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Use English as primary language
                  </span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                ✓ Currency: <strong>BDT (৳)</strong> &nbsp;|&nbsp; Timezone: <strong>Asia/Dhaka</strong>
              </div>
            </div>
          )}

          {/* Step 2: Accounts & Opening Balances */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Enter your current accounts and real opening balances. Opening balance is NOT counted as income.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Date:</span>
                  <input
                    type="date"
                    value={openingDate}
                    onChange={(e) => setOpeningDate(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {setupAccounts.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                  >
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={row.name}
                      onChange={(e) => {
                        const copy = [...setupAccounts];
                        copy[idx].name = e.target.value;
                        setSetupAccounts(copy);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <select
                      value={row.type}
                      onChange={(e) => {
                        const copy = [...setupAccounts];
                        copy[idx].type = e.target.value as any;
                        setSetupAccounts(copy);
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                      <option value="mobile_banking">Mobile Banking</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Provider (e.g. bKash)"
                      value={row.provider}
                      onChange={(e) => {
                        const copy = [...setupAccounts];
                        copy[idx].provider = e.target.value;
                        setSetupAccounts(copy);
                      }}
                      className="w-28 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        value={row.openingBalance || ''}
                        onChange={(e) => {
                          const copy = [...setupAccounts];
                          copy[idx].openingBalance = parseFloat(e.target.value) || 0;
                          setSetupAccounts(copy);
                        }}
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccountRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addAccountRow}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
              >
                <Plus className="w-4 h-4" />
                Add Another Account
              </button>
            </div>
          )}

          {/* Step 3: Security & PIN */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      Enable Application PIN Lock
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Adds an extra privacy lock screen using Web Crypto PBKDF2.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePin}
                    onChange={(e) => setEnablePin(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {enablePin && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Set 4-Digit PIN Code:
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234"
                      className="w-48 px-3 py-2 text-center text-lg tracking-widest font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Inactivity Auto-Lock Timeout:
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                >
                  <option value={1}>1 Minute</option>
                  <option value={5}>5 Minutes (Recommended)</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={0}>Disabled</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Categories & People Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                <p className="font-bold text-sm">Everything is ready!</p>
                <p>
                  We have prepared default categories (Food & Grocery, House Rent, Utilities, Transport, Shopping, Medical, Salary, etc.) and people (Family, Wife, Personal, etc.). You can customize or add your own anytime.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Accounts to be initialized:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{setupAccounts.filter((a) => a.name).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Initial Opening Balance:</span>
                  <span className="font-bold text-emerald-600">
                    ৳{setupAccounts.reduce((sum, a) => sum + (a.openingBalance || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Security PIN:</span>
                  <span>{enablePin ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={isFinishing}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
              >
                {isFinishing ? 'Finalizing...' : 'Complete & Open Dashboard'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
