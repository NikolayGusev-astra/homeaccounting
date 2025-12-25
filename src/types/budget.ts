// TypeScript types for Home Accounting App

export type AccountType = 'debit' | 'credit_card' | 'savings';

export type ExpenseType = 'regular' | 'credit_payment' | 'installment' | 'cc_payment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName: string;
  currency: 'RUB' | 'USD' | 'EUR';
  balance: number;
  creditLimit?: number;
  interestRate?: number;
  gracePeriodDays?: number;
  minPaymentPercent?: number;
  color: string;
}

export interface InstallmentPayment {
  date: string;
  amount: number;
  paid: boolean;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'once';
  received: boolean;
  receivedDate: string | null;
  notes?: string;
  createdAt: string;
  targetYear?: number;
  targetMonth?: number;
}

export interface CreditDetails {
  loanNumber?: string;
  remainingBalance?: number;
  interestRate?: number;
}

export interface ActualExpense {
  date: string;
  amount: number;
  items?: string;
}

export interface ExpenseHistory {
  date: string;
  amount: number;
  status: 'planned' | 'paid' | 'changed';
}

export type ExpenseCategory = 'кредиты' | 'коммунальные' | 'питание' | 'прочее';

export type ExpenseSubcategory = 'электро' | 'газ' | 'вода' | 'отопление' | 'интернет' | 'тв';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  subcategory?: ExpenseSubcategory;
  name: string;
  amount: number;
  dayOfMonth: number | null;
  dueDate: string | null;
  isPaid: boolean;
  isRequired: boolean;
  creditDetails?: CreditDetails;
  notes?: string;
  history: ExpenseHistory[];
  actualExpenses?: ActualExpense[];
  createdAt: string;
  frequency?: 'monthly' | 'weekly' | 'biweekly' | 'once';
  targetYear?: number;
  targetMonth?: number;
}

export type PaymentStatus = 'unpaid' | 'paid' | 'overdue';

export interface DailyBalance {
  date: string;
  day: number;
  balance: number;
  income: number;         // For forecast (only received income)
  expenses: number;       // For forecast (only unpaid expenses)
  incomeAll: number;      // For calendar display (all income)
  expensesAll: number;    // For calendar display (all expenses)
  isCashGap: boolean;
  incomeTransactions?: Income[];
  expenseTransactions?: Expense[];
}

export interface CashGap {
  date: string;
  day: number;
  balance: number;
  gapAmount: number;
  incomes: Income[];
  expenses: Expense[];
}

export interface MonthlyForecast {
  year: number;
  month: number;
  startingBalance: number;
  dailyBalances: DailyBalance[];
  cashGaps: CashGap[];
  totalIncome: number;
  totalExpenses: number;
  endingBalance: number;
}

export interface CategoryStats {
  category: string;
  total: number;
  count: number;
  average: number;
  min: number;
  max: number;
}

export interface AppSettings {
  currency: string;
  locale: string;
  theme: 'dark-neon' | 'light';
  notifications: boolean;
  defaultMonth: 'current' | 'next';
}

export interface BudgetData {
  version: string;
  lastUpdated: string;
  currentMonth: string;
  income: Income[];
  expenses: Expense[];
  settings: AppSettings;
}

export interface ExportData extends BudgetData {
  exportDate: string;
}

export type ViewMode = 'dashboard' | 'income' | 'expenses' | 'analytics';
