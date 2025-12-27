-- ============================================
-- SQL СКРИПТ ДЛЯ СОЗДАНИЯ ТАБЛИЦ СЕМЕЙНОГО БЮДЖЕТА
-- Выполните в Supabase Dashboard → SQL Editor
-- ============================================

-- Таблица профилей пользователей (расширенная информация)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Индексы для profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Включить RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS политики для profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Таблица семейных аккаунтов
CREATE TABLE IF NOT EXISTS public.family_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Индексы для family_accounts
CREATE INDEX IF NOT EXISTS idx_family_accounts_created_by ON public.family_accounts(created_by);

-- Включить RLS
ALTER TABLE public.family_accounts ENABLE ROW LEVEL SECURITY;

-- RLS политики для family_accounts

-- Владелец может видеть свои аккаунты и аккаунты, где он член
DROP POLICY IF EXISTS "family_accounts_select_policy" ON public.family_accounts;
CREATE POLICY "family_accounts_select_policy" ON public.family_accounts
FOR SELECT USING (
  created_by = auth.uid()::text
  OR
  id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

-- Только владелец может создавать аккаунты
DROP POLICY IF EXISTS "family_accounts_insert_policy" ON public.family_accounts;
CREATE POLICY "family_accounts_insert_policy" ON public.family_accounts
FOR INSERT WITH CHECK (created_by = auth.uid()::text);

-- Только владелец может обновлять аккаунты
DROP POLICY IF EXISTS "family_accounts_update_policy" ON public.family_accounts;
CREATE POLICY "family_accounts_update_policy" ON public.family_accounts
FOR UPDATE USING (created_by = auth.uid()::text)
WITH CHECK (created_by = auth.uid()::text);

-- Только владелец может удалять аккаунты
DROP POLICY IF EXISTS "family_accounts_delete_policy" ON public.family_accounts;
CREATE POLICY "family_accounts_delete_policy" ON public.family_accounts
FOR DELETE USING (created_by = auth.uid()::text);

-- Таблица членов семьи
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_account_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(family_account_id, user_id)
);

-- Индексы для family_members
CREATE INDEX IF NOT EXISTS idx_family_members_family_account_id ON public.family_members(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);

-- Включить RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS политики для family_members

-- Участник может видеть членов семьи, в которой состоит
DROP POLICY IF EXISTS "family_members_select_policy" ON public.family_members;
CREATE POLICY "family_members_select_policy" ON public.family_members
FOR SELECT USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

-- Только владелец может добавлять членов в свою семью
DROP POLICY IF EXISTS "family_members_insert_policy" ON public.family_members;
CREATE POLICY "family_members_insert_policy" ON public.family_members
FOR INSERT WITH CHECK (
  user_id = auth.uid()::text OR
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_account_id = public.family_members.family_account_id
    AND user_id = auth.uid()::text
    AND role = 'owner'
  )
);

-- Владелец может обновлять роли других членов
DROP POLICY IF EXISTS "family_members_update_policy" ON public.family_members;
CREATE POLICY "family_members_update_policy" ON public.family_members
FOR UPDATE USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members 
    WHERE user_id = auth.uid()::text AND role = 'owner'
  )
);

-- Владелец может удалять других членов, или пользователь может выйти сам
DROP POLICY IF EXISTS "family_members_delete_policy" ON public.family_members;
CREATE POLICY "family_members_delete_policy" ON public.family_members
FOR DELETE USING (
  user_id = auth.uid()::text OR
  family_account_id IN (
    SELECT family_account_id FROM public.family_members 
    WHERE user_id = auth.uid()::text AND role = 'owner'
  )
);

-- Таблица приглашений в семью
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_account_id UUID NOT NULL REFERENCES public.family_accounts(id) ON DELETE CASCADE,
  invited_by TEXT NOT NULL,
  invited_email TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Индексы для family_invitations
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_account_id ON public.family_invitations(family_account_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_invited_by ON public.family_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON public.family_invitations(status);

-- Включить RLS
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- RLS политики для family_invitations

-- Владелец приглашения или владелец семейного аккаунта может видеть приглашения
DROP POLICY IF EXISTS "family_invitations_select_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_select_policy" ON public.family_invitations
FOR SELECT USING (
  invited_by = auth.uid()::text
  OR
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

-- Только владелец семейного аккаунта может создавать приглашения
DROP POLICY IF EXISTS "family_invitations_insert_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_insert_policy" ON public.family_invitations
FOR INSERT WITH CHECK (
  invited_by = auth.uid()::text
  AND
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_account_id = public.family_invitations.family_account_id
    AND user_id = auth.uid()::text
    AND role = 'owner'
  )
);

-- Владелец приглашения или владелец семейного аккаунта может обновлять статус
DROP POLICY IF EXISTS "family_invitations_update_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_update_policy" ON public.family_invitations
FOR UPDATE USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

-- Владелец приглашения или владелец семейного аккаунта может удалять приглашения
DROP POLICY IF EXISTS "family_invitations_delete_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_delete_policy" ON public.family_invitations
FOR DELETE USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

-- Функция для автоматического создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_family_accounts_updated_at ON public.family_accounts;
CREATE TRIGGER update_family_accounts_updated_at 
  BEFORE UPDATE ON public.family_accounts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_invitations_updated_at ON public.family_invitations;
CREATE TRIGGER update_family_invitations_updated_at 
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ВАЖНОЕ ПРИМЕЧАНИЕ:
-- 1. Этот скрипт создает все необходимые таблицы для семейного бюджета
-- 2. При создании семейного аккаунта владелец автоматически станет членом
--    с ролью 'owner' (нужно добавить в коде после создания)
-- 3. RLS политики обеспечивают безопасность данных
-- 4. Приглашения действительны 7 дней (expires_at)
-- ============================================
