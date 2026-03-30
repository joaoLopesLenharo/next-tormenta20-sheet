-- ============================================
-- TABELA DE INICIATIVA
-- ============================================
-- Controla a ordem de iniciativa durante sessões de combate.
-- O mestre pode editar a ordem e adicionar NPCs.
-- Jogadores podem visualizar a ordem.

CREATE TABLE IF NOT EXISTS public.initiative_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  campaign_member_id UUID REFERENCES public.campaign_members(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  roll_value INTEGER NOT NULL DEFAULT 0,
  modifier INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_npc BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.initiative_entries ENABLE ROW LEVEL SECURITY;

-- O mestre da campanha pode tudo (INSERT, UPDATE, DELETE)
CREATE POLICY "initiative_master_all" ON public.initiative_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.campaigns c ON c.id = s.campaign_id
      WHERE s.id = initiative_entries.session_id AND c.master_id = auth.uid()
    )
  );

-- Membros da campanha podem ver a iniciativa
CREATE POLICY "initiative_members_select" ON public.initiative_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = initiative_entries.session_id
        AND public.campaign_member_exists(auth.uid(), s.campaign_id)
    )
  );

-- Habilitar Realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.initiative_entries;
