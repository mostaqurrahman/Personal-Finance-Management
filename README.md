# Personal Finance Manager (ব্যক্তিগত অর্থ পরিচালক)

A production-grade, offline-first personal financial management application built for a single user in Bangladesh with double-entry accounting integrity, Cloud Firestore synchronization, Bengali voice assistant powered by Gemini AI, and PWA capabilities.

## Key Features

1. **Strict Accounting Integrity:**
   - Centralized ledger engine (`src/services/ledgerEngine.ts`).
   - Account Balance = Opening Balance + Inflows - Outflows + Valid Adjustments.
   - Distinct classification of genuine Income vs. transfers, loan receipts, and asset sales.
   - Net Expense calculation with linked refunds and transfer fees.
   - Single source of truth for Loan Receivables (Loan Given) and Loan Liabilities (Loan Taken).
   - Zero double-counting of savings goals or linked DPS/FDR products.
   - Total Net Worth = Total Assets - Total Liabilities.

2. **Localization & Formatting:**
   - Primary Language: Bengali (বাংলা), Secondary Language: English.
   - Primary Currency: Bangladeshi Taka (৳ BDT) with South Asian comma grouping (`৳1,00,000`).
   - Timezone: Asia/Dhaka.

3. **Owner Allowlist Security:**
   - Single-user restriction configured in `src/config/owner.ts`.
   - Only authorized Google accounts are permitted to authenticate and access Firestore.
   - Client-side Web Crypto PBKDF2 PIN Lock and Password Lock with increasing lockout delays after repeated failed attempts.
   - Inactivity auto-lock timer (configurable in Settings).

4. **Offline-First & PWA:**
   - Firestore persistent multi-tab local cache for seamless operation when internet is unavailable.
   - IndexedDB local storage for offline attachments and mutations.
   - Service worker and Web App Manifest for installable PWA experience.

5. **Bengali Voice Entry with Gemini AI:**
   - Natural spoken Bengali recognition via Web Speech API (`bn-BD`).
   - Secure server-side Gemini 2.5 Flash endpoint (`/api/parse-transaction`) that parses complex financial statements into structured amounts, categories, and accounts.
   - Mandatory review form preventing automatic unverified postings.

6. **Comprehensive Modules:**
   - Dashboard with 12 real-time summary cards, charts, and date filters.
   - Transactions with Split transactions (`sum(splits) === total`) and linked Refunds.
   - Accounts (Cash, Bank, Mobile Banking) with opening balances and audited balance adjustments.
   - Transfers with fees.
   - Loans & Repayments with overdue calculations.
   - Savings Goals & Products (DPS/FDR).
   - Physical Assets & Other Liabilities.
   - Budgets with 70%, 85%, and 100% threshold notifications.
   - Recurring Reminders (requires user confirmation before posting).
   - Trash Bin with soft-delete restore and immutable Audit History.
   - Export to Excel (.xlsx), PDF, and JSON backups.

## Automated Tests

All 14 mandatory test scenarios from the Master Development Prompt have been implemented in `src/tests/financialEngine.test.ts`.
You can execute them in terminal:
```bash
npx tsx src/tests/financialEngine.test.ts
```
Or run them directly within the web app in the **Settings** view.

## Build and Run

- Development dev server:
  ```bash
  npm run dev
  ```
- Build for production:
  ```bash
  npm run build
  ```
