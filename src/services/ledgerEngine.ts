/**
 * Central Financial Calculation and Ledger Engine
 *
 * Implements strict double-entry accounting rules, prevents double-counting,
 * and serves as the single source of truth for all calculations in the app.
 */

import {
  Account,
  Transaction,
  Loan,
  LoanRepayment,
  SavingsProduct,
  Asset,
  Liability,
  SplitLine,
} from '../types/finance';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  availableBalance: number;
  cashBalance: number;
  bankBalance: number;
  mobileBankingBalance: number;
  totalSavings: number;
  loanGivenOutstanding: number;
  loanTakenOutstanding: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface DateFilterRange {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  range?: DateFilterRange
): Transaction[] {
  if (!range || (!range.startDate && !range.endDate)) {
    return transactions;
  }

  return transactions.filter((t) => {
    // Only check active posted transactions
    if (t.status === 'cancelled' || t.deletedAt) return false;
    const tDate = t.occurredAt.substring(0, 10);
    if (range.startDate && tDate < range.startDate) return false;
    if (range.endDate && tDate > range.endDate) return false;
    return true;
  });
}

/**
 * Calculate Current Balances for each Account based on Opening Balances & Transactions
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize with opening balance
  for (const acc of accounts) {
    balances[acc.id] = acc.openingBalance || 0;
  }

  // Active transactions (excluding soft-deleted / cancelled)
  const activeTx = transactions.filter((t) => !t.deletedAt && t.status !== 'cancelled');

  for (const tx of activeTx) {
    const accId = tx.accountId;
    if (balances[accId] === undefined) {
      balances[accId] = 0;
    }

    switch (tx.type) {
      case 'income':
        balances[accId] += tx.amount;
        break;

      case 'expense':
        balances[accId] -= tx.amount;
        break;

      case 'transfer':
        balances[accId] -= tx.amount;
        if (tx.transferFee) {
          balances[accId] -= tx.transferFee;
        }
        if (tx.destinationAccountId) {
          if (balances[tx.destinationAccountId] === undefined) {
            balances[tx.destinationAccountId] = 0;
          }
          balances[tx.destinationAccountId] += tx.amount;
        }
        break;

      case 'loan_given':
        balances[accId] -= tx.amount;
        break;

      case 'loan_received':
        balances[accId] += tx.amount;
        break;

      case 'loan_repayment_received':
        balances[accId] += tx.amount;
        break;

      case 'loan_repayment_paid':
        balances[accId] -= tx.amount;
        break;

      case 'savings_deposit':
        balances[accId] -= tx.amount;
        if (tx.destinationAccountId) {
          if (balances[tx.destinationAccountId] === undefined) {
            balances[tx.destinationAccountId] = 0;
          }
          balances[tx.destinationAccountId] += tx.amount;
        }
        break;

      case 'savings_withdrawal':
        balances[accId] += tx.amount;
        if (tx.destinationAccountId) {
          if (balances[tx.destinationAccountId] === undefined) {
            balances[tx.destinationAccountId] = 0;
          }
          balances[tx.destinationAccountId] -= tx.amount;
        }
        break;

      case 'asset_purchase':
        balances[accId] -= tx.amount;
        break;

      case 'asset_sale':
        balances[accId] += tx.amount;
        break;

      case 'refund':
        // Refund received adds back to the financial account
        balances[accId] += tx.amount;
        break;

      case 'balance_adjustment':
        // Direct delta adjustment
        balances[accId] += tx.amount;
        break;
    }
  }

  return balances;
}

/**
 * Calculate Genuine Total Income
 * Excludes: loan received, transfers, savings movements, loan repayments received, asset sale principal
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => !t.deletedAt && t.status !== 'cancelled')
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate Genuine Total Net Expense
 * Formula: Posted Expenses - Linked Refunds
 * Excludes: transfers, loan given, loan repayment paid, asset purchases
 */
export function calculateTotalExpense(transactions: Transaction[]): number {
  const activeTx = transactions.filter((t) => !t.deletedAt && t.status !== 'cancelled');

  // Map of refunds by originalExpenseId
  const refundsByExpense: Record<string, number> = {};
  for (const t of activeTx) {
    if (t.type === 'refund' && t.originalExpenseId) {
      refundsByExpense[t.originalExpenseId] = (refundsByExpense[t.originalExpenseId] || 0) + t.amount;
    }
  }

  // Also include transfer fees as expenses
  let totalExpense = 0;

  for (const t of activeTx) {
    if (t.type === 'expense') {
      const refunded = refundsByExpense[t.id] || t.refundedAmount || 0;
      const net = Math.max(0, t.amount - refunded);
      totalExpense += net;
    } else if (t.type === 'transfer' && t.transferFee) {
      totalExpense += t.transferFee;
    }
  }

  return totalExpense;
}

