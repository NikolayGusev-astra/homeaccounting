'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '@/types/budget';
import { generateId } from '@/lib/utils';

interface AccountStore {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
  recalculateAllBalances: () => void;
}

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString();
};

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],

      addAccount: (accountData) => {
        const newAccount: Account = {
          ...accountData,
          id: generateId(),
          createdAt: getCurrentDate(),
        };
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === id ? { ...acc, ...updates, updatedAt: getCurrentDate() } : acc
          ),
        }));
      },

      deleteAccount: (id) => {
        set((state) => ({ accounts: state.accounts.filter((acc) => acc.id !== id) }));
      },

      getAccountBalance: (accountId) => {
        const account = get().accounts.find(acc => acc.id === accountId);
        return account ? account.balance : 0;
      },

      recalculateAllBalances: () => {
        // TODO: Implement balance recalculation logic based on transactions
        // For now, balances are managed manually
        console.log('Balances recalculation triggered');
      },
    }),
    {
      name: 'account-storage',
      partialize: (state) => ({
        accounts: state.accounts,
      }),
    }
  )
);
