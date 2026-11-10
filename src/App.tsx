import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';

// Components
import { Layout } from './components/Layout';
import { LockScreen } from './components/LockScreen';
import { FirstTimeSetupWizard } from './components/FirstTimeSetupWizard';
import { AuthPage } from './pages/AuthPage';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { TransfersPage } from './pages/TransfersPage';
import { PeoplePage } from './pages/PeoplePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoansPage } from './pages/LoansPage';
import { SavingsPage } from './pages/SavingsPage';
import { AssetsPage } from './pages/AssetsPage';
import { LiabilitiesPage } from './pages/LiabilitiesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { RecurringPage } from './pages/RecurringPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TrashAuditPage } from './pages/TrashAuditPage';
import { SettingsPage } from './pages/SettingsPage';

import { Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading, isLocked, settings } = useAuth();
  const [showSetupManual, setShowSetupManual] = useState(false);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-emerald-600/30 animate-pulse">
            ৳
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading Personal Finance Manager...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render dedicated multi-user AuthPage (Google & Email/Password)
  if (!user) {
    return <AuthPage />;
  }

  // 3. First-time Setup Wizard if not completed for this user
  const needsSetup = settings && !settings.isSetupCompleted;
  if (needsSetup || showSetupManual) {
    return <FirstTimeSetupWizard onComplete={() => setShowSetupManual(false)} />;
  }

  // 5. Security Lock Screen Overlay
  if (isLocked) {
    return <LockScreen />;
  }

  // 6. Main Application Layout & Routes
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="liabilities" element={<LiabilitiesPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="trash-audit" element={<TrashAuditPage />} />
        <Route
          path="settings"
          element={<SettingsPage onRerunSetup={() => setShowSetupManual(true)} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <FinanceProvider>
              <MainAppContent />
            </FinanceProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
