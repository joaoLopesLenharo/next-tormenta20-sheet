'use client'

import type React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Swords,
  Shield,
  Sparkles,
  BookOpen,
  Package,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Dices,
  ScrollText,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CharacterSheetPanel } from '@/components/character/character-sheet-panel'
// ---------------------------------------------------------------------------
// Tipos e helpers
// ---------------------------------------------------------------------------

/** Estado da ficha na visualização CRIS (compatível com JSON importado / Supabase) */
export interface CampaignSheetData {
  nome?: string
  raca?: string
  origem?: string
  divindade?: string
  tendencia?: string
  nivel?: number
  classes?: Array<{ nome: string; nivel: number }>
  atributos?: Record<string, number>
  pericias?: Record<string, { treinada?: boolean | string; atributo?: string; outros?: number; bonusExtra?: number | string; desconto?: string }>
  recursos?: {
    vida?: { atual: number; maximo: number; cor?: string }
    mana?: { atual: number; maximo: number; cor?: string }
    prana?: { atual: number; maximo: number; cor?: string }
    recursos_extras?: Array<{ nome: string; atual: number; maximo: number; cor?: string }>
  }
  inventario?: {
    armas?: Array<{ nome: string; dano?: string; critico?: string; alcance?: string; tipo?: string; equipada?: boolean; bonus_ataque?: number; peso?: number }>
    armaduras?: Array<{ nome: string; ca?: number; categoria?: string; equipada?: boolean; penalidade?: number; peso?: number }>
    itens?: Array<{ nome: string; quantidade?: number; qtd?: number; peso?: number; descricao?: string; equipada?: boolean }>
    dinheiro?: Record<string, number>
  }
  poderes?: Array<{ nome: string; descricao?: string; tipo?: string }>
  habilidades?: Array<{ nome: string; descricao?: string; tipo?: string }>
  magias?: Record<string, Record<string, Array<{ nome: string; escola?: string; execucao?: string; alcance?: string; duracao?: string; descricao?: string }>>>
  defenseAttributes?: string[]
  defenseAttribute?: string
  defesa_outros?: number
  deslocamento?: number
  foto?: string | { src: string; srcOriginal?: string; zoom: number; offsetX: number; offsetY: number }
  spellDCAttributes?: string[]
  spellDC_outros?: number
  oficiosPersonalizados?: Array<{ id: string; nome: string; atributo: string; treinada: boolean; outros: number }>
  [key: string]: unknown
}

const ATTR_LABELS: Record<string, string> = {
  forca: 'FOR',
  destreza: 'DES',
  constituicao: 'CON',
  inteligencia: 'INT',
  sabedoria: 'SAB',
  carisma: 'CAR',
}

const ATTR_FULL_LABELS: Record<string, string> = {
  forca: 'Força',
  destreza: 'Destreza',
  constituicao: 'Constituição',
  inteligencia: 'Inteligência',
  sabedoria: 'Sabedoria',
  carisma: 'Carisma',
}

const SKILLS_BY_ATTR: Record<string, string[]> = {
  forca: ['Atletismo', 'Luta'],
  destreza: ['Acrobacia', 'Cavalgar', 'Furtividade', 'Iniciativa', 'Ladinagem', 'Pilotagem', 'Pontaria', 'Reflexos'],
  constituicao: ['Fortitude'],
  inteligencia: ['Conhecimento', 'Guerra', 'Investigação', 'Misticismo', 'Nobreza', 'Ofício'],
  sabedoria: ['Cura', 'Intuição', 'Percepção', 'Religião', 'Sobrevivência', 'Vontade'],
  carisma: ['Adestramento', 'Atuação', 'Diplomacia', 'Enganação', 'Intimidação', 'Jogatina'],
}

function getAttrMod(value: number) {
  return Math.floor((value - 10) / 2)
}

