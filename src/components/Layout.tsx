import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { QuickAddModal } from './QuickAddModal';
import { VoiceTransactionModal } from './VoiceTransactionModal';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  ArrowLeftRight,
  Users,
  Tag,
  HandCoins,
  PiggyBank,
  Building,
  Scale,
  Target,
  Repeat,
  BarChart3,
  Bell,
  Trash2,
  Settings,
  Plus,
  Mic,
  Lock,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  LogOut,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, lockApp, isOnline, resendVerificationEmail } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markNotificationRead } = useFinance();
  const location = useLocation();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const navItems = [
    { to: '/', label: t('navDashboard'), icon: LayoutDashboard },
    { to: '/transactions', label: t('navTransactions'), icon: Receipt },
    { to: '/accounts', label: t('navAccounts'), icon: Wallet },
    { to: '/transfers', label: t('navTransfers'), icon: ArrowLeftRight },
    { to: '/people', label: t('navPeople'), icon: Users },
    { to: '/categories', label: t('navCategories'), icon: Tag },
    { to: '/loans', label: t('navLoans'), icon: HandCoins },
    { to: '/savings', label: t('navSavings'), icon: PiggyBank },
    { to: '/assets', label: t('navAssets'), icon: Building },
    { to: '/liabilities', label: t('navLiabilities'), icon: Scale },
    { to: '/budgets', label: t('navBudgets'), icon: Target },
    { to: '/recurring', label: t('navRecurring'), icon: Repeat },
    { to: '/reports', label: t('navReports'), icon: BarChart3 },
    { to: '/notifications', label: t('navNotifications'), icon: Bell, badge: unreadNotifs.length },
    { to: '/trash-audit', label: t('navTrashAudit'), icon: Trash2 },
    { to: '/settings', label: t('navSettings'), icon: Settings },
  ];

  const isEmailPasswordAccount =
    user &&
    !user.emailVerified &&
    user.providerData.some((p) => p.providerId === 'password');

  const handleResendVerification = async () => {
    setIsResendingEmail(true);
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to send verification email. Please try again later.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none flex-shrink-0 z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/30">
            ৳
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {t('appName')}
            </h1>
            <p className="text-[10px] text-slate-400">Bangladesh • BDT</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white text-emerald-700'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 truncate">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                  {user?.displayName ? user.displayName[0] : 'U'}
                </div>
              )}
              <span className="truncate font-medium">{user?.displayName || user?.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-4">
          {/* Mobile Menu trigger & title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-base font-bold text-slate-900 dark:text-white truncate">
              {navItems.find((n) => n.to === location.pathname)?.label || 'Personal Finance'}
            </span>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Online / Offline Sync badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? t('online') : t('offline')}</span>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('quickAdd')}</span>
            </button>

            {/* Bengali Voice Input Button */}
            <button
              onClick={() => setIsVoiceOpen(true)}
              title="Bengali Voice Input"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-all active:scale-95"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">{t('voiceInput')}</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              title="Switch Language"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {language === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Notifications ({unreadNotifs.length})
                    </span>
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">No notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`py-2 px-1 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {language === 'bn' ? n.titleBn : n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {language === 'bn' ? n.messageBn : n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lock App Button */}
            <button
              onClick={lockApp}
              title={t('lockApp')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Email Verification Banner */}
        {isEmailPasswordAccount && (
          <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-200 dark:border-amber-900/60 px-4 md:px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Please verify your email address (<strong>{user?.email}</strong>) to secure your account.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {verificationSent ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  Verification email sent! Check your inbox.
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors disabled:opacity-50"
                >
                  {isResendingEmail ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-white dark:bg-slate-900 h-full flex flex-col z-10 shadow-2xl p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                  ৳
                </div>
                <span className="font-bold text-sm">{t('appName')}</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </NavLink>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="flex items-center gap-2 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors mt-auto border-t border-slate-100 dark:border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Buttons (Placed above bottom nav bar) */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-2.5">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-11 h-11 rounded-full bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center shadow-lg active:scale-95 border border-slate-700"
          title="Bengali Voice Entry"
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="w-13 h-13 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/40 active:scale-95"
          title="Quick Add Transaction"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Menu */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1">
        <NavLink
          to="/"
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{t('navDashboard')}</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Receipt className="w-5 h-5" />
          <span>{t('navTransactions')}</span>
        </NavLink>

        <NavLink
          to="/accounts"
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Wallet className="w-5 h-5" />
          <span>{t('navAccounts')}</span>
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }: { isActive: boolean }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Target className="w-5 h-5" />
          <span>{t('navBudgets')}</span>
        </NavLink>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />

      {/* Bengali Voice Input Modal */}
      <VoiceTransactionModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
};
