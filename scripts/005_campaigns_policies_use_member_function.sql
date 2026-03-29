-- ============================================
-- Evita subconsultas diretas em campaign_members
-- dentro de políticas de OUTRAS tabelas (campaigns, sessions, dice_rolls).
-- Usa campaign_member_exists (SECURITY DEFINER) como em 004.
-- ============================================
-- Rode no SQL Editor depois de 004 (função já deve existir).

-- Dono da função: leitura interna sem reaplicar RLS problemática (Supabase: postgres)
ALTER FUNCTION public.campaign_member_exists(uuid, uuid) OWNER TO postgres;

DROP POLICY IF EXISTS "campaigns_members_select" ON public.campaigns;
CREATE POLICY "campaigns_members_select" ON public.campaigns
  FOR SELECT USING (
    public.campaign_member_exists(auth.uid(), id)
  );

DROP POLICY IF EXISTS "sessions_members_select" ON public.sessions;
CREATE POLICY "sessions_members_select" ON public.sessions
  FOR SELECT USING (
    public.campaign_member_exists(auth.uid(), campaign_id)
  );

DROP POLICY IF EXISTS "dice_rolls_select_non_secret" ON public.dice_rolls;
CREATE POLICY "dice_rolls_select_non_secret" ON public.dice_rolls
  FOR SELECT USING (
    is_secret = FALSE
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = dice_rolls.session_id
        AND public.campaign_member_exists(auth.uid(), s.campaign_id)
    )
  );
