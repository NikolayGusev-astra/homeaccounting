# OAuth Credentials

⚠️ **ВАЖНО:** Этот файл содержит секретные данные и не должен попадать в git (уже добавлен в .gitignore)

## GitHub OAuth App: Home Accounting

**Application:** Home Accounting  
**Owner:** @NikolayGusev-astra  
**Application URL:** https://github.com/settings/developers

### Credentials

**Client ID:**
```
Ov23liJO5XqvPV6DdJCt
```

**Client Secret:**
```
b3873ffbb6e1dcc78acc0a4c960342ba76f0bae5
```

**Status:**
- Created: now by NikolayGusev-astra
- Never used
- 0 users

### Callback URL
```
https://yzdpqzjwqxzictfhcehk.supabase.co/auth/v1/callback
```

### Настройка в Supabase

1. Откройте: https://supabase.com/dashboard
2. Выберите проект: `yzdpqzjwqxzictfhcehk`
3. Перейдите: **Authentication** → **Providers** → **GitHub**
4. Включите провайдер (переключите тумблер в ON)
5. Вставьте **Client ID** и **Client Secret** выше
6. Нажмите **Save**

---

## Google OAuth (если настроен)

_Добавьте сюда данные Google OAuth, если они есть_

---

## VK ID OAuth App: Home Accounting

**Application:** Home Accounting  
**App ID:** 54409028

### Credentials

**Защищённый ключ:**
```
hBKPfMiIMpHD9nrbcIZ0
```

**Сервисный ключ доступа:**
```
684867a0684867a0684867a06a6b7650e466848684867a001050e954fdfeea2b9cd7990
```

### Настройка

**Базовый домен:**
```
homeaccounting.ru
```

**Доверенные Redirect URL:**
```
https://homeaccounting.online
https://homeaccounting.vercel.app/
```

**Или для локальной разработки:**
```
http://localhost:3000/auth/callback
```

### Интеграция

VK ID SDK интегрирован в приложение:
- Скрипт загружается в `src/app/layout.tsx`
- Компонент `VKAuth` в `src/components/auth/VKAuth.tsx`
- Функция авторизации `signInWithVK` в `src/lib/supabase.ts`

**Примечание:** Supabase не поддерживает VK напрямую, поэтому используется кастомная авторизация через VK API.

---

**Последнее обновление:** 2025-01-25

