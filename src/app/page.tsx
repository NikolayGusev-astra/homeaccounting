'use client';

import { useEffect, useRef } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { isSupabaseEnabled } from '@/lib/supabase';
import DashboardLayout from '@/components/budget/DashboardLayout';

export default function Home() {
  const { syncFromSupabase } = useBudgetStore();
  const hasSyncedRef = useRef(false);
  const syncIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Автоматическая загрузка данных из Supabase при первом запуске
    // Загружаем всегда, чтобы синхронизировать данные между устройствами
    if (isSupabaseEnabled() && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      syncFromSupabase()
        .then(() => {
          console.log('Supabase sync successful');
        })
        .catch((error) => {
          console.error('Supabase sync error:', error);
          hasSyncedRef.current = false; // Позволяем повторить попытку
        });
    }

    // Синхронизация при возврате фокуса на окно (когда пользователь возвращается на вкладку)
    const handleVisibilityChange = () => {
      if (isSupabaseEnabled() && document.visibilityState === 'visible') {
        syncFromSupabase()
          .then(() => {
            console.log('Sync completed on visibility change');
          })
          .catch((error) => {
            console.error('Sync error on visibility change:', error);
          });
      }
    };

    // Периодическая синхронизация каждые 30 секунд (если окно видимо)
    const startPeriodicSync = () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      if (isSupabaseEnabled()) {
        syncIntervalRef.current = setInterval(() => {
          if (document.visibilityState === 'visible') {
            syncFromSupabase()
              .then(() => {
                console.log('Periodic sync completed');
              })
              .catch((error) => {
                console.error('Periodic sync error:', error);
              });
          }
        }, 30000); // 30 секунд
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPeriodicSync();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncFromSupabase]);

  return <DashboardLayout />;
}
