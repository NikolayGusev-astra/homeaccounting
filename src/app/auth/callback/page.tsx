'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, signInWithVK } from '@/lib/supabase'

declare global {
  interface Window {
    VKIDSDK?: any
  }
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Обработка авторизации...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // #region agent log
        const callbackLogData = {
          location: 'auth/callback/page.tsx:13',
          message: 'Auth callback page load',
          data: {
            origin: window.location.origin,
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            search: window.location.search,
            hasCode: !!searchParams.get('code'),
            hasState: !!searchParams.get('state'),
            hasError: !!searchParams.get('error'),
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'vk-auth-debug',
            hypothesisId: 'A'
          },
          timestamp: Date.now()
        };
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(callbackLogData)
        }).catch(() => {});
        // #endregion agent log
        
        // Проверяем, есть ли параметры VK OAuth в URL
        const vkCode = searchParams.get('code')
        const vkState = searchParams.get('state')
        const vkError = searchParams.get('error')
        
        // Если есть ошибка от VK
        if (vkError) {
          // #region agent log
          const errorLogData = {
            location: 'auth/callback/page.tsx:30',
            message: 'VK OAuth error in URL',
            data: {
              origin: window.location.origin,
              error: vkError,
              errorDescription: searchParams.get('error_description'),
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'vk-auth-debug',
              hypothesisId: 'B'
            },
            timestamp: Date.now()
          };
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorLogData)
          }).catch(() => {});
          // #endregion agent log
          setStatus('error')
          setMessage(`Ошибка VK авторизации: ${vkError}`)
          setTimeout(() => router.push('/'), 3000)
          return
        }
        
        // Если есть code от VK OAuth, обрабатываем его
        if (vkCode && vkState) {
          // #region agent log
          const vkCodeLogData = {
            location: 'auth/callback/page.tsx:50',
            message: 'VK OAuth code received',
            data: {
              origin: window.location.origin,
              hasCode: true,
              hasState: true,
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'vk-auth-debug',
              hypothesisId: 'C'
            },
            timestamp: Date.now()
          };
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vkCodeLogData)
          }).catch(() => {});
          // #endregion agent log
          
          // Загружаем VK ID SDK если еще не загружен
          if (!window.VKIDSDK) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script')
              script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js'
              script.async = true
              script.onload = () => {
                if (window.VKIDSDK) {
                  resolve(true)
                } else {
                  reject(new Error('VK ID SDK не загрузился'))
                }
              }
              script.onerror = reject
              document.head.appendChild(script)
            })
          }
          
          // Инициализируем VK ID SDK Config перед обменом кода
          const VKID = window.VKIDSDK
          
          // Определяем redirectUrl в зависимости от окружения
          const getRedirectUrl = () => {
            const origin = window.location.origin
            if (origin.includes('homeaccounting.ru')) {
              return 'https://homeaccounting.ru/auth/callback'
            }
            if (origin.includes('homeaccounting.online')) {
              return 'https://homeaccounting.online/auth/callback'
            }
            if (origin.includes('vercel.app')) {
              return 'https://homeaccounting.vercel.app/auth/callback'
            }
            return `${origin}/auth/callback`
          }
          
          const redirectUrl = getRedirectUrl()
          
          // Инициализируем Config с теми же параметрами, что и в VKAuth
          VKID.Config.init({
            app: 54409028, // VK App ID
            redirectUrl: redirectUrl,
            responseMode: VKID.ConfigResponseMode.Callback,
            source: VKID.ConfigSource.LOWCODE,
            scope: '',
          })
          
          // Генерируем или получаем device_id
          // VK ID SDK требует device_id для обмена кода на токен
          let deviceId = localStorage.getItem('vk_device_id')
          if (!deviceId) {
            // Генерируем новый device_id если его нет
            // Формат device_id для VK ID: обычно это UUID или строка вида "vk-device-{random}"
            deviceId = `vk-device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
            localStorage.setItem('vk_device_id', deviceId)
          }
          
          // #region agent log
          const deviceIdLogData = {
            location: 'auth/callback/page.tsx:155',
            message: 'VK device_id handling',
            data: {
              origin: window.location.origin,
              hasDeviceId: !!deviceId,
              deviceIdSource: localStorage.getItem('vk_device_id') ? 'localStorage' : 'generated',
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'vk-auth-debug',
              hypothesisId: 'G'
            },
            timestamp: Date.now()
          };
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceIdLogData)
          }).catch(() => {});
          // #endregion agent log
          
          try {
            // #region agent log
            const beforeExchangeLogData = {
              location: 'auth/callback/page.tsx:175',
              message: 'Before VK code exchange',
              data: {
                origin: window.location.origin,
                hasCode: !!vkCode,
                hasDeviceId: !!deviceId,
                codeLength: vkCode?.length || 0,
                deviceIdLength: deviceId?.length || 0,
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'vk-auth-debug',
                hypothesisId: 'H'
              },
              timestamp: Date.now()
            };
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(beforeExchangeLogData)
            }).catch(() => {});
            // #endregion agent log
            
            const vkTokenData = await VKID.Auth.exchangeCode(vkCode, deviceId)
            
            // #region agent log
            const exchangeLogData = {
              location: 'auth/callback/page.tsx:195',
              message: 'VK code exchange success',
              data: {
                origin: window.location.origin,
                hasToken: !!vkTokenData?.token || !!vkTokenData?.access_token,
                tokenDataKeys: vkTokenData ? Object.keys(vkTokenData) : [],
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'vk-auth-debug',
                hypothesisId: 'D'
              },
              timestamp: Date.now()
            };
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(exchangeLogData)
            }).catch(() => {});
            // #endregion agent log
            
            // Используем токен для авторизации через Supabase
            const token = vkTokenData?.token || vkTokenData?.access_token || vkTokenData?.accessToken
            if (!token) {
              throw new Error('Токен VK не получен после обмена code')
            }
            
            const { data: vkAuthData, error: vkAuthError } = await signInWithVK(token, vkTokenData)
            
            if (vkAuthError) {
              // #region agent log
              const vkAuthErrorLogData = {
                location: 'auth/callback/page.tsx:95',
                message: 'VK signInWithVK error',
                data: {
                  origin: window.location.origin,
                  error: vkAuthError.message || String(vkAuthError),
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'vk-auth-debug',
                  hypothesisId: 'E'
                },
                timestamp: Date.now()
              };
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vkAuthErrorLogData)
              }).catch(() => {});
              // #endregion agent log
              throw vkAuthError
            }
            
            setStatus('success')
            setMessage('Авторизация через VK успешна! Перенаправление...')
            
            // Перенаправляем на главную страницу
            setTimeout(() => {
              router.push('/')
              router.refresh()
            }, 1000)
            return
          } catch (error: any) {
            // #region agent log
            const exchangeErrorLogData = {
              location: 'auth/callback/page.tsx:225',
              message: 'VK code exchange error',
              data: {
                origin: window.location.origin,
                error: error.message || String(error),
                errorName: error.name,
                errorStack: error.stack?.substring(0, 500),
                errorCode: error.code,
                errorDetails: error.details || error.data,
                hasCode: !!vkCode,
                hasDeviceId: !!deviceId,
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'vk-auth-debug',
                hypothesisId: 'F'
              },
              timestamp: Date.now()
            };
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(exchangeErrorLogData)
            }).catch(() => {});
            // #endregion agent log
              message: error.message,
              name: error.name,
              code: error.code,
              details: error.details || error.data,
              stack: error.stack
            })
            setStatus('error')
            setMessage(`Ошибка обмена кода VK: ${error.message || 'Неизвестная ошибка'}`)
            setTimeout(() => router.push('/'), 3000)
            return
          }
        }
        
        // Обработка стандартного OAuth callback (Google, GitHub через Supabase)
        const { data, error } = await supabase?.auth.getSession()
        
        if (error) {
          setStatus('error')
          setMessage(`Ошибка авторизации: ${error.message}`)
          setTimeout(() => router.push('/'), 3000)
          return
        }

        if (data?.session) {
          setStatus('success')
          setMessage('Авторизация успешна! Перенаправление...')
          
          // Перенаправляем на главную страницу
          setTimeout(() => {
            router.push('/')
            router.refresh()
          }, 1000)
        } else {
          setStatus('error')
          setMessage('Сессия не найдена')
          setTimeout(() => router.push('/'), 3000)
        }
      } catch (error: any) {
        setStatus('error')
        setMessage(`Неожиданная ошибка: ${error.message}`)
        setTimeout(() => router.push('/'), 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-cyan-400 text-xl font-bold">
          {status === 'loading' && '⏳ '}
          {status === 'success' && '✅ '}
          {status === 'error' && '❌ '}
          {message}
        </div>
        {status === 'loading' && (
          <div className="text-cyan-500/60 text-sm">
            Пожалуйста, подождите...
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-cyan-400 text-xl font-bold">
            ⏳ Загрузка...
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

