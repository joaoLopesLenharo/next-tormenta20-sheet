-- ============================================
-- TORMENTA 20 RPG - DATABASE SCHEMA
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'jogador' CHECK (role IN ('mestre', 'jogador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  invite_code TEXT UNIQUE NOT NULL DEFAULT lower(substring(md5(random()::text), 1, 8)),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'encerrada')),
  master_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 3. CAMPAIGN MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- 4. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 5. DICE ROLLS TABLE
CREATE TABLE IF NOT EXISTS public.dice_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT,
  roll_type TEXT NOT NULL CHECK (roll_type IN ('pericia', 'ataque', 'dano', 'resistencia', 'livre', 'secreto')),
  formula TEXT NOT NULL,
  individual_results INTEGER[] NOT NULL,
  modifier INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  is_fumble BOOLEAN NOT NULL DEFAULT FALSE,
  natural_roll INTEGER,
  observation TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

-- 6. INITIATIVE ENTRIES TABLE
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
