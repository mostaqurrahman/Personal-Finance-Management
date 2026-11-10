import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { TrashItem, AuditLogEntry } from '../types/finance';
import { formatBDT, formatDhakaDateTime } from '../i18n/formatters';
import { Trash2, RotateCcw, ShieldCheck, History, X, AlertTriangle } from 'lucide-react';

export const TrashAuditPage: React.FC = () => {
  const { trash, auditLogs, restoreTrash, deleteTrashPermanently } = useFinance();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'trash' | 'audit'>('trash');

  const handleRestore = async (item: TrashItem) => {
    try {
      await restoreTrash(item);
      alert(t('successRestored'));
    } catch (err: any) {
      alert(err.message || 'Failed to restore item');
    }
  };

  const handlePermanentDelete = async (trashId: string) => {
    if (confirm('Are you sure you want to permanently delete this record? This action CANNOT be undone!')) {
      try {
        await deleteTrashPermanently(trashId);
      } catch (err: any) {
        alert(err.message || 'Failed to delete permanently');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navTrashAudit')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Soft-deleted records recovery and append-only cryptographic audit logs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('trash')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'trash'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Trash Bin ({trash.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit History ({auditLogs.length})</span>
        </button>
      </div>

      {/* Trash Bin View */}
      {activeTab === 'trash' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Deleted At</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {trash.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Trash bin is empty. No deleted records.
                    </td>
                  </tr>
                ) : (
                  trash.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500">
                        {formatDhakaDateTime(item.deletedAt)}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {item.entityType}
                      </td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">
                        {item.nameOrDesc}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {item.amount ? formatBDT(item.amount) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Forever</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log View */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Device ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500">
                        {formatDhakaDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.action === 'create'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'delete'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {log.deviceId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