function formatMod(mod: number) {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function calcDefense(char: CampaignSheetData) {
  const base = 10
  const selectedAttrs = char.defenseAttributes ?? (char.defenseAttribute ? [char.defenseAttribute] : ['destreza'])
  const attrMod = selectedAttrs.reduce(
    (sum, a) => sum + getAttrMod(char.atributos?.[a] ?? 10),
    0
  )
  const equippedArmor = char.inventario?.armaduras?.find((a) => a.equipada && a.categoria !== 'escudo')
  const equippedShield = char.inventario?.armaduras?.find((a) => a.equipada && a.categoria === 'escudo')
  return base + attrMod + (equippedArmor?.ca ?? 0) + (equippedShield?.ca ?? 0) + (char.defesa_outros ?? 0)
}

function calcSpellDC(char: CampaignSheetData) {
  const baseDC = 10
  const totalLevel = calcTotalLevel(char)
  const halfLevel = Math.floor(totalLevel / 2)
  const selectedAttrs = char.spellDCAttributes || ['inteligencia']
  const attrMod = selectedAttrs.reduce(
    (sum, attr) => sum + getAttrMod(char.atributos?.[attr] ?? 10),
    0
  )
  const itemsBonus = (char.inventario?.itens || [])
    .filter((item: any) => item.equipada)
    .reduce((sum, item: any) => sum + (item.bonus_cd || 0), 0)
  const outrosBonus = char.spellDC_outros || 0
  return baseDC + halfLevel + attrMod + itemsBonus + outrosBonus
}

function calcTotalLevel(char: CampaignSheetData) {
  return (char.classes ?? []).reduce((acc, c) => acc + (parseInt(String(c.nivel)) || 0), 0) || char.nivel || 1
}

/** Mescla atualização parcial mantendo aninhamentos usados na edição */
function mergeCharacterData(base: CampaignSheetData, patch: Partial<CampaignSheetData>): CampaignSheetData {
  const next = { ...base, ...patch } as CampaignSheetData
  if (patch.atributos && base.atributos) {
    next.atributos = { ...base.atributos, ...patch.atributos }
  }
  if (patch.recursos && base.recursos) {
    const r = base.recursos
    const p = patch.recursos
    next.recursos = {
      ...r,
      ...p,
      vida: p.vida ? { ...r.vida, ...p.vida } : r.vida,
      mana: p.mana ? { ...r.mana, ...p.mana } : r.mana,
      prana: p.prana ? { ...r.prana, ...p.prana } : r.prana,
    }
  }
  if (patch.pericias) {
    const baseP = base.pericias ?? {}
    next.pericias = { ...baseP }
    for (const key of Object.keys(patch.pericias)) {
      const sub = patch.pericias[key]
      if (sub && typeof sub === 'object') {
        next.pericias[key] = { ...(baseP[key] as object), ...sub } as NonNullable<CampaignSheetData['pericias']>[string]
      }
    }
  }
  return next
}

function calcSkillTotal(char: CampaignSheetData, skillName: string): number {
  const attrKey = Object.entries(SKILLS_BY_ATTR).find(([, skills]) => skills.includes(skillName))?.[0] ?? 'forca'
  const skill = char.pericias?.[skillName] ?? {}
  const selectedAttr = (skill.atributo ?? attrKey).toLowerCase()
  const attrValue = char.atributos?.[selectedAttr] ?? 10
  const attrMod = getAttrMod(attrValue)
  const totalLevel = calcTotalLevel(char)
  const halfLevel = Math.floor(totalLevel / 2)

  let trainingBonus = 0
  const isTrained = skill.treinada === true || (typeof skill.treinada === 'string' && skill.treinada !== 'destreinado')
  if (isTrained) {
    if (totalLevel >= 15) trainingBonus = 6
    else if (totalLevel >= 7) trainingBonus = 4
    else trainingBonus = 2
  }

  const outros = skill.outros ?? 0
  const bonusExtra = typeof skill.bonusExtra === 'number' ? skill.bonusExtra : parseInt(String(skill.bonusExtra)) || 0

  return halfLevel + attrMod + trainingBonus + outros + bonusExtra
}

/** Flatten nested magias object into a display-friendly list */
function flattenMagias(magias: CampaignSheetData['magias']): Array<{ nome: string; escola?: string; execucao?: string; alcance?: string; duracao?: string; descricao?: string; tipo: string; circulo: string }> {
  if (!magias) return []
  
  // If magias is already an array (legacy format), return as-is with defaults
  if (Array.isArray(magias)) {
    return (magias as any[]).map((m: any) => ({
      ...m,
      tipo: m.tipo || 'arcana',
      circulo: m.nivel ? `${m.nivel}º` : '1º',
    }))
  }

  const result: Array<{ nome: string; escola?: string; execucao?: string; alcance?: string; duracao?: string; descricao?: string; tipo: string; circulo: string }> = []
  
  for (const [tipo, circulos] of Object.entries(magias)) {
    if (!circulos || typeof circulos !== 'object') continue
    for (const [circulo, spells] of Object.entries(circulos)) {
      if (!Array.isArray(spells)) continue
      for (const spell of spells) {
        if (spell && spell.nome) {
          result.push({
            ...spell,
            tipo,
            circulo,
          })
        }
      }
    }
  }

  return result
}

/** Get character photo URL */
function getPhotoUrl(foto: CampaignSheetData['foto']): string | null {
  if (!foto) return null
  if (typeof foto === 'string') return foto || null
  return foto.src || null
}

/** Get photo style with zoom/offset */
function getPhotoStyle(foto: CampaignSheetData['foto']): React.CSSProperties {
  if (!foto || typeof foto === 'string') return {}
  return {
    transform: `scale(${foto.zoom || 1})`,
    transformOrigin: `${50 + (foto.offsetX || 0)}% ${50 + (foto.offsetY || 0)}%`,
  }
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

// --- Atributo radial (círculo no estilo CRIS) ---
function AttrCircle({
  label,
  abbr,
  value,
  size = 'md',
  editable = false,
  onValueChange,
}: {
  label: string
  abbr: string
  value: number
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
  onValueChange?: (v: number) => void
}) {
  const mod = getAttrMod(value)
  const sizeClasses = {
    sm: 'w-14 h-14 text-[10px]',
    md: 'w-18 h-18 text-xs',
    lg: 'w-22 h-22 text-sm',
  }
  const valueClasses = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }
  const modClasses = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs' }

  const clampAttr = (n: number) => Math.min(30, Math.max(1, n))

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-primary/40 bg-card flex flex-col items-center justify-center relative`}
      >
        {/* Anel decorativo externo */}
        <div className="absolute inset-0 rounded-full border border-primary/10" />
        {editable && onValueChange ? (
          <input
            type="number"
            min={1}
            max={30}
            aria-label={`Valor de ${abbr}`}
            className={`${valueClasses[size]} font-bold leading-none w-full text-center bg-transparent border-none outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            value={value}
            onChange={(e) => onValueChange(clampAttr(parseInt(e.target.value, 10) || 10))}
          />
        ) : (
          <span className={`${valueClasses[size]} font-bold leading-none`}>{value}</span>
        )}
        <span className={`${modClasses[size]} font-mono text-primary`}>{formatMod(mod)}</span>
      </div>
      <div className="text-center">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
        <p className="text-[10px] font-bold leading-none">{abbr}</p>
      </div>
    </div>
  )
}