/**
 * Calculate Outstanding Loans Given (Money people owe me)
 */
export function calculateLoanGivenOutstanding(loans: Loan[], repayments: LoanRepayment[] = []): number {
  const activeLoans = loans.filter((l) => !l.deletedAt && l.type === 'given');

  const repaymentsByLoan: Record<string, number> = {};
  for (const r of repayments) {
    if (r.loanType === 'given') {
      repaymentsByLoan[r.loanId] = (repaymentsByLoan[r.loanId] || 0) + r.amount;
    }
  }

  return activeLoans.reduce((sum, l) => {
    const repaid = repaymentsByLoan[l.id] || l.paidAmount || 0;
    return sum + Math.max(0, l.originalAmount - repaid);
  }, 0);
}

/**
 * Calculate Outstanding Loans Taken (Money I owe people)
 */
export function calculateLoanTakenOutstanding(loans: Loan[], repayments: LoanRepayment[] = []): number {
  const activeLoans = loans.filter((l) => !l.deletedAt && l.type === 'taken');

  const repaymentsByLoan: Record<string, number> = {};
  for (const r of repayments) {
    if (r.loanType === 'taken') {
      repaymentsByLoan[r.loanId] = (repaymentsByLoan[r.loanId] || 0) + r.amount;
    }
  }

  return activeLoans.reduce((sum, l) => {
    const repaid = repaymentsByLoan[l.id] || l.paidAmount || 0;
    return sum + Math.max(0, l.originalAmount - repaid);
  }, 0);
}

/**
 * Calculate Total Savings
 * Based on savings accounts and standalone DPS/FDR products
 */
export function calculateTotalSavings(
  accounts: Account[],
  accountBalances: Record<string, number>,
  savingsProducts: SavingsProduct[]
): number {
  // Savings accounts balances
  const savingsAccountTotal = accounts
    .filter((a) => a.status === 'active' && (a.type === 'savings_account' || a.type === 'dps' || a.type === 'fdr'))
    .reduce((sum, a) => sum + (accountBalances[a.id] || 0), 0);

  // Standalone DPS / FDR products not already represented by a financial account
  const standaloneProductsTotal = savingsProducts
    .filter((p) => p.status === 'active' && !p.linkedAccountId)
    .reduce((sum, p) => sum + (p.currentValue || p.principal), 0);

  return savingsAccountTotal + standaloneProductsTotal;
}

/**
 * Calculate Total Assets
 * Includes:
 * - Cash, Bank, Mobile Banking accounts
 * - Standalone Savings Products (not double-counted)
 * - Physical Assets (Land, House, Gold, Vehicle, Electronics, Business)
 * - Outstanding Loans Given (Receivables)
 */
export function calculateTotalAssets(
  accounts: Account[],
  accountBalances: Record<string, number>,
  savingsProducts: SavingsProduct[],
  assets: Asset[],
  loansGivenOutstanding: number
): number {
  // All active accounts balance
  const allAccountsBalance = accounts
    .filter((a) => a.status === 'active')
    .reduce((sum, a) => sum + (accountBalances[a.id] || 0), 0);

  // Standalone savings products without linked account
  const standaloneSavings = savingsProducts
    .filter((p) => p.status === 'active' && !p.linkedAccountId)
    .reduce((sum, p) => sum + (p.currentValue || p.principal), 0);

  // Physical assets (active only)
  const physicalAssetsTotal = assets
    .filter((a) => !a.deletedAt && a.status === 'active')
    .reduce((sum, a) => sum + (a.currentEstimatedValue || a.purchasePrice || 0), 0);

  return allAccountsBalance + standaloneSavings + physicalAssetsTotal + loansGivenOutstanding;
}

/**
 * Calculate Total Liabilities
 * Includes:
 * - Outstanding Loans Taken (from Loan module)
 * - Other liabilities (not double-counting loans taken)
 */
export function calculateTotalLiabilities(
  loanTakenOutstanding: number,
  liabilities: Liability[]
): number {
  const otherLiabilities = liabilities
    .filter((l) => !l.deletedAt && l.status === 'active')
    .reduce((sum, l) => sum + (l.remainingAmount ?? (l.originalAmount - (l.paidAmount || 0))), 0);

  return loanTakenOutstanding + otherLiabilities;
}

