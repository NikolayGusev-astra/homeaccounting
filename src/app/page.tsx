'use client';

import { useEffect } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { isSupabaseEnabled } from '@/lib/supabase';
import DashboardLayout from '@/components/budget/DashboardLayout';

export default function Home() {
  const { syncFromSupabase, income, expenses } = useBudgetStore();

  useEffect(() => {
    // Автоматическая загрузка данных из Supabase при первом запуске
    if (isSupabaseEnabled() && income.length === 0 && expenses.length === 0) {
      syncFromSupabase().catch(console.error);
    }
  }, []); // Только при монтировании компонента

  return <DashboardLayout />;
}
