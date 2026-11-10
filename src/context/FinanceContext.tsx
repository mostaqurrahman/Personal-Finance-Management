import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  Account,
  Transaction,
  Loan,
  LoanRepayment,
  SavingsGoal,
  SavingsProduct,
  Asset,
  Liability,
  Budget,
  RecurringTransaction,
  NotificationItem,
  AuditLogEntry,
  TrashItem,
  Category,
  Person,
} from '../types/finance';
import {
  subscribeAccounts,
  subscribeTransactions,
  subscribeLoans,
  subscribeLoanRepayments,
  subscribeSavingsGoals,
  subscribeSavingsProducts,
  subscribeAssets,
  subscribeLiabilities,
  subscribeBudgets,
  subscribeRecurring,
  subscribeNotifications,
  subscribeCategories,
  subscribePeople,
  subscribeTrash,
  subscribeAuditLogs,
  saveAccount,
  saveTransaction,
  softDeleteTransaction,
  restoreFromTrash,
  permanentlyDeleteFromTrash,
  saveLoan,
  saveLoanRepayment,
  saveSavingsGoal,
  saveSavingsProduct,
  saveAsset,
  saveLiability,
  saveBudget,
  saveRecurring,
  saveCategory,
  savePerson,
  saveNotification,
  markNotificationAsRead,
} from '../services/dbService';
import {
  computeComprehensiveSummary,
  FinancialSummary,
  DateFilterRange,
} from '../services/ledgerEngine';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PEOPLE,
} from '../config/initialData';
import { getCurrentDhakaDateString } from '../i18n/formatters';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  savingsGoals: SavingsGoal[];
  savingsProducts: SavingsProduct[];
  assets: Asset[];
  liabilities: Liability[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  notifications: NotificationItem[];
  categories: Category[];
  people: Person[];
  trash: TrashItem[];
  auditLogs: AuditLogEntry[];
  summary: FinancialSummary;
  dateRange: DateFilterRange;
  setDateRange: (range: DateFilterRange) => void;
  isLoading: boolean;

  // Actions
  createTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'revisionNumber'>) => Promise<string>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (tx: Transaction) => Promise<void>;
  createAccount: (acc: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>) => Promise<string>;
  updateAccount: (acc: Account) => Promise<void>;
  adjustAccountBalance: (accountId: string, newBalance: number, reason: string) => Promise<void>;
  createLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => Promise<string>;
  addLoanRepayment: (repayment: Omit<LoanRepayment, 'id' | 'createdAt'>) => Promise<void>;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createSavingsProduct: (prod: Omit<SavingsProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createLiability: (liability: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createRecurring: (item: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  processRecurringPost: (recurringItem: RecurringTransaction) => Promise<void>;
  createCategory: (cat: Omit<Category, 'id'>) => Promise<string>;
  createPerson: (p: Omit<Person, 'id'>) => Promise<string>;
  restoreTrash: (item: TrashItem) => Promise<void>;
  deleteTrashPermanently: (trashId: string) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  seedInitialDataIfEmpty: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isOwner } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanRepayments, setLoanRepayments] = useState<LoanRepayment[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsProducts, setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_EXPENSE_CATEGORIES,
  ]);
  const [people, setPeople] = useState<Person[]>(DEFAULT_PEOPLE);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default date filter range: This Month
  const [dateRange, setDateRange] = useState<DateFilterRange>(() => {
    const today = getCurrentDhakaDateString();
    const firstDay = today.substring(0, 8) + '01';
    return { startDate: firstDay, endDate: today };
  });

  // Subscribe to all Firestore collections when user is authorized owner
  useEffect(() => {
    if (!user || !isOwner) {
      setAccounts(DEFAULT_ACCOUNTS);
      setCategories([...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]);
      setPeople(DEFAULT_PEOPLE);
      setIsLoading(false);
      return;
    }

    const uid = user.uid;
    setIsLoading(true);

    const unsubs = [
      subscribeAccounts(uid, (items) => {
        if (items.length > 0) setAccounts(items);
        else setAccounts(DEFAULT_ACCOUNTS);
      }),
      subscribeTransactions(uid, (items) => setTransactions(items)),
      subscribeLoans(uid, (items) => setLoans(items)),
      subscribeLoanRepayments(uid, (items) => setLoanRepayments(items)),
      subscribeSavingsGoals(uid, (items) => setSavingsGoals(items)),
      subscribeSavingsProducts(uid, (items) => setSavingsProducts(items)),
      subscribeAssets(uid, (items) => setAssets(items)),
      subscribeLiabilities(uid, (items) => setLiabilities(items)),
      subscribeBudgets(uid, (items) => setBudgets(items)),
      subscribeRecurring(uid, (items) => setRecurring(items)),
      subscribeNotifications(uid, (items) => setNotifications(items)),
      subscribeCategories(uid, (items) => {
        if (items.length > 0) setCategories(items);
        else setCategories([...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES]);
      }),
      subscribePeople(uid, (items) => {
        if (items.length > 0) setPeople(items);
        else setPeople(DEFAULT_PEOPLE);
      }),
      subscribeTrash(uid, (items) => setTrash(items)),
      subscribeAuditLogs(uid, (items) => setAuditLogs(items)),
    ];

    setIsLoading(false);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user, isOwner]);

  // Compute Centralized Financial Summary
  const summary = useMemo(() => {
    return computeComprehensiveSummary({
      accounts,
      transactions,
      loans,
      repayments: loanRepayments,
      savingsProducts,
      assets,
      liabilities,
      dateRange,
    });
  }, [accounts, transactions, loans, loanRepayments, savingsProducts, assets, liabilities, dateRange]);

  // Seed default categories & people if new account
  const seedInitialDataIfEmpty = async () => {
    if (!user) return;
    const uid = user.uid;

    if (categories.length === 0) {
      const allDefaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
      for (const cat of allDefaultCats) {
        await saveCategory(uid, cat);
      }
    }

    if (people.length === 0) {
      for (const p of DEFAULT_PEOPLE) {
        await savePerson(uid, p);
      }
    }
  };

  // Transaction Actions
  const createTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'revisionNumber'>
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newTx: Transaction = {
      ...data,
      id,
      syncStatus: navigator.onLine ? 'synced' : 'pending',
      revisionNumber: 1,
      createdAt: now,
      updatedAt: now,
    };

    await saveTransaction(user.uid, newTx);
    return id;
  };

  const updateTransaction = async (tx: Transaction): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    const oldTx = transactions.find((t) => t.id === tx.id);
    const updated: Transaction = {
      ...tx,
      revisionNumber: (tx.revisionNumber || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveTransaction(user.uid, updated, oldTx);
  };

  const deleteTransaction = async (tx: Transaction): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await softDeleteTransaction(user.uid, tx);
  };

  // Account Actions
  const createAccount = async (
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance'>
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const newAcc: Account = {
      ...data,
      id,
      currentBalance: data.openingBalance || 0,
      createdAt: now,
      updatedAt: now,
    };

    await saveAccount(user.uid, newAcc);
    return id;
  };

  const updateAccount = async (acc: Account): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    const oldAcc = accounts.find((a) => a.id === acc.id);
    await saveAccount(user.uid, { ...acc, updatedAt: new Date().toISOString() }, oldAcc);
  };

  const adjustAccountBalance = async (
    accountId: string,
    newBalance: number,
    reason: string
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) throw new Error('Account not found');

    const currentBal = summary.availableBalance; // or specific balance from ledger
    const balanceDiff = newBalance - acc.currentBalance;

    const txId = 'adj_' + Date.now();
    const adjTx: Transaction = {
      id: txId,
      type: 'balance_adjustment',
      amount: balanceDiff,
      accountId,
      paymentMethod: 'Adjustment',
      occurredAt: getCurrentDhakaDateString(),
      timezone: 'Asia/Dhaka',
      description: `Balance Adjustment: ${reason}`,
      note: `Adjustment from ৳${acc.currentBalance} to ৳${newBalance}. Reason: ${reason}`,
      status: 'posted',
      syncStatus: navigator.onLine ? 'synced' : 'pending',
      revisionNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTransaction(user.uid, adjTx);
  };

  // Loan Actions
  const createLoan = async (
    data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'remainingAmount' | 'status'>
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'loan_' + Date.now();
    const now = new Date().toISOString();

    const newLoan: Loan = {
      ...data,
      id,
      paidAmount: 0,
      remainingAmount: data.originalAmount,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await saveLoan(user.uid, newLoan);

    // Also record the initial movement transaction
    const txType = data.type === 'given' ? 'loan_given' : 'loan_received';
    const txDesc = data.type === 'given'
      ? `Loan Given to ${data.personName}`
      : `Loan Borrowed from ${data.personName}`;

    await createTransaction({
      type: txType,
      amount: data.originalAmount,
      accountId: data.accountId,
      paymentMethod: 'Bank/Cash',
      personId: data.personId,
      occurredAt: data.startDate || getCurrentDhakaDateString(),
      timezone: 'Asia/Dhaka',
      description: txDesc,
      relatedLoanId: id,
      status: 'posted',
    });

    return id;
  };

  const addLoanRepayment = async (
    data: Omit<LoanRepayment, 'id' | 'createdAt'>
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'repay_' + Date.now();
    const repayment: LoanRepayment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    await saveLoanRepayment(user.uid, repayment);

    // Update Loan record status and remainingAmount
    const loan = loans.find((l) => l.id === data.loanId);
    if (loan) {
      const allPriorRepayments = loanRepayments
        .filter((r) => r.loanId === loan.id)
        .reduce((sum, r) => sum + r.amount, 0);

      const totalPaid = allPriorRepayments + data.amount;
      const remaining = Math.max(0, loan.originalAmount - totalPaid);
      const newStatus = remaining === 0 ? 'completed' : 'partial';

      await saveLoan(user.uid, {
        ...loan,
        paidAmount: totalPaid,
        remainingAmount: remaining,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }, loan);
    }

    // Post financial transaction for repayment
    const txType = data.loanType === 'given' ? 'loan_repayment_received' : 'loan_repayment_paid';
    const txDesc = data.loanType === 'given'
      ? `Repayment Received on Loan`
      : `Repayment Paid for Loan`;

    await createTransaction({
      type: txType,
      amount: data.amount,
      accountId: data.accountId,
      paymentMethod: 'Bank/Cash',
      occurredAt: data.date,
      timezone: 'Asia/Dhaka',
      description: txDesc,
      note: data.note,
      relatedLoanId: data.loanId,
      status: 'posted',
    });
  };

  // Savings Actions
  const createSavingsGoal = async (
    data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'goal_' + Date.now();
    const now = new Date().toISOString();
    await saveSavingsGoal(user.uid, { ...data, id, createdAt: now, updatedAt: now });
    return id;
  };

  const createSavingsProduct = async (
    data: Omit<SavingsProduct, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'sprod_' + Date.now();
    const now = new Date().toISOString();
    await saveSavingsProduct(user.uid, { ...data, id, createdAt: now, updatedAt: now });
    return id;
  };

  // Asset & Liability
  const createAsset = async (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'asset_' + Date.now();
    const now = new Date().toISOString();
    await saveAsset(user.uid, { ...data, id, createdAt: now, updatedAt: now });

    // If purchase was paid from an account, record asset_purchase transaction
    if (data.linkedAccountId && data.purchasePrice > 0) {
      await createTransaction({
        type: 'asset_purchase',
        amount: data.purchasePrice,
        accountId: data.linkedAccountId,
        paymentMethod: 'Account',
        occurredAt: data.purchaseDate || getCurrentDhakaDateString(),
        timezone: 'Asia/Dhaka',
        description: `Purchased Asset: ${data.name}`,
        relatedAssetId: id,
        status: 'posted',
      });
    }

    return id;
  };

  const createLiability = async (data: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'liab_' + Date.now();
    const now = new Date().toISOString();
    await saveLiability(user.uid, { ...data, id, createdAt: now, updatedAt: now });
    return id;
  };

  const createBudget = async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'budget_' + Date.now();
    const now = new Date().toISOString();
    await saveBudget(user.uid, { ...data, id, createdAt: now, updatedAt: now });
    return id;
  };

  const createRecurring = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'rec_' + Date.now();
    const now = new Date().toISOString();
    await saveRecurring(user.uid, { ...data, id, createdAt: now, updatedAt: now });
    return id;
  };

  // Process and confirm recurring transaction (converts reminder to real transaction)
  const processRecurringPost = async (item: RecurringTransaction): Promise<void> => {
    if (!user) return;
    await createTransaction({
      type: item.type,
      amount: item.amount,
      accountId: item.accountId,
      categoryId: item.categoryId,
      personId: item.personId,
      paymentMethod: 'Scheduled',
      occurredAt: getCurrentDhakaDateString(),
      timezone: 'Asia/Dhaka',
      description: item.name,
      status: 'posted',
    });

    // Update next due date based on frequency
    const nextDate = new Date();
    if (item.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (item.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (item.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (item.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

    const nextDueStr = nextDate.toISOString().substring(0, 10);
    await saveRecurring(user.uid, {
      ...item,
      lastProcessedDate: getCurrentDhakaDateString(),
      nextDueDate: nextDueStr,
      updatedAt: new Date().toISOString(),
    });
  };

  const createCategory = async (data: Omit<Category, 'id'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'cat_' + Date.now();
    await saveCategory(user.uid, { ...data, id });
    return id;
  };

  const createPerson = async (data: Omit<Person, 'id'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const id = 'person_' + Date.now();
    await savePerson(user.uid, { ...data, id });
    return id;
  };

  const restoreTrash = async (item: TrashItem): Promise<void> => {
    if (!user) return;
    await restoreFromTrash(user.uid, item);
  };

  const deleteTrashPermanently = async (trashId: string): Promise<void> => {
    if (!user) return;
    await permanentlyDeleteFromTrash(user.uid, trashId);
  };

  const markNotificationRead = async (notifId: string): Promise<void> => {
    if (!user) return;
    await markNotificationAsRead(user.uid, notifId);
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        loans,
        loanRepayments,
        savingsGoals,
        savingsProducts,
        assets,
        liabilities,
        budgets,
        recurring,
        notifications,
        categories,
        people,
        trash,
        auditLogs,
        summary,
        dateRange,
        setDateRange,
        isLoading,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        createAccount,
        updateAccount,
        adjustAccountBalance,
        createLoan,
        addLoanRepayment,
        createSavingsGoal,
        createSavingsProduct,
        createAsset,
        createLiability,
        createBudget,
        createRecurring,
        processRecurringPost,
        createCategory,
        createPerson,
        restoreTrash,
        deleteTrashPermanently,
        markNotificationRead,
        seedInitialDataIfEmpty,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
