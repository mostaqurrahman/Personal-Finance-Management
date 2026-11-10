import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Person } from '../types/finance';
import { formatBDT } from '../i18n/formatters';
import { Users, Plus, Edit2, Archive, X, Heart, User } from 'lucide-react';

export const PeoplePage: React.FC = () => {
  const { people, transactions, createPerson } = useFinance();
  const { t, language } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [phone, setPhone] = useState('');

  // Calculate expenses spent for each person
  const personExpenses: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === 'expense' && !tx.deletedAt) {
      if (tx.splitLines && tx.splitLines.length > 0) {
        for (const line of tx.splitLines) {
          if (line.personId) {
            personExpenses[line.personId] = (personExpenses[line.personId] || 0) + line.amount;
          }
        }
      } else if (tx.personId) {
        personExpenses[tx.personId] = (personExpenses[tx.personId] || 0) + (tx.netExpense ?? tx.amount);
      }
    }
  }

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createPerson({
        name: name.trim(),
        nameBn: nameBn.trim() || name.trim(),
        relationship,
        phone,
        status: 'active',
      });
      setIsModalOpen(false);
      setName('');
      setNameBn('');
      setPhone('');
    } catch (err: any) {
      alert(err.message || 'Failed to add person');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navPeople')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track expenses made for family, spouse, parents, friends, and business
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Person</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {people.map((p) => {
          const totalSpent = personExpenses[p.id] || 0;
          return (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  {p.relationship === 'Spouse' ? (
                    <Heart className="w-5 h-5 text-rose-500" />
                  ) : (
                    <User className="w-5 h-5 text-indigo-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {language === 'bn' ? p.nameBn : p.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{p.relationship}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Spent for Person</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {formatBDT(totalSpent)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Beneficiary / Person
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahim, Father, Sister"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  নাম (বাংলায়)
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: রহিম, বাবা, বোন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Spouse, Parent, Friend, Sibling"
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
                  Save Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
