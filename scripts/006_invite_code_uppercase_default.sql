-- Novos códigos em MAIÚSCULAS (igual à UI). Linhas antigas continuam válidas
-- (join usa comparação em minúsculas via app).
ALTER TABLE public.campaigns
  ALTER COLUMN invite_code SET DEFAULT upper(substring(md5(random()::text), 1, 8));
