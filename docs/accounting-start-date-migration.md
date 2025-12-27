# Миграция: Добавление поля accounting_start_date

## Описание
Добавляет поле `accounting_start_date` в таблицу `profiles` для указания даты начала учёта финансов. Это позволит не показывать ежемесячные платежи, которые были созданы до начала учёта.

## SQL для выполнения в Supabase SQL Editor

```sql
-- Добавляем колонку accounting_start_date в таблицу profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accounting_start_date DATE;

-- Устанавливаем значение по умолчанию для существующих пользователей
-- Если колонка была добавлена без значения, установим NULL
-- Пользователь сможет установить дату через UI

-- Добавляем комментарий к колонке
COMMENT ON COLUMN public.profiles.accounting_start_date IS 'Дата начала учёта финансов. Ежемесячные платежи созданные до этой даты не будут показываться в прогнозе';
```

## Как выполнить миграцию

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor** в левом меню
4. Нажмите **New query**
5. Вставьте SQL код выше
6. Нажмите **Run** (или нажмите Ctrl+Enter)

### Вариант 2: Через CLI (если настроен)

```bash
npx supabase db push
```

## После миграции

### Что нужно изменить в коде

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

#### 4. Добавить поле в `syncToSupabase`

Сохранять и загружать `accounting_start_date` из таблицы `profiles`:

```typescript
// В syncFromSupabase добавляем загрузку:
const { data: profileData } = await supabase
  .from('profiles')
  .select('accounting_start_date')
  .eq('id', userId)
  .single();

// В updateSettings добавляем сохранение:
const { error: updateError } = await supabase
  .from('profiles')
  .update({ accounting_start_date: settings.accountingStartDate })
  .eq('id', userId);
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

1. Установите дату начала учёта в настройках (например, 2024-12-01)
2. Создайте ежемесячный платеж с датой 1-го числа
3. Посмотрите прогноз за ноябрь 2024 года - платеж не должен показываться
4. Посмотрите прогноз за декабрь 2024 года - платеж должен показываться

## Примечания

- Поле `accounting_start_date` может быть `NULL` - в этом случае показываются все платежи
- Миграция безопасная - использует `IF NOT EXISTS`, поэтому можно запустить несколько раз
- Дата хранится в формате ISO (YYYY-MM-DD)
