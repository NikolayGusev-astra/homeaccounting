# Добавление поля accounting_start_date и синхронизация настроек (ИСПРАВЛЕННО)

## Описание
Добавляет таблицу `profiles` в Supabase для хранения настроек пользователей, включая `accounting_start_date`. Это позволит синхронизировать настройки между устройствами и не показывать ежемесячные платежи, которые были созданы до начала учёта.

## Исправление ошибки
**Проблема:** Ошибка `foreign key constraint "profiles_id_fkey" cannot be implemented` возникает из-за несовместимости типов: `auth.users(id)` имеет тип `UUID`, а `profiles.id` был определен как `TEXT`.

**Решение:** Изменить тип `profiles.id` на `UUID` для соответствия с `auth.users(id)`.

## SQL для выполнения в Supabase SQL Editor

```sql
-- Создаём таблицу profiles для хранения настроек пользователя
-- ИСПРАВЛЕНО: id имеет тип UUID для соответствия с auth.users(id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  accounting_start_date DATE,
  currency TEXT DEFAULT 'RUB',
  locale TEXT DEFAULT 'ru-RU',
  theme TEXT DEFAULT 'dark-neon',
  notifications BOOLEAN DEFAULT true,
  default_month TEXT DEFAULT 'current',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Создаём индексы
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Политика RLS - пользователь может читать и редактировать свои настройки
-- ПРИМЕЧАНИЕ: auth.uid() возвращает UUID, поэтому преобразуем его в TEXT
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_profile_updated_at();

-- Добавляем комментарий к колонке
COMMENT ON COLUMN public.profiles.accounting_start_date IS 'Дата начала учёта финансов. Ежемесячные платежи созданные до этой даты не будут показываться в прогнозе';
```

## Как выполнить миграцию

### Вариант 1: Если таблица profiles еще не создана

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor** в левом меню
4. Нажмите **New query**
5. Вставьте исправленный SQL код выше
6. Нажмите **Run** (или нажмите Ctrl+Enter)

### Вариант 2: Если таблица profiles уже создана с ошибкой

Если вы уже выполнили миграцию и таблица создана, нужно сначала удалить её:

```sql
-- Удаляем таблицу profiles с ошибкой
DROP TABLE IF EXISTS public.profiles CASCADE;
```

Затем выполните исправленный SQL код выше.

## Как проверить, что миграция прошла успешно

Выполните этот запрос в SQL Editor:

```sql
-- Проверяем структуру таблицы
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

Результат должен показать, что столбец `id` имеет тип `uuid`.

## Что нужно изменить в коде

#### 1. Обновить тип `AppSettings` в `src/types/budget.ts`

```typescript
export interface AppSettings {
  currency: string;
  locale: string;
  theme: string;
  notifications: boolean;
  defaultMonth: string;
  accountingStartDate?: string | null; // Добавить это поле
}
```

#### 2. Обновить `calculateForecast` в `src/store/budgetStore.ts`

Добавить параметр `accountingStartDate` и проверку при генерации транзакций:

```typescript
const calculateForecast = (
  income: Income[],
  expenses: Expense[],
  year: number,
  month: number,
  startingBalance: number = 0,
  accountingStartDate?: string | null // Новый параметр
): MonthlyForecast => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyBalances: DailyBalance[] = [];
  const cashGaps: CashGap[] = [];
  let currentBalance = startingBalance;
  let totalIncome = 0;
  let totalExpenses = 0;

  // Парсим дату начала учёта
  const accountingStart = accountingStartDate ? new Date(accountingStartDate) : null;

  // Pre-calculate all payment occurrences for entire month
  const incomeOccurrences = new Map<number, Income[]>();
  const expenseOccurrences = new Map<number, Expense[]>();

  // Calculate income occurrences
  income.forEach(inc => {
    const occurrences: number[] = [];

    if (inc.frequency === 'once') {
      if (inc.targetYear === year && inc.targetMonth === month && inc.dayOfMonth) {
        occurrences.push(inc.dayOfMonth);
      }
    } else if (inc.frequency === 'monthly') {
      // Для ежемесячных: проверяем, не создан ли платеж ДО начала учёта
      if (!accountingStart || 
          new Date(year, month, inc.dayOfMonth) >= accountingStart) {
        occurrences.push(inc.dayOfMonth);
      }
    } else if (inc.frequency === 'weekly') {
      // Еженедельные платежи
      for (let i = 0; i < 5; i++) {
        const occurrenceDay = inc.dayOfMonth + (i * 7);
        if (occurrenceDay > daysInMonth) break;
        const occurrenceDate = new Date(year, month, occurrenceDay);
        if (!accountingStart || occurrenceDate >= accountingStart) {
          occurrences.push(occurrenceDay);
        }
      }
    } else if (inc.frequency === 'biweekly') {
      // Раз в две недели
      for (let i = 0; i < 3; i++) {
        const occurrenceDay = inc.dayOfMonth + (i * 14);
        if (occurrenceDay > daysInMonth) break;
        const occurrenceDate = new Date(year, month, occurrenceDay);
        if (!accountingStart || occurrenceDate >= accountingStart) {
          occurrences.push(occurrenceDay);
        }
      }
    }

    occurrences.forEach(day => {
      if (!incomeOccurrences.has(day)) {
        incomeOccurrences.set(day, []);
      }
      incomeOccurrences.get(day)!.push(inc);
    });
  });

  // Calculate expense occurrences (аналогичная логика)
  expenses.forEach(exp => {
    const occurrences: number[] = [];
    const frequency = exp.frequency || 'monthly';

    if (frequency === 'once') {
      if (exp.targetYear === year && exp.targetMonth === month && exp.dayOfMonth) {
        occurrences.push(exp.dayOfMonth);
      }
    } else if (frequency === 'monthly') {
      if (!accountingStart || 
          new Date(year, month, exp.dayOfMonth) >= accountingStart) {
        if (exp.dayOfMonth) {
          occurrences.push(exp.dayOfMonth);
        }
      }
    } else if (frequency === 'weekly') {
      const baseDay = exp.dayOfMonth || 1;
      for (let i = 0; i < 5; i++) {
        const occurrenceDay = baseDay + (i * 7);
        if (occurrenceDay > daysInMonth) break;
        const occurrenceDate = new Date(year, month, occurrenceDay);
        if (!accountingStart || occurrenceDate >= accountingStart) {
          occurrences.push(occurrenceDay);
        }
      }
    } else if (frequency === 'biweekly') {
      const baseDay = exp.dayOfMonth || 1;
      for (let i = 0; i < 3; i++) {
        const occurrenceDay = baseDay + (i * 14);
        if (occurrenceDay > daysInMonth) break;
        const occurrenceDate = new Date(year, month, occurrenceDay);
        if (!accountingStart || occurrenceDate >= accountingStart) {
          occurrences.push(occurrenceDay);
        }
      }
    }

    occurrences.forEach(day => {
      if (!expenseOccurrences.has(day)) {
        expenseOccurrences.set(day, []);
      }
      expenseOccurrences.get(day)!.push(exp);
    });
  });

  // ... остальной код без изменений