// --- Barra de recurso estilo CRIS ---
function ResourceBar({
  label,
  atual,
  maximo,
  color,
  onDecrement,
  onIncrement,
  onFullDecrement,
  onFullIncrement,
  onSetValue,
  onMax,
}: {
  label: string
  atual: number
  maximo: number
  color: 'red' | 'blue' | 'orange' | 'custom'
  customColor?: string
  onDecrement: () => void
  onIncrement: () => void
  onFullDecrement: () => void
  onFullIncrement: () => void
  onSetValue: (v: number) => void
  onMax: () => void
}) {
  const pct = maximo > 0 ? Math.min(100, Math.max(0, (atual / maximo) * 100)) : 0

  const colorMap = {
    red: {
      bar: pct > 50 ? 'bg-red-500' : pct > 25 ? 'bg-orange-500' : 'bg-red-700',
      track: 'bg-red-950/60',
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      text: 'text-red-400',
      label: 'text-red-300',
      btn: 'bg-red-500/20 hover:bg-red-500/40 text-red-300',
    },
    blue: {
      bar: 'bg-blue-500',
      track: 'bg-blue-950/60',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      label: 'text-blue-300',
      btn: 'bg-blue-500/20 hover:bg-blue-500/40 text-blue-300',
    },
    orange: {
      bar: 'bg-orange-500',
      track: 'bg-orange-950/60',
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/5',
      text: 'text-orange-400',
      label: 'text-orange-300',
      btn: 'bg-orange-500/20 hover:bg-orange-500/40 text-orange-300',
    },
    custom: {
      bar: 'bg-purple-500',
      track: 'bg-purple-950/60',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/5',
      text: 'text-purple-400',
      label: 'text-purple-300',
      btn: 'bg-purple-500/20 hover:bg-purple-500/40 text-purple-300',
    },
  }

  const c = colorMap[color]

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-1.5 min-w-0 max-w-full overflow-hidden`}>
      <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${c.label}`}>{label}</span>
        <span className={`text-[10px] font-mono shrink-0 ${c.text}`}>
          {atual} / {maximo}
        </span>
      </div>

      {/* Barra */}
      <div className={`h-2.5 rounded-full ${c.track} overflow-hidden mb-1.5 relative`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-black/20 last:border-r-0" />
          ))}
        </div>
      </div>

      {/* Controles em coluna estreita: duas linhas para não estourar a largura */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-center gap-0.5 min-w-0">
          <button
            type="button"
            aria-label={`Decrementar ${label}`}
            className={`w-7 h-6 shrink-0 rounded flex items-center justify-center text-xs font-bold transition-colors ${c.btn}`}
            onClick={onDecrement}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <input
            type="number"
            aria-label={`Valor atual de ${label}`}
            className={`min-w-0 w-full max-w-[3.25rem] h-6 text-center text-xs font-bold bg-transparent border border-border/40 rounded px-0.5 outline-none ${c.text} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            value={atual}
            onChange={(e) => onSetValue(parseInt(e.target.value, 10) || 0)}
          />
          <button
            type="button"
            aria-label={`Incrementar ${label}`}
            className={`w-7 h-6 shrink-0 rounded flex items-center justify-center text-xs font-bold transition-colors ${c.btn}`}
            onClick={onIncrement}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-1 px-0.5">
          <button
            type="button"
            aria-label={`Zerar ${label}`}
            className={`flex-1 h-6 rounded flex items-center justify-center transition-colors ${c.btn}`}
            onClick={onFullDecrement}
          >
            <ChevronsLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            aria-label={`Maximizar ${label}`}
            className={`flex-1 h-6 rounded flex items-center justify-center transition-colors ${c.btn}`}
            onClick={onFullIncrement}
          >
            <ChevronsRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Linha de perícia ---
function SkillRow({
  name,
  total,
  trained,
  attrAbbr,
  halfLevel,
  trainingBonus,
  outros,
  onRoll,
  highlight,
  editable = false,
  onToggleTrained,
  onOutrosChange,
}: {
  name: string
  total: number
  trained: boolean
  attrAbbr: string
  halfLevel: number
  trainingBonus: number
  outros: number
  onRoll?: (name: string, total: number) => void
  highlight?: boolean
  editable?: boolean
  onToggleTrained?: () => void
  onOutrosChange?: (v: number) => void
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors cursor-default hover:bg-muted/40 ${
        highlight ? 'bg-primary/5' : ''
      }`}
    >
      <button
        aria-label={`Rolar ${name}`}
        className="w-5 h-5 rounded border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors shrink-0"
        onClick={() => onRoll?.(name, total)}
      >
        <Dices className="w-2.5 h-2.5" />
      </button>
      <span className={`flex-1 truncate ${trained ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {name}
        {trained && <span className="ml-1 text-[9px] text-primary/70 uppercase">T</span>}
      </span>
      <span className="text-muted-foreground/60 w-8 text-right font-mono text-[10px]">({attrAbbr})</span>
      <span className="text-muted-foreground/60 w-8 text-right font-mono text-[10px]">
        {halfLevel > 0 ? `+${halfLevel}` : halfLevel}
      </span>
      <span className={`w-8 text-right font-mono text-[10px] ${trainingBonus > 0 ? 'text-primary/80' : 'text-muted-foreground/40'}`}>
        {trainingBonus > 0 ? `+${trainingBonus}` : '—'}
      </span>
      {editable && onOutrosChange ? (
        <input
          type="number"
          aria-label={`Outros ${name}`}
          className="w-9 h-6 text-right font-mono text-[10px] rounded border border-border/60 bg-background px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={outros}
          onChange={(e) => onOutrosChange(parseInt(e.target.value, 10) || 0)}
        />
      ) : (
        <span className={`w-8 text-right font-mono text-[10px] ${outros !== 0 ? 'text-yellow-400/80' : 'text-muted-foreground/40'}`}>
          {outros !== 0 ? (outros > 0 ? `+${outros}` : outros) : '—'}
        </span>
      )}
      <span className={`w-10 text-right font-bold font-mono ${total >= 10 ? 'text-foreground' : 'text-muted-foreground'}`}>
        {formatMod(total)}
      </span>
      {editable && onToggleTrained && (
        <label className="flex items-center gap-0.5 shrink-0 text-[9px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={trained}
            onChange={() => onToggleTrained()}
            className="rounded border-border h-3 w-3"
          />
          T
        </label>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface CharacterSheetViewProps {
  character: CampaignSheetData
  /** Se verdadeiro, os recursos são somente leitura (ex: visualização do mestre) */
  readOnly?: boolean
  /** Quando definido com readOnly false, atributos, perícias e ajustes passam a ser editáveis e o estado sobe para o pai */
  onCharacterChange?: (next: CampaignSheetData) => void
  onResourceChange?: (resource: 'vida' | 'mana' | 'prana', newValue: number) => void
  onRollSkill?: (skillName: string, total: number) => void
  /**
   * Seção recolhível com o editor completo (mesmo da página inicial), sem alterar o layout principal da ficha de campanha.
   */
  complementFullEditor?: boolean
}

export function CharacterSheetView({
  character,
  readOnly = false,
  onCharacterChange,
  onResourceChange,
  onRollSkill,
  complementFullEditor = true,
}: CharacterSheetViewProps) {
  const [skillFilter, setSkillFilter] = useState('')
  const [activeTab, setActiveTab] = useState('combate')
  const [spellFilter, setSpellFilter] = useState('')

  const char = character

  const canEditSheet = !readOnly && !!onCharacterChange

  const patchCharacter = useCallback(
    (patch: Partial<CampaignSheetData>) => {
      if (!canEditSheet || !onCharacterChange) return
      onCharacterChange(mergeCharacterData(char, patch))
    },
    [canEditSheet, char, onCharacterChange]
  )

  // --- Cálculos derivados ---
  const totalLevel = useMemo(() => calcTotalLevel(char), [char])
  const halfLevel = useMemo(() => Math.floor(totalLevel / 2), [totalLevel])
  const defense = useMemo(() => calcDefense(char), [char])
  const spellDC = useMemo(() => calcSpellDC(char), [char])
  const allSkillNames = useMemo(
    () => Object.values(SKILLS_BY_ATTR).flat().sort(),
    []
  )
  const filteredSkills = useMemo(
    () =>
      allSkillNames.filter((s) =>
        s.toLowerCase().includes(skillFilter.toLowerCase())
      ),
    [allSkillNames, skillFilter]
  )

  // Flatten magias from nested format
  const allSpells = useMemo(() => flattenMagias(char.magias), [char.magias])
  const filteredSpells = useMemo(
    () => allSpells.filter((s) => s.nome.toLowerCase().includes(spellFilter.toLowerCase())),
    [allSpells, spellFilter]
  )

  // Group spells by type then circle for display
  const spellsByType = useMemo(() => {
    const grouped: Record<string, Record<string, typeof allSpells>> = {}
    for (const spell of filteredSpells) {
      if (!grouped[spell.tipo]) grouped[spell.tipo] = {}
      if (!grouped[spell.tipo][spell.circulo]) grouped[spell.tipo][spell.circulo] = []
      grouped[spell.tipo][spell.circulo].push(spell)
    }
    return grouped
  }, [filteredSpells])

  // Combine poderes + habilidades
  const allPowers = useMemo(() => {
    const poderes = (char.poderes || []).map((p) => ({ ...p, categoria: 'Poder' }))
    const habilidades = (char.habilidades || []).map((h) => ({ ...h, categoria: 'Habilidade' }))
    return [...habilidades, ...poderes]
  }, [char.poderes, char.habilidades])

  // Recursos com fallback
  const vida = char.recursos?.vida ?? { atual: 0, maximo: 0 }
  const mana = char.recursos?.mana ?? { atual: 0, maximo: 0 }
  const prana = char.recursos?.prana ?? { atual: 0, maximo: 0 }

  // Photo
  const photoUrl = getPhotoUrl(char.foto)
  const photoStyle = getPhotoStyle(char.foto)

  const handleResource = (resource: 'vida' | 'mana' | 'prana', delta: number) => {
    if (readOnly) return
    const cur = char.recursos?.[resource]?.atual ?? 0
    const max = char.recursos?.[resource]?.maximo ?? 0
    const next = Math.max(0, Math.min(max, cur + delta))
    if (canEditSheet) {
      const baseR = char.recursos ?? {}
      const slot = baseR[resource] ?? { atual: 0, maximo: 0 }
      patchCharacter({
        recursos: {
          ...baseR,
          [resource]: { ...slot, atual: next },
        },
      })
    } else {
      onResourceChange?.(resource, next)
    }
  }

  const handleResourceSet = (resource: 'vida' | 'mana' | 'prana', value: number) => {
    if (readOnly) return
    const max = char.recursos?.[resource]?.maximo ?? 0
    const clamped = Math.max(0, Math.min(max, value))
    if (canEditSheet) {
      const baseR = char.recursos ?? {}
      const slot = baseR[resource] ?? { atual: 0, maximo: 0 }
      patchCharacter({
        recursos: {
          ...baseR,
          [resource]: { ...slot, atual: clamped },
        },
      })
    } else {
      onResourceChange?.(resource, clamped)
    }
  }

  const handleResourceMax = (resource: 'vida' | 'mana' | 'prana') => {
    if (readOnly) return
    const max = char.recursos?.[resource]?.maximo ?? 0
    if (canEditSheet) {
      const baseR = char.recursos ?? {}
      const slot = baseR[resource] ?? { atual: 0, maximo: 0 }
      patchCharacter({
        recursos: {
          ...baseR,
          [resource]: { ...slot, atual: max },
        },
      })
    } else {
      onResourceChange?.(resource, max)
    }
  }

  // Armas equipadas para o painel de combate
  const weapons = char.inventario?.armas ?? []
  const equippedWeapons = weapons.filter((w) => w.equipada)
  const allWeapons = equippedWeapons.length > 0 ? equippedWeapons : weapons

  // tipo labels
  const typeLabels: Record<string, string> = {
    arcana: 'Arcana',
    divina: 'Divina',
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho da ficha */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start gap-3 p-3 border-b border-border/50 shrink-0">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-lg border-2 border-primary/30 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={char.nome || 'Personagem'}
              className="w-full h-full object-cover"
              style={photoStyle}
            />
          ) : (
            <span className="text-xl font-bold text-primary">
              {(char.nome || 'P')[0].toUpperCase()}
            </span>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold leading-none">{char.nome || 'Personagem'}</h2>
            {char.classes?.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">
                {c.nome} {c.nivel}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            {char.raca && <span>{char.raca}</span>}
            {char.origem && <span>• {char.origem}</span>}
            {char.divindade && <span>• {char.divindade}</span>}
            {totalLevel > 0 && <span>• Nível {totalLevel}</span>}
          </div>
        </div>
        {/* Stats rápidos */}
        <div className="flex items-start gap-3 shrink-0">
          <div className="text-center min-w-[3rem]">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Defesa</p>
            <p className="text-lg font-bold leading-none">{defense}</p>
            {canEditSheet && (
              <Input
                type="number"
                title="Bônus extra de defesa"
                className="h-6 mt-0.5 text-[10px] px-1 text-center"
                value={char.defesa_outros ?? 0}
                onChange={(e) =>
                  patchCharacter({ defesa_outros: parseInt(e.target.value, 10) || 0 })
                }
              />
            )}
          </div>
          <div className="text-center min-w-[3rem]">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">CD</p>
            <p className="text-lg font-bold leading-none text-purple-400">{spellDC}</p>
            {canEditSheet && (
              <Input
                type="number"
                title="Bônus extra na CD de magias"
                className="h-6 mt-0.5 text-[10px] px-1 text-center"
                value={char.spellDC_outros ?? 0}
                onChange={(e) =>
                  patchCharacter({ spellDC_outros: parseInt(e.target.value, 10) || 0 })
                }
              />
            )}
          </div>
          <div className="text-center min-w-[3.25rem]">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Desl.</p>
            {canEditSheet ? (
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <Input
                  type="number"
                  min={0}
                  className="h-7 w-11 text-sm font-bold text-center px-0.5"
                  value={char.deslocamento ?? 9}
                  onChange={(e) =>
                    patchCharacter({ deslocamento: Math.max(0, parseInt(e.target.value, 10) || 0) })
                  }
                />
                <span className="text-xs text-muted-foreground">m</span>
              </div>
            ) : (
              <p className="text-lg font-bold leading-none">{char.deslocamento ?? 9}m</p>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Layout principal: esquerda + conteúdo das abas */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ---- Coluna esquerda: atributos + recursos ---- */}
        <div className="w-44 min-w-0 shrink-0 border-r border-border/50 flex flex-col gap-3 p-3 overflow-y-auto overflow-x-hidden">
          {/* Atributos — grade 2×3 compacta */}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Atributos</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ATTR_LABELS).map(([key, abbr]) => (
                <AttrCircle
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  abbr={abbr}
                  value={char.atributos?.[key] ?? 10}
                  size="sm"
                  editable={canEditSheet}
                  onValueChange={
                    canEditSheet
                      ? (v) =>
                          patchCharacter({
                            atributos: {
                              ...(char.atributos ?? {}),
                              [key]: v,
                            } as Record<string, number>,
                          })
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div className="border-t border-border/40 pt-3 space-y-2">
            {/* Vida */}
            {vida.maximo > 0 && (
              <ResourceBar
                label="Vida"
                atual={vida.atual}
                maximo={vida.maximo}
                color="red"
                onDecrement={() => handleResource('vida', -1)}
                onIncrement={() => handleResource('vida', 1)}
                onFullDecrement={() => handleResourceSet('vida', 0)}
                onFullIncrement={() => handleResourceMax('vida')}
                onSetValue={(v) => handleResourceSet('vida', v)}
                onMax={() => handleResourceMax('vida')}
              />
            )}
            {/* Mana */}
            {mana.maximo > 0 && (
              <ResourceBar
                label="Mana"
                atual={mana.atual}
                maximo={mana.maximo}
                color="blue"
                onDecrement={() => handleResource('mana', -1)}
                onIncrement={() => handleResource('mana', 1)}
                onFullDecrement={() => handleResourceSet('mana', 0)}
                onFullIncrement={() => handleResourceMax('mana')}
                onSetValue={(v) => handleResourceSet('mana', v)}
                onMax={() => handleResourceMax('mana')}
              />
            )}
            {/* Prana */}
            {prana.maximo > 0 && (
              <ResourceBar
                label="Prana"
                atual={prana.atual}
                maximo={prana.maximo}
                color="orange"
                onDecrement={() => handleResource('prana', -1)}
                onIncrement={() => handleResource('prana', 1)}
                onFullDecrement={() => handleResourceSet('prana', 0)}
                onFullIncrement={() => handleResourceMax('prana')}
                onSetValue={(v) => handleResourceSet('prana', v)}
                onMax={() => handleResourceMax('prana')}
              />
            )}
          </div>
        </div>

        {/* ---- Centro: tabela de perícias ---- */}
        <div className="w-64 min-w-[17rem] shrink-0 border-r border-border/50 flex flex-col min-h-0">
          {/* Header da tabela */}
          <div className="p-2 border-b border-border/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                placeholder="Filtrar perícias..."
                className="h-7 pl-7 text-xs"
              />
            </div>
            {/* Cabeçalho colunas */}
            <div className="flex items-center gap-2 px-2 mt-2 text-[9px] uppercase tracking-widest text-muted-foreground/60">
              <div className="w-5 shrink-0" />
              <span className="flex-1">Perícia</span>
              <span className="w-8 text-right">Atr</span>
              <span className="w-8 text-right">N/2</span>
              <span className="w-8 text-right">Trei</span>
              <span className="w-9 text-right">Outros</span>
              <span className="w-10 text-right">Tot</span>
              {canEditSheet && <span className="w-6 shrink-0 text-center"> </span>}
            </div>
          </div>

          {/* Lista de perícias */}
          <div className="flex-1 overflow-y-auto py-1">
            {filteredSkills.map((skillName) => {
              const attrKey = Object.entries(SKILLS_BY_ATTR).find(([, skills]) => skills.includes(skillName))?.[0] ?? 'forca'
              const skill = char.pericias?.[skillName] ?? {}
              const selectedAttr = (skill.atributo ?? attrKey).toLowerCase()
              const attrValue = char.atributos?.[selectedAttr] ?? 10
              const attrMod = getAttrMod(attrValue)
              const isTrained = skill.treinada === true || (typeof skill.treinada === 'string' && skill.treinada !== 'destreinado')
              let trainingBonus = 0
              if (isTrained) {
                if (totalLevel >= 15) trainingBonus = 6
                else if (totalLevel >= 7) trainingBonus = 4
                else trainingBonus = 2
              }
              const rawOutros =
                typeof skill.outros === 'number' ? skill.outros : parseInt(String(skill.outros ?? 0), 10) || 0
              const bonusExtraNum =
                typeof skill.bonusExtra === 'number'
                  ? skill.bonusExtra
                  : parseInt(String(skill.bonusExtra ?? 0), 10) || 0
              const outrosTotal = rawOutros + bonusExtraNum
              const total = halfLevel + attrMod + trainingBonus + outrosTotal
              const attrAbbr = ATTR_LABELS[selectedAttr] ?? '???'

              return (
                <SkillRow
                  key={skillName}
                  name={skillName}
                  total={total}
                  trained={isTrained}
                  attrAbbr={attrAbbr}
                  halfLevel={halfLevel + attrMod}
                  trainingBonus={trainingBonus}
                  outros={canEditSheet ? rawOutros : outrosTotal}
                  onRoll={onRollSkill}
                  highlight={isTrained}
                  editable={canEditSheet}
                  onToggleTrained={
                    canEditSheet
                      ? () =>
                          patchCharacter({
                            pericias: {
                              [skillName]: {
                                ...skill,
                                treinada: isTrained ? 'destreinado' : true,
                              },
                            },
                          })
                      : undefined
                  }
                  onOutrosChange={
                    canEditSheet
                      ? (v) =>
                          patchCharacter({
                            pericias: {
                              [skillName]: {
                                ...skill,
                                outros: v,
                              },
                            },
                          })
                      : undefined
                  }
                />
              )
            })}
          </div>
        </div>

        {/* ---- Direita: abas de conteúdo ---- */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
            <TabsList className="shrink-0 rounded-none border-b border-border/50 bg-transparent h-10 px-3 justify-start gap-0">
              {[
                { value: 'combate', label: 'Combate', icon: Swords },
                { value: 'poderes', label: 'Poderes', icon: Sparkles },
                { value: 'magias', label: 'Magias', icon: BookOpen },
                { value: 'inventario', label: 'Inventário', icon: Package },
                { value: 'descricao', label: 'Descrição', icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs h-full px-3"
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* COMBATE */}
            <TabsContent value="combate" className="flex-1 overflow-y-auto p-3 mt-0">
              <div className="space-y-4">
                {/* Armas */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Armas</p>
                  {allWeapons.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhuma arma no inventário.</p>
                  ) : (
                    <div className="space-y-2">
                      {allWeapons.map((weapon, i) => {
                        const luta = calcSkillTotal(char, 'Luta')
                        const pontaria = calcSkillTotal(char, 'Pontaria')
                        const isRanged = weapon.tipo?.toLowerCase().includes('arco') || weapon.alcance ? parseInt(weapon.alcance ?? '0') > 1 : false
                        const baseBonus = isRanged ? pontaria : luta
                        const attackBonus = baseBonus + (weapon.bonus_ataque ?? 0)
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">
                                  {weapon.nome || 'Arma'}
                                  {weapon.equipada && (
                                    <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1 text-primary border-primary/40">
                                      Equipada
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Dano: <span className="font-mono text-foreground">{weapon.dano || '?'}</span>
                                  {weapon.critico && <span className="ml-2">Crítico: <span className="font-mono text-foreground">{weapon.critico}</span></span>}
                                  {weapon.alcance && parseInt(weapon.alcance) > 1 && <span className="ml-2">Alcance: <span className="font-mono text-foreground">{weapon.alcance}m</span></span>}
                                  {weapon.tipo && <span className="ml-2">Tipo: <span className="text-foreground">{weapon.tipo}</span></span>}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-muted-foreground uppercase">Ataque</p>
                                <p className="text-base font-bold font-mono text-primary">{formatMod(attackBonus)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Armaduras */}
                {(char.inventario?.armaduras?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Armaduras & Escudos</p>
                    <div className="space-y-1">
                      {char.inventario!.armaduras!.map((armor, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded border border-border/30 bg-muted/10 text-xs">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-muted-foreground" />
                            <span className={armor.equipada ? 'text-foreground' : 'text-muted-foreground'}>
                              {armor.nome}
                              {armor.equipada && <span className="ml-1 text-[9px] text-primary/70">(Eq)</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {armor.penalidade ? (
                              <span className="font-mono text-red-400 text-[10px]">Pen. {armor.penalidade}</span>
                            ) : null}
                            <span className="font-mono font-bold">{armor.ca != null ? `+${armor.ca}` : '?'} CA</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* PODERES & HABILIDADES */}
            <TabsContent value="poderes" className="flex-1 overflow-y-auto p-3 mt-0">
              {allPowers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum poder ou habilidade registrada.</p>
              ) : (
                <div className="space-y-2">
                  {allPowers.map((poder, i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{poder.nome}</p>
                        {poder.tipo && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{poder.tipo}</Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[9px] h-4 px-1.5 ${
                            poder.categoria === 'Habilidade'
                              ? 'border-blue-500/40 text-blue-400'
                              : 'border-amber-500/40 text-amber-400'
                          }`}
                        >
                          {poder.categoria}
                        </Badge>
                      </div>
                      {poder.descricao && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{poder.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* MAGIAS */}
            <TabsContent value="magias" className="flex-1 overflow-y-auto p-3 mt-0">
              {allSpells.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma magia registrada.</p>
              ) : (
                <div className="space-y-4">
                  {/* Filtro */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      value={spellFilter}
                      onChange={(e) => setSpellFilter(e.target.value)}
                      placeholder="Filtrar magias..."
                      className="h-7 pl-7 text-xs"
                    />
                  </div>

                  {/* CD de magias */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <ScrollText className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-300">CD de Magias:</span>
                    <span className="text-sm font-bold text-purple-400">{spellDC}</span>
                  </div>

                  {/* Magias agrupadas por tipo e círculo */}
                  {Object.entries(spellsByType).map(([tipo, circulos]) => (
                    <div key={tipo}>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        {typeLabels[tipo] || tipo}
                      </p>
                      {Object.entries(circulos)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([circulo, spells]) => (
                          <div key={circulo} className="mb-3">
                            <p className="text-[9px] font-semibold text-primary/70 uppercase mb-1 ml-1">
                              {circulo} Círculo
                            </p>
                            <div className="space-y-1.5">
                              {spells.map((magia, i) => (
                                <div key={i} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold">{magia.nome}</p>
                                    {magia.escola && (
                                      <span className="text-[10px] text-muted-foreground">{magia.escola}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                                    {magia.execucao && <span>Execução: <span className="text-foreground">{magia.execucao}</span></span>}
                                    {magia.alcance && <span>Alcance: <span className="text-foreground">{magia.alcance}</span></span>}
                                    {magia.duracao && <span>Duração: <span className="text-foreground">{magia.duracao}</span></span>}
                                  </div>
                                  {magia.descricao && (
                                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{magia.descricao}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* INVENTÁRIO */}
            <TabsContent value="inventario" className="flex-1 overflow-y-auto p-3 mt-0">
              <div className="space-y-4">
                {/* Dinheiro */}
                {char.inventario?.dinheiro && Object.values(char.inventario.dinheiro).some((v) => v > 0) && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Dinheiro</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(char.inventario.dinheiro)
                        .filter(([, v]) => v > 0)
                        .map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs py-1 px-2 font-mono">
                            {value} {key}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Itens */}
                {(char.inventario?.itens?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum item no inventário.</p>
                ) : (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Itens</p>
                    <div className="space-y-1">
                      {char.inventario!.itens!.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded border border-border/30 bg-muted/10 text-xs">
                          <div>
                            <p className="font-medium">
                              {item.nome}
                              {item.equipada && <span className="ml-1 text-[9px] text-primary/70">(Eq)</span>}
                            </p>
                            {item.descricao && <p className="text-muted-foreground">{item.descricao}</p>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {(item.quantidade ?? item.qtd) != null && (
                              <span className="text-muted-foreground">×{item.quantidade ?? item.qtd}</span>
                            )}
                            {item.peso != null && (
                              <span className="text-muted-foreground font-mono">{item.peso}kg</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* DESCRIÇÃO */}
            <TabsContent value="descricao" className="flex-1 overflow-y-auto p-3 mt-0">
              <div className="space-y-3 text-sm">
                {/* Foto grande */}
                {photoUrl && (
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 rounded-xl border-2 border-primary/30 bg-muted overflow-hidden">
                      <img
                        src={photoUrl}
                        alt={char.nome || 'Personagem'}
                        className="w-full h-full object-cover"
                        style={photoStyle}
                      />
                    </div>
                  </div>
                )}
                
                {[
                  { label: 'Nome', value: char.nome },
                  { label: 'Raça', value: char.raca },
                  { label: 'Origem', value: char.origem },
                  { label: 'Divindade', value: char.divindade },
                  { label: 'Tendência', value: char.tendencia },
                  { label: 'Nível', value: totalLevel > 0 ? totalLevel : undefined },
                  { label: 'Classes', value: char.classes?.map((c) => `${c.nome} ${c.nivel}`).join(', ') },
                ].filter(f => f.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2 border-b border-border/30 pb-2">
                    <span className="text-muted-foreground w-20 shrink-0 text-xs uppercase tracking-wide">{label}</span>
                    <span className="text-foreground">{String(value)}</span>
                  </div>
                ))}

                {/* Atributos completos */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Atributos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(ATTR_LABELS).map(([key, abbr]) => {
                      const val = char.atributos?.[key] ?? 10
                      const mod = getAttrMod(val)
                      return (
                        <div key={key} className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 text-xs">
                          <span className="text-muted-foreground">{ATTR_FULL_LABELS[key]}</span>
                          <span className="font-bold">{val} <span className="font-mono text-primary text-[10px]">({formatMod(mod)})</span></span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Estatísticas calculadas */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Estatísticas</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 text-xs">
                      <span className="text-muted-foreground">Defesa</span>
                      <span className="font-bold">{defense}</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 text-xs">
                      <span className="text-muted-foreground">CD Magias</span>
                      <span className="font-bold text-purple-400">{spellDC}</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 text-xs">
                      <span className="text-muted-foreground">Deslocamento</span>
                      <span className="font-bold">{char.deslocamento ?? 9}m</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 text-xs">
                      <span className="text-muted-foreground">Nível Total</span>
                      <span className="font-bold">{totalLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Editor completo (página inicial): complemento; recolhido por padrão para manter a mesma aparência */}
      {complementFullEditor && onCharacterChange && (
        <Collapsible className="group shrink-0 border-t border-border/50 bg-muted/5">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors">
            <span>Editor completo (mesmas opções da página inicial)</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="max-h-[min(72vh,880px)] min-h-[320px] overflow-y-auto border-t border-border/40 bg-background">
              <CharacterSheetPanel
                character={char as any}
                readOnly={readOnly}
                persistLocalSheets={false}
                onUpdateCharacter={(data) => onCharacterChange(data as CampaignSheetData)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
