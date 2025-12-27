// Transaction types

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  schedule_id?: string | null; // null = one-time transaction
  date: string;            // ISO date format: YYYY-MM-DD
  amount: number;
  currency: 'RUB' | 'USD' | 'EUR';
  direction: 'income' | 'expense';
  description?: string;
  
  // New fields for enhanced functionality
  category?: string;         // Main category (optional)
  subcategory?: string;       // Subcategory for detailed tracking
  is_transfer?: boolean;       // true if this is a transfer
  transfer_type?: string;      // 'to_self' | 'to_family' | 'to_friend'
  recipient?: string;       // Recipient for transfers
  is_credit?: boolean;         // true if this is a credit payment
  credit_kind?: string;        // 'mortgage' | 'consumer_credit' | 'credit_card' | 'auto_loan'
  bank_name?: string;          // Bank name for credits
  interest_rate?: number;      // Interest rate for credits
  credit_limit?: number;       // Credit limit for credit cards
  grace_period?: string;       // Grace period for credit cards (e.g., '30 days')
  
  is_generated: boolean;     // true = from Schedule, false = manual
  created_at: string;        // ISO timestamp
  updated_at: string;        // ISO timestamp
}

export interface TransactionFilter {
  startDate?: string;      // ISO date
  endDate?: string;        // ISO date
  scheduleId?: string | null;
  direction?: 'income' | 'expense' | 'all';
  category?: string;        // Filter by category
  isTransfer?: boolean;     // Filter transfers
  isCredit?: boolean;       // Filter credits
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Additional types for enhanced functionality
export type TransactionCategory = string;
export type ExpenseSubcategoryDetail = string;
export type CreditKind = 'mortgage' | 'consumer_credit' | 'credit_card' | 'auto_loan';
export type TransferKind = 'to_self' | 'to_family' | 'to_friend';
