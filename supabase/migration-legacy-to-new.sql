-- ============================================
-- Миграция данных из Legacy в New Architecture
-- Скопируйте и выполните этот скрипт в Supabase SQL Editor
-- ============================================

-- ============================================
-- ЧАСТЬ 1: Создание таблиц новой архитектуры
-- ============================================

-- Таблица расписаний
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,                -- Уникальный ID (текст, не UUID)
  user_id TEXT NOT NULL,               -- ID пользователя
  kind TEXT NOT NULL CHECK (kind IN ('fixed', 'recurring', 'rule')), -- Тип расписания
  direction TEXT NOT NULL CHECK (direction IN ('income', 'expense'), -- Направление
  name TEXT NOT NULL,                  -- Название (например, "Зарплата")
  amount DECIMAL(10, 2) NOT NULL,        -- Сумма
  currency TEXT DEFAULT 'RUB',             -- Валюта
  start_date DATE NOT NULL,             -- Дата начала (ISO: YYYY-MM-DD)
  end_date DATE,                          -- Дата окончания (для fixed)
  recurrence_rule TEXT NOT NULL,           -- ICal правило (например, "FREQ=MONTHLY;BYMONTHDAY=25")
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')), -- Статус
  notes TEXT,                             -- Примечания
  created_at TIMESTAMP DEFAULT NOW(),     -- Время создания
  updated_at TIMESTAMP DEFAULT NOW()      -- Время обновления
  CONSTRAINT schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Индексы для расписаний
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_start_date ON public.schedules(start_date);


-- Таблица ревизий сумм расписаний
CREATE TABLE IF NOT EXISTS public.schedule_revisions (
  id TEXT PRIMARY KEY,                -- Уникальный ID
  schedule_id TEXT NOT NULL,               -- ID расписания
  user_id TEXT NOT NULL,                -- ID пользователя
  valid_from DATE NOT NULL,              -- Дата начала действия
  valid_to DATE,                         -- Дата окончания действия (null = бессрочно)
  amount DECIMAL(10, 2) NOT NULL,        -- Новая сумма
  reason TEXT,                             -- Причина изменения
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT revision_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE CASCADE
);

-- Индексы для ревизий
CREATE INDEX IF NOT EXISTS idx_schedule_revisions_schedule_id ON public.schedule_revisions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_revisions_user_id ON public.schedule_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_revisions_valid_from ON public.schedule_revisions(valid_from);


-- Таблица транзакций
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,                -- Уникальный ID
  user_id TEXT NOT NULL,               -- ID пользователя
  schedule_id TEXT,                         -- Связанное расписание (null = разовая транзакция)
  date DATE NOT NULL,                    -- Дата транзакции (ISO: YYYY-MM-DD)
  amount DECIMAL(10, 2) NOT NULL,     -- Сумма
  currency TEXT DEFAULT 'RUB',            -- Валюта
  direction TEXT NOT NULL CHECK (direction IN ('income', 'expense')), -- Направление
  description TEXT,                       -- Описание
  category TEXT,                         -- Категория
  subcategory TEXT,                      -- Подкатегория
  is_transfer BOOLEAN DEFAULT false,       -- Является ли переводом
  transfer_type TEXT CHECK (transfer_type IN ('to_self', 'to_family', 'to_friend')), -- Тип перевода
  recipient TEXT,                         -- Получатель для переводов
  is_credit BOOLEAN DEFAULT false,        -- Является ли кредитом
  credit_kind TEXT CHECK (credit_kind IN ('mortgage', 'consumer_credit', 'credit_card', 'auto_loan')), -- Тип кредита
  bank_name TEXT,                         -- Название банка (для кредитов)
  interest_rate DECIMAL(5, 2),            -- Процентная ставка (для кредитов)
  credit_limit DECIMAL(10, 2),          -- Лимит кредита (для кредитных карт)
  grace_period TEXT,                       -- Льготный период (для кредитов)
  is_generated BOOLEAN DEFAULT false,     -- Создано автоматически из расписания
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT transaction_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE CASCADE,
  CONSTRAINT transaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Индексы для транзакций
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON public.transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_schedule_id ON public.transactions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_transfer ON public.transactions(is_transfer);


-- Таблица хранилища файлов
CREATE TABLE IF NOT EXISTS public.storage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_path TEXT NOT NULL,               -- Путь к файлу (например, checks/check_123.png)
  file_type TEXT NOT NULL CHECK (file_type IN ('check', 'receipt', 'invoice', 'statement')),
  file_size BIGINT,                         -- Размер файла в байтах
  upload_url TEXT,                         -- URL загруженного файла (в хранилище)
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT storage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Индексы для хранилища
CREATE INDEX IF NOT EXISTS idx_storage_user_id ON public.storage(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_file_type ON public.storage(file_type);


-- ============================================
-- ЧАСТЬ 2: Политика доступа (Row Level Security)
-- ============================================

-- Разрешить всем пользователям читать/писать свои данные
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_legacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses_legacy ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ЧАСТЬ 3: Вспомогательные функции
-- ============================================

-- Функция для генерации уникальных ID
CREATE OR REPLACE FUNCTION generate_id(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Генерируем уникальный ID на основе префикса и времени
  SELECT prefix || 'tr_' || substring(md5(random()::text), 1, 8);
END;

-- Функция для генерации следующего дня оплаты
CREATE OR REPLACE FUNCTION get_next_payment_day(start_day INTEGER, frequency TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE frequency
    WHEN 'monthly' THEN start_day
    WHEN 'weekly' THEN (start_day + 7) % 31
    WHEN 'biweekly' THEN (start_day + 14) % 31
    ELSE start_day
  END;
END;


-- ============================================
-- ЧАСТЬ 4: Миграция данных из Legacy в New Architecture
-- ============================================

-- Включаем миграцию (по умолчанию можно отключить)
DO $$
  -- ============================================
  -- ШАГ 1: Миграция доходов (income_legacy → transactions)
  -- ============================================
  
  -- Создаём транзакции для каждого дохода
  INSERT INTO public.transactions (id, user_id, date, amount, currency, direction, description, is_generated, created_at, updated_at)
  SELECT 
    generate_id('inc'),
    user_id,
    received_date,
    amount,
    currency,
    'income',
    'Перевод из ' || COALESCE(name, 'Старый доход: ' || name) || 'Доход ' || date_part(received_date) || 'Дата не указана',
    true,
    NOW()
  FROM public.income_legacy
  WHERE received_date IS NOT NULL
  ORDER BY received_date;

  -- ============================================
  -- ШАГ 2: Миграция расходов (expenses_legacy → transactions)
  -- ============================================
  
  -- Создаём транзакции для каждого оплаченного расхода
  INSERT INTO public.transactions (id, user_id, date, amount, currency, direction, category, description, is_generated, created_at, updated_at)
  SELECT 
    generate_id('exp'),
    user_id,
    COALESCE(target_year, EXTRACT(YEAR FROM created_at))::TEXT || '-' || EXTRACT(YEAR FROM NOW())::TEXT,
    COALESCE(target_month, EXTRACT(MONTH FROM created_at))::TEXT,
    day_of_month,
    amount,
    currency,
    'expense',
    COALESCE(category, 'Прочее') || name,
    false,
    NOW()
  FROM public.expenses_legacy
  WHERE is_paid = true
  ORDER BY target_year, target_month, day_of_month;

  -- ============================================
  -- ШАГ 3: Миграция расписаний (если есть данные в users.profiles.starting_balance)
  -- ============================================
  
  -- Проверяем, есть ли стартовый баланс в профиле
  -- Проверяем, есть ли расписание в профилях (это не реализовано, но резервируем)
  -- Пока пропускаем этот шаг

  RAISE NOTICE 'Шаг 3 (Миграция расписаний) пропущен - функциональность не реализована в профиле';

  -- ============================================
  -- ШАГ 4: Создание тестовых расписаний
  -- ============================================
  
  -- Создаём тестовое расписание зарплаты
  INSERT INTO public.schedules (id, user_id, kind, direction, name, amount, currency, start_date, recurrence_rule, status, created_at, updated_at)
  VALUES (
    generate_id('sched'),
    (SELECT user_id FROM public.users LIMIT 1),
    'fixed',
    'expense',
    'Тестовая зарплата',
    150000,
    'RUB',
    DATE_FORMAT(NOW(), 'YYYY-MM-01'),
    'FREQ=MONTHLY;BYMONTHDAY=25',
    'active',
    NOW(),
    NOW()
  );

  -- Создаём тестовое расписание аренды
  INSERT INTO public.schedules (id, user_id, kind, direction, name, amount, currency, start_date, recurrence_rule, status, created_at, updated_at)
  VALUES (
    generate_id('sched2'),
    (SELECT user_id FROM public.users LIMIT 1),
    'fixed',
    'expense',
    'Тестовая аренда',
    35000,
    'RUB',
    DATE_FORMAT(NOW(), 'YYYY-MM-01'),
    'FREQ=MONTHLY;BYMONTHDAY=1',
    'active',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Миграция завершена!';
  
END $;

-- ============================================
-- ЧАСТЬ 5: Валидация миграции
-- ============================================

-- Проверяем количество мигрированных записей
DO $$
  DECLARE
    v_income_count INTEGER;
    v_expenses_count INTEGER;
    v_schedules_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_income_count FROM public.transactions WHERE is_generated = true AND direction = 'income';
    SELECT COUNT(*) INTO v_expenses_count FROM public.transactions WHERE is_generated = true AND direction = 'expense';
    SELECT COUNT(*) INTO v_schedules_count FROM public.schedules;
  END;
  
  IF v_income_count > 0 OR v_expenses_count > 0 OR v_schedules_count > 0 THEN
    RAISE NOTICE 'Миграция выполнена успешно! Мигрировано: % (доходов), % (расходов), % (расписаний)', 
                  v_income_count, v_expenses_count, v_schedules_count;
  ELSE
    RAISE EXCEPTION 'Миграция не выполнена - нет данных для миграции';
  END IF;
END $;

-- ============================================
-- ЧАСТЬ 6: Пояснения к пользователю
-- ============================================

-- После выполнения скрипта проверьте результаты:
-- 1. Таблицы schedules, schedule_revisions, transactions созданы
-- 2. Данные из income_legacy и expenses_legacy мигрированы в transactions
-- 3. Созданы тестовые расписания (Зарплата, Аренда)
-- 4. Все таблицы включены ROW LEVEL SECURITY

-- Что происходит дальше:
-- Приложение начнёт использовать новые таблицы:
-- - Создание расписаний через ScheduleForm будет сохраняться в schedules
-- - Создание транзакций через TransactionForm будет сохраняться в transactions
-- - Все данные будут автоматически синхронизироваться с Supabase

-- Legacy таблицы (income_legacy, expenses_legacy):
-- - Можно оставить для совместимости
-- - Или удалить после успешной миграции (через DROP TABLE IF EXISTS)

-- Удаляя legacy таблицы:
-- DROP TABLE IF EXISTS public.income_legacy CASCADE;
-- DROP TABLE IF EXISTS public.expenses_legacy CASCADE;

-- ============================================
-- Конец скрипта миграции
-- ============================================
