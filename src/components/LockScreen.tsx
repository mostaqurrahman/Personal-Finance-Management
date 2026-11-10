import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Delete, LogOut, ShieldAlert } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { unlockApp, logout, settings, lockoutSecondsRemaining } = useAuth();
  const { t } = useLanguage();
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const isPinOnly = settings?.pinEnabled && !settings?.passwordEnabled;

  const handleKeyPress = (num: string) => {
    if (lockoutSecondsRemaining > 0) return;
    if (inputVal.length < 8) {
      setInputVal((prev) => prev + num);
      setErrorMsg(false);
    }
  };

  const handleDelete = () => {
    setInputVal((prev) => prev.slice(0, -1));
    setErrorMsg(false);
  };

  const handleUnlock = async () => {
    if (!inputVal) return;
    setIsVerifying(true);
    setErrorMsg(false);

    const success = await unlockApp(inputVal);
    setIsVerifying(false);

    if (!success) {
      setErrorMsg(true);
      setInputVal('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
          {settings?.pinEnabled ? t('pinLock') : t('passwordLock')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {t('tagline')}
        </p>

        {lockoutSecondsRemaining > 0 ? (
          <div className="w-full p-4 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>Too many failed attempts. Locked for {lockoutSecondsRemaining}s.</span>
          </div>
        ) : null}

        {/* Input display */}
        {isPinOnly ? (
          <div className="flex gap-3 mb-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  inputVal.length > idx
                    ? 'bg-emerald-600 scale-110 shadow-sm shadow-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="w-full mb-6">
            <input
              type="password"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlock();
              }}
              placeholder="Enter PIN or Password"
              disabled={lockoutSecondsRemaining > 0}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-4 animate-shake">
            Incorrect secret. Please try again.
          </p>
        )}

        {/* Keypad for PIN */}
        {isPinOnly && (
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(String(num))}
                disabled={lockoutSecondsRemaining > 0}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xl font-semibold text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center active:scale-95"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={lockoutSecondsRemaining > 0}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xl font-semibold text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={lockoutSecondsRemaining > 0}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center active:scale-95"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Unlock Action Button */}
        <button
          type="button"
          onClick={handleUnlock}
          disabled={!inputVal || isVerifying || lockoutSecondsRemaining > 0}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold transition-all shadow-md shadow-emerald-600/20 mb-3"
        >
          {isVerifying ? 'Verifying...' : 'Unlock'}
        </button>

        {/* Sign Out option */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors mt-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t('signOut')}
        </button>
      </div>
    </div>
  );
};
