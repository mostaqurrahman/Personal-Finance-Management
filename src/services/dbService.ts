/**
 * Database Service for Firestore with error handling, audit logging, and soft-delete.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
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
  UserSettings,
  Category,
  Person,
} from '../types/finance';

function getUserPath(uid: string, subcollection: string): string {
  return `users/${uid}/${subcollection}`;
}

function getDeviceId(): string {
  let devId = localStorage.getItem('pfm_device_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('pfm_device_id', devId);
  }
  return devId;
}

// ---------------- AUDIT LOGGING ----------------
export async function recordAuditLog(
  uid: string,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'deviceId' | 'userId'>
): Promise<void> {
  const auditId = 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const logDoc: AuditLogEntry = {
    ...entry,
    id: auditId,
    timestamp: new Date().toISOString(),
    deviceId: getDeviceId(),
    userId: uid,
  };

  try {
    await setDoc(doc(db, getUserPath(uid, 'auditLogs'), auditId), logDoc);
  } catch (error) {
    console.warn('Could not write audit log:', error);
  }
}

// ---------------- USER SETTINGS ----------------
export async function getUserSettings(uid: string): Promise<UserSettings | null> {
  const path = `${getUserPath(uid, 'settings')}/general`;
  try {
    const snap = await getDoc(doc(db, getUserPath(uid, 'settings'), 'general'));
    if (snap.exists()) {
      return snap.data() as UserSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserSettings(uid: string, settings: UserSettings): Promise<void> {
  const path = `${getUserPath(uid, 'settings')}/general`;
  try {
    await setDoc(doc(db, getUserPath(uid, 'settings'), 'general'), settings, { merge: true });
    await recordAuditLog(uid, {
      action: 'update',
      entityType: 'settings',
      entityId: 'general',
      newValues: settings,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- ACCOUNTS ----------------
export function subscribeAccounts(
  uid: string,
  onData: (accounts: Account[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = getUserPath(uid, 'accounts');
  const q = query(collection(db, colPath));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d: any) => d.data() as Account);
      onData(items);
    },
    (err: any) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, colPath);
    }
  );
}

export async function saveAccount(uid: string, account: Account, oldAccount?: Account): Promise<void> {
  const path = `${getUserPath(uid, 'accounts')}/${account.id}`;
  try {
    await setDoc(doc(db, getUserPath(uid, 'accounts'), account.id), account);
    await recordAuditLog(uid, {
      action: oldAccount ? 'update' : 'create',
      entityType: 'account',
      entityId: account.id,
      oldValues: oldAccount,
      newValues: account,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- TRANSACTIONS ----------------
export function subscribeTransactions(
  uid: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = getUserPath(uid, 'transactions');
  const q = query(collection(db, colPath));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d: any) => d.data() as Transaction);
      onData(items);
    },
    (err: any) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, colPath);
    }
  );
}

export async function saveTransaction(
  uid: string,
  transaction: Transaction,
  oldTx?: Transaction
): Promise<void> {
  const path = `${getUserPath(uid, 'transactions')}/${transaction.id}`;
  try {
    await setDoc(doc(db, getUserPath(uid, 'transactions'), transaction.id), transaction);
    await recordAuditLog(uid, {
      action: oldTx ? 'update' : 'create',
      entityType: 'transaction',
      entityId: transaction.id,
      oldValues: oldTx,
      newValues: transaction,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Soft delete to Trash
export async function softDeleteTransaction(uid: string, tx: Transaction): Promise<void> {
  const path = `${getUserPath(uid, 'transactions')}/${tx.id}`;
  try {
    const updated = { ...tx, deletedAt: new Date().toISOString() };
    await setDoc(doc(db, getUserPath(uid, 'transactions'), tx.id), updated);

    // Add to trash collection
    const trashItem: TrashItem = {
      id: 'trash_' + tx.id,
      entityType: 'transaction',
      entityId: tx.id,
      nameOrDesc: tx.description || 'Transaction',
      amount: tx.amount,
      deletedAt: new Date().toISOString(),
      data: tx,
    };
    await setDoc(doc(db, getUserPath(uid, 'trash'), trashItem.id), trashItem);

    await recordAuditLog(uid, {
      action: 'delete',
      entityType: 'transaction',
      entityId: tx.id,
      oldValues: tx,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function restoreFromTrash(uid: string, trashItem: TrashItem): Promise<void> {
  try {
    if (trashItem.entityType === 'transaction') {
      const tx = { ...trashItem.data, deletedAt: null };
      await setDoc(doc(db, getUserPath(uid, 'transactions'), tx.id), tx);
    } else if (trashItem.entityType === 'loan') {
      const loan = { ...trashItem.data, deletedAt: null };
      await setDoc(doc(db, getUserPath(uid, 'loans'), loan.id), loan);
    } else if (trashItem.entityType === 'asset') {
      const asset = { ...trashItem.data, deletedAt: null };
      await setDoc(doc(db, getUserPath(uid, 'assets'), asset.id), asset);
    } else if (trashItem.entityType === 'liability') {
      const liability = { ...trashItem.data, deletedAt: null };
      await setDoc(doc(db, getUserPath(uid, 'liabilities'), liability.id), liability);
    }

    await deleteDoc(doc(db, getUserPath(uid, 'trash'), trashItem.id));

    await recordAuditLog(uid, {
      action: 'restore',
      entityType: trashItem.entityType as any,
      entityId: trashItem.entityId,
      newValues: trashItem.data,
    });
  } catch (error) {
    console.error('Error restoring from trash:', error);
    throw error;
  }
}

export async function permanentlyDeleteFromTrash(uid: string, trashId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, getUserPath(uid, 'trash'), trashId));
  } catch (error) {
    console.error('Error permanently deleting:', error);
    throw error;
  }
}

// ---------------- LOANS & REPAYMENTS ----------------
export function subscribeLoans(
  uid: string,
  onData: (loans: Loan[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = getUserPath(uid, 'loans');
  return onSnapshot(
    collection(db, colPath),
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d: any) => d.data() as Loan);
      onData(items);
    },
    (err: any) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, colPath);
    }
  );
}

export async function saveLoan(uid: string, loan: Loan, oldLoan?: Loan): Promise<void> {
  const path = `${getUserPath(uid, 'loans')}/${loan.id}`;
  try {
    await setDoc(doc(db, getUserPath(uid, 'loans'), loan.id), loan);
    await recordAuditLog(uid, {
      action: oldLoan ? 'update' : 'create',
      entityType: 'loan',
      entityId: loan.id,
      oldValues: oldLoan,
      newValues: loan,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeLoanRepayments(
  uid: string,
  onData: (repayments: LoanRepayment[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'loanRepayments')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as LoanRepayment);
    onData(items);
  });
}

export async function saveLoanRepayment(uid: string, repayment: LoanRepayment): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'loanRepayments'), repayment.id), repayment);
}

// ---------------- SAVINGS ----------------
export function subscribeSavingsGoals(
  uid: string,
  onData: (goals: SavingsGoal[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'savingsGoals')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as SavingsGoal);
    onData(items);
  });
}

export async function saveSavingsGoal(uid: string, goal: SavingsGoal): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'savingsGoals'), goal.id), goal);
}

export function subscribeSavingsProducts(
  uid: string,
  onData: (products: SavingsProduct[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'savingsProducts')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as SavingsProduct);
    onData(items);
  });
}

export async function saveSavingsProduct(uid: string, product: SavingsProduct): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'savingsProducts'), product.id), product);
}

// ---------------- ASSETS & LIABILITIES ----------------
export function subscribeAssets(uid: string, onData: (assets: Asset[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'assets')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as Asset);
    onData(items);
  });
}

export async function saveAsset(uid: string, asset: Asset, oldAsset?: Asset): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'assets'), asset.id), asset);
  await recordAuditLog(uid, {
    action: oldAsset ? 'update' : 'create',
    entityType: 'asset',
    entityId: asset.id,
    oldValues: oldAsset,
    newValues: asset,
  });
}

export function subscribeLiabilities(uid: string, onData: (liabilities: Liability[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'liabilities')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as Liability);
    onData(items);
  });
}

export async function saveLiability(uid: string, liability: Liability, oldLiability?: Liability): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'liabilities'), liability.id), liability);
  await recordAuditLog(uid, {
    action: oldLiability ? 'update' : 'create',
    entityType: 'liability',
    entityId: liability.id,
    oldValues: oldLiability,
    newValues: liability,
  });
}

// ---------------- BUDGETS ----------------
export function subscribeBudgets(uid: string, onData: (budgets: Budget[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'budgets')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as Budget);
    onData(items);
  });
}

export async function saveBudget(uid: string, budget: Budget): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'budgets'), budget.id), budget);
}

// ---------------- RECURRING RULES ----------------
export function subscribeRecurring(
  uid: string,
  onData: (recurring: RecurringTransaction[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'recurringRules')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as RecurringTransaction);
    onData(items);
  });
}

export async function saveRecurring(uid: string, item: RecurringTransaction): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'recurringRules'), item.id), item);
}

// ---------------- NOTIFICATIONS ----------------
export function subscribeNotifications(
  uid: string,
  onData: (notifications: NotificationItem[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'notifications')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as NotificationItem);
    onData(items);
  });
}

export async function saveNotification(uid: string, notif: NotificationItem): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'notifications'), notif.id), notif);
}

export async function markNotificationAsRead(uid: string, notifId: string): Promise<void> {
  await updateDoc(doc(db, getUserPath(uid, 'notifications'), notifId), { isRead: true });
}

// ---------------- TRASH & AUDIT ----------------
export function subscribeTrash(uid: string, onData: (trash: TrashItem[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'trash')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as TrashItem);
    onData(items);
  });
}

export function subscribeAuditLogs(uid: string, onData: (logs: AuditLogEntry[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'auditLogs')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as AuditLogEntry);
    onData(items);
  });
}

// ---------------- CATEGORIES & PEOPLE ----------------
export function subscribeCategories(uid: string, onData: (categories: Category[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'categories')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as Category);
    onData(items);
  });
}

export async function saveCategory(uid: string, cat: Category): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'categories'), cat.id), cat);
}

export function subscribePeople(uid: string, onData: (people: Person[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid, 'people')), (snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map((d: any) => d.data() as Person);
    onData(items);
  });
}

export async function savePerson(uid: string, person: Person): Promise<void> {
  await setDoc(doc(db, getUserPath(uid, 'people'), person.id), person);
}
