-- ============================================
-- Função para buscar campanha por invite_code (SECURITY DEFINER).
-- Necessário porque o jogador que quer entrar ainda
-- não é membro, então as políticas RLS normais bloqueiam
-- o SELECT na tabela campaigns.
-- ============================================

CREATE OR REPLACE FUNCTION public.find_campaign_by_invite_code(p_invite_code text)
RETURNS TABLE (
  id uuid,
  master_id uuid,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT c.id, c.master_id, c.status::text
  FROM public.campaigns c
  WHERE c.invite_code = p_invite_code
  LIMIT 1;
$$;

ALTER FUNCTION public.find_campaign_by_invite_code(text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.find_campaign_by_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_campaign_by_invite_code(text) TO authenticated;
