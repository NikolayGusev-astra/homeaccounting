'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Обработка авторизации...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Обработка OAuth callback
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
  }, [router])

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

