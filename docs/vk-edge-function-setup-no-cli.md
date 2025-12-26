# Настройка VK OAuth через Supabase Edge Functions (БЕЗ CLI)

## ✅ Что уже сделано в коде:

1. ✅ Создана Edge Function: `supabase/functions/vk-auth/index.ts`
2. ✅ Добавлена функция `signInWithVK` в `src/lib/supabase.ts`
3. ✅ Создан компонент `VKAuth` в `src/components/auth/VKAuth.tsx`
4. ✅ Интегрирован VKAuth в `AuthDialog`

## 📋 Настройка через Supabase Dashboard (БЕЗ CLI):

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите: https://supabase.com/dashboard/project/yzdpqzjwqxzictfhcehk
2. Войдите в свой аккаунт

### Шаг 2: Создайте Edge Function через веб-интерфейс

1. В левом меню найдите раздел **"Edge Functions"** (или **"Functions"**)
2. Нажмите **"Create a new function"** или **"New Function"**
3. Введите имя функции: `vk-auth`
4. Выберите шаблон: **"HTTP Request"** или **"Blank"**

### Шаг 3: Скопируйте код функции

Откройте файл `supabase/functions/vk-auth/index.ts` из репозитория и скопируйте весь код в редактор функции в Dashboard.

**Или скопируйте отсюда:**

```typescript
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
      // Пользователь существует - обновляем метаданные
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
      
      // Генерируем токены для существующего пользователя через generateLink
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: existingUser.email!,
      })
      
      if (linkError) throw linkError
      
      // Используем токены из properties
      accessToken = linkData.properties.access_token
      refreshToken = linkData.properties.refresh_token || ''
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
      
      // Генерируем токены для нового пользователя через generateLink
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })
      
      if (linkError) throw linkError
      
      // Используем токены из properties
      accessToken = linkData.properties.access_token
      refreshToken = linkData.properties.refresh_token || ''
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
```

### Шаг 4: Настройте переменные окружения

1. В редакторе функции найдите раздел **"Secrets"** или **"Environment Variables"**
2. Добавьте секрет:
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Ваш Service Role Key (см. Шаг 5)

**Примечание:** `SUPABASE_URL` уже доступен автоматически, его не нужно добавлять.

### Шаг 5: Получите Service Role Key

1. В Supabase Dashboard перейдите: **Settings** → **API**
2. Найдите раздел **"Project API keys"**
3. Скопируйте **"service_role"** ключ (⚠️ секретный ключ!)
4. Вставьте его в секреты функции (Шаг 4)

### Шаг 6: Сохраните и деплойте функцию

1. Нажмите **"Save"** или **"Deploy"** в редакторе функции
2. Дождитесь успешного деплоя
3. Функция будет доступна по адресу:
   ```
   https://yzdpqzjwqxzictfhcehk.supabase.co/functions/v1/vk-auth
   ```

### Шаг 7: Проверьте работу

1. Откройте приложение
2. Нажмите "Войти"
3. Должен появиться виджет VK ID
4. Попробуйте войти через VK

## 🔧 Альтернативный способ: Через REST API

Если веб-интерфейс не работает, можно использовать REST API Supabase:

### 1. Получите Access Token

1. В Supabase Dashboard: **Settings** → **API**
2. Скопируйте **"anon"** или **"service_role"** ключ

### 2. Создайте функцию через API

```bash
curl -X POST \
  'https://api.supabase.com/v1/projects/yzdpqzjwqxzictfhcehk/functions' \
  -H 'Authorization: Bearer ваш_access_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "vk-auth",
    "body": "код_функции_из_файла"
  }'
```

Но проще использовать веб-интерфейс Dashboard.

## 🔧 Отладка

Если что-то не работает:

1. **Проверьте логи функции:**
   - В Dashboard: **Edge Functions** → **vk-auth** → **Logs**

2. **Проверьте переменные окружения:**
   - В Dashboard: **Edge Functions** → **vk-auth** → **Settings** → **Secrets**

3. **Проверьте консоль браузера** на наличие ошибок

4. **Проверьте Network tab** в DevTools - должен быть запрос к `/functions/v1/vk-auth`

## 📝 Примечания

- Edge Function использует **Service Role Key** для создания пользователей в Supabase
- VK токен обменивается на сессию Supabase через Edge Function
- Все данные пользователя сохраняются в `user_metadata`
- Email генерируется автоматически, если VK не предоставил его

## 🔒 Безопасность

- Service Role Key должен храниться только в секретах Supabase
- Никогда не коммитьте Service Role Key в git
- Edge Function проверяет валидность VK токена через VK API

