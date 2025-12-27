// Transaction types

export interface Transaction {
  id: string;
  user_id: string;
  schedule_id?: string | null; // null = one-time transaction
  date: string;            // ISO date format: YYYY-MM-DD
  amount: number;
  currency: 'RUB' | 'USD' | 'EUR';
  direction: 'income' | 'expense';
  description?: string;
  is_generated: boolean; // true = from Schedule, false = manual
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
}

export interface TransactionFilter {
  startDate?: string;      // ISO date
  endDate?: string;        // ISO date
  scheduleId?: string | null;
  direction?: 'income' | 'expense' | 'all';
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>;
