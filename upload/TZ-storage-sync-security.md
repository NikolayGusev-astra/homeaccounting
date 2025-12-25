# Техническое задание: Система хранения и синхронизации данных

**Проект:** Домашняя бухгалтерия (Home Accounting)  
**Дата:** 23 декабря 2024  
**Версия:** 1.0

---

## 📋 ОБЩЕЕ ОПИСАНИЕ

Разработать безопасную систему хранения и синхронизации данных бюджета с использованием гибридного подхода: локальное хранилище (IndexedDB) + облачная синхронизация через Supabase.

### Требования:
- ✅ Работа в офлайн-режиме с локальным хранилищем
- ✅ Автоматическая синхронизация между устройствами (ПК и телефон)
- ✅ Совместный доступ к данным (семейный учет)
- ✅ Защита от подмены токенов и несанкционированного доступа
- ✅ Безопасное хранение финансовых данных

---

## 🔐 ТРЕБОВАНИЯ К БЕЗОПАСНОСТИ

### Критически важно:
1. **Обязательная авторизация** - анонимные токены НЕ использовать
2. **Валидация токенов на сервере** - через RLS политики
3. **Защита от подмены токенов** - использование только Supabase SDK
4. **Шифрование данных** - при передаче (HTTPS) и хранении
5. **Изоляция данных** - каждый пользователь видит только свои данные и данные, к которым ему предоставлен доступ

---

## 🏗️ АРХИТЕКТУРА

### Компоненты системы:

