-- ============================================
-- SQL СКРИПТ ДЛЯ SUPABASE
-- Скопируйте и выполните в Supabase Dashboard → SQL Editor
-- ============================================

-- Таблица доходов
CREATE TABLE IF NOT EXISTS public.income (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  day_of_month INTEGER,
  frequency TEXT DEFAULT 'monthly',
  received BOOLEAN DEFAULT false,
  received_date TIMESTAMP,
  target_month INTEGER,
  target_year INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица расходов
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  day_of_month INTEGER,
  frequency TEXT DEFAULT 'monthly',
  is_paid BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  target_month INTEGER,
  target_year INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_income_user_id ON public.income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_created_at ON public.income(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- Включить RLS (Row Level Security)
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS политики для income
-- Для MVP: разрешаем всем читать/писать (небезопасно, но работает сразу)
-- Для production: использовать auth.uid() для проверки пользователя

DROP POLICY IF EXISTS "Allow all for income" ON public.income;
CREATE POLICY "Allow all for income"
  ON public.income
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for expenses" ON public.expenses;
CREATE POLICY "Allow all for expenses"
  ON public.expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_income_updated_at ON public.income;
CREATE TRIGGER update_income_updated_at 
  BEFORE UPDATE ON public.income
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ПРИМЕЧАНИЕ:
-- Для production нужно заменить политики на:
--
-- CREATE POLICY "Users can view own income"
--   ON public.income FOR SELECT
--   USING (user_id = current_setting('app.user_id', true));
--
-- И использовать Supabase Auth для получения user_id
-- ============================================

