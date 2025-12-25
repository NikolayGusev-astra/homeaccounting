/**
 * Financial Math Utilities
 * 
 * Provides calculations for:
 * - Debit card interest
 * - Credit card grace period
 * - Installment schedule generation
 */

import type { AccountType } from '@/types/budget';

/**
 * Calculate debit card interest
 * Formula: balance * rate * (days / days_in_year)
 */
export function calculateDebitCardInterest(
  balance: number,
  rate: number,
  days: number = 30
): number {
  if (rate <= 0 || balance <= 0) return 0;
  
  const daysInYear = 365;
  const interest = balance * (rate / 100) * (days / daysInYear);
  
  return interest;
}

/**
 * Calculate credit card grace period end date
 */
export function calculateGracePeriod(
  lastPaymentDate: string,
  graceDays: number
): Date {
  const lastDate = new Date(lastPaymentDate);
  const endDate = new Date(lastDate);
  endDate.setDate(lastDate.getDate() + graceDays);
  
  return endDate;
}

/**
 * Check if credit card is within grace period
 */
export function isWithinGracePeriod(
  lastPaymentDate: string,
  graceDays: number,
  currentDate: Date = new Date()
): boolean {
  const graceEndDate = calculateGracePeriod(lastPaymentDate, graceDays);
  return currentDate <= graceEndDate;
}

/**
 * Generate installment payment schedule
 */
export function generateInstallmentSchedule(
  totalAmount: number,
  months: number,
  startDate: Date
): {
  payments: Array<{
    date: string;
    amount: number;
    paid: boolean;
  }>;
  monthlyAmount: number;
} {
  const payments = Array<{
    date: string;
    amount: number;
    paid: boolean;
  }>([]);
  const monthlyAmount = totalAmount / months;
  
  for (let i = 0; i < months; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i);
    paymentDate.setDate(startDate.getDate());
    
    payments.push({
      date: paymentDate.toISOString(),
      amount: monthlyAmount,
      paid: false,
    });
  }
  
  return {
    payments,
    monthlyAmount,
  };
}

/**
 * Calculate credit card minimum payment
 */
export function calculateMinimumPayment(
  balance: number,
  percent: number
): number {
  if (percent <= 0 || balance <= 0) return 0;
  
  return (balance * percent) / 100;
}

/**
 * Calculate credit card recommended payment
 * For grace period: full balance
 */
export function calculateRecommendedPayment(balance: number): number {
  if (balance <= 0) return 0;
  
  return balance;
}