```
┌─────────────────────────────────────────┐
│         Клиент (Next.js App)            │
│  ┌───────────────────────────────────┐  │
│  │   IndexedDB (локальное хранилище) │  │
│  │   - Быстрый доступ                │  │
│  │   - Офлайн работа                 │  │
│  │   - Очередь синхронизации         │  │
│  └───────────────────────────────────┘  │
│              ↕ Синхронизация            │
│  ┌───────────────────────────────────┐  │
│  │   Supabase SDK                     │  │
│  │   - Автоматическая валидация      │  │
│  │   - Обновление токенов             │  │
│  │   - Real-time подписки             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕ HTTPS
┌─────────────────────────────────────────┐
│         Supabase Backend                │
│  ┌───────────────────────────────────┐  │
│  │   Auth Service                    │  │
│  │   - JWT валидация                 │  │
│  │   - Обновление токенов            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   PostgreSQL + RLS                │  │
│  │   - Row Level Security            │  │
│  │   - Изоляция данных               │  │
│  │   - Совместный доступ             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📦 ЗАДАЧА 1: Настройка Supabase

### 1.1 Создание проекта Supabase

**Требования:**
- Создать новый проект в Supabase
- Получить URL и Anon Key
- Настроить переменные окружения

**Файлы:**
- `.env.local` - переменные окружения

**Переменные:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### 1.2 Создание схемы базы данных

**SQL скрипты для выполнения в Supabase SQL Editor:**

```sql
-- Таблица пользователей (расширение auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица бюджетных данных
CREATE TABLE public.budget_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  shared_with UUID[] DEFAULT ARRAY[]::UUID[], -- Массив ID пользователей с доступом
  data JSONB NOT NULL,
  version INTEGER DEFAULT 1, -- Версия данных для разрешения конфликтов
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX idx_budget_data_user_id ON public.budget_data(user_id);

-- Индекс для поиска по shared_with
CREATE INDEX idx_budget_data_shared_with ON public.budget_data USING GIN(shared_with);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_budget_data_updated_at 
    BEFORE UPDATE ON public.budget_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### 1.3 Настройка Row Level Security (RLS)

**Критически важно для безопасности!**

```sql
-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_data ENABLE ROW LEVEL SECURITY;

-- Политика для users: пользователь видит только себя
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Политика для budget_data: пользователь видит только свои данные и данные, к которым ему предоставлен доступ
CREATE POLICY "Users can view own and shared data"
ON public.budget_data
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = ANY(shared_with)
);

-- Политика: пользователь может создавать только свои данные
CREATE POLICY "Users can insert own data"
ON public.budget_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Политика: пользователь может обновлять только свои данные
CREATE POLICY "Users can update own data"
ON public.budget_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Политика: пользователь может удалять только свои данные
CREATE POLICY "Users can delete own data"
ON public.budget_data
FOR DELETE
USING (auth.uid() = user_id);
```

---

## 📦 ЗАДАЧА 2: Система авторизации

### 2.1 Компонент авторизации

**Файл:** `src/utils/auth.ts`

**Требования:**
- Регистрация пользователя (email + password)
- Вход пользователя
- Выход
- Получение текущего пользователя
- Проверка валидности сессии
- Автоматическое обновление токенов

**Интерфейс:**
```typescript
interface AuthService {
  signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  validateSession(): Promise<boolean>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}
```

**Реализация:**
- Использовать только Supabase SDK
- НЕ работать с токенами напрямую
- Обрабатывать ошибки авторизации
- Логировать события авторизации

---

### 2.2 UI компоненты авторизации

**Файлы:**
- `src/components/auth/SignUpForm.tsx`
- `src/components/auth/SignInForm.tsx`
- `src/components/auth/AuthGuard.tsx`

**Требования:**
- Форма регистрации с валидацией
- Форма входа с валидацией
- Компонент защиты маршрутов (AuthGuard)
- Обработка ошибок с понятными сообщениями
- Индикация загрузки

---

## 📦 ЗАДАЧА 3: Гибридное хранилище

### 3.1 Локальное хранилище (IndexedDB)

**Файл:** `src/utils/storage/localStorage.ts`

**Требования:**
- Использовать библиотеку `idb` для работы с IndexedDB
- Схема базы данных:
  - `budget` - основное хранилище данных бюджета
  - `syncQueue` - очередь операций для синхронизации
  - `metadata` - метаданные (версия, последняя синхронизация)

**Интерфейс:**
```typescript
interface LocalStorage {
  init(): Promise<void>;
  save(data: BudgetData): Promise<void>;
  load(): Promise<BudgetData | null>;
  delete(): Promise<void>;
  addToSyncQueue(operation: SyncOperation): Promise<void>;
  getSyncQueue(): Promise<SyncOperation[]>;
  clearSyncQueue(): Promise<void>;
}
```

**Структура данных:**
```typescript
interface BudgetData {
  id: string;
  userId: string;
  data: {
    income: Income[];
    expenses: Expense[];
    loans?: Loan[];
    settings: Settings;
  };
  synced: boolean;
  lastModified: number;
  version: number;
}

interface SyncOperation {
  id: string;
  type: 'save' | 'delete';
  data: BudgetData;
  timestamp: number;
  retries: number;
}
```

---

### 3.2 Класс HybridStorage

**Файл:** `src/utils/storage/hybridStorage.ts`

**Требования:**
- Объединяет локальное хранилище и Supabase
- Offline-first подход (всегда сохранять локально сначала)
- Автоматическая синхронизация при наличии интернета
- Очередь синхронизации для офлайн операций
- Разрешение конфликтов через версионирование

**Интерфейс:**
```typescript
class HybridStorage {
  init(): Promise<void>;
  save(data: BudgetData): Promise<void>;
  load(): Promise<BudgetData | null>;
  syncFromServer(): Promise<void>;
  syncToServer(data: BudgetData): Promise<void>;
  setupRealtimeSync(): void;
  processSyncQueue(): Promise<void>;
  shareWith(email: string): Promise<void>;
  getSharedUsers(): Promise<User[]>;
}
```

**Логика работы:**
1. При инициализации:
   - Проверка авторизации
   - Загрузка данных с сервера
   - Сохранение локально
   - Настройка real-time подписки

2. При сохранении:
   - Сохранение в IndexedDB (быстро)
   - Попытка синхронизации с сервером
   - При ошибке - добавление в очередь

3. При загрузке:
   - Сначала загрузка из IndexedDB (быстро)
   - Фоновая синхронизация с сервером
   - Обновление локальных данных при изменениях

---

### 3.3 Real-time синхронизация

**Требования:**
- Подписка на изменения в таблице `budget_data`
- Автоматическое обновление локальных данных при изменениях на сервере
- Обработка конфликтов (последнее изменение побеждает или merge)

**Реализация:**
```typescript
// Использовать Supabase Realtime
supabase
  .channel('budget-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'budget_data',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Обновить локальные данные
  })
  .subscribe();
```

---

## 📦 ЗАДАЧА 4: Совместный доступ

### 4.1 Функционал предоставления доступа

**Требования:**
- Поиск пользователя по email
- Предоставление доступа к данным
- Отзыв доступа
- Список пользователей с доступом

**Интерфейс:**
```typescript
interface SharingService {
  shareWith(email: string): Promise<void>;
  revokeAccess(userId: string): Promise<void>;
  getSharedUsers(): Promise<User[]>;
  getSharedWithMe(): Promise<BudgetData[]>;
}
```

**SQL функция для добавления пользователя в shared_with:**
```sql
CREATE OR REPLACE FUNCTION add_shared_user(
  p_user_id UUID,
  p_email TEXT
)
RETURNS void AS $$
DECLARE
  v_target_user_id UUID;
BEGIN
  -- Находим ID пользователя по email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Добавляем в массив shared_with
  UPDATE budget_data
  SET shared_with = array_append(shared_with, v_target_user_id)
  WHERE user_id = p_user_id
    AND NOT (v_target_user_id = ANY(shared_with));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 4.2 UI для управления доступом

**Файл:** `src/components/sharing/SharingSettings.tsx`

**Требования:**
- Форма для добавления пользователя по email
- Список пользователей с доступом
- Кнопка отзыва доступа
- Индикация статуса (ожидание подтверждения, активен)

---

## 📦 ЗАДАЧА 5: Защита от подмены токенов

### 5.1 Валидация токенов

**Требования:**
- Использовать только Supabase SDK для работы с токенами
- НЕ хранить токены в localStorage напрямую
- Автоматическая валидация при каждом запросе
- Обработка невалидных токенов (очистка данных, редирект на логин)

**Реализация:**
```typescript
// НЕПРАВИЛЬНО - не делать так:
const token = localStorage.getItem('token'); // ❌

// ПРАВИЛЬНО - использовать Supabase SDK:
const { data: { session } } = await supabase.auth.getSession(); // ✅
```

---

### 5.2 Middleware для проверки авторизации

**Файл:** `src/middleware/auth.ts`

**Требования:**
- Проверка авторизации на защищенных маршрутах
- Редирект на страницу входа при отсутствии авторизации
- Обновление токенов при необходимости

**Реализация:**
```typescript
export async function requireAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/auth/signin');
  }
  
  return user;
}
```

---

### 5.3 Обработка истечения токенов

**Требования:**
- Автоматическое обновление refresh token
- Обработка ошибок авторизации
- Очистка локальных данных при невалидном токене
- Уведомление пользователя о необходимости повторного входа

---

## 📦 ЗАДАЧА 6: Обработка офлайн режима

### 6.1 Определение статуса подключения

**Файл:** `src/utils/network.ts`

**Требования:**
- Определение наличия интернет-соединения
- Слушатель событий online/offline
- Индикация статуса подключения в UI

---

### 6.2 Очередь синхронизации

**Требования:**
- Сохранение операций в очередь при отсутствии интернета
- Автоматическая обработка очереди при восстановлении соединения
- Ограничение количества попыток синхронизации
- Логирование ошибок синхронизации

**Структура очереди:**
```typescript
interface SyncQueueItem {
  id: string;
  type: 'save' | 'delete';
  data: BudgetData;
  timestamp: number;
  retries: number;
  maxRetries: number;
}
```

---

## 📦 ЗАДАЧА 7: Разрешение конфликтов

### 7.1 Версионирование данных

**Требования:**
- Поле `version` в таблице `budget_data`
- Увеличение версии при каждом изменении
- Сравнение версий при синхронизации
- Стратегия разрешения конфликтов (последнее изменение побеждает)

**Алгоритм:**
```typescript
async function resolveConflict(localData: BudgetData, serverData: BudgetData) {
  if (localData.version > serverData.version) {
    // Локальная версия новее - отправляем на сервер
    return await syncToServer(localData);
  } else if (serverData.version > localData.version) {
    // Серверная версия новее - загружаем с сервера
    return await syncFromServer();
  } else {
    // Версии равны - проверяем timestamp
    if (localData.lastModified > serverData.updated_at) {
      return await syncToServer(localData);
    } else {
      return await syncFromServer();
    }
  }
}
```

---

## 📦 ЗАДАЧА 8: UI компоненты

### 8.1 Провайдер Supabase

**Файл:** `src/providers/SupabaseProvider.tsx`

**Требования:**
- Контекст для доступа к Supabase клиенту
- Состояние авторизации
- Инициализация HybridStorage
- Обработка изменений авторизации

---

### 8.2 Хук для работы с данными

**Файл:** `src/hooks/useBudgetData.ts`

**Требования:**
- Загрузка данных бюджета
- Сохранение данных бюджета
- Автоматическая синхронизация
- Обработка ошибок

**Интерфейс:**
```typescript
function useBudgetData() {
  const { data, loading, error, save, sync } = useBudgetData();
  
  return {
    data,
    loading,
    error,
    save,
    sync,
    isOnline: boolean,
    isSyncing: boolean
  };
}
```

---

### 8.3 Индикаторы синхронизации

**Требования:**
- Индикатор статуса синхронизации
- Индикатор офлайн режима
- Уведомления об успешной/неуспешной синхронизации
- Прогресс синхронизации

---

## 🧪 ТЕСТИРОВАНИЕ

### Тестовые сценарии:

1. **Авторизация:**
   - Регистрация нового пользователя
   - Вход существующего пользователя
   - Выход
   - Валидация токенов

2. **Хранение данных:**
   - Сохранение локально
   - Синхронизация с сервером
   - Загрузка с сервера
   - Офлайн сохранение

3. **Совместный доступ:**
   - Предоставление доступа
   - Отзыв доступа
   - Просмотр общих данных

4. **Безопасность:**
   - Попытка подмены токена (должна быть отклонена)
   - Доступ к чужим данным (должен быть запрещен)
   - Валидация RLS политик

5. **Синхронизация:**
   - Синхронизация между устройствами
   - Разрешение конфликтов
   - Обработка очереди синхронизации

---

## 📚 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Зависимости:

```json
{
  "@supabase/supabase-js": "^2.38.0",
  "idb": "^7.1.1"
}
```

### Структура файлов:

```
src/
├── utils/
│   ├── auth.ts                    # Авторизация
│   ├── storage/
│   │   ├── localStorage.ts        # Локальное хранилище
│   │   ├── hybridStorage.ts       # Гибридное хранилище
│   │   └── sharing.ts             # Совместный доступ
│   └── network.ts                 # Определение сети
├── components/
│   ├── auth/
│   │   ├── SignUpForm.tsx
│   │   ├── SignInForm.tsx
│   │   └── AuthGuard.tsx
│   └── sharing/
│       └── SharingSettings.tsx
├── providers/
│   └── SupabaseProvider.tsx
├── hooks/
│   └── useBudgetData.ts
└── middleware/
    └── auth.ts
