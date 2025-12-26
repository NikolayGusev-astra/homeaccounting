'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, signInWithVK } from '@/lib/supabase'

declare global {
  interface Window {
    VKIDSDK?: any
  }
}

export default function AuthCallback() {
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
        fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
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
          fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
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
          fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
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
          
          // Обмениваем code на токен через VK ID SDK
          const VKID = window.VKIDSDK
          // Пытаемся получить device_id из localStorage или используем дефолтный
          // Если device_id не найден, VK может вернуть ошибку, но попробуем
          const deviceId = localStorage.getItem('vk_device_id') || 'vk-device-id'
          
          try {
            const vkTokenData = await VKID.Auth.exchangeCode(vkCode, deviceId)
            // #region agent log
            const exchangeLogData = {
              location: 'auth/callback/page.tsx:80',
              message: 'VK code exchange success',
              data: {
                origin: window.location.origin,
                hasToken: !!vkTokenData?.token || !!vkTokenData?.access_token,
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'vk-auth-debug',
                hypothesisId: 'D'
              },
              timestamp: Date.now()
            };
            fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
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
              fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
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
              location: 'auth/callback/page.tsx:110',
              message: 'VK code exchange error',
              data: {
                origin: window.location.origin,
                error: error.message || String(error),
                errorStack: error.stack?.substring(0, 200),
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'vk-auth-debug',
                hypothesisId: 'F'
              },
              timestamp: Date.now()
            };
            fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(exchangeErrorLogData)
            }).catch(() => {});
            // #endregion agent log
            console.error('VK code exchange error:', error)
            setStatus('error')
            setMessage(`Ошибка обмена кода VK: ${error.message || 'Неизвестная ошибка'}`)
            setTimeout(() => router.push('/'), 3000)
            return
          }
        }
        
        // Обработка стандартного OAuth callback (Google, GitHub через Supabase)
        const { data, error } = await supabase?.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
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
        console.error('Unexpected error:', error)
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

