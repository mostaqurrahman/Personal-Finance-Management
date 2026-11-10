import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDhakaDateTime } from '../i18n/formatters';
import { Bell, Check, Trash2, AlertCircle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead } = useFinance();
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navNotifications')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loan repayment dues, budget threshold alerts, and recurring payment reminders
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p>{t('noAlerts')}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    !n.isRead
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? n.titleBn : n.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {language === 'bn' ? n.messageBn : n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatDhakaDateTime(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => markNotificationRead(n.id)}
                  title="Mark as read"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
