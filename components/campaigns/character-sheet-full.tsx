'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  Swords,
  Shield,
  Sparkles,
  BookOpen,
  Package,
  FileText,
  Search,
  Heart,
  Zap,
  Droplets,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Dices,
  Minus,
  Plus,
  Settings,
  Dice6,
  ChevronDown,
  Trash2,
  Save,
  Loader2,
  Check,
  ScrollText,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Tipos e helpers
// ---------------------------------------------------------------------------

interface CharacterData {
  nome?: string
  raca?: string
  origem?: string
  divindade?: string
  tendencia?: string
  nivel?: number
  deslocamento?: number
  classes?: Array<{ nome: string; nivel: number }>
  atributos?: Record<string, number>
  pericias?: Record<string, { treinada?: boolean | string; atributo?: string; outros?: number; bonusExtra?: number }>
  recursos?: {
    vida?: { atual: number; maximo: number }
    mana?: { atual: number; maximo: number }
    prana?: { atual: number; maximo: number }
    recursos_extras?: Array<{ id: string; nome: string; atual: number; maximo: number; cor: string }>
  }
  inventario?: {
    armas?: Array<{ nome: string; dano?: string; critico?: string; alcance?: string; tipo?: string; equipada?: boolean; bonus_ataque?: number; peso?: number }>
    armaduras?: Array<{ nome: string; ca?: number; categoria?: string; equipada?: boolean; peso?: number }>
    itens?: Array<{ nome: string; qtd?: number; peso?: number; descricao?: string; quantidade?: number }>
    dinheiro?: Record<string, number>
  }
  poderes?: Array<{ nome: string; descricao?: string; tipo?: string }>
  magias?: Array<{ nome: string; nivel?: number; escola?: string; descricao?: string }> | {
    arcana?: Record<string, Array<{ nome: string; descricao?: string }>>
    divina?: Record<string, Array<{ nome: string; descricao?: string }>>
  }
  habilidades?: Array<{ nome: string; descricao?: string; tipo?: string }>
  defenseAttributes?: string[]
  defenseAttribute?: string
  defesa_outros?: number
  defesa?: number
  spellDCAttributes?: string[]
  spellDC_outros?: number
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

const ATTR_NAMES: Record<string, string> = {
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

function calcDefense(char: CharacterData) {
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

function calcSpellDC(char: CharacterData) {
  const selectedAttrs = char.spellDCAttributes ?? ['inteligencia']
  const attrMod = selectedAttrs.reduce(
    (sum, a) => sum + getAttrMod(char.atributos?.[a] ?? 10),
    0
  )
  const totalLevel = calcTotalLevel(char)
  const halfLevel = Math.floor(totalLevel / 2)
  return 10 + halfLevel + attrMod + (char.spellDC_outros ?? 0)
}

function calcTotalLevel(char: CharacterData) {
  return (char.classes ?? []).reduce((acc, c) => acc + (parseInt(String(c.nivel)) || 0), 0) || char.nivel || 1
}

function calcSkillTotal(char: CharacterData, skillName: string): number {
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

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function AttrCircle({
  label,
  abbr,
  value,
  onChange,
  size = 'lg',
  editable = false,
}: {
  label: string
  abbr: string
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}) {
  const mod = getAttrMod(value)
  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-24 h-24 text-base',
  }
  const valueClasses = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }
  const modClasses = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-primary/40 bg-card flex flex-col items-center justify-center relative hover:border-primary/60 transition-colors`}
      >
        <div className="absolute inset-0 rounded-full border border-primary/10" />
        {editable ? (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange?.(parseInt(e.target.value) || 10)}
            className={`${valueClasses[size]} font-bold leading-none text-center bg-transparent border-none p-0 w-12 h-auto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        ) : (
          <span className={`${valueClasses[size]} font-bold leading-none`}>{value}</span>
        )}
        <span className={`${modClasses[size]} font-mono text-primary`}>{formatMod(mod)}</span>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
        <p className="text-sm font-bold leading-none">{abbr}</p>
      </div>
    </div>
  )
}

