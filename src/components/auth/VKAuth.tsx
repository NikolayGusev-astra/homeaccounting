'use client'

import { useEffect, useRef, useState } from 'react'

interface VKAuthProps {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  containerId?: string
}

declare global {
  interface Window {
    VKIDSDK?: any
  }
}

export function VKAuth({ onSuccess, onError, containerId = 'vkid-container' }: VKAuthProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Загружаем VK ID SDK только на клиенте
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') {
      return
    }

    // Проверяем, не загружен ли уже SDK
    if (window.VKIDSDK) {
      setSdkLoaded(true)
      return
    }

    // Проверяем, не добавлен ли уже script тег
    const existingScript = document.querySelector('script[src*="@vkid/sdk"]')
    if (existingScript) {
      // Ждем загрузки SDK
      const checkInterval = setInterval(() => {
        if (window.VKIDSDK) {
          setSdkLoaded(true)
          clearInterval(checkInterval)
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    // Создаем и добавляем script тег
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js'
    script.async = true
    const scriptLoadStartTime = Date.now();
    script.onload = () => {
      // #region agent log
      const scriptLoadLogData = {
        location: 'VKAuth.tsx:57',
        message: 'VK SDK script loaded',
        data: {
          origin: window.location.origin,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          loadDuration: Date.now() - scriptLoadStartTime,
          sdkAvailable: !!window.VKIDSDK,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'domain-comparison',
          hypothesisId: 'E'
        },
        timestamp: Date.now()
      };
      fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptLoadLogData)
      }).catch(() => {});
      // #endregion agent log
      if (window.VKIDSDK) {
        setSdkLoaded(true)
        window.dispatchEvent(new Event('vkid-sdk-loaded'))
      }
    }
    script.onerror = (e) => {
      // #region agent log
      const scriptErrorLogData = {
        location: 'VKAuth.tsx:63',
        message: 'VK SDK script load error',
        data: {
          origin: window.location.origin,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          loadDuration: Date.now() - scriptLoadStartTime,
          error: String(e),
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'domain-comparison',
          hypothesisId: 'F'
        },
        timestamp: Date.now()
      };
      fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scriptErrorLogData)
      }).catch(() => {});
      // #endregion agent log
      const errorMsg = 'VK ID SDK не загрузился. Проверьте подключение к интернету.'
      console.error('VK ID SDK failed to load:', e)
      setError(errorMsg)
      onError?.(new Error(errorMsg))
    }
    
    document.head.appendChild(script)

    return () => {
      // Не удаляем скрипт, так как он может использоваться другими компонентами
    }
  }, [isClient, onError])

  // Инициализируем виджет VK ID
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') {
      return
    }

    if (!sdkLoaded || !window.VKIDSDK || initializedRef.current || !containerRef.current) {
      return
    }

    const VKID = window.VKIDSDK

    try {
      console.log('Initializing VK ID SDK...')
      
      // Определяем redirectUrl в зависимости от окружения
      const getRedirectUrl = () => {
        if (typeof window === 'undefined') {
          return 'https://homeaccounting.ru'
        }
        const origin = window.location.origin
        // Для основного домена используем homeaccounting.ru
        if (origin.includes('homeaccounting.ru')) {
          return 'https://homeaccounting.ru/auth/callback'
        }
        // Для альтернативного домена используем homeaccounting.online
        if (origin.includes('homeaccounting.online')) {
          return 'https://homeaccounting.online/auth/callback'
        }
        // Для Vercel используем vercel.app домен
        if (origin.includes('vercel.app')) {
          return 'https://homeaccounting.vercel.app/auth/callback'
        }
        // Для локальной разработки
        return `${origin}/auth/callback`
      }

      const redirectUrl = getRedirectUrl()
      console.log('VK ID Redirect URL:', redirectUrl)
      
      // #region agent log
      const vkInitLogData = {
        location: 'VKAuth.tsx:114',
        message: 'VK ID initialization',
        data: {
          origin: window.location.origin,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          redirectUrl: redirectUrl,
          sdkLoaded: !!window.VKIDSDK,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'domain-comparison',
          hypothesisId: 'D'
        },
        timestamp: Date.now()
      };
      fetch('http://127.0.0.1:7246/ingest/62f0094b-71f7-4d08-88e9-7f3d97a8eb6c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vkInitLogData)
      }).catch(() => {});
      // #endregion agent log

      // Инициализация конфигурации
      VKID.Config.init({
        app: 54409028, // VK App ID
        redirectUrl: redirectUrl,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '', // Можно добавить нужные scope при необходимости
      })

      console.log('VK ID Config initialized')

      // Создаем виджет OAuthList
      const oAuth = new VKID.OAuthList()
      console.log('VK ID OAuthList created')

      if (containerRef.current) {
        console.log('Rendering VK ID widget in container:', containerRef.current)
        oAuth
          .render({
            container: containerRef.current,
            oauthList: ['vkid', 'ok_ru', 'mail_ru'] as any,
          })
          .on(VKID.WidgetEvents.ERROR, (error: any) => {
            console.error('VK ID Widget Error:', error)
            const errorMsg = `Ошибка виджета VK ID: ${error?.message || 'Неизвестная ошибка'}`
            setError(errorMsg)
            onError?.(error)
          })
          .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, function (payload: any) {
            console.log('VK ID LOGIN_SUCCESS:', payload)
            const code = payload.code
            const deviceId = payload.device_id

            if (!code || !deviceId) {
              const error = new Error('Не получен code или device_id от VK ID')
              console.error(error)
              onError?.(error)
              return
            }

            // Сохраняем device_id для использования в callback
            if (typeof window !== 'undefined') {
              localStorage.setItem('vk_device_id', deviceId)
            }

            // Обмениваем code на токен
            VKID.Auth.exchangeCode(code, deviceId)
              .then((data: any) => {
                console.log('VK ID Exchange Success:', data)
                // VK ID возвращает объект с токеном и данными пользователя
                // Передаем данные в callback
                onSuccess?.(data)
              })
              .catch((error: any) => {
                console.error('VK ID Exchange Error:', error)
                onError?.(error)
              })
          })

        initializedRef.current = true
        console.log('VK ID widget initialized successfully')
      } else {
        console.error('Container ref is null')
        setError('Контейнер для виджета VK ID не найден')
      }
    } catch (error) {
      console.error('VK ID Initialization Error:', error)
      onError?.(error)
    }

    return () => {
      // Cleanup при размонтировании
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      initializedRef.current = false
    }
  }, [sdkLoaded, onSuccess, onError, isClient])

  if (error) {
    return (
      <div className="text-sm text-pink-400 p-2 bg-pink-500/20 rounded">
        {error}
      </div>
    )
  }

  if (!sdkLoaded) {
    return (
      <div className="text-sm text-cyan-500/60 p-2">
        Загрузка VK ID...
      </div>
    )
  }

  return (
    <div 
      id={containerId} 
      ref={containerRef}
      className="w-full min-h-[40px]"
    />
  )
}

