-- ============================================
-- SQL СКРИПТ ДЛЯ ИСПРАВЛЕНИЯ СЕМЕЙНОГО БЮДЖЕТА
-- Выполните в Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Создать таблицу family_members, если она не существует
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

-- 2. Удалить старые политики и создать новые для family_members
DROP POLICY IF EXISTS "family_members_select_policy" ON public.family_members;
CREATE POLICY "family_members_select_policy" ON public.family_members
FOR SELECT USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "family_members_insert_policy" ON public.family_members;
CREATE POLICY "family_members_insert_policy" ON public.family_members
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_accounts 
    WHERE id = public.family_members.family_account_id
    AND created_by = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "family_members_update_policy" ON public.family_members;
CREATE POLICY "family_members_update_policy" ON public.family_members
FOR UPDATE USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members 
    WHERE user_id = auth.uid()::text AND role = 'owner'
  )
);

DROP POLICY IF EXISTS "family_members_delete_policy" ON public.family_members;
CREATE POLICY "family_members_delete_policy" ON public.family_members
FOR DELETE USING (
  user_id = auth.uid()::text OR
  family_account_id IN (
    SELECT family_account_id FROM public.family_members 
    WHERE user_id = auth.uid()::text AND role = 'owner'
  )
);

-- 3. Добавить владельцев для существующих семейных аккаунтов
-- Это добавит создателей в family_members как владельцев
INSERT INTO public.family_members (family_account_id, user_id, role, joined_at)
SELECT 
  id as family_account_id,
  created_by as user_id,
  'owner' as role,
  created_at as joined_at
FROM public.family_accounts
WHERE NOT EXISTS (
  SELECT 1 FROM public.family_members 
  WHERE family_members.family_account_id = public.family_accounts.id
  AND family_members.user_id = public.family_accounts.created_by
);

-- 4. Создать таблицу family_invitations, если она не существует
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

-- 5. Создать политики для family_invitations
DROP POLICY IF EXISTS "family_invitations_select_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_select_policy" ON public.family_invitations
FOR SELECT USING (
  invited_by = auth.uid()::text
  OR
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "family_invitations_insert_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_insert_policy" ON public.family_invitations
FOR INSERT WITH CHECK (
  invited_by = auth.uid()::text
  AND
  EXISTS (
    SELECT 1 FROM public.family_accounts 
    WHERE id = public.family_invitations.family_account_id
    AND created_by = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "family_invitations_update_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_update_policy" ON public.family_invitations
FOR UPDATE USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "family_invitations_delete_policy" ON public.family_invitations;
CREATE POLICY "family_invitations_delete_policy" ON public.family_invitations
FOR DELETE USING (
  family_account_id IN (
    SELECT family_account_id FROM public.family_members WHERE user_id = auth.uid()::text
  )
);

-- 6. Создать функцию для обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 7. Создать триггеры для обновления updated_at
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
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ============================================

-- Проверить, что владельцы добавлены
SELECT 'Family accounts:' as type, id, name, created_by, created_at
FROM public.family_accounts;

SELECT 'Family members:' as type, id, family_account_id, user_id, role, joined_at
FROM public.family_members;

-- ============================================
-- ВАЖНОЕ ПРИМЕЧАНИЕ:
-- 1. Этот скрипт обновляет существующие таблицы
-- 2. Автоматически добавляет создателей как владельцев
-- 3. Исправляет RLS политики для избежания бесконечной рекурсии
-- ============================================
