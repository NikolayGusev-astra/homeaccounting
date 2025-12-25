import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Income,
  Expense,
  AppSettings,
  BudgetData,
  MonthlyForecast,
  DailyBalance,
  CashGap,
  CategoryStats,
} from '@/types/budget';

interface BudgetStore {
  // Data
  income: Income[];
  expenses: Expense[];
  settings: AppSettings;
  currentMonth: string;

  // Actions - Income
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  toggleIncomeReceived: (id: string) => void;

  // Actions - Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'history' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  toggleExpensePaid: (id: string) => void;
  addActualExpense: (expenseId: string, actualExpense: { date: string; amount: number; items?: string }) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  setCurrentMonth: (month: string) => void;
  exportData: () => BudgetData;
  importData: (data: BudgetData) => void;

  // Computed
  getMonthlyForecast: (year: number, month: number, startingBalance?: number) => MonthlyForecast;
  getCategoryStats: (year: number, month: number) => CategoryStats[];
  getTotalExpenses: (year: number, month: number) => number;
}

let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return `${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 6)}`;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const calculateForecast = (
  income: Income[],
  expenses: Expense[],
  year: number,
  month: number,
  startingBalance: number = 0
): MonthlyForecast => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyBalances: DailyBalance[] = [];
  const cashGaps: CashGap[] = [];
  let currentBalance = startingBalance;
  let totalIncome = 0;
  let totalExpenses = 0;

  // Pre-calculate all payment occurrences for entire month
  const incomeOccurrences = new Map<number, Income[]>();
  const expenseOccurrences = new Map<number, Expense[]>();

  // Calculate income occurrences
  income.forEach(inc => {
    const occurrences: number[] = [];

    if (inc.frequency === 'once') {
      // Only if target month/year matches current
      if (inc.targetYear === year && inc.targetMonth === month && inc.dayOfMonth) {
        occurrences.push(inc.dayOfMonth);
      }
    } else if (inc.frequency === 'monthly') {
      occurrences.push(inc.dayOfMonth);
    } else if (inc.frequency === 'weekly') {
      // Every 7 days starting from dayOfMonth
      for (let i = 0; i < 5; i++) {
        const occurrenceDay = inc.dayOfMonth + (i * 7);
        if (occurrenceDay > daysInMonth) break;
        occurrences.push(occurrenceDay);
      }
    } else if (inc.frequency === 'biweekly') {
      // Every 14 days starting from dayOfMonth
      for (let i = 0; i < 3; i++) {
        const occurrenceDay = inc.dayOfMonth + (i * 14);
        if (occurrenceDay > daysInMonth) break;
        occurrences.push(occurrenceDay);
      }
    }

    occurrences.forEach(day => {
      if (!incomeOccurrences.has(day)) {
        incomeOccurrences.set(day, []);
      }
      incomeOccurrences.get(day)!.push(inc);
    });
  });

  // Calculate expense occurrences
  expenses.forEach(exp => {
    const occurrences: number[] = [];

    if (exp.frequency === 'once') {
      // Only if target month/year matches current
      if (exp.targetYear === year && exp.targetMonth === month && exp.dayOfMonth) {
        occurrences.push(exp.dayOfMonth);
      }
    } else if (exp.frequency === 'monthly') {
      if (exp.dayOfMonth) {
        occurrences.push(exp.dayOfMonth);
      }
    } else if (exp.frequency === 'weekly') {
      // Every 7 days starting from dayOfMonth (default to day 1 if not set)
      const baseDay = exp.dayOfMonth || 1;
      for (let i = 0; i < 5; i++) {
        const occurrenceDay = baseDay + (i * 7);
        if (occurrenceDay > daysInMonth) break;
        occurrences.push(occurrenceDay);
      }
    } else if (exp.frequency === 'biweekly') {
      // Every 14 days starting from dayOfMonth (default to day 1 if not set)
      const baseDay = exp.dayOfMonth || 1;
      for (let i = 0; i < 3; i++) {
        const occurrenceDay = baseDay + (i * 14);
        if (occurrenceDay > daysInMonth) break;
        occurrences.push(occurrenceDay);
      }
    }

    occurrences.forEach(day => {
      if (!expenseOccurrences.has(day)) {
        expenseOccurrences.set(day, []);
      }
      expenseOccurrences.get(day)!.push(exp);
    });
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Get income transactions for this day
    const dayIncomeTransactions = incomeOccurrences.get(day) || [];
    const incomeAmount = dayIncomeTransactions.reduce((sum, inc) => inc.received ? sum + inc.amount : sum, 0);
    const incomeAmountAll = dayIncomeTransactions.reduce((sum, inc) => sum + inc.amount, 0); // For calendar display

    // Get expense transactions for this day
    const dayExpenseTransactions = expenseOccurrences.get(day) || [];
    // Все расходы учитываются в балансе, независимо от статуса оплаты
    const expenseAmount = dayExpenseTransactions.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseAmountAll = dayExpenseTransactions.reduce((sum, exp) => sum + exp.amount, 0); // For calendar display

    // Update balance
    currentBalance += incomeAmount - expenseAmount;
    const isCashGap = currentBalance < 0;

    // Track totals
    totalIncome += incomeAmount;
    totalExpenses += expenseAmount;

    // Store daily balance
    dailyBalances.push({
      date: dateStr,
      day,
      balance: currentBalance,
      income: incomeAmount,
      expenses: expenseAmount,
      incomeAll: incomeAmountAll,
      expensesAll: expenseAmountAll,
      isCashGap,
      incomeTransactions: dayIncomeTransactions,
      expenseTransactions: dayExpenseTransactions,
    });

    // Track cash gaps
    if (isCashGap) {
      cashGaps.push({
        date: dateStr,
        day,
        balance: currentBalance,
        gapAmount: Math.abs(currentBalance),
        incomes: dayIncomeTransactions,
        expenses: dayExpenseTransactions,
      });
    }
  }

  return {
    year,
    month,
    startingBalance,
    dailyBalances,
    cashGaps,
    totalIncome,
    totalExpenses,
    endingBalance: currentBalance,
  };
};

