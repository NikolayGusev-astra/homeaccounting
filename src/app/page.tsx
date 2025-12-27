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
    fetch('https://log-agent.example.com/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {});
    
    // Логируем ошибки из консоли
    const originalError = console.error;
    console.error = (...args: any[]) => {
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
      fetch('https://log-agent.example.com/log', {
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
      fetch('https://log-agent.example.com/log', {
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
          fetch('https://log-agent.example.com/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncLogData)
          }).catch(() => {});
          // #endregion agent log
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
          fetch('https://log-agent.example.com/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorLogData)
          }).catch(() => {});
          // #endregion agent log
          hasSyncedRef.current = false; // Позволяем повторить попытку
        });
    }

    // Синхронизация при возврате фокуса на окно (когда пользователь возвращается на вкладку)
    const handleVisibilityChange = () => {
      if (isSupabaseEnabled() && document.visibilityState === 'visible') {
        syncFromSupabase()
          .then(() => {
            // #region agent log
            const visibilityLogData = {
              location: 'page.tsx:visibilitychange',
              message: 'Tab visible - sync started',
              data: {
                origin: window.location.origin,
                hostname: window.location.hostname,
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'domain-comparison',
                hypothesisId: 'D'
              },
              timestamp: Date.now()
            };
            fetch('https://log-agent.example.com/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(visibilityLogData)
            }).catch(() => {});
            // #endregion agent log
          })
          .catch((error) => {
            // #region agent log
            const visibilityErrorData = {
              location: 'page.tsx:visibilitychange-error',
              message: 'Tab visible - sync error',
              data: {
                origin: window.location.origin,
                hostname: window.location.hostname,
                error: error.message || String(error),
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'domain-comparison',
                hypothesisId: 'E'
              },
              timestamp: Date.now()
            };
            fetch('https://log-agent.example.com/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(visibilityErrorData)
            }).catch(() => {});
            // #endregion agent log
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
                // #region agent log
                const periodicLogData = {
                  location: 'page.tsx:periodic-sync',
                  message: 'Periodic sync success',
                  data: {
                    origin: window.location.origin,
                    hostname: window.location.hostname,
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'domain-comparison',
                    hypothesisId: 'F'
                  },
                  timestamp: Date.now()
                };
                fetch('https://log-agent.example.com/log', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(periodicLogData)
                }).catch(() => {});
                // #endregion agent log
              })
              .catch((error) => {
                // #region agent log
                const periodicErrorData = {
                  location: 'page.tsx:periodic-sync-error',
                  message: 'Periodic sync error',
                  data: {
                    origin: window.location.origin,
                    hostname: window.location.hostname,
                    error: error.message || String(error),
                    timestamp: Date.now(),
                    sessionId: 'debug-session',
                    runId: 'domain-comparison',
                    hypothesisId: 'G'
                  },
                  timestamp: Date.now()
                };
                fetch('https://log-agent.example.com/log', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(periodicErrorData)
                }).catch(() => {});
                // #endregion agent log
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