```

#### 3. Обновить вызов `getMonthlyForecast` в store

```typescript
getMonthlyForecast: (year, month, startingBalance = 0) => {
  const { income, expenses, settings } = get();
  return calculateForecast(income, expenses, year, month, startingBalance, settings.accountingStartDate);
},
```

#### 4. Добавить синхронизацию настроек в `budgetStore.ts`

Добавить функции для загрузки и сохранения настроек:

```typescript
// Добавить в BudgetStore interface:
syncSettings: () => Promise<void>;
loadSettings: () => Promise<void>;

// Реализация в store:

// Загрузка настроек из Supabase
loadSettings: async () => {
  if (!isSupabaseEnabled() || !supabase) return;
  
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profile) {
      set((state) => ({
        settings: {
          currency: profile.currency || 'RUB',
          locale: profile.locale || 'ru-RU',
          theme: profile.theme || 'dark-neon',
          notifications: profile.notifications ?? true,
          defaultMonth: profile.default_month || 'current',
          accountingStartDate: profile.accounting_start_date,
        }
      }));
    } else {
      // Создаём профиль если его нет
      await supabase.from('profiles').insert({
        id: userId,
        user_id: userId,
        currency: get().settings.currency,
        locale: get().settings.locale,
        theme: get().settings.theme,
        notifications: get().settings.notifications,
        default_month: get().settings.defaultMonth,
        accounting_start_date: get().settings.accountingStartDate,
      });
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
},

// Синхронизация настроек с Supabase
syncSettings: async () => {
  if (!isSupabaseEnabled() || !supabase) return;
  
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    const { settings } = get();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        accounting_start_date: settings.accountingStartDate,
        currency: settings.currency,
        locale: settings.locale,
        theme: settings.theme,
        notifications: settings.notifications,
        default_month: settings.defaultMonth,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error syncing settings:', error);
    }
  } catch (error) {
    console.error('Error syncing settings:', error);
  }
},
```

#### 5. Обновить `updateSettings` для автоматической синхронизации

```typescript
updateSettings: (settings) => {
  set((state) => ({
    settings: { ...state.settings, ...settings },
  }));
  // Автоматическая синхронизация настроек
  if (isSupabaseEnabled()) {
    get().syncSettings().catch(console.error);
  }
},
```

#### 6. Загрузить настройки при инициализации

```typescript
// В компоненте или при инициализации приложения:
useEffect(() => {
  const store = useBudgetStore.getState();
  store.loadSettings().catch(console.error);
}, []);
```

## UI для настройки даты начала учёта

Добавить компонент в настройки приложения:

```typescript
// В SettingsView добавить:
<div>
  <label className="text-sm font-medium text-cyan-400 mb-2 block">
    Дата начала учёта финансов
  </label>
  <input
    type="date"
    value={settings.accountingStartDate || ''}
    onChange={(e) => updateSettings({ accountingStartDate: e.target.value || null })}
    className="w-full px-3 py-2 bg-[#0a0a0f] border border-cyan-500/30 rounded-lg text-cyan-400"
  />
  <p className="text-xs text-cyan-500/60 mt-1">
    Ежемесячные платежи созданные до этой даты не будут показываться
  </p>
</div>
```

## Проверка

После миграции и обновления кода:

1. Выполните SQL миграцию в Supabase (сначала удалите старую таблицу если есть)
2. Обновите код согласно инструкции выше
3. Установите дату начала учёта в настройках (например, 2024-12-01)
4. Создайте ежемесячный платеж с датой 1-го числа
5. Посмотрите прогноз за ноябрь 2024 года - платеж не должен показываться
6. Посмотрите прогноз за декабрь 2024 года - платеж должен показываться
7. Войдите с другого устройства - настройки должны быть синхронизированы

## Примечания

- Поле `accounting_start_date` может быть `NULL` - в этом случае показываются все платежи
- Настройки синхронизируются автоматически при каждом изменении
- При первом входе создаётся профиль пользователя в таблице profiles
- Используется Supabase RLS для защиты настроек разных пользователей
- Дата хранится в формате ISO (YYYY-MM-DD)
- **Важно:** Столбец `id` должен иметь тип `UUID` для корректной работы foreign key