const calculateTotalExpenses = (
  expenses: Expense[],
  year: number,
  month: number
): number => {
  let total = 0;

  expenses.forEach(exp => {
    // Для разовых платежей используем targetMonth и targetYear
    if (exp.frequency === 'once') {
      if (exp.targetYear === year && exp.targetMonth === month) {
        total += exp.amount;
      }
      return;
    }

    // Для обычных платежей проверяем дату появления
    // Если платеж был создан в выбранном месяце, учитываем его
    const expenseDate = new Date(exp.createdAt);
    if (expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month) {
      total += exp.amount;
    }
  });

  return total;
};

const calculateCategoryStats = (
  expenses: Expense[],
  year: number,
  month: number
): CategoryStats[] => {
  const monthlyExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.createdAt);
    return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month;
  });

  const statsByCategory = new Map<string, { total: number; count: number; amounts: number[] }>();

  monthlyExpenses.forEach(exp => {
    const existing = statsByCategory.get(exp.category);
    if (existing) {
      existing.total += exp.amount;
      existing.count += 1;
      existing.amounts.push(exp.amount);
    } else {
      statsByCategory.set(exp.category, {
        total: exp.amount,
        count: 1,
        amounts: [exp.amount],
      });
    }
  });

  return Array.from(statsByCategory.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    average: data.total / data.count,
    min: Math.min(...data.amounts),
    max: Math.max(...data.amounts),
  }));
};

const getTotalExpenses = (
  expenses: Expense[],
  year: number,
  month: number
): number => {
  const monthlyExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.createdAt);
    return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month;
  });

  return monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
};

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      income: [],
      expenses: [],
      settings: {
        currency: 'RUB',
        locale: 'ru-RU',
        theme: 'dark-neon',
        notifications: true,
        defaultMonth: 'current',
      },
      currentMonth: getCurrentMonth(),

      // Income actions
      addIncome: (incomeData) => {
        const newIncome: Income = {
          ...incomeData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ income: [...state.income, newIncome] }));
      },

      updateIncome: (id, updates) => {
        set((state) => ({
          income: state.income.map((inc) =>
            inc.id === id ? { ...inc, ...updates } : inc
          ),
        }));
      },

      deleteIncome: (id) => {
        set((state) => ({
          income: state.income.filter((inc) => inc.id !== id),
        }));
      },

      toggleIncomeReceived: (id) => {
        set((state) => ({
          income: state.income.map((inc) =>
            inc.id === id
              ? {
                  ...inc,
                  received: !inc.received,
                  receivedDate: !inc.received ? new Date().toISOString() : null,
                }
              : inc
          ),
        }));
      },

      // Expense actions
      addExpense: (expenseData) => {
        const now = new Date();
        const newExpense: Expense = {
          ...expenseData,
          id: generateId(),
          history: [
            {
              date: now.toISOString(),
              amount: expenseData.amount,
              status: 'planned',
            },
          ],
          createdAt: now.toISOString(),
        };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((exp) =>
            exp.id === id
              ? {
                  ...exp,
                  ...updates,
                  history: [
                    ...exp.history,
                    {
                      date: new Date().toISOString(),
                      amount: updates.amount ?? exp.amount,
                      status: 'changed',
                    },
                  ],
                }
              : exp
          ),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((exp) => exp.id !== id),
        }));
      },

      toggleExpensePaid: (id) => {
        set((state) => ({
          expenses: state.expenses.map((exp) =>
            exp.id === id
              ? {
                  ...exp,
                  isPaid: !exp.isPaid,
                  history: [
                    ...exp.history,
                    {
                      date: new Date().toISOString(),
                      amount: exp.amount,
                      status: !exp.isPaid ? 'paid' : 'unpaid',
                    },
                  ],
                }
              : exp
          ),
        }));
      },

      addActualExpense: (expenseId, actualExpenseData) => {
        set((state) => ({
          expenses: state.expenses.map((exp) =>
            exp.id === expenseId
              ? {
                  ...exp,
                  actualExpenses: [...(exp.actualExpenses || []), actualExpenseData],
                }
              : exp
          ),
        }));
      },

      // Settings actions
      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      setCurrentMonth: (month) => {
        set({ currentMonth: month });
      },

      exportData: () => {
        const state = get();
        return {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          currentMonth: state.currentMonth,
          income: state.income,
          expenses: state.expenses,
          settings: state.settings,
        };
      },

      importData: (data) => {
        set({
          income: data.income || [],
          expenses: data.expenses || [],
          settings: data.settings || get().settings,
          currentMonth: data.currentMonth || getCurrentMonth(),
        });
      },

      // Computed implementations
      getMonthlyForecast: (year, month, startingBalance = 0) => {
        const { income, expenses } = get();
        return calculateForecast(income, expenses, year, month, startingBalance);
      },

      getCategoryStats: (year, month) => {
        const { expenses } = get();
        return calculateCategoryStats(expenses, year, month);
      },

      getTotalExpenses: (year, month) => {
        const { expenses } = get();
        return getTotalExpenses(expenses, year, month);
      },
    }),
    {
      name: 'budget-storage',
      partialize: (state) => ({
        income: state.income,
        expenses: state.expenses,
        settings: state.settings,
        currentMonth: state.currentMonth,
      }),
    }
  )
);
