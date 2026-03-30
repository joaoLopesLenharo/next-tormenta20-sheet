-- ============================================
-- Corrige a visualização de jogadores para o mestre
-- e evita recursão nas políticas de campaign_members.
-- ============================================

-- 1. Função SECURITY DEFINER para verificar se o usuário é mestre da campanha
CREATE OR REPLACE FUNCTION public.is_campaign_master(
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
    SELECT 1 FROM public.campaigns
    WHERE id = p_campaign_id AND master_id = p_user_id
  );
$$;

ALTER FUNCTION public.is_campaign_master(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_campaign_master(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_campaign_master(uuid, uuid) TO authenticated;

-- 2. Atualiza a política de MASTER para usar a função segura
DROP POLICY IF EXISTS "campaign_members_master_all" ON public.campaign_members;

CREATE POLICY "campaign_members_master_all" ON public.campaign_members 
  FOR ALL USING (
    public.is_campaign_master(auth.uid(), campaign_id)
  );

-- 3. Atualiza a política de SELECT para também permitir que o mestre veja
-- Em vez de depender apenas do ALL anterior, separamos explicitamente.
DROP POLICY IF EXISTS "campaign_members_select" ON public.campaign_members;

CREATE POLICY "campaign_members_select" ON public.campaign_members 
  FOR SELECT USING (
    public.is_campaign_master(auth.uid(), campaign_id) 
    OR
    public.campaign_member_exists(auth.uid(), campaign_id)
  );
