import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vkToken, vkUserData } = await req.json()
    
    if (!vkToken) {
      throw new Error('VK token is required')
    }
    
    // Получаем данные пользователя из VK API, если не переданы
    let userData = vkUserData
    if (!userData) {
      const vkResponse = await fetch(
        `https://api.vk.com/method/users.get?access_token=${vkToken}&v=5.131&fields=email,photo_200`
      )
      const vkData = await vkResponse.json()
      
      if (!vkData.response || !vkData.response[0]) {
        throw new Error('Не удалось получить данные пользователя VK')
      }
      
      userData = vkData.response[0]
    }
    
    const vkId = userData.id?.toString() || userData.uid?.toString()
    if (!vkId) {
      throw new Error('VK ID не найден в данных пользователя')
    }
    
    const email = userData.email || `vk_${vkId}@vk.temp`
    const displayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.screen_name || `VK User ${vkId}`
    
    // Создаем Supabase клиент с service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Проверяем, существует ли пользователь с таким email
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
    }
    
    const existingUser = existingUsers?.users?.find(u => 
      u.email === email || u.user_metadata?.vk_id === vkId
    )
    
    let userId: string
    let accessToken: string
    let refreshToken: string
    
    if (existingUser) {
      // Пользователь существует - обновляем метаданные и создаем сессию
      userId = existingUser.id
      
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingUser.user_metadata,
          vk_id: vkId,
          vk_token: vkToken,
          full_name: displayName,
          avatar_url: userData.photo_200,
          provider: 'vk',
        }
      })
      
      // Генерируем новую сессию для существующего пользователя
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: existingUser.email!,
      })
      
      if (sessionError) throw sessionError
      
      // Получаем токены из ссылки
      const url = new URL(sessionData.properties.action_link)
      const hash = url.hash.substring(1)
      const params = new URLSearchParams(hash)
      
      // Создаем сессию через API
      const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: existingUser.email!,
        password: `vk_${vkId}_temp`, // Временный пароль для существующих пользователей
      })
      
      // Если не удалось войти с временным паролем, создаем новый
      if (signInError || !session.session) {
        // Генерируем новый пароль и обновляем пользователя
        const newPassword = `vk_${vkId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword
        })
        
        const { data: newSession, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
          email: existingUser.email!,
          password: newPassword,
        })
        
        if (newSignInError || !newSession.session) {
          throw new Error('Не удалось создать сессию для существующего пользователя')
        }
        
        accessToken = newSession.session.access_token
        refreshToken = newSession.session.refresh_token
      } else {
        accessToken = session.session.access_token
        refreshToken = session.session.refresh_token
      }
    } else {
      // Создаем нового пользователя
      const tempPassword = `vk_${vkId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Автоматически подтверждаем email
        user_metadata: {
          vk_id: vkId,
          vk_token: vkToken,
          full_name: displayName,
          avatar_url: userData.photo_200,
          provider: 'vk',
        }
      })
      
      if (createError) throw createError
      if (!newUser.user) throw new Error('User creation failed')
      
      userId = newUser.user.id
      
      // Создаем сессию для нового пользователя
      const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: tempPassword,
      })
      
      if (signInError || !session.session) {
        throw new Error('Не удалось создать сессию для нового пользователя')
      }
      
      accessToken = session.session.access_token
      refreshToken = session.session.refresh_token
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          displayName,
          vkId,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error: any) {
    console.error('VK Auth Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

