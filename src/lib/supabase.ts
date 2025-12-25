import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Sync will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Получить текущего пользователя (для MVP используем localStorage)
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  
  // Для MVP: используем localStorage
  // Для production: использовать Supabase Auth
  let userId = localStorage.getItem('supabase_user_id')
  
  if (!userId) {
    // Генерируем временный ID для анонимного пользователя
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('supabase_user_id', userId)
  }
  
  return userId
}

// Проверка доступности Supabase
export function isSupabaseEnabled(): boolean {
  return supabase !== null && !!supabaseUrl && !!supabaseAnonKey
}

