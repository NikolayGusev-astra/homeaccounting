-- ============================================
-- SQL СКРИПТ ДЛЯ ДОБАВЛЕНИЯ ТАБЛИЦЫ ПРИГЛАШЕНИЙ
-- Выполните в Supabase Dashboard → SQL Editor
-- ============================================

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

-- Индексы для быстрого поиска
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

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_family_invitations_updated_at ON public.family_invitations;
CREATE TRIGGER update_family_invitations_updated_at 
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ПРИМЕЧАНИЕ:
-- - Приглашения действительны 7 дней (expires_at)
-- - Статус может быть: pending, accepted, declined
-- - Только владелец семейного аккаунта может создавать приглашения
-- - Приглашенный пользователь может принять/отклонить приглашение
-- ============================================
