// Tipos do banco de dados Supabase

export type UserRole = 'mestre' | 'jogador'
export type CampaignStatus = 'ativa' | 'pausada' | 'encerrada'
export type RollType = 'pericia' | 'ataque' | 'dano' | 'resistencia' | 'livre' | 'secreto'
export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  invite_code: string
  status: CampaignStatus
  master_id: string
  created_at: string
  updated_at: string
}

export interface CampaignMember {
  id: string
  campaign_id: string
  user_id: string
  character_name: string | null
  joined_at: string
}

export interface Session {
  id: string
  campaign_id: string
  name: string | null
  is_active: boolean
  started_at: string
  ended_at: string | null
}

export interface DiceRoll {
  id: string
  session_id: string
  user_id: string
  character_name: string | null
  roll_type: RollType
  formula: string
  individual_results: number[]
  modifier: number
  total: number
  is_critical: boolean
  is_fumble: boolean
  natural_roll: number | null
  observation: string | null
  is_secret: boolean
  created_at: string
}

// Tipos com joins
export interface CampaignWithMaster extends Campaign {
  master: Profile
}

export interface CampaignMemberWithProfile extends CampaignMember {
  profile: Profile
}

export interface DiceRollWithUser extends DiceRoll {
  profile: Profile
}

// Perícias de Tormenta 20
export const TORMENTA_SKILLS = [
  'Acrobacia',
  'Adestramento',
  'Atletismo',
  'Atuação',
  'Cavalgar',
  'Conhecimento',
  'Cura',
  'Diplomacia',
  'Enganação',
  'Fortitude',
  'Furtividade',
  'Guerra',
  'Iniciativa',
  'Intimidação',
  'Intuição',
  'Investigação',
  'Jogatina',
  'Ladinagem',
  'Luta',
  'Misticismo',
  'Nobreza',
  'Ofício',
  'Percepção',
  'Pilotagem',
  'Pontaria',
  'Reflexos',
  'Religião',
  'Sobrevivência',
  'Vontade',
] as const

export type TormentaSkill = typeof TORMENTA_SKILLS[number]

export const RESISTANCE_TYPES: { value: ResistanceType; label: string }[] = [
  { value: 'fortitude', label: 'Fortitude' },
  { value: 'reflexos', label: 'Reflexos' },
  { value: 'vontade', label: 'Vontade' },
]

export interface InitiativeEntry {
  id: string
  session_id: string
  campaign_member_id: string | null
  character_name: string
  roll_value: number
  modifier: number
  total: number
  sort_order: number
  is_current: boolean
  is_npc: boolean
  created_at: string
}
