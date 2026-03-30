-- ============================================
-- RLS POLICIES
-- ============================================
-- A função deve existir antes das políticas que a referenciam.

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

ALTER FUNCTION public.campaign_member_exists(uuid, uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.campaign_member_exists(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.campaign_member_exists(uuid, uuid) TO authenticated;

-- CAMPAIGNS POLICIES
CREATE POLICY "campaigns_master_all" ON public.campaigns 
  FOR ALL USING (auth.uid() = master_id);

CREATE POLICY "campaigns_members_select" ON public.campaigns 
  FOR SELECT USING (
    public.campaign_member_exists(auth.uid(), id)
  );

-- CAMPAIGN MEMBERS POLICIES
CREATE POLICY "campaign_members_master_all" ON public.campaign_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_members.campaign_id AND master_id = auth.uid()
    )
  );

CREATE POLICY "campaign_members_select" ON public.campaign_members 
  FOR SELECT USING (
    public.campaign_member_exists(auth.uid(), campaign_id)
  );

CREATE POLICY "campaign_members_insert_self" ON public.campaign_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaign_members_update_self" ON public.campaign_members 
  FOR UPDATE USING (auth.uid() = user_id);

-- SESSIONS POLICIES
CREATE POLICY "sessions_master_all" ON public.sessions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = sessions.campaign_id AND master_id = auth.uid()
    )
  );

CREATE POLICY "sessions_members_select" ON public.sessions 
  FOR SELECT USING (
    public.campaign_member_exists(auth.uid(), campaign_id)
  );

-- DICE ROLLS POLICIES
CREATE POLICY "dice_rolls_master_all" ON public.dice_rolls 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.campaigns c ON c.id = s.campaign_id
      WHERE s.id = dice_rolls.session_id AND c.master_id = auth.uid()
    )
  );

CREATE POLICY "dice_rolls_insert_own" ON public.dice_rolls 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dice_rolls_select_non_secret" ON public.dice_rolls 
  FOR SELECT USING (
    is_secret = FALSE AND
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = dice_rolls.session_id
        AND public.campaign_member_exists(auth.uid(), s.campaign_id)
    )
  );

CREATE POLICY "dice_rolls_select_own_secret" ON public.dice_rolls 
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- ============================================
-- FUNÇÃO PARA BUSCAR CAMPANHA POR INVITE CODE
-- ============================================
-- Necessária porque um jogador que quer entrar numa campanha
-- ainda não é membro, então as políticas RLS (campaigns_master_all
-- e campaigns_members_select) bloqueiam o SELECT.
-- Esta função SECURITY DEFINER contorna o RLS e retorna apenas
-- os campos necessários (id, master_id, status).

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

-- INITIATIVE ENTRIES POLICIES
CREATE POLICY "initiative_master_all" ON public.initiative_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.campaigns c ON c.id = s.campaign_id
      WHERE s.id = initiative_entries.session_id AND c.master_id = auth.uid()
    )
  );

CREATE POLICY "initiative_members_select" ON public.initiative_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = initiative_entries.session_id
        AND public.campaign_member_exists(auth.uid(), s.campaign_id)
    )
  );
