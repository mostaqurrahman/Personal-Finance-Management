/**
 * Comprehensive TypeScript definitions for Personal Finance Manager
 */

export type AccountType = 
  | 'cash'
  | 'bank'
  | 'mobile_banking'
  | 'savings_account'
  | 'dps'
  | 'fdr'
  | 'custom';

export type AccountStatus = 'active' | 'archived';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  provider: string; // e.g., 'DBBL', 'bKash', 'Nagad', 'Cash'
  accountNumber?: string;
  openingBalance: number;
  openingBalanceDate: string; // YYYY-MM-DD
  currentBalance: number;
  currency: 'BDT';
  status: AccountStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'loan_given'
  | 'loan_received'
  | 'loan_repayment_received'
  | 'loan_repayment_paid'
  | 'savings_deposit'
  | 'savings_withdrawal'
  | 'asset_purchase'
  | 'asset_sale'
  | 'refund'
  | 'balance_adjustment';

export interface SplitLine {
  id: string;
  categoryId: string;
  personId?: string;
  amount: number;
  note?: string;
}

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Stored in whole BDT
  accountId: string;
  destinationAccountId?: string; // For transfers
  paymentMethod: string;
  categoryId?: string;
  subcategoryId?: string;
  personId?: string; // Beneficiary
  occurredAt: string; // ISO date-time or YYYY-MM-DD
  timezone: string; // e.g. "Asia/Dhaka"
  description: string;
  note?: string;
  splitLines?: SplitLine[];
  relatedLoanId?: string;
  relatedTransferId?: string;
  originalExpenseId?: string; // For refunds
  relatedAssetId?: string;
  relatedLiabilityId?: string;
  transferFee?: number;
  refundedAmount?: number; // Total refunded for this expense
  netExpense?: number; // amount - refundedAmount for expenses
  status: 'posted' | 'draft' | 'cancelled';
  syncStatus: SyncStatus;
  revisionNumber: number;
  attachments?: string[]; // base64 or storage URLs
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  subcategories: Array<{ id: string; name: string; nameBn: string }>;
  isDefault?: boolean;
  status: 'active' | 'archived';
}

export interface Person {
  id: string;
  name: string;
  nameBn: string;
  relationship: string;
  phone?: string;
  status: 'active' | 'archived';
  isDefault?: boolean;
}

export type LoanType = 'given' | 'taken';
export type LoanStatus = 'pending' | 'partial' | 'completed' | 'overdue';

export interface Loan {
  id: string;
  type: LoanType;
  personName: string;
  personId?: string;
  originalAmount: number;
  paidAmount: number; // For loan taken, how much repaid; for loan given, how much received back
  remainingAmount: number;
  startDate: string;
  dueDate?: string;
  accountId: string; // Default funding account
  description?: string;
  note?: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  loanType: LoanType;
  amount: number;
  accountId: string;
  date: string;
  note?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSavedAmount: number;
  startDate: string;
  deadline?: string;
  linkedAccountId?: string;
  description?: string;
  status: 'active' | 'achieved' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface SavingsProduct {
  id: string;
  institutionName: string;
  productName: string;
  type: 'dps' | 'fdr' | 'savings_scheme';
  principal: number;
  currentValue: number;
  maturityValue?: number;
  startDate: string;
  maturityDate: string;
  linkedAccountId?: string;
  notes?: string;
  status: 'active' | 'matured' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: 'land' | 'building' | 'gold' | 'vehicle' | 'electronics' | 'business' | 'other';
  purchaseDate: string;
  purchasePrice: number;
  currentEstimatedValue: number;
  linkedAccountId?: string;
  description?: string;
  notes?: string;
  status: 'active' | 'sold';
  salePrice?: number;
  saleDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Liability {
  id: string;
  name: string;
  category: 'personal_loan' | 'bank_loan' | 'family_debt' | 'unpaid_bill' | 'other';
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  dueDate?: string;
  description?: string;
  notes?: string;
  status: 'active' | 'settled';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Budget {
  id: string;
  categoryId: string; // or 'overall'
  period: 'monthly' | 'yearly';
  month?: string; // YYYY-MM
  year: number;
  amount: number;
  alertThresholds: number[]; // e.g. [70, 85, 100]
  createdAt: string;
  updatedAt: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  accountId: string;
  personId?: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  endDate?: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  lastProcessedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  type: 'loan_due' | 'budget_warning' | 'savings_reminder' | 'recurring_reminder' | 'sync_alert' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'archive' | 'sync';
  entityType: 'account' | 'transaction' | 'loan' | 'savings' | 'asset' | 'liability' | 'budget' | 'settings';
  entityId: string;
  oldValues?: any;
  newValues?: any;
  timestamp: string;
  deviceId: string;
  userId: string;
}

export interface TrashItem {
  id: string;
  entityType: 'transaction' | 'loan' | 'asset' | 'liability' | 'account';
  entityId: string;
  nameOrDesc: string;
  amount?: number;
  deletedAt: string;
  data: any;
}

export interface UserSettings {
  language: 'bn' | 'en';
  currency: 'BDT';
  timezone: string;
  theme: 'light' | 'dark';
  pinEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  passwordEnabled: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  autoLockMinutes: number; // 0 for off, or 1, 5, 10, 15, 30, 60, 1440, 7200
  budgetAlertThresholds: number[];
  isSetupCompleted: boolean;
}
