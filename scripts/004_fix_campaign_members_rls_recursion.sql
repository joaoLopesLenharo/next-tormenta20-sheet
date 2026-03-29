-- ============================================
-- Corrige 42P17: infinite recursion em campaign_members
-- A política antiga fazia EXISTS (SELECT ... FROM campaign_members)
-- dentro da própria tabela campaign_members, re-disparando RLS.
-- ============================================
-- Rode este script no SQL Editor do Supabase (ou via migração)
-- se o projeto já aplicou scripts/002_create_policies.sql antigo.

CREATE OR REPLACE FUNCTION public.campaign_member_exists(
  p_user_id uuid,
  p_campaign_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_members
    WHERE campaign_id = p_campaign_id
      AND user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.campaign_member_exists(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.campaign_member_exists(uuid, uuid) TO authenticated;

ALTER FUNCTION public.campaign_member_exists(uuid, uuid) OWNER TO postgres;

DROP POLICY IF EXISTS "campaign_members_select" ON public.campaign_members;

CREATE POLICY "campaign_members_select" ON public.campaign_members
  FOR SELECT USING (
    public.campaign_member_exists(auth.uid(), campaign_id)
  );

-- Depois rode também scripts/005_campaigns_policies_use_member_function.sql
-- para trocar subconsultas em campaign_members nas políticas de campaigns/sessions/dice_rolls.
