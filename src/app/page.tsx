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
    // #region agent log
    const pageLoadStartTime = performance.timing ? performance.timing.navigationStart : Date.now();
    const logData = {
      location: 'page.tsx:13',
      message: 'Home component mount',
      data: {
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        pathname: window.location.pathname,
        supabaseEnabled: isSupabaseEnabled(),
        hasSynced: hasSyncedRef.current,
        userAgent: navigator.userAgent.substring(0, 100),
        performanceTiming: performance.timing ? {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - pageLoadStartTime,
          loadComplete: performance.timing.loadEventEnd - pageLoadStartTime,
          domInteractive: performance.timing.domInteractive - pageLoadStartTime
        } : null,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'domain-comparison',
        hypothesisId: 'A'
      },
      timestamp: Date.now()
    };
    fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {});
    
    // Логируем ошибки из консоли
    const originalError = console.error;
    console.error = function(...args) {
      const errorLogData = {
        location: 'page.tsx:console.error',
        message: 'Console error captured',
        data: {
          origin: window.location.origin,
          hostname: window.location.hostname,
          error: args.map(a => String(a)).join(' '),
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'domain-comparison',
          hypothesisId: 'H'
        },
        timestamp: Date.now()
      };
      fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLogData)
      }).catch(() => {});
      originalError.apply(console, args);
    };
    
    // Логируем загрузку ресурсов
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      const resourceLogData = {
        location: 'page.tsx:performance.resources',
        message: 'Resource loading stats',
        data: {
          origin: window.location.origin,
          hostname: window.location.hostname,
          resourceCount: resources.length,
          resources: resources.slice(0, 10).map(r => ({
            name: r.name.substring(0, 100),
            duration: r.duration,
            size: (r as any).transferSize || 0
          })),
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'domain-comparison',
          hypothesisId: 'I'
        },
        timestamp: Date.now()
      };
      fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceLogData)
      }).catch(() => {});
    }
    // #endregion agent log
    
    // Автоматическая загрузка данных из Supabase при первом запуске
    // Загружаем всегда, чтобы синхронизировать данные между устройствами
    if (isSupabaseEnabled() && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      const syncStartTime = Date.now();
      syncFromSupabase()
        .then(() => {
          // #region agent log
          const syncLogData = {
            location: 'page.tsx:25',
            message: 'Supabase sync success',
            data: {
              origin: window.location.origin,
              hostname: window.location.hostname,
              syncDuration: Date.now() - syncStartTime,
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'domain-comparison',
              hypothesisId: 'B'
            },
            timestamp: Date.now()
          };
          fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncLogData)
          }).catch(() => {});
          // #endregion agent log
          console.log('Данные успешно загружены из Supabase');
        })
        .catch((error) => {
          // #region agent log
          const errorLogData = {
            location: 'page.tsx:30',
            message: 'Supabase sync error',
            data: {
              origin: window.location.origin,
              hostname: window.location.hostname,
              error: error.message || String(error),
              errorStack: error.stack?.substring(0, 200),
              syncDuration: Date.now() - syncStartTime,
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'domain-comparison',
              hypothesisId: 'C'
            },
            timestamp: Date.now()
          };
          fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorLogData)
          }).catch(() => {});
          // #endregion agent log
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