/**
 * Calculate Net Worth
 * Formula: Total Assets - Total Liabilities
 */
export function calculateNetWorth(totalAssets: number, totalLiabilities: number): number {
  return totalAssets - totalLiabilities;
}

/**
 * Master calculation aggregating all 12 key financial figures
 */
export function computeComprehensiveSummary(params: {
  accounts: Account[];
  transactions: Transaction[];
  loans: Loan[];
  repayments?: LoanRepayment[];
  savingsProducts?: SavingsProduct[];
  assets?: Asset[];
  liabilities?: Liability[];
  dateRange?: DateFilterRange;
}): FinancialSummary {
  const {
    accounts,
    transactions,
    loans,
    repayments = [],
    savingsProducts = [],
    assets = [],
    liabilities = [],
    dateRange,
  } = params;

  // Account balances are always cumulative (all-time current state)
  const accountBalances = calculateAccountBalances(accounts, transactions);

  // Date-filtered transactions for Income & Expense period metrics
  const periodTransactions = filterTransactionsByDate(transactions, dateRange);

  const totalIncome = calculateTotalIncome(periodTransactions);
  const totalExpense = calculateTotalExpense(periodTransactions);

  // Balances by account type
  let cashBalance = 0;
  let bankBalance = 0;
  let mobileBankingBalance = 0;

  for (const acc of accounts) {
    if (acc.status !== 'active') continue;
    const bal = accountBalances[acc.id] || 0;
    if (acc.type === 'cash') {
      cashBalance += bal;
    } else if (acc.type === 'bank') {
      bankBalance += bal;
    } else if (acc.type === 'mobile_banking') {
      mobileBankingBalance += bal;
    }
  }

  // Available liquid balance (Cash + Bank + Mobile Banking)
  const availableBalance = cashBalance + bankBalance + mobileBankingBalance;

  // Outstanding loan balances
  const loanGivenOutstanding = calculateLoanGivenOutstanding(loans, repayments);
  const loanTakenOutstanding = calculateLoanTakenOutstanding(loans, repayments);

  // Savings
  const totalSavings = calculateTotalSavings(accounts, accountBalances, savingsProducts);

  // Assets, Liabilities, and Net Worth
  const totalAssets = calculateTotalAssets(
    accounts,
    accountBalances,
    savingsProducts,
    assets,
    loanGivenOutstanding
  );
  const totalLiabilities = calculateTotalLiabilities(loanTakenOutstanding, liabilities);
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);

  return {
    totalIncome,
    totalExpense,
    availableBalance,
    cashBalance,
    bankBalance,
    mobileBankingBalance,
    totalSavings,
    loanGivenOutstanding,
    loanTakenOutstanding,
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

/**
 * Validate Split Transaction
 * Sum of split lines must exactly equal the parent transaction amount
 */
export function validateSplitTransaction(
  totalAmount: number,
  splitLines: SplitLine[]
): { isValid: boolean; difference: number; currentSum: number } {
  const currentSum = splitLines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const difference = totalAmount - currentSum;
  return {
    isValid: Math.abs(difference) === 0,
    difference,
    currentSum,
  };
}

/**
 * Validate Refund Request
 * Cannot refund more than remaining refundable amount
 */
export function validateRefund(
  originalExpense: Transaction,
  existingRefunds: Transaction[],
  newRefundAmount: number
): { isValid: boolean; maxAllowedRefund: number; error?: string } {
  if (originalExpense.type !== 'expense') {
    return { isValid: false, maxAllowedRefund: 0, error: 'Refund must be linked to an Expense transaction' };
  }

  const priorRefundTotal = existingRefunds
    .filter((r) => !r.deletedAt && r.status !== 'cancelled' && r.originalExpenseId === originalExpense.id)
    .reduce((sum, r) => sum + r.amount, 0);

  const maxAllowed = Math.max(0, originalExpense.amount - priorRefundTotal);

  if (newRefundAmount <= 0) {
    return { isValid: false, maxAllowedRefund: maxAllowed, error: 'Refund amount must be greater than zero' };
  }

  if (newRefundAmount > maxAllowed) {
    return {
      isValid: false,
      maxAllowedRefund: maxAllowed,
      error: `Refund of ৳${newRefundAmount} exceeds remaining refundable limit of ৳${maxAllowed}`,
    };
  }

  return { isValid: true, maxAllowedRefund: maxAllowed };
}
