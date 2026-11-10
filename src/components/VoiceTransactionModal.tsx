import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { getCurrentDhakaDateString } from '../i18n/formatters';
import { Mic, MicOff, Sparkles, Check, AlertCircle, X, Loader2 } from 'lucide-react';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceTransactionModal: React.FC<VoiceTransactionModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, people, createTransaction } = useFinance();
  const { t, language } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parsed structured result for user review and confirmation
  const [reviewData, setReviewData] = useState<{
    type: string;
    amount: number;
    accountId: string;
    categoryId?: string;
    personId?: string;
    date: string;
    description: string;
    note?: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD'; // Bengali (Bangladesh)

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleListen = () => {
    if (!recognitionRef.current) {
      setError('Browser speech recognition not available. Please type text below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setReviewData(null);
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleParseWithGemini = async () => {
    if (!transcript.trim()) {
      setError('Please speak or type some text first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const payloadContext = {
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        people: people.map((p) => ({ id: p.id, name: p.name })),
      };

      const res = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcript,
          context: payloadContext,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server failed to parse transaction');
      }

      const parsed = await res.json();

      // Match account
      let matchedAccountId = accounts[0]?.id || '';
      if (parsed.accountName) {
        const found = accounts.find((a) =>
          a.name.toLowerCase().includes(parsed.accountName.toLowerCase()) ||
          a.provider.toLowerCase().includes(parsed.accountName.toLowerCase())
        );
        if (found) matchedAccountId = found.id;
      }

      // Match category
      let matchedCategoryId: string | undefined = undefined;
      if (parsed.categoryName) {
        const foundCat = categories.find((c) =>
          c.name.toLowerCase().includes(parsed.categoryName.toLowerCase()) ||
          c.nameBn.includes(parsed.categoryName)
        );
        if (foundCat) matchedCategoryId = foundCat.id;
      }

      // Match person
      let matchedPersonId: string | undefined = undefined;
      if (parsed.personName) {
        const foundPerson = people.find((p) =>
          p.name.toLowerCase().includes(parsed.personName.toLowerCase()) ||
          p.nameBn.includes(parsed.personName)
        );
        if (foundPerson) matchedPersonId = foundPerson.id;
      }

      setReviewData({
        type: parsed.type || 'expense',
        amount: Math.round(parsed.amount || 0),
        accountId: matchedAccountId,
        categoryId: matchedCategoryId,
        personId: matchedPersonId,
        date: parsed.date || getCurrentDhakaDateString(),
        description: parsed.description || transcript,
        note: parsed.note || `Voice recognized: "${transcript}"`,
      });
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message || 'Could not parse text. Please check connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveConfirmed = async () => {
    if (!reviewData) return;
    if (reviewData.amount <= 0) {
      setError(t('invalidAmount'));
      return;
    }

    try {
      await createTransaction({
        type: reviewData.type as any,
        amount: reviewData.amount,
        accountId: reviewData.accountId,
        categoryId: reviewData.categoryId,
        personId: reviewData.personId,
        paymentMethod: accounts.find((a) => a.id === reviewData.accountId)?.provider || 'Cash',
        occurredAt: reviewData.date,
        timezone: 'Asia/Dhaka',
        description: reviewData.description,
        note: reviewData.note,
        status: 'posted',
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {t('voiceTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powered by Bengali Speech Recognition + Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Voice Input Section */}
          {!reviewData ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
                {t('voiceInstructions')}
              </p>

              {/* Big Mic Button */}
              <div className="relative my-2">
                {isListening && (
                  <span className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                    isListening
                      ? 'bg-rose-600 shadow-rose-600/40'
                      : 'bg-emerald-600 shadow-emerald-600/40 hover:scale-105'
                  }`}
                >
                  {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isListening ? t('listening') : 'Click to start speaking in Bengali'}
              </p>

              {/* Text Area for Live Transcription / Manual Fallback */}
              <div className="w-full text-left">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Transcribed Text / Or Type in Bengali / Banglish:
                </label>
                <textarea
                  rows={3}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="যেমন: আজকে বাজার করার জন্য বিকাশ থেকে ১২০০ টাকা খরচ করেছি, এটা Family Expense হিসেবে রাখো।"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Analyze Button */}
              <button
                type="button"
                onClick={handleParseWithGemini}
                disabled={isProcessing || !transcript.trim()}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('processingVoice')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400 dark:text-white" />
                    <span>Parse with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Review & Edit Form before Confirmation */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                <strong>{t('voiceReviewTitle')}:</strong> {t('voiceReviewNotice')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('fieldAmount')} (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reviewData.amount}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Type
                  </label>
                  <select
                    value={reviewData.type}
                    onChange={(e) => setReviewData({ ...reviewData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="expense">{t('typeExpense')}</option>
                    <option value="income">{t('typeIncome')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('fieldAccount')} *
                  </label>
                  <select
                    value={reviewData.accountId}
                    onChange={(e) => setReviewData({ ...reviewData, accountId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('fieldCategory')}
                  </label>
                  <select
                    value={reviewData.categoryId || ''}
                    onChange={(e) => setReviewData({ ...reviewData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">None / Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'bn' ? c.nameBn : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('fieldPerson')}
                  </label>
                  <select
                    value={reviewData.personId || ''}
                    onChange={(e) => setReviewData({ ...reviewData, personId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
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
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('fieldDate')}
                  </label>
                  <input
                    type="date"
                    value={reviewData.date}
                    onChange={(e) => setReviewData({ ...reviewData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('fieldDescription')}
                </label>
                <input
                  type="text"
                  value={reviewData.description}
                  onChange={(e) => setReviewData({ ...reviewData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewData(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Re-speak / Edit Text
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfirmed}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Save</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
