'use client'

import { useState } from 'react'
import { supabase, signInWithGoogle, signInWithGitHub } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setMessage('Заполните все поля')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase!.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Проверьте email для подтверждения регистрации')
        setMessageType('success')
        setTimeout(() => {
          setIsSignUp(false)
          setMessage('')
        }, 3000)
      } else {
        const { error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onOpenChange(false)
      }
    } catch (error: any) {
      setMessage(error.message || 'Ошибка авторизации')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      // Редирект произойдет автоматически
    } catch (error: any) {
      setMessage(error.message || 'Ошибка входа через Google')
      setMessageType('error')
      setLoading(false)
    }
  }

  const handleGitHubAuth = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { error } = await signInWithGitHub()
      if (error) throw error
      // Редирект произойдет автоматически
    } catch (error: any) {
      setMessage(error.message || 'Ошибка входа через GitHub')
      setMessageType('error')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-cyan-500/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 text-xl">
            {isSignUp ? 'Регистрация' : 'Вход в систему'}
          </DialogTitle>
          <DialogDescription className="text-cyan-500/60">
            Выберите способ входа или зарегистрируйтесь
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* OAuth кнопки */}
          <div className="space-y-2">
            <Button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Войти через Google
            </Button>
            
            <Button
              onClick={handleGitHubAuth}
              disabled={loading}
              className="w-full bg-gray-800 text-white hover:bg-gray-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23 1.957-.538 4.064-.538 6.021 0 2.293-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              Войти через GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-cyan-500/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0d0d14] px-2 text-cyan-500/60">или</span>
            </div>
          </div>

          {/* Email/Password форма */}
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0a0a0f] border-cyan-500/30 text-cyan-400"
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0a0a0f] border-cyan-500/30 text-cyan-400"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleEmailAuth()
                }
              }}
            />
            <Button
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                isSignUp ? 'Зарегистрироваться' : 'Войти'
              )}
            </Button>
          </div>

          {/* Сообщения */}
          {message && (
            <div className={`text-sm p-3 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-pink-500/20 text-pink-400'
            }`}>
              {message}
            </div>
          )}

          {/* Переключение регистрация/вход */}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300 w-full text-center"
            disabled={loading}
          >
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