function ResourceBar({
  label,
  atual,
  maximo,
  color,
  onDecrement,
  onIncrement,
  onSetAtual,
  onSetMaximo,
  onMax,
  editable = true,
}: {
  label: string
  atual: number
  maximo: number
  color: 'red' | 'blue' | 'orange' | 'purple'
  onDecrement?: () => void
  onIncrement?: () => void
  onSetAtual?: (v: number) => void
  onSetMaximo?: (v: number) => void
  onMax?: () => void
  editable?: boolean
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
    purple: {
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
    <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-bold uppercase tracking-widest ${c.label}`}>{label}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={atual}
            onChange={(e) => onSetAtual?.(parseInt(e.target.value) || 0)}
            disabled={!editable}
            className={`w-14 h-7 text-center text-sm font-bold bg-transparent border border-border/40 ${c.text} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          <span className={`text-sm ${c.text}`}>/</span>
          <Input
            type="number"
            value={maximo}
            onChange={(e) => onSetMaximo?.(parseInt(e.target.value) || 0)}
            disabled={!editable}
            className={`w-14 h-7 text-center text-sm font-bold bg-transparent border border-border/40 ${c.text} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>
      </div>

      <div className={`h-4 rounded-full ${c.track} overflow-hidden mb-2 relative`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-black/20 last:border-r-0" />
          ))}
        </div>
      </div>

      {editable && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${c.btn}`}
            onClick={() => onSetAtual?.(0)}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${c.btn}`}
            onClick={onDecrement}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${c.btn}`}
            onClick={onIncrement}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${c.btn}`}
            onClick={onMax}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function SkillRow({
  name,
  total,
  trained,
  attrAbbr,
  halfLevel,
  trainingBonus,
  outros,
  defaultAttr,
  selectedAttr,
  onRoll,
  onToggleTrained,
  onChangeAttr,
  onChangeOutros,
  highlight,
  editable = false,
}: {
  name: string
  total: number
  trained: boolean
  attrAbbr: string
  halfLevel: number
  trainingBonus: number
  outros: number
  defaultAttr: string
  selectedAttr: string
  onRoll?: (name: string, total: number) => void
  onToggleTrained?: () => void
  onChangeAttr?: (attr: string) => void
  onChangeOutros?: (value: number) => void
  highlight?: boolean
  editable?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted/40 ${
        highlight ? 'bg-primary/5' : ''
      }`}
    >
      <button
        aria-label={`Rolar ${name}`}
        className="w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 transition-colors shrink-0"
        onClick={() => onRoll?.(name, total)}
      >
        <Dices className="w-4 h-4" />
      </button>
      
      {editable && (
        <Checkbox
          checked={trained}
          onCheckedChange={() => onToggleTrained?.()}
          className="shrink-0"
        />
      )}
      
      <span className={`flex-1 ${trained ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {name}
        {trained && <span className="ml-1 text-xs text-primary/70 uppercase">T</span>}
      </span>
      
      {editable ? (
        <Select value={selectedAttr} onValueChange={(v) => onChangeAttr?.(v)}>
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ATTR_LABELS).map(([key, abbr]) => (
              <SelectItem key={key} value={key} className="text-xs">
                {abbr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-muted-foreground/60 w-12 text-right font-mono text-sm">({attrAbbr})</span>
      )}
      
      <span className="text-muted-foreground/60 w-10 text-right font-mono text-sm">
        {halfLevel > 0 ? `+${halfLevel}` : halfLevel}
      </span>
      
      <span className={`w-10 text-right font-mono text-sm ${trainingBonus > 0 ? 'text-primary/80' : 'text-muted-foreground/40'}`}>
        {trainingBonus > 0 ? `+${trainingBonus}` : '—'}
      </span>
      
      {editable ? (
        <Input
          type="number"
          value={outros}
          onChange={(e) => onChangeOutros?.(parseInt(e.target.value) || 0)}
          className="w-14 h-7 text-center text-sm font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      ) : (
        <span className={`w-10 text-right font-mono text-sm ${outros !== 0 ? 'text-yellow-400/80' : 'text-muted-foreground/40'}`}>
          {outros !== 0 ? (outros > 0 ? `+${outros}` : outros) : '—'}
        </span>
      )}
      
      <span className={`w-12 text-right font-bold font-mono text-base ${total >= 10 ? 'text-foreground' : 'text-muted-foreground'}`}>
        {formatMod(total)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface CharacterSheetFullProps {
  character: CharacterData
  readOnly?: boolean
  onChange?: (character: CharacterData) => void
  onSave?: (character: CharacterData) => Promise<void>
  onRollSkill?: (skillName: string, total: number) => void
  saving?: boolean
  lastSaved?: Date | null
}

export function CharacterSheetFull({
  character: initialCharacter,
  readOnly = false,
  onChange,
  onSave,
  onRollSkill,
  saving = false,
  lastSaved,
}: CharacterSheetFullProps) {
  const [character, setCharacter] = useState<CharacterData>(initialCharacter)
  const [activeTab, setActiveTab] = useState('basic-info')
  const [skillFilter, setSkillFilter] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync with external character prop
  useEffect(() => {
    setCharacter(initialCharacter)
  }, [initialCharacter])

  const updateCharacter = useCallback((updates: Partial<CharacterData>) => {
    setCharacter(prev => {
      const updated = { ...prev, ...updates }
      onChange?.(updated)
      setHasChanges(true)
      
      // Auto-save with debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        onSave?.(updated)
        setHasChanges(false)
      }, 2000)
      
      return updated
    })
  }, [onChange, onSave])

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Cálculos derivados
  const totalLevel = useMemo(() => calcTotalLevel(character), [character])
  const halfLevel = useMemo(() => Math.floor(totalLevel / 2), [totalLevel])
  const defense = useMemo(() => calcDefense(character), [character])
  const spellDC = useMemo(() => calcSpellDC(character), [character])
  
  const allSkillNames = useMemo(
    () => Object.values(SKILLS_BY_ATTR).flat().sort(),
    []
  )
  const filteredSkills = useMemo(
    () => allSkillNames.filter((s) => s.toLowerCase().includes(skillFilter.toLowerCase())),
    [allSkillNames, skillFilter]
  )

  // Recursos
  const vida = character.recursos?.vida ?? { atual: 0, maximo: 0 }
  const mana = character.recursos?.mana ?? { atual: 0, maximo: 0 }
  const prana = character.recursos?.prana ?? { atual: 0, maximo: 0 }

  const handleResource = (resource: 'vida' | 'mana' | 'prana', delta: number) => {
    const cur = character.recursos?.[resource]?.atual ?? 0
    const max = character.recursos?.[resource]?.maximo ?? 0
    const next = Math.max(0, Math.min(max, cur + delta))
    updateCharacter({
      recursos: {
        ...character.recursos,
        [resource]: { ...character.recursos?.[resource], atual: next },
      },
    })
  }

  const handleResourceSet = (resource: 'vida' | 'mana' | 'prana', field: 'atual' | 'maximo', value: number) => {
    updateCharacter({
      recursos: {
        ...character.recursos,
        [resource]: { ...character.recursos?.[resource], [field]: Math.max(0, value) },
      },
    })
  }

  // Flatten magias if stored in nested structure
  const magiasList = useMemo(() => {
    if (Array.isArray(character.magias)) {
      return character.magias
    }
    const list: Array<{ nome: string; nivel?: number; escola?: string; descricao?: string }> = []
    const magias = character.magias as any
    if (magias?.arcana) {
      Object.entries(magias.arcana).forEach(([nivel, spells]: [string, any]) => {
        if (Array.isArray(spells)) {
          spells.forEach((spell: any) => {
            list.push({ ...spell, nivel: parseInt(nivel) || 1, escola: 'Arcana' })
          })
        }
      })
    }
    if (magias?.divina) {
      Object.entries(magias.divina).forEach(([nivel, spells]: [string, any]) => {
        if (Array.isArray(spells)) {
          spells.forEach((spell: any) => {
            list.push({ ...spell, nivel: parseInt(nivel) || 1, escola: 'Divina' })
          })
        }
      })
    }
    return list
  }, [character.magias])

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* Cabeçalho */}
      <div className="shrink-0 border-b border-border/50 bg-card/50">
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border-2 border-primary/30 bg-muted flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {(character.nome || 'P')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{character.nome || 'Personagem'}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {character.classes?.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {c.nome} {c.nivel}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {character.raca && <span>{character.raca}</span>}
                  {character.origem && <span>| {character.origem}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : hasChanges ? (
                <div className="flex items-center gap-2 text-sm text-yellow-500">
                  <span>Alterações pendentes</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="w-4 h-4" />
                  <span>Salvo</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Card className="p-3 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vida</p>
                  <p className="text-lg font-bold">{vida.atual}/{vida.maximo}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Defesa</p>
                  <p className="text-lg font-bold">{defense}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nível</p>
                  <p className="text-lg font-bold">{totalLevel}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CD Magias</p>
                  <p className="text-lg font-bold">{spellDC}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-row gap-1 p-2 bg-muted/50 border-t border-border/50 w-full overflow-x-auto">
            <TabsTrigger
              value="basic-info"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              <span>Básico</span>
            </TabsTrigger>
            <TabsTrigger
              value="attributes"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <Dice6 className="w-4 h-4" />
              <span>Atributos</span>
            </TabsTrigger>
            <TabsTrigger
              value="defense"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <Shield className="w-4 h-4" />
              <span>Defesa</span>
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              <span>Perícias</span>
            </TabsTrigger>
            <TabsTrigger
              value="abilities"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              <span>Habilidades</span>
            </TabsTrigger>
            <TabsTrigger
              value="powers"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Poderes</span>
            </TabsTrigger>
            <TabsTrigger
              value="magic"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <ScrollText className="w-4 h-4" />
              <span>Magias</span>
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
            >
              <Package className="w-4 h-4" />
              <span>Inventário</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo das abas */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* BÁSICO */}
          <TabsContent value="basic-info" className="p-4 mt-0">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={character.nome || ''}
                    onChange={(e) => updateCharacter({ nome: e.target.value })}
                    placeholder="Nome do personagem"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raca">Raça</Label>
                  <Input
                    id="raca"
                    value={character.raca || ''}
                    onChange={(e) => updateCharacter({ raca: e.target.value })}
                    placeholder="Raça"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Input
                    id="origem"
                    value={character.origem || ''}
                    onChange={(e) => updateCharacter({ origem: e.target.value })}
                    placeholder="Origem"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="divindade">Divindade</Label>
                  <Input
                    id="divindade"
                    value={character.divindade || ''}
                    onChange={(e) => updateCharacter({ divindade: e.target.value })}
                    placeholder="Divindade"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tendencia">Tendência</Label>
                  <Input
                    id="tendencia"
                    value={character.tendencia || ''}
                    onChange={(e) => updateCharacter({ tendencia: e.target.value })}
                    placeholder="Tendência"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deslocamento">Deslocamento</Label>
                  <Input
                    id="deslocamento"
                    type="number"
                    value={character.deslocamento || 9}
                    onChange={(e) => updateCharacter({ deslocamento: parseInt(e.target.value) || 9 })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Classes */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold">Classes</h4>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newClasses = [...(character.classes || []), { nome: '', nivel: 1 }]
                        updateCharacter({ classes: newClasses })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Classe
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {(character.classes || []).map((cls, index) => (
                    <div key={`class-${index}`} className="flex items-center gap-2">
                      <Input
                        value={cls.nome || ''}
                        onChange={(e) => {
                          const newClasses = [...(character.classes || [])]
                          newClasses[index] = { ...cls, nome: e.target.value }
                          updateCharacter({ classes: newClasses })
                        }}
                        placeholder="Nome da classe"
                        className="flex-1"
                        disabled={readOnly}
                      />
                      <Input
                        type="number"
                        min="1"
                        value={cls.nivel || 1}
                        onChange={(e) => {
                          const newClasses = [...(character.classes || [])]
                          newClasses[index] = { ...cls, nivel: parseInt(e.target.value) || 1 }
                          updateCharacter({ classes: newClasses })
                        }}
                        className="w-20"
                        disabled={readOnly}
                      />
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newClasses = (character.classes || []).filter((_, i) => i !== index)
                            updateCharacter({ classes: newClasses })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ATRIBUTOS */}
          <TabsContent value="attributes" className="p-4 mt-0">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Dice6 className="w-5 h-5 text-primary" />
                Atributos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-items-center">
                {Object.entries(ATTR_LABELS).map(([key, abbr]) => (
                  <AttrCircle
                    key={key}
                    label={ATTR_NAMES[key]}
                    abbr={abbr}
                    value={character.atributos?.[key] ?? 10}
                    onChange={(value) => updateCharacter({
                      atributos: { ...character.atributos, [key]: value }
                    })}
                    size="lg"
                    editable={!readOnly}
                  />
                ))}
              </div>
            </Card>

            {/* Recursos */}
            <Card className="p-6 mt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Recursos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResourceBar
                  label="Vida"
                  atual={vida.atual}
                  maximo={vida.maximo}
                  color="red"
                  onDecrement={() => handleResource('vida', -1)}
                  onIncrement={() => handleResource('vida', 1)}
                  onSetAtual={(v) => handleResourceSet('vida', 'atual', v)}
                  onSetMaximo={(v) => handleResourceSet('vida', 'maximo', v)}
                  onMax={() => handleResourceSet('vida', 'atual', vida.maximo)}
                  editable={!readOnly}
                />
                <ResourceBar
                  label="Mana"
                  atual={mana.atual}
                  maximo={mana.maximo}
                  color="blue"
                  onDecrement={() => handleResource('mana', -1)}
                  onIncrement={() => handleResource('mana', 1)}
                  onSetAtual={(v) => handleResourceSet('mana', 'atual', v)}
                  onSetMaximo={(v) => handleResourceSet('mana', 'maximo', v)}
                  onMax={() => handleResourceSet('mana', 'atual', mana.maximo)}
                  editable={!readOnly}
                />
                <ResourceBar
                  label="Prana"
                  atual={prana.atual}
                  maximo={prana.maximo}
                  color="orange"
                  onDecrement={() => handleResource('prana', -1)}
                  onIncrement={() => handleResource('prana', 1)}
                  onSetAtual={(v) => handleResourceSet('prana', 'atual', v)}
                  onSetMaximo={(v) => handleResourceSet('prana', 'maximo', v)}
                  onMax={() => handleResourceSet('prana', 'atual', prana.maximo)}
                  editable={!readOnly}
                />
              </div>
            </Card>
          </TabsContent>

          {/* DEFESA */}
          <TabsContent value="defense" className="p-4 mt-0">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Defesa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cálculo da Defesa */}
                <div className="space-y-4">
                  <div className="text-center p-6 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Defesa Total</p>
                    <p className="text-5xl font-bold text-primary">{defense}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Atributo(s) para Defesa</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ATTR_LABELS).map(([key, abbr]) => {
                        const selected = character.defenseAttributes?.includes(key) ?? (key === 'destreza')
                        return (
                          <Button
                            key={key}
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            disabled={readOnly}
                            onClick={() => {
                              const current = character.defenseAttributes ?? ['destreza']
                              const updated = selected
                                ? current.filter(a => a !== key)
                                : [...current, key]
                              updateCharacter({ defenseAttributes: updated.length > 0 ? updated : ['destreza'] })
                            }}
                          >
                            {abbr}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defesa_outros">Bônus de Outros</Label>
                    <Input
                      id="defesa_outros"
                      type="number"
                      value={character.defesa_outros || 0}
                      onChange={(e) => updateCharacter({ defesa_outros: parseInt(e.target.value) || 0 })}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                {/* Armaduras */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Armaduras & Escudos</h4>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newArmors = [...(character.inventario?.armaduras || []), { nome: '', ca: 0, categoria: '', equipada: false }]
                          updateCharacter({
                            inventario: { ...character.inventario, armaduras: newArmors }
                          })
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(character.inventario?.armaduras || []).map((armor, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                        <Checkbox
                          checked={armor.equipada}
                          onCheckedChange={(checked) => {
                            const newArmors = [...(character.inventario?.armaduras || [])]
                            newArmors[index] = { ...armor, equipada: !!checked }
                            updateCharacter({
                              inventario: { ...character.inventario, armaduras: newArmors }
                            })
                          }}
                          disabled={readOnly}
                        />
                        <Input
                          value={armor.nome || ''}
                          onChange={(e) => {
                            const newArmors = [...(character.inventario?.armaduras || [])]
                            newArmors[index] = { ...armor, nome: e.target.value }
                            updateCharacter({
                              inventario: { ...character.inventario, armaduras: newArmors }
                            })
                          }}
                          placeholder="Nome"
                          className="flex-1"
                          disabled={readOnly}
                        />
                        <Input
                          type="number"
                          value={armor.ca || 0}
                          onChange={(e) => {
                            const newArmors = [...(character.inventario?.armaduras || [])]
                            newArmors[index] = { ...armor, ca: parseInt(e.target.value) || 0 }
                            updateCharacter({
                              inventario: { ...character.inventario, armaduras: newArmors }
                            })
                          }}
                          placeholder="CA"
                          className="w-16"
                          disabled={readOnly}
                        />
                        <Select
                          value={armor.categoria || ''}
                          onValueChange={(value) => {
                            const newArmors = [...(character.inventario?.armaduras || [])]
                            newArmors[index] = { ...armor, categoria: value }
                            updateCharacter({
                              inventario: { ...character.inventario, armaduras: newArmors }
                            })
                          }}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leve">Leve</SelectItem>
                            <SelectItem value="pesada">Pesada</SelectItem>
                            <SelectItem value="escudo">Escudo</SelectItem>
                          </SelectContent>
                        </Select>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newArmors = (character.inventario?.armaduras || []).filter((_, i) => i !== index)
                              updateCharacter({
                                inventario: { ...character.inventario, armaduras: newArmors }
                              })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* PERÍCIAS */}
          <TabsContent value="skills" className="p-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Perícias
                </h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    placeholder="Filtrar perícias..."
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Cabeçalho */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground border-b border-border/50 mb-2">
                <div className="w-7 shrink-0" />
                {!readOnly && <div className="w-5 shrink-0" />}
                <span className="flex-1">Perícia</span>
                <span className="w-20 text-center">Atributo</span>
                <span className="w-10 text-right">N/2 + Atr</span>
                <span className="w-10 text-right">Treino</span>
                <span className={!readOnly ? 'w-14 text-center' : 'w-10 text-right'}>Outros</span>
                <span className="w-12 text-right">Total</span>
              </div>

              {/* Lista de perícias */}
              <div className="space-y-1">
                {filteredSkills.map((skillName) => {
                  const defaultAttr = Object.entries(SKILLS_BY_ATTR).find(([, skills]) => skills.includes(skillName))?.[0] ?? 'forca'
                  const skill = character.pericias?.[skillName] ?? {}
                  const selectedAttr = (skill.atributo ?? defaultAttr).toLowerCase()
                  const attrValue = character.atributos?.[selectedAttr] ?? 10
                  const attrMod = getAttrMod(attrValue)
                  const isTrained = skill.treinada === true || (typeof skill.treinada === 'string' && skill.treinada !== 'destreinado')
                  
                  let trainingBonus = 0
                  if (isTrained) {
                    if (totalLevel >= 15) trainingBonus = 6
                    else if (totalLevel >= 7) trainingBonus = 4
                    else trainingBonus = 2
                  }
                  
                  const outros = (skill.outros ?? 0) + (typeof skill.bonusExtra === 'number' ? skill.bonusExtra : parseInt(String(skill.bonusExtra ?? 0)) || 0)
                  const total = halfLevel + attrMod + trainingBonus + outros
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
                      outros={outros}
                      defaultAttr={defaultAttr}
                      selectedAttr={selectedAttr}
                      onRoll={onRollSkill}
                      onToggleTrained={() => {
                        const newPericias = {
                          ...character.pericias,
                          [skillName]: { ...skill, treinada: !isTrained }
                        }
                        updateCharacter({ pericias: newPericias })
                      }}
                      onChangeAttr={(attr) => {
                        const newPericias = {
                          ...character.pericias,
                          [skillName]: { ...skill, atributo: attr }
                        }
                        updateCharacter({ pericias: newPericias })
                      }}
                      onChangeOutros={(value) => {
                        const newPericias = {
                          ...character.pericias,
                          [skillName]: { ...skill, outros: value }
                        }
                        updateCharacter({ pericias: newPericias })
                      }}
                      highlight={isTrained}
                      editable={!readOnly}
                    />
                  )
                })}
              </div>
            </Card>
          </TabsContent>

          {/* HABILIDADES */}
          <TabsContent value="abilities" className="p-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Habilidades
                </h3>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newHabilidades = [...(character.habilidades || []), { nome: '', descricao: '', tipo: '' }]
                      updateCharacter({ habilidades: newHabilidades })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Habilidade
                  </Button>
                )}
              </div>

              {(character.habilidades?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhuma habilidade registrada.
                </p>
              ) : (
                <div className="space-y-3">
                  {character.habilidades!.map((hab, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={hab.nome || ''}
                              onChange={(e) => {
                                const newHabilidades = [...(character.habilidades || [])]
                                newHabilidades[index] = { ...hab, nome: e.target.value }
                                updateCharacter({ habilidades: newHabilidades })
                              }}
                              placeholder="Nome da habilidade"
                              className="font-semibold"
                              disabled={readOnly}
                            />
                            <Input
                              value={hab.tipo || ''}
                              onChange={(e) => {
                                const newHabilidades = [...(character.habilidades || [])]
                                newHabilidades[index] = { ...hab, tipo: e.target.value }
                                updateCharacter({ habilidades: newHabilidades })
                              }}
                              placeholder="Tipo"
                              className="w-32"
                              disabled={readOnly}
                            />
                          </div>
                          <Input
                            value={hab.descricao || ''}
                            onChange={(e) => {
                              const newHabilidades = [...(character.habilidades || [])]
                              newHabilidades[index] = { ...hab, descricao: e.target.value }
                              updateCharacter({ habilidades: newHabilidades })
                            }}
                            placeholder="Descrição"
                            disabled={readOnly}
                          />
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newHabilidades = (character.habilidades || []).filter((_, i) => i !== index)
                              updateCharacter({ habilidades: newHabilidades })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* PODERES */}
          <TabsContent value="powers" className="p-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Poderes
                </h3>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPoderes = [...(character.poderes || []), { nome: '', descricao: '', tipo: '' }]
                      updateCharacter({ poderes: newPoderes })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Poder
                  </Button>
                )}
              </div>

              {(character.poderes?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhum poder registrado.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {character.poderes!.map((poder, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={poder.nome || ''}
                              onChange={(e) => {
                                const newPoderes = [...(character.poderes || [])]
                                newPoderes[index] = { ...poder, nome: e.target.value }
                                updateCharacter({ poderes: newPoderes })
                              }}
                              placeholder="Nome do poder"
                              className="font-semibold"
                              disabled={readOnly}
                            />
                            <Input
                              value={poder.tipo || ''}
                              onChange={(e) => {
                                const newPoderes = [...(character.poderes || [])]
                                newPoderes[index] = { ...poder, tipo: e.target.value }
                                updateCharacter({ poderes: newPoderes })
                              }}
                              placeholder="Tipo"
                              className="w-32"
                              disabled={readOnly}
                            />
                          </div>
                          <Input
                            value={poder.descricao || ''}
                            onChange={(e) => {
                              const newPoderes = [...(character.poderes || [])]
                              newPoderes[index] = { ...poder, descricao: e.target.value }
                              updateCharacter({ poderes: newPoderes })
                            }}
                            placeholder="Descrição"
                            disabled={readOnly}
                          />
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newPoderes = (character.poderes || []).filter((_, i) => i !== index)
                              updateCharacter({ poderes: newPoderes })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* MAGIAS */}
          <TabsContent value="magic" className="p-4 mt-0">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-primary" />
                  Magias
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    CD de Magias: <span className="font-bold text-foreground">{spellDC}</span>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMagias = Array.isArray(character.magias)
                          ? [...character.magias, { nome: '', nivel: 1, escola: '', descricao: '' }]
                          : [{ nome: '', nivel: 1, escola: '', descricao: '' }]
                        updateCharacter({ magias: newMagias })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Magia
                    </Button>
                  )}
                </div>
              </div>

              {/* Atributos CD */}
              <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Label className="text-sm mb-2 block">Atributo(s) para CD de Magias</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ATTR_LABELS).map(([key, abbr]) => {
                    const selected = character.spellDCAttributes?.includes(key) ?? (key === 'inteligencia')
                    return (
                      <Button
                        key={key}
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        disabled={readOnly}
                        onClick={() => {
                          const current = character.spellDCAttributes ?? ['inteligencia']
                          const updated = selected
                            ? current.filter(a => a !== key)
                            : [...current, key]
                          updateCharacter({ spellDCAttributes: updated.length > 0 ? updated : ['inteligencia'] })
                        }}
                      >
                        {abbr}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {magiasList.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Nenhuma magia registrada.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {magiasList.map((magia, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={magia.nome || ''}
                              onChange={(e) => {
                                if (Array.isArray(character.magias)) {
                                  const newMagias = [...character.magias]
                                  newMagias[index] = { ...magia, nome: e.target.value }
                                  updateCharacter({ magias: newMagias })
                                }
                              }}
                              placeholder="Nome da magia"
                              className="font-semibold"
                              disabled={readOnly}
                            />
                            <Input
                              type="number"
                              value={magia.nivel || 1}
                              onChange={(e) => {
                                if (Array.isArray(character.magias)) {
                                  const newMagias = [...character.magias]
                                  newMagias[index] = { ...magia, nivel: parseInt(e.target.value) || 1 }
                                  updateCharacter({ magias: newMagias })
                                }
                              }}
                              placeholder="Nível"
                              className="w-16"
                              disabled={readOnly}
                            />
                            <Input
                              value={magia.escola || ''}
                              onChange={(e) => {
                                if (Array.isArray(character.magias)) {
                                  const newMagias = [...character.magias]
                                  newMagias[index] = { ...magia, escola: e.target.value }
                                  updateCharacter({ magias: newMagias })
                                }
                              }}
                              placeholder="Escola"
                              className="w-28"
                              disabled={readOnly}
                            />
                          </div>
                          <Input
                            value={magia.descricao || ''}
                            onChange={(e) => {
                              if (Array.isArray(character.magias)) {
                                const newMagias = [...character.magias]
                                newMagias[index] = { ...magia, descricao: e.target.value }
                                updateCharacter({ magias: newMagias })
                              }
                            }}
                            placeholder="Descrição"
                            disabled={readOnly}
                          />
                        </div>
                        {!readOnly && Array.isArray(character.magias) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newMagias = (character.magias as any[]).filter((_, i) => i !== index)
                              updateCharacter({ magias: newMagias })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* INVENTÁRIO */}
          <TabsContent value="inventory" className="p-4 mt-0">
            <div className="space-y-4">
              {/* Armas */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Swords className="w-5 h-5 text-primary" />
                    Armas
                  </h3>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newArmas = [...(character.inventario?.armas || []), { nome: '', dano: '', critico: '', alcance: '', tipo: '', equipada: false, bonus_ataque: 0 }]
                        updateCharacter({
                          inventario: { ...character.inventario, armas: newArmas }
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Arma
                    </Button>
                  )}
                </div>

                {(character.inventario?.armas?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Nenhuma arma no inventário.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {character.inventario!.armas!.map((weapon, index) => {
                      const luta = calcSkillTotal(character, 'Luta')
                      const pontaria = calcSkillTotal(character, 'Pontaria')
                      const isRanged = weapon.tipo?.toLowerCase().includes('arco') || (weapon.alcance ? parseInt(weapon.alcance) > 1 : false)
                      const baseBonus = isRanged ? pontaria : luta
                      const attackBonus = baseBonus + (weapon.bonus_ataque ?? 0)

                      return (
                        <div key={index} className="p-3 rounded-lg border border-border/50 bg-muted/10">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={weapon.equipada}
                              onCheckedChange={(checked) => {
                                const newArmas = [...(character.inventario?.armas || [])]
                                newArmas[index] = { ...weapon, equipada: !!checked }
                                updateCharacter({
                                  inventario: { ...character.inventario, armas: newArmas }
                                })
                              }}
                              disabled={readOnly}
                            />
                            <Input
                              value={weapon.nome || ''}
                              onChange={(e) => {
                                const newArmas = [...(character.inventario?.armas || [])]
                                newArmas[index] = { ...weapon, nome: e.target.value }
                                updateCharacter({
                                  inventario: { ...character.inventario, armas: newArmas }
                                })
                              }}
                              placeholder="Nome"
                              className="flex-1"
                              disabled={readOnly}
                            />
                            <Input
                              value={weapon.dano || ''}
                              onChange={(e) => {
                                const newArmas = [...(character.inventario?.armas || [])]
                                newArmas[index] = { ...weapon, dano: e.target.value }
                                updateCharacter({
                                  inventario: { ...character.inventario, armas: newArmas }
                                })
                              }}
                              placeholder="Dano"
                              className="w-20"
                              disabled={readOnly}
                            />
                            <Input
                              value={weapon.critico || ''}
                              onChange={(e) => {
                                const newArmas = [...(character.inventario?.armas || [])]
                                newArmas[index] = { ...weapon, critico: e.target.value }
                                updateCharacter({
                                  inventario: { ...character.inventario, armas: newArmas }
                                })
                              }}
                              placeholder="Crítico"
                              className="w-20"
                              disabled={readOnly}
                            />
                            <Input
                              type="number"
                              value={weapon.bonus_ataque || 0}
                              onChange={(e) => {
                                const newArmas = [...(character.inventario?.armas || [])]
                                newArmas[index] = { ...weapon, bonus_ataque: parseInt(e.target.value) || 0 }
                                updateCharacter({
                                  inventario: { ...character.inventario, armas: newArmas }
                                })
                              }}
                              placeholder="Bônus"
                              className="w-16"
                              disabled={readOnly}
                            />
                            <div className="text-center px-2">
                              <p className="text-xs text-muted-foreground">Ataque</p>
                              <p className="font-bold text-primary">{formatMod(attackBonus)}</p>
                            </div>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newArmas = (character.inventario?.armas || []).filter((_, i) => i !== index)
                                  updateCharacter({
                                    inventario: { ...character.inventario, armas: newArmas }
                                  })
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {/* Itens */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Itens
                  </h3>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newItens = [...(character.inventario?.itens || []), { nome: '', qtd: 1, peso: 0, descricao: '' }]
                        updateCharacter({
                          inventario: { ...character.inventario, itens: newItens }
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Item
                    </Button>
                  )}
                </div>

                {(character.inventario?.itens?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Nenhum item no inventário.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {character.inventario!.itens!.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/10">
                        <Input
                          value={item.nome || ''}
                          onChange={(e) => {
                            const newItens = [...(character.inventario?.itens || [])]
                            newItens[index] = { ...item, nome: e.target.value }
                            updateCharacter({
                              inventario: { ...character.inventario, itens: newItens }
                            })
                          }}
                          placeholder="Nome"
                          className="flex-1"
                          disabled={readOnly}
                        />
                        <Input
                          type="number"
                          value={item.qtd ?? item.quantidade ?? 1}
                          onChange={(e) => {
                            const newItens = [...(character.inventario?.itens || [])]
                            newItens[index] = { ...item, qtd: parseInt(e.target.value) || 1 }
                            updateCharacter({
                              inventario: { ...character.inventario, itens: newItens }
                            })
                          }}
                          placeholder="Qtd"
                          className="w-16"
                          disabled={readOnly}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          value={item.peso || 0}
                          onChange={(e) => {
                            const newItens = [...(character.inventario?.itens || [])]
                            newItens[index] = { ...item, peso: parseFloat(e.target.value) || 0 }
                            updateCharacter({
                              inventario: { ...character.inventario, itens: newItens }
                            })
                          }}
                          placeholder="Peso"
                          className="w-20"
                          disabled={readOnly}
                        />
                        <Input
                          value={item.descricao || ''}
                          onChange={(e) => {
                            const newItens = [...(character.inventario?.itens || [])]
                            newItens[index] = { ...item, descricao: e.target.value }
                            updateCharacter({
                              inventario: { ...character.inventario, itens: newItens }
                            })
                          }}
                          placeholder="Descrição"
                          className="flex-1"
                          disabled={readOnly}
                        />
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newItens = (character.inventario?.itens || []).filter((_, i) => i !== index)
                              updateCharacter({
                                inventario: { ...character.inventario, itens: newItens }
                              })
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Dinheiro */}
                <div className="mt-6">
                  <h4 className="text-base font-semibold mb-3">Dinheiro</h4>
                  <div className="flex flex-wrap gap-3">
                    {['T$', 'PP', 'PO', 'PE', 'PC'].map((currency) => (
                      <div key={currency} className="flex items-center gap-2">
                        <Label className="w-8 text-sm">{currency}</Label>
                        <Input
                          type="number"
                          value={character.inventario?.dinheiro?.[currency] || 0}
                          onChange={(e) => {
                            updateCharacter({
                              inventario: {
                                ...character.inventario,
                                dinheiro: {
                                  ...character.inventario?.dinheiro,
                                  [currency]: parseInt(e.target.value) || 0
                                }
                              }
                            })
                          }}
                          className="w-20"
                          disabled={readOnly}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
