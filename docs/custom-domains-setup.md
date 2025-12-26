# Настройка кастомных доменов в Vercel

## Рекомендация

Используйте **homeaccounting.ru** как основной домен, а **homeaccounting.online** как алиас (оба будут открывать одно и то же приложение).

## Шаг 1: Добавление доменов в Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект **homeaccounting**
3. Перейдите в **Settings** → **Domains**
4. Нажмите **Add Domain**

### 1.1 Добавление homeaccounting.ru

1. Введите `homeaccounting.ru`
2. Нажмите **Add**
3. Vercel покажет инструкции по настройке DNS

### 1.2 Добавление homeaccounting.online

1. Введите `homeaccounting.online`
2. Нажмите **Add**
3. Vercel покажет инструкции по настройке DNS

## Шаг 2: Настройка DNS записей

### 2.1 Для homeaccounting.ru

В панели управления вашего регистратора домена (где вы купили домен) добавьте DNS записи:

**Вариант A: Использование CNAME (рекомендуется для поддоменов)**
```
Тип: CNAME
Имя: @ (или оставить пустым для корневого домена)
Значение: cname.vercel-dns.com
TTL: 3600 (или Auto)
```

**Вариант B: Использование A записей (для корневого домена)**
```
Тип: A
Имя: @ (или оставить пустым)
Значение: 76.76.21.21
TTL: 3600

Тип: A
Имя: @
Значение: 76.223.126.88
TTL: 3600
```

**Примечание:** Некоторые регистраторы (например, некоторые российские) не поддерживают CNAME для корневого домена (@). В этом случае используйте A записи, которые Vercel предоставит в настройках домена.

### 2.2 Для homeaccounting.online

Настройте аналогично:

**Вариант A: CNAME**
```
Тип: CNAME
Имя: @
Значение: cname.vercel-dns.com
TTL: 3600
```

**Вариант B: A записи**
```
Тип: A
Имя: @
Значение: 76.76.21.21
TTL: 3600

Тип: A
Имя: @
Значение: 76.223.126.88
TTL: 3600
```

## Шаг 3: Ожидание активации

1. После добавления DNS записей подождите **5-60 минут** (обычно 10-15 минут)
2. Vercel автоматически проверит DNS записи
3. Когда домен будет готов, статус изменится на **Valid Configuration**
4. Vercel автоматически выдаст SSL сертификат (Let's Encrypt) - это займет еще несколько минут

## Шаг 4: Проверка работы

1. Откройте `https://homeaccounting.ru` в браузере
2. Откройте `https://homeaccounting.online` в браузере
3. Оба должны открывать ваше приложение

## Шаг 5: Обновление OAuth redirect URI

После настройки доменов нужно обновить redirect URI в OAuth провайдерах:

### 5.1 Google OAuth

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Перейдите: **APIs & Services** → **Credentials**
3. Найдите ваш OAuth 2.0 Client ID
4. Нажмите **Edit**
5. В разделе **Authorized redirect URIs** добавьте:
   ```
   https://homeaccounting.ru/auth/callback
   https://homeaccounting.online/auth/callback
   ```
6. Сохраните изменения

### 5.2 GitHub OAuth

1. Откройте [GitHub Settings](https://github.com/settings/developers)
2. Найдите ваше OAuth App
3. Нажмите **Edit**
4. В поле **Authorization callback URL** укажите:
   ```
   https://homeaccounting.ru/auth/callback
   ```
   (GitHub позволяет только один callback URL, используйте основной домен)
5. Сохраните изменения

### 5.3 Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект
3. Перейдите: **Authentication** → **URL Configuration**
4. В поле **Site URL** укажите:
   ```
   https://homeaccounting.ru
   ```
5. В поле **Redirect URLs** добавьте:
   ```
   https://homeaccounting.ru/**
   https://homeaccounting.online/**
   ```
6. Сохраните изменения

## Шаг 6: Обновление кода (опционально)

Код уже настроен на автоматическое определение домена через `window.location.origin`, но можно явно указать домены в `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://homeaccounting.ru
```

## Решение проблем

### Домен не активируется

1. Проверьте DNS записи через [DNS Checker](https://dnschecker.org/)
2. Убедитесь, что прошло достаточно времени (до 24 часов для некоторых регистраторов)
3. Проверьте, что DNS записи указаны правильно (без лишних точек, правильный TTL)

### SSL сертификат не выдается

1. Подождите до 24 часов (обычно 5-10 минут)
2. Проверьте, что домен правильно настроен в Vercel
3. Убедитесь, что DNS записи корректны

### Ошибка "Domain not found"

1. Проверьте, что домен добавлен в Vercel
2. Убедитесь, что DNS записи настроены правильно
3. Подождите распространения DNS (может занять до 24 часов)

## Дополнительные настройки

### Редирект с .online на .ru (опционально)

Если хотите, чтобы `homeaccounting.online` автоматически редиректил на `homeaccounting.ru`, можно добавить middleware:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Редирект с .online на .ru
  if (hostname === 'homeaccounting.online' || hostname === 'www.homeaccounting.online') {
    return NextResponse.redirect(
      new URL(request.url.replace(hostname, 'homeaccounting.ru')),
      301
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Полезные ссылки

- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [DNS Propagation Checker](https://dnschecker.org/)
- [SSL Certificate Checker](https://www.ssllabs.com/ssltest/)

