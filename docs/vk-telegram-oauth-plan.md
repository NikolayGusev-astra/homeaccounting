# План: Интеграция VK и Telegram OAuth

## Архитектура решения

Supabase не поддерживает VK и Telegram как встроенные OAuth провайдеры, поэтому используем кастомный подход:

1. **VK**: VK SDK → получение токена → Vercel API route → создание/обновление пользователя в Supabase
2. **Telegram**: Telegram Login Widget → callback → Vercel API route → проверка подписи → создание/обновление пользователя в Supabase

## Файлы для изменения/создания

### 1. Vercel API Routes (новые файлы)

#### `src/app/api/auth/vk/callback/route.ts`
- Обработка callback от VK OAuth
- Получение access_token и user_id
- Создание/обновление пользователя в Supabase через `supabase.auth.admin.createUser()` или кастомную таблицу
- Генерация сессии и редирект

#### `src/app/api/auth/telegram/callback/route.ts`
- Обработка callback от Telegram Login Widget
- Проверка подписи данных (используя токен бота)
- Создание/обновление пользователя в Supabase
- Генерация сессии и редирект

### 2. Обновление существующих файлов

#### `src/lib/supabase.ts`
- Добавить функции `signInWithVK()` и `signInWithTelegram()`
- Эти функции будут открывать OAuth окно/виджет, а не использовать Supabase OAuth напрямую

#### `src/components/auth/AuthDialog.tsx`
- Добавить кнопки "Войти через VK" и "Войти через Telegram"
- Интегрировать VK SDK и Telegram Widget
- Обработка успешной авторизации

#### `src/app/auth/callback/page.tsx`
- Расширить для обработки VK и Telegram callback'ов (через query параметры)

### 3. Конфигурация и документация

#### `.env.local` (обновить)
- `VK_APP_ID` - ID приложения VK
- `VK_APP_SECRET` - Secret ключ VK
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота
- `TELEGRAM_BOT_USERNAME` - Имя бота (без @)

#### `docs/vk-telegram-oauth-setup.md` (новый файл)
- Инструкции по созданию приложения VK
- Инструкции по созданию Telegram бота
- Настройка redirect URI
- Добавление переменных окружения в Vercel

## Детальная реализация

### Шаг 1: VK OAuth интеграция

**1.1 Создание Vercel API route для VK callback:**
```typescript
// src/app/api/auth/vk/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Обмен code на access_token через VK API
  // Получение данных пользователя
  // Создание/обновление пользователя в Supabase
  // Генерация сессии
  // Редирект на главную с токеном
}
```

**1.2 Интеграция VK SDK в AuthDialog:**
- Добавить скрипт VK SDK в `layout.tsx` или динамически загружать
- Инициализация VK.init() с APP_ID
- Кнопка авторизации через VK.Widgets.Auth или кастомная кнопка с VK.Auth.login()

**1.3 Функция signInWithVK в supabase.ts:**
- Открывает VK OAuth окно
- После успешной авторизации редиректит на `/api/auth/vk/callback`

### Шаг 2: Telegram OAuth интеграция

**2.1 Создание Vercel API route для Telegram callback:**
```typescript
// src/app/api/auth/telegram/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const authData = Object.fromEntries(searchParams.entries())
  
  // Проверка подписи (crypto.createHmac)
  // Создание/обновление пользователя в Supabase
  // Генерация сессии
  // Редирект на главную
}
```

**2.2 Интеграция Telegram Widget в AuthDialog:**
- Добавить Telegram Login Widget скрипт
- Настроить `data-auth-url` на `/api/auth/telegram/callback`
- Обработка успешной авторизации

**2.3 Функция signInWithTelegram в supabase.ts:**
- Возвращает URL для Telegram Widget (или просто инициализирует виджет)

### Шаг 3: Создание пользователей в Supabase

**Вариант A: Использование Supabase Admin API (предпочтительно)**
- Создание пользователя через `supabase.auth.admin.createUser()`
- Требует `SUPABASE_SERVICE_ROLE_KEY` в Vercel env

**Вариант B: Кастомная таблица users + JWT токены**
- Создание записи в кастомной таблице
- Генерация JWT токена вручную (сложнее)

### Шаг 4: UI обновления

**4.1 AuthDialog.tsx:**
- Добавить кнопки VK и Telegram
- Добавить иконки VK и Telegram
- Обработка состояний загрузки

**4.2 Иконки:**
- VK: использовать SVG иконку или emoji
- Telegram: использовать SVG иконку или emoji

## Переменные окружения

Добавить в `.env.local` и Vercel:
```
VK_APP_ID=your_vk_app_id
VK_APP_SECRET=your_vk_app_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (уже есть)
```

## Последовательность действий

1. Создать Vercel API routes для обработки callback'ов
2. Обновить `supabase.ts` с функциями для VK и Telegram
3. Обновить `AuthDialog.tsx` с кнопками и виджетами
4. Обновить `auth/callback/page.tsx` для обработки новых провайдеров
5. Создать документацию по настройке
6. Добавить переменные окружения в `.env.local`
7. Протестировать локально
8. Добавить переменные окружения в Vercel
9. Протестировать на production

## Важные замечания

1. **Безопасность**: Всегда проверять подпись Telegram данных
2. **Секреты**: Никогда не коммитить секреты в Git
3. **Redirect URI**: Настроить правильные redirect URI в VK и Telegram
4. **CORS**: Убедиться, что Vercel API routes доступны с фронтенда
5. **Сессии**: После создания пользователя нужно создать сессию Supabase для автоматического входа

## Зависимости

- `crypto` (встроенный Node.js модуль) для проверки подписи Telegram
- `@supabase/supabase-js` (уже установлен) для работы с Supabase Admin API

