'use client';

import { useEffect, useRef } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { isSupabaseEnabled } from '@/lib/supabase';
import DashboardLayout from '@/components/budget/DashboardLayout';

export default function Home() {
  const { syncFromSupabase } = useBudgetStore();
  const hasSyncedRef = useRef(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Синхронизация при возврате фокуса на окно (когда пользователь возвращается на вкладку)
    const handleVisibilityChange = () => {
      if (isSupabaseEnabled() && document.visibilityState === 'visible') {
        syncFromSupabase()
          .then(() => {
            console.log('Данные синхронизированы при возврате фокуса');
          })
          .catch((error) => {
            console.error('Ошибка синхронизации при возврате фокуса:', error);
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
                console.log('Периодическая синхронизация выполнена');
              })
              .catch((error) => {
                console.error('Ошибка периодической синхронизации:', error);
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
