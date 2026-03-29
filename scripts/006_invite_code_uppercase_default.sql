-- Padroniza códigos em minúsculas (consistente com a busca no app).
-- Linhas antigas continuam válidas.
ALTER TABLE public.campaigns
  ALTER COLUMN invite_code SET DEFAULT lower(substring(md5(random()::text), 1, 8));
