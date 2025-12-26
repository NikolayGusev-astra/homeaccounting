# Руководство по настройке VK Auth и Supabase

## Проблемы, которые нужно решить

### 1. CORS ошибка от VK API
**Ошибка:** `Access to fetch at 'https://id.vk.ru/vkid_sdk_get_config?app_id=54409028' from origin 'https://homeaccounting.vercel.app' has been blocked by CORS policy`

**Причина:** Домен `https://homeaccounting.vercel.app` (и другие домены) не добавлены в настройки VK приложения как разрешенные источники.

**Решение:**

1. Перейдите в [VK Developer Console](https://dev.vk.com/console)
2. Откройте приложение с ID `54409028`
3. Перейдите в раздел **"Настройки"** → **"Безопасность"**
4. В разделе **"Разрешенные домены"** или **"Redirect URI"** добавьте следующие URL:
   - `https://homeaccounting.vercel.app`
   - `https://homeaccounting.ru`
   - `https://homeaccounting.online`
   - `https://www.homeaccounting.ru` (если используется)
   - `https://www.homeaccounting.online` (если используется)
   - Для локальной разработки: `http://localhost:3000`

5. В разделе **"Callback URL"** или **"Redirect URI"** добавьте:
   - `https://homeaccounting.vercel.app/auth/callback`
   - `https://homeaccounting.ru/auth/callback`
   - `https://homeaccounting.online/auth/callback`
   - `http://localhost:3000/auth/callback` (для локальной разработки)

6. Сохраните изменения и подождите несколько минут для применения настроек

### 2. Настройка Supabase Edge Function

**Требуется:**

1. **Развернуть Edge Function `vk-auth`:**
   ```bash
   # Установите Supabase CLI если еще не установлен
   npm install -g supabase
   
   # Войдите в Supabase
   supabase login
   
   # Свяжите проект с вашим Supabase проектом
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Разверните Edge Function
   supabase functions deploy vk-auth
   ```

2. **Настроить переменные окружения в Supabase:**
   - Перейдите в [Supabase Dashboard](https://app.supabase.com)
   - Откройте ваш проект
   - Перейдите в **Settings** → **Edge Functions** → **Secrets**
   - Добавьте следующие секреты:
     - `SUPABASE_URL` - URL вашего Supabase проекта (например, `https://xxxxx.supabase.co`)
     - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (находится в **Settings** → **API** → **Service Role Key**)

   **Важно:** Service Role Key имеет полный доступ к вашему проекту. Никогда не публикуйте его в клиентском коде!

3. **Проверить, что Edge Function развернута:**
   - В Supabase Dashboard перейдите в **Edge Functions**
   - Убедитесь, что функция `vk-auth` отображается и имеет статус "Active"

### 3. Проверка переменных окружения в Vercel

Убедитесь, что в настройках Vercel проекта установлены следующие переменные окружения:

- `NEXT_PUBLIC_SUPABASE_URL` - URL вашего Supabase проекта
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/Public Key из Supabase (находится в **Settings** → **API** → **Project API keys** → **anon/public**)

### 4. Ошибка 500 на logging endpoint

**Ошибка:** `Failed to load resource: the server responded with a status of 500 (Internal Server Error)` для `http://127.0.0.1:7246/ingest/...`

**Причина:** Это локальный debug-сервер для логирования. Ошибка не влияет на работу приложения, но логи не записываются.

**Решение:** 
- Если debug-сервер не нужен, можно удалить все вызовы `fetch('http://127.0.0.1:7246/...')` из кода
- Если нужен, проверьте, что сервер запущен на порту 7246

## Проверка работоспособности

После настройки:

1. **Проверьте VK настройки:**
   - Откройте `https://homeaccounting.vercel.app` в браузере
   - Откройте консоль разработчика (F12)
   - Проверьте, что нет CORS ошибок при загрузке VK ID SDK

2. **Проверьте Supabase Edge Function:**
   - Попробуйте авторизоваться через VK
   - Проверьте логи Edge Function в Supabase Dashboard
   - Убедитесь, что пользователь создается или обновляется корректно

3. **Проверьте сессию:**
   - После успешной авторизации проверьте, что пользователь авторизован
   - Проверьте, что данные синхронизируются с Supabase

## Дополнительные заметки

- VK App ID: `54409028` (жестко закодирован в коде)
- Redirect URLs настроены динамически в зависимости от домена
- Edge Function использует Service Role Key для создания/обновления пользователей
- Пользователи создаются с email вида `vk_{id}@vk.temp` если email не предоставлен VK

