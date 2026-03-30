-- ============================================
-- Permite que participantes da mesma campanha
-- vejam os profiles uns dos outros (display_name, avatar).
-- Sem esta política, o mestre não vê os nomes dos jogadores.
-- ============================================

-- Políticas existentes permitem apenas ver o próprio perfil.
-- Adicionamos uma política que permite ver perfis de
-- usuários que participam das mesmas campanhas.

CREATE OR REPLACE FUNCTION public.shares_campaign_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    -- Usuário é membro de uma campanha onde p_user_id é mestre
    SELECT 1 FROM public.campaign_members cm
    JOIN public.campaigns c ON c.id = cm.campaign_id
    WHERE cm.user_id = p_user_id AND c.master_id = auth.uid()
  ) OR EXISTS (
    -- Usuário é mestre de uma campanha onde p_user_id é membro
    SELECT 1 FROM public.campaigns c
    JOIN public.campaign_members cm ON cm.campaign_id = c.id
    WHERE c.master_id = p_user_id AND cm.user_id = auth.uid()
  ) OR EXISTS (
    -- Ambos são membros da mesma campanha
    SELECT 1 FROM public.campaign_members cm1
    JOIN public.campaign_members cm2 ON cm1.campaign_id = cm2.campaign_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = p_user_id
  ) OR (
    -- É o próprio usuário
    auth.uid() = p_user_id
  );
$$;

ALTER FUNCTION public.shares_campaign_with(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.shares_campaign_with(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shares_campaign_with(uuid) TO authenticated;

-- Nova política: ver perfis de participantes da mesma campanha
DROP POLICY IF EXISTS "profiles_select_campaign_peers" ON public.profiles;
CREATE POLICY "profiles_select_campaign_peers" ON public.profiles
  FOR SELECT USING (
    public.shares_campaign_with(id)
  );
