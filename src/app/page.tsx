'use client';

import { useEffect, useRef } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { isSupabaseEnabled } from '@/lib/supabase';
import DashboardLayout from '@/components/budget/DashboardLayout';

export default function Home() {
  const { syncFromSupabase } = useBudgetStore();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Автоматическая загрузка данных из Supabase при первом запуске
    // Загружаем всегда, чтобы синхронизировать данные между устройствами
    if (isSupabaseEnabled() && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      syncFromSupabase()
        .then(() => {
          console.log('Данные успешно загружены из Supabase');
        })
        .catch((error) => {
          console.error('Ошибка загрузки данных из Supabase:', error);
          hasSyncedRef.current = false; // Позволяем повторить попытку
        });
    }
  }, [syncFromSupabase]); // Зависимость от syncFromSupabase

  return <DashboardLayout />;
}