```

---

## ✅ КРИТЕРИИ ПРИЕМКИ

### Обязательные требования:

1. ✅ Авторизация работает корректно
2. ✅ Данные сохраняются локально при отсутствии интернета
3. ✅ Автоматическая синхронизация при наличии интернета
4. ✅ Данные синхронизируются между устройствами
5. ✅ Совместный доступ работает корректно
6. ✅ RLS политики защищают данные от несанкционированного доступа
7. ✅ Подмена токенов невозможна
8. ✅ Очередь синхронизации обрабатывается корректно
9. ✅ Конфликты разрешаются корректно
10. ✅ UI информирует о статусе синхронизации

---

## 🔒 БЕЗОПАСНОСТЬ

### Чек-лист безопасности:

- [ ] RLS включен для всех таблиц
- [ ] Политики безопасности настроены корректно
- [ ] Токены не хранятся в localStorage напрямую
- [ ] Используется только Supabase SDK для работы с токенами
- [ ] Все запросы идут по HTTPS
- [ ] Валидация данных на клиенте и сервере
- [ ] Обработка ошибок авторизации
- [ ] Логирование подозрительной активности
- [ ] Регулярное обновление зависимостей

---

## 📝 ДОКУМЕНТАЦИЯ

### Требуется создать:

1. **README для разработчиков:**
   - Описание архитектуры
   - Инструкции по настройке
   - Примеры использования

2. **API документация:**
   - Описание всех методов
   - Примеры запросов/ответов
   - Коды ошибок

3. **Руководство пользователя:**
   - Как зарегистрироваться
   - Как синхронизировать данные
   - Как предоставить доступ

---

## 🚀 ЭТАПЫ РАЗРАБОТКИ

### Этап 1: Базовая инфраструктура (1-2 дня)
- Настройка Supabase проекта
- Создание схемы БД
- Настройка RLS политик
- Базовые компоненты авторизации

### Этап 2: Локальное хранилище (2-3 дня)
- Реализация IndexedDB хранилища
- Класс HybridStorage
- Очередь синхронизации

### Этап 3: Синхронизация (2-3 дня)
- Синхронизация с Supabase
- Real-time подписки
- Разрешение конфликтов

### Этап 4: Совместный доступ (2 дня)
- Функционал предоставления доступа
- UI для управления доступом

### Этап 5: Безопасность и тестирование (2-3 дня)
- Защита от подмены токенов
- Тестирование всех сценариев
- Исправление багов

**Общее время:** 9-13 дней

---

## 📞 КОНТАКТЫ И ВОПРОСЫ

При возникновении вопросов по ТЗ обращаться к:
- Технический лид проекта
- Архитектор системы

---

**Статус:** Готово к разработке  
**Приоритет:** Высокий  
**Дата создания:** 23 декабря 2024

