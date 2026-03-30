-- ============================================
-- Adiciona a coluna character_data para armazenar a ficha completa do jogador
-- Isso permite ao mestre visualizar a ficha atualizada.
-- ============================================

ALTER TABLE public.campaign_members 
ADD COLUMN IF NOT EXISTS character_data JSONB;
