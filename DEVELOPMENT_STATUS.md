# DEVELOPMENT STATUS — Personal Finance Manager

## 1. Completed Features
- **Project Foundation & Framework:**
  - Full-stack React 19 + TypeScript + Vite + Express architecture.
  - Tailwind CSS 4 styling with Light and Dark modes.
  - Asia/Dhaka timezone support with Bangladeshi number system (`৳1,00,000`).
  - Bilingual localization: Bengali (বাংলা) as primary language, English as secondary language.
- **Multi-User Registration, Authentication & Security:**
  - Multi-user authentication supporting both Google Sign-In and Email/Password.
  - Anyone can register and use the application with their own credentials.
  - Dedicated authentication UI (`AuthPage.tsx`) supporting:
    - Method 1: Continue with Google (one-click login / automatic account creation).
    - Method 2: Email and Password (registration, login, password visibility toggle, client validation).
    - Email Verification: Verification link dispatch on registration and on-demand resend action.
    - Password Reset: Forgot password flow sending secure reset links.
  - **Individual User Data Isolation**:
    - Each user has a completely private, zero-trust workspace stored under `users/{uid}/*`.
    - Firestore security rules enforce strict ownership (`request.auth.uid == userId`) preventing cross-user reads, mutations, or data leaks.
  - Web Crypto API PBKDF2 PIN Lock and Password Lock with random salt, rate limiting, and increasing lockout delays.
  - Inactivity auto-lock timer with configurable thresholds (1m, 5m, 10m, 15m, 30m, 1h, 1d, 5d, Off).
- **Cloud Firestore & Security Rules:**
  - Automated Firebase provisioning with multi-user isolation rules (`firestore.rules`).
  - Multi-tab persistent local cache enabled for true offline-first performance per user.
  - Deployed ABAC security rules rejecting unauthenticated requests and cross-user data access.
  - Mandatory `handleFirestoreError` error instrumentation per the Firebase Integration Skill.
- **Centralized Financial Calculation Engine (`ledgerEngine.ts`):**
  - Account Balances = Opening Balance + Inflows - Outflows + Valid Adjustments.
  - Total Income: Genuine income only (Salary, Business, Freelance, Rent, Investment, Gift). Excludes loans, transfers, savings movements.
  - Total Expense: Posted Expenses minus linked Refunds. Excludes transfers, loan given, loan repayment paid, asset purchases.
  - Available Balance: Liquid sum of cash, bank, and mobile wallets.
  - Single source of truth for Loan Receivables (Given) and Loan Liabilities (Taken).
  - No double counting of savings goals or linked DPS/FDR products.
  - Net Worth = Total Assets - Total Liabilities.
- **Transaction & Split Management:**
  - Full CRUD with soft deletion to Trash and append-only Audit History.
  - Split transactions with strict `sum(splitLines) === totalAmount` validation.
  - Refunds linked to original expense with remaining balance checks.
  - Account Transfers with source deduction, destination addition, and optional transfer fee.
- **Modules Implemented:**
  - Dashboard: 12 summary KPI cards, date filters (Today, This Week, This Month, This Year), category breakdowns, recent transactions, and critical alerts.
  - Accounts: Cash, Bank, Mobile Banking (bKash, Nagad), Savings accounts, balance adjustments with mandatory notes, and ledger viewer.
  - Loans: Given & Taken, installment repayments, overdue detection, history viewer.
  - Savings: Goals with progress bars, DPS and FDR fixed schemes with maturity tracking.
  - Assets: Physical property, gold, vehicles, and electronics with valuation updates and sale realization.
  - Liabilities: Non-loan obligations and bills without double counting loan module.
  - Budgets: Monthly and category limits with 70%, 85%, and 100% threshold alert notifications.
  - Recurring Reminders: Rent, bills, and tuition reminders that require explicit user confirmation before recording expenses.
  - Reports: Custom date range ledger, KPIs, and functional export buttons for Excel (.xlsx), PDF, and JSON backups.
  - Trash & Audit History: Soft-deleted records recovery, permanent deletion, and immutable audit logs.
  - Settings: Profile, owner allowlist status, language switch, PIN lock configuration, auto-lock timeout, full JSON backup & restore.
  - Setup Wizard: 10-step wizard for first-time account setup and opening balances.
  - Bengali Voice Entry: Browser Web Speech API (`bn-BD`) + server-side Gemini 2.5 Flash API endpoint (`/api/parse-transaction`) + explicit confirmation form.
  - Responsive Navigation: Desktop collapsible sidebar, mobile top header, floating Quick Add/Voice buttons, and mobile bottom navigation menu.
  - PWA: Web App Manifest and Service Worker shell caching.

## 2. In-Progress Features
- In-flight attachment synchronization for receipt image binaries.

## 3. Pending Features
- Server-side scheduled cron pushes (requires Cloud Functions / Cloud Scheduler when deployed to independent cloud projects).

## 4. Firebase Setup Requirements
- Firebase project provisioned: `gen-lang-client-0142249322`
- Firestore database: `ai-studio-personalfinancem-839615e0-8a1d-4fca-a757-cabd12939339`
- Firestore security rules deployed and active.

## 5. Known Bugs
- None identified.

## 6. Test Results
- Automated Unit Test Suite (`src/tests/financialEngine.test.ts`):
  - 14 out of 14 mandatory test scenarios passed (100% success rate).
  - All tests can also be verified on-demand directly inside the app under Settings.

## 7. Next Implementation Steps
- Continue verifying production build output with `compile_applet` and `lint_applet`.
