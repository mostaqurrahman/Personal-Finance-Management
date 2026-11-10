/**
 * Export and Backup Service
 * - Excel (.xlsx) export
 * - PDF export
 * - Full JSON Backup & Restore with validation
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Transaction,
  Account,
  Loan,
  SavingsProduct,
  Asset,
  Liability,
  UserSettings,
  Category,
  Person,
} from '../types/finance';
import { formatBDT, formatDhakaDateTime } from '../i18n/formatters';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  people: Person[],
  dateRangeStr?: string
) {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const personMap = new Map(people.map((p) => [p.id, p.name]));

  const rows = transactions.map((t) => ({
    'Date & Time': t.occurredAt,
    Type: t.type.toUpperCase(),
    'Amount (BDT)': t.amount,
    Account: accountMap.get(t.accountId) || t.accountId,
    Category: t.categoryId ? (categoryMap.get(t.categoryId) || t.categoryId) : '',
    Person: t.personId ? (personMap.get(t.personId) || t.personId) : '',
    'Payment Method': t.paymentMethod,
    Description: t.description,
    Note: t.note || '',
    Status: t.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  const fileName = `PFM_Transactions_${dateRangeStr || new Date().toISOString().substring(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportSummaryToExcel(
  summaryData: Record<string, any>,
  fileName = 'PFM_Financial_Summary.xlsx'
) {
  const rows = Object.entries(summaryData).map(([key, value]) => ({
    Metric: key,
    Value: value,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
  XLSX.writeFile(workbook, fileName);
}

export function exportTransactionsToPdf(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  title = 'Personal Finance Manager - Transactions Report'
) {
  const doc = new jsPDF();
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatDhakaDateTime(new Date())}`, 14, 25);

  const tableRows = transactions.slice(0, 200).map((t) => [
    t.occurredAt.substring(0, 10),
    t.type.toUpperCase(),
    formatBDT(t.amount, { hideSymbol: true }),
    accountMap.get(t.accountId) || t.accountId,
    t.categoryId ? (categoryMap.get(t.categoryId) || t.categoryId) : '-',
    t.description.substring(0, 30),
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Date', 'Type', 'Amount (BDT)', 'Account', 'Category', 'Description']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
  });

  doc.save(`PFM_Report_${new Date().toISOString().substring(0, 10)}.pdf`);
}

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  settings?: UserSettings | null;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  people: Person[];
  loans: Loan[];
  savingsProducts: SavingsProduct[];
  assets: Asset[];
  liabilities: Liability[];
}

export function createFullJsonBackup(data: FullBackupPayload): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PFM_Backup_${new Date().toISOString().substring(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateJsonBackup(parsed: any): { isValid: boolean; error?: string } {
  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'File does not contain valid JSON object' };
  }
  if (!Array.isArray(parsed.accounts)) {
    return { isValid: false, error: 'Missing accounts array in backup file' };
  }
  if (!Array.isArray(parsed.transactions)) {
    return { isValid: false, error: 'Missing transactions array in backup file' };
  }
  return { isValid: true };
}
