import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Sync will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Получить текущего пользователя через Supabase Auth (async)
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return getCurrentUserIdSync()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      // Fallback на localStorage для обратной совместимости
      return getCurrentUserIdSync()
    }
    
    return user.id
  } catch (error) {
    console.error('Error getting current user:', error)
    // Fallback на localStorage
    return getCurrentUserIdSync()
  }
}

// Синхронная версия (для обратной совместимости)
export function getCurrentUserIdSync(): string | null {
  if (typeof window === 'undefined') return null
  
  // Пытаемся получить из сессии (если уже загружена)
  if (supabase) {
    const session = supabase.auth.session
    if (session?.user) {
      return session.user.id
    }
  }
  
  // Fallback на localStorage
  return localStorage.getItem('supabase_user_id')
}

// OAuth функции
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  return { data, error }
}

export async function signInWithGitHub() {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  return { data, error }
}

export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  if (!supabase) return { user: null, error: null }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Проверка доступности Supabase
export function isSupabaseEnabled(): boolean {
  return supabase !== null && !!supabaseUrl && !!supabaseAnonKey
}

