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
import { supabase, getCurrentUserId, getCurrentUserIdSync, isSupabaseEnabled } from '@/lib/supabase';

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
  deleteExpense: (id: string) => Promise<void>;
  toggleExpensePaid: (id: string) => void;
  addActualExpense: (expenseId: string, actualExpense: { date: string; amount: number; items?: string }) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setCurrentMonth: (month: string) => void;
  exportData: () => BudgetData;
  importData: (data: BudgetData) => void;

  // Actions - Settings Sync
  syncSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;

  // Actions - Supabase Sync
  syncToSupabase: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  isSyncing: boolean;

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
      if (inc.targetYear === year && inc.targetMonth === month && inc.dayOfMonth) {
        occurrences.push(inc.dayOfMonth);
      }
    } else if (inc.frequency === 'monthly') {
      occurrences.push(inc.dayOfMonth);
    } else if (inc.frequency === 'weekly') {
      for (let i = 0; i < 5; i++) {
        const occurrenceDay = inc.dayOfMonth + (i * 7);
        if (occurrenceDay > daysInMonth) break;
        occurrences.push(occurrenceDay);
      }
    } else if (inc.frequency === 'biweekly') {
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
    const frequency = exp.frequency || 'monthly';

    if (frequency === 'once') {
      if (exp.targetYear === year && exp.targetMonth === month && exp.dayOfMonth) {
        occurrences.push(exp.dayOfMonth);
      }
    } else if (frequency === 'monthly') {
      if (exp.dayOfMonth) {
        occurrences.push(exp.dayOfMonth);
      }
    } else if (frequency === 'weekly') {
      const baseDay = exp.dayOfMonth || 1;
      for (let i = 0; i < 5; i++) {
        const occurrenceDay = baseDay + (i * 7);
        if (occurrenceDay > daysInMonth) break;
        occurrences.push(occurrenceDay);
      }
    } else if (frequency === 'biweekly') {
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
    
    const dayIncomeTransactions = incomeOccurrences.get(day) || [];
    const incomeAmount = dayIncomeTransactions.reduce((sum, inc) => inc.received ? sum + inc.amount : sum, 0);
    const incomeAmountAll = dayIncomeTransactions.reduce((sum, inc) => sum + inc.amount, 0);
    
    const dayExpenseTransactions = expenseOccurrences.get(day) || [];
    const expenseAmount = dayExpenseTransactions.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseAmountAll = dayExpenseTransactions.reduce((sum, exp) => sum + exp.amount, 0);

    currentBalance += incomeAmount - expenseAmount;
    
    const isCashGap = currentBalance < 0;

    totalIncome += incomeAmount;
    totalExpenses += expenseAmount;

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

const calculateCategoryStats = (
  expenses: Expense[],
  year: number,
  month: number
): CategoryStats[] => {
  const monthlyExpenses = expenses.filter(exp => {
    if (exp.frequency === 'once') {
      return exp.targetYear === year && exp.targetMonth === month;
    } else {
      return true;
    }
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

const calculateTotalExpenses = (
  expenses: Expense[],
  year: number,
  month: number
): number => {
  const monthlyExpenses = expenses.filter(exp => {
    if (exp.frequency === 'once') {
      return exp.targetYear === year && exp.targetMonth === month;
    } else {
      return true;
    }
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
      isSyncing: false,

      addIncome: (incomeData) => {
        const newIncome: Income = {
          ...incomeData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        let newExpense: Expense | null = null;
        if (incomeData.isTransfer && incomeData.transferType === 'sent') {
          newExpense = {
            id: generateId(),
            category: 'переводы',
            name: incomeData.name,
            amount: incomeData.amount,
            dayOfMonth: incomeData.dayOfMonth,
            dueDate: null,
            isPaid: false,
            isRequired: false,
            notes: incomeData.notes,
            history: [],
            createdAt: new Date().toISOString(),
            frequency: incomeData.frequency,
            targetYear: incomeData.targetYear,
            targetMonth: incomeData.targetMonth,
            isTransfer: true,
            transferType: 'sent',
          };
        }

        set((state) => ({
          income: [...state.income, newIncome],
          expenses: newExpense ? [...state.expenses, newExpense] : state.expenses,
        }));

        if (isSupabaseEnabled()) {
          get().syncToSupabase().catch(console.error);
        }
      },

      updateIncome: (id, updates) => {
        set((state) => ({
          income: state.income.map((inc) =>
            inc.id === id ? { ...inc, ...updates } : inc
          ),
        }));

        if (isSupabaseEnabled()) {
          get().syncToSupabase().catch(console.error);
        }
      },

      deleteIncome: (id) => {
        set((state) => ({
          income: state.income.filter((inc) => inc.id !== id),
        }));

        if (isSupabaseEnabled() && supabase) {
          const userId = getCurrentUserIdSync();
          if (userId) {
            // ИСПРАВЛЕНИЕ: Используем IIFE и проверку error вместо .then().catch()
            (async () => {
              const { error } = await supabase
                .from('income_legacy')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
              
              if (error) console.error('Error deleting income:', error);
            })();
          }
        }
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

        if (isSupabaseEnabled()) {
          get().syncToSupabase().catch(console.error);
        }
      },

      addExpense: (expenseData) => {
        const now = new Date();
        const newExpense: Expense = {
          ...expenseData,
          id: generateId(),
          history: [{
            date: now.toISOString(),
            amount: expenseData.amount,
            status: 'planned',
          }],
          createdAt: now.toISOString(),
        };

        let newIncome: Income | null = null;
        if (expenseData.isTransfer && expenseData.transferType === 'received') {
          newIncome = {
            id: generateId(),
            name: expenseData.name,
            amount: expenseData.amount,
            dayOfMonth: expenseData.dayOfMonth || 1,
            frequency: expenseData.frequency || 'monthly',
            received: false,
            receivedDate: null,
            notes: expenseData.notes,
            createdAt: new Date().toISOString(),
            targetYear: expenseData.targetYear,
            targetMonth: expenseData.targetMonth,
            isTransfer: true,
            transferType: 'received',
          };
        }

        set((state) => ({
          expenses: [...state.expenses, newExpense],
          income: newIncome ? [...state.income, newIncome] : state.income,
        }));

        if (isSupabaseEnabled()) {
          get().syncToSupabase().catch(console.error);
        }
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((exp) => {
            if (exp.id === id) {
              return {
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
              };
            }
            return exp;
          }),
        }));

        if (isSupabaseEnabled()) {
          get().syncToSupabase().catch(console.error);
        }
      },

      deleteExpense: async (id) => {
        set((state) => ({
          expenses: state.expenses.filter((exp) => exp.id !== id),
        }));

        if (isSupabaseEnabled() && supabase) {
          const userId = await getCurrentUserId();
          if (userId) {
            // ИСПРАВЛЕНИЕ: Убрали .catch(), используем проверку { error }
            const { error } = await supabase
              .from('expenses_legacy')
              .delete()
              .eq('id', id)
              .eq('user_id', userId);
            
            if (error) console.error('Error deleting expense:', error);
          }
        }
      },

      toggleExpensePaid: (id) => {
        set((state) => ({
          expenses: state.expenses.map((exp) => {
            if (exp.id === id) {
              return {
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
              };
            }
            return exp;
          }),
        }));

        if (isSupabaseEnabled()) {
          get().syncToSupabase().catch(console.error);
        }
      },

      addActualExpense: (expenseId, actualExpenseData) => {
        set((state) => ({
          expenses: state.expenses.map((exp) => {
            if (exp.id === expenseId) {
              return {
                ...exp,
                actualExpenses: [
                  ...(exp.actualExpenses || []),
                  actualExpenseData,
                ],
              };
            }
            return exp;
          }),
        }));
      },

      updateSettings: async (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
        
        if (isSupabaseEnabled()) {
          await get().syncSettings().catch(console.error);
        }
      },

      loadSettings: async () => {
        if (!isSupabaseEnabled() || !supabase) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (profile) {
            set((state) => ({
              settings: {
                currency: profile.currency || 'RUB',
                locale: profile.locale || 'ru-RU',
                theme: profile.theme || 'dark-neon',
                notifications: profile.notifications ?? true,
                defaultMonth: profile.default_month || 'current',
              },
            }));
          } else {
            // Create profile if doesn't exist
            await supabase.from('profiles').insert({
              id: userId,
              user_id: userId,
              currency: get().settings.currency,
              locale: get().settings.locale,
              theme: get().settings.theme,
              notifications: get().settings.notifications,
              default_month: get().settings.defaultMonth,
            }).catch((error) => {
              console.error('Error loading settings:', error);
            });
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      },

      syncSettings: async () => {
        if (!isSupabaseEnabled() || !supabase) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        try {
          const settings = get().settings;
          const { error } = await supabase
            .from('profiles')
            .upsert({
              user_id: userId,
              currency: settings.currency,
              locale: settings.locale,
              theme: settings.theme,
              notifications: settings.notifications,
              default_month: settings.defaultMonth,
            }, { onConflict: 'user_id' });

          if (error) console.error('Error syncing settings:', error);
        } catch (error) {
          console.error('Error syncing settings:', error);
        }
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
          settings: { ...data.settings, ...get().settings },
          currentMonth: data.currentMonth || getCurrentMonth(),
        });
      },

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
        return calculateTotalExpenses(expenses, year, month);
      },

      syncToSupabase: async () => {
        if (!isSupabaseEnabled() || !supabase) {
          console.warn('Supabase not configured, skipping sync');
          return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
          console.warn('No user ID, skipping sync');
          return;
        }

        set({ isSyncing: true });

        try {
          const { income, expenses } = get();
          
          if (income.length > 0) {
            const incomeData = income.map(inc => ({
              id: inc.id,
              user_id: userId,
              name: inc.name,
              amount: inc.amount,
              day_of_month: inc.dayOfMonth,
              frequency: inc.frequency || 'monthly',
              received: inc.received || false,
              received_date: inc.receivedDate || null,
              target_month: inc.targetMonth || null,
              target_year: inc.targetYear || null,
              notes: inc.notes || null,
              is_transfer: inc.isTransfer ?? false,
              transfer_type: inc.transferType ?? null,
            }));

            const { error: incomeError } = await supabase
              .from('income_legacy')
              .upsert(incomeData);

            if (incomeError) console.error('Error syncing income:', incomeError);
          }

          if (expenses.length > 0) {
            const expensesData = expenses.map(exp => ({
              id: exp.id,
              user_id: userId,
              name: exp.name,
              amount: exp.amount,
              category: exp.category,
              day_of_month: exp.dayOfMonth,
              frequency: exp.frequency || 'monthly',
              is_paid: exp.isPaid || false,
              is_required: exp.isRequired || false,
              target_month: exp.targetMonth || null,
              target_year: exp.targetYear || null,
              notes: exp.notes || null,
              is_transfer: exp.isTransfer ?? false,
              transfer_type: exp.transferType ?? null,
            }));

            const { error: expensesError } = await supabase
              .from('expenses_legacy')
              .upsert(expensesData);

            if (expensesError) console.error('Error syncing expenses:', expensesError);
          }
        } catch (error) {
          console.error('Error during sync:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncFromSupabase: async () => {
        if (!isSupabaseEnabled() || !supabase) {
          console.warn('Supabase not configured, skipping sync');
          return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
          console.warn('No user ID, skipping sync');
          return;
        }

        set({ isSyncing: true });

        try {
          const { data: incomeData, error: incomeError } = await supabase
            .from('income_legacy')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

          if (incomeError) console.error('Error loading income:', incomeError);

          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses_legacy')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

          if (expensesError) console.error('Error loading expenses:', expensesError);

          const income: Income[] = (incomeData || []).map(inc => ({
            id: inc.id,
            name: inc.name,
            amount: Number(inc.amount),
            dayOfMonth: inc.day_of_month,
            frequency: inc.frequency as any,
            received: inc.received,
            receivedDate: inc.received_date,
            targetMonth: inc.target_month,
            targetYear: inc.target_year,
            notes: inc.notes || undefined,
            isTransfer: inc.is_transfer || undefined,
            transferType: inc.transfer_type || undefined,
            createdAt: inc.created_at,
          }));

          const expenses: Expense[] = (expensesData || []).map(exp => ({
            id: exp.id,
            name: exp.name,
            amount: Number(exp.amount),
            category: exp.category as any,
            dayOfMonth: exp.day_of_month,
            frequency: exp.frequency as any,
            isPaid: exp.is_paid,
            isRequired: exp.is_required,
            targetMonth: exp.target_month,
            targetYear: exp.target_year,
            notes: exp.notes || undefined,
            isTransfer: exp.is_transfer || undefined,
            transferType: exp.transfer_type || undefined,
            history: [],
            createdAt: exp.created_at,
          }));

          set({ income, expenses });
        } catch (error) {
          console.error('Error during sync from Supabase:', error);
        } finally {
          set({ isSyncing: false });
        }
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
