import { Category, Person } from '../types/finance';

export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Upay',
  'Bank Transfer',
  'Debit Card',
  'Cheque',
  'Other',
];

export const DEFAULT_ACCOUNTS = [
  { id: 'acc-cash', name: 'Personal Cash', type: 'cash' as const, provider: 'Cash', openingBalance: 10000, openingBalanceDate: '2026-01-01', currentBalance: 10000, currency: 'BDT' as const, status: 'active' as const, createdAt: '', updatedAt: '' },
  { id: 'acc-dbbl', name: 'DBBL Bank', type: 'bank' as const, provider: 'DBBL', openingBalance: 30000, openingBalanceDate: '2026-01-01', currentBalance: 30000, currency: 'BDT' as const, status: 'active' as const, createdAt: '', updatedAt: '' },
  { id: 'acc-bkash', name: 'Personal bKash', type: 'mobile_banking' as const, provider: 'bKash', openingBalance: 5000, openingBalanceDate: '2026-01-01', currentBalance: 5000, currency: 'BDT' as const, status: 'active' as const, createdAt: '', updatedAt: '' },
  { id: 'acc-nagad', name: 'Personal Nagad', type: 'mobile_banking' as const, provider: 'Nagad', openingBalance: 2000, openingBalanceDate: '2026-01-01', currentBalance: 2000, currency: 'BDT' as const, status: 'active' as const, createdAt: '', updatedAt: '' },
];

export const DEFAULT_PEOPLE: Person[] = [
  { id: 'person-family', name: 'Family', nameBn: 'পরিবার', relationship: 'Family', status: 'active', isDefault: true },
  { id: 'person-wife', name: 'Wife', nameBn: 'স্ত্রী', relationship: 'Spouse', status: 'active', isDefault: true },
  { id: 'person-personal', name: 'Personal', nameBn: 'ব্যক্তিগত', relationship: 'Self', status: 'active', isDefault: true },
  { id: 'person-father', name: 'Father', nameBn: 'বাবা', relationship: 'Parent', status: 'active', isDefault: true },
  { id: 'person-mother', name: 'Mother', nameBn: 'মা', relationship: 'Parent', status: 'active', isDefault: true },
  { id: 'person-brother', name: 'Brother', nameBn: 'ভাই', relationship: 'Sibling', status: 'active', isDefault: true },
  { id: 'person-sister', name: 'Sister', nameBn: 'বোন', relationship: 'Sibling', status: 'active', isDefault: true },
  { id: 'person-friend', name: 'Friend', nameBn: 'বন্ধু', relationship: 'Friend', status: 'active', isDefault: true },
  { id: 'person-business', name: 'Business', nameBn: 'ব্যবসা', relationship: 'Business', status: 'active', isDefault: true },
  { id: 'person-others', name: 'Others', nameBn: 'অন্যান্য', relationship: 'Other', status: 'active', isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'cat-inc-salary', name: 'Salary', nameBn: 'বেতন', type: 'income', icon: 'Briefcase', color: '#10b981', subcategories: [{ id: 'sub-base', name: 'Basic', nameBn: 'মূল বেতন' }, { id: 'sub-bonus', name: 'Bonus', nameBn: 'বোনাস' }], isDefault: true, status: 'active' },
  { id: 'cat-inc-business', name: 'Business Income', nameBn: 'ব্যবসায়িক আয়', type: 'income', icon: 'TrendingUp', color: '#059669', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-inc-freelance', name: 'Freelancing Income', nameBn: 'ফ্রিল্যান্সিং', type: 'income', icon: 'Laptop', color: '#047857', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-inc-investment', name: 'Investment Profit', nameBn: 'বিনিয়োগ মুনাফা', type: 'income', icon: 'PieChart', color: '#0d9488', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-inc-rental', name: 'Rental Income', nameBn: 'ভাড়া আয়', type: 'income', icon: 'Home', color: '#0284c7', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-inc-gift', name: 'Gift', nameBn: 'উপহার', type: 'income', icon: 'Gift', color: '#8b5cf6', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-inc-other', name: 'Other Income', nameBn: 'অন্যান্য আয়', type: 'income', icon: 'PlusCircle', color: '#6b7280', subcategories: [], isDefault: true, status: 'active' },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-exp-food', name: 'Food & Grocery', nameBn: 'খাবার ও মুদি বাজার', type: 'expense', icon: 'ShoppingCart', color: '#ef4444', subcategories: [{ id: 'sub-bazar', name: 'Daily Bazar', nameBn: 'কাঁচা বাজার' }, { id: 'sub-restaurant', name: 'Restaurant', nameBn: 'রেস্তোরাঁ' }], isDefault: true, status: 'active' },
  { id: 'cat-exp-rent', name: 'House Rent', nameBn: 'বাড়ি ভাড়া', type: 'expense', icon: 'Home', color: '#dc2626', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-electricity', name: 'Electricity', nameBn: 'বিদ্যুৎ বিল', type: 'expense', icon: 'Zap', color: '#ea580c', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-gas', name: 'Gas', nameBn: 'গ্যাস বিল', type: 'expense', icon: 'Flame', color: '#d97706', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-water', name: 'Water', nameBn: 'পানি বিল', type: 'expense', icon: 'Droplet', color: '#2563eb', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-internet', name: 'Internet', nameBn: 'ইন্টারনেট ও ওয়াইফাই', type: 'expense', icon: 'Wifi', color: '#4f46e5', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-transport', name: 'Transportation', nameBn: 'যাতায়াত ও জ্বালানি', type: 'expense', icon: 'Car', color: '#7c3aed', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-shopping', name: 'Shopping & Clothing', nameBn: 'কেনাকাটা ও পোশাক', type: 'expense', icon: 'ShoppingBag', color: '#db2777', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-medical', name: 'Medical & Healthcare', nameBn: 'চিকিৎসা ও ওষুধ', type: 'expense', icon: 'HeartPulse', color: '#e11d48', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-education', name: 'Education', nameBn: 'শিক্ষা ও বই', type: 'expense', icon: 'GraduationCap', color: '#0891b2', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-family', name: 'Family Expense', nameBn: 'পারিবারিক খরচ', type: 'expense', icon: 'Users', color: '#b91c1c', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-wife', name: 'Wife Expense', nameBn: 'স্ত্রীর খরচ', type: 'expense', icon: 'Heart', color: '#f43f5e', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-personal', name: 'Personal Expense', nameBn: 'ব্যক্তিগত খরচ', type: 'expense', icon: 'User', color: '#9333ea', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-entertainment', name: 'Entertainment & Travel', nameBn: 'বিনোদন ও ভ্রমণ', type: 'expense', icon: 'Film', color: '#c026d3', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-donation', name: 'Donation & Charity', nameBn: 'দান ও সদকা', type: 'expense', icon: 'HandHeart', color: '#16a34a', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-business', name: 'Business Expense', nameBn: 'ব্যবসায়িক ব্যয়', type: 'expense', icon: 'Briefcase', color: '#475569', subcategories: [], isDefault: true, status: 'active' },
  { id: 'cat-exp-other', name: 'Other Expense', nameBn: 'অন্যান্য খরচ', type: 'expense', icon: 'MoreHorizontal', color: '#64748b', subcategories: [], isDefault: true, status: 'active' },
];
