'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Tipos e helpers
// ---------------------------------------------------------------------------

interface CharacterData {
  nome?: string
  raca?: string
  origem?: string
  divindade?: string
  nivel?: number
  classes?: Array<{ nome: string; nivel: number }>
  atributos?: Record<string, number>
  pericias?: Record<string, { treinada?: boolean | string; atributo?: string; outros?: number; bonusExtra?: number }>
  recursos?: {
    vida?: { atual: number; maximo: number }
    mana?: { atual: number; maximo: number }
    prana?: { atual: number; maximo: number }
  }
  inventario?: {
    armas?: Array<{ nome: string; dano?: string; critico?: string; alcance?: string; tipo?: string; equipada?: boolean; bonus_ataque?: number }>
    armaduras?: Array<{ nome: string; ca?: number; categoria?: string; equipada?: boolean }>
    itens?: Array<{ nome: string; qtd?: number; peso?: number; descricao?: string }>
  }
  poderes?: Array<{ nome: string; descricao?: string; tipo?: string }>
  magias?: Array<{ nome: string; nivel?: number; escola?: string; descricao?: string }>
  defenseAttributes?: string[]
  defenseAttribute?: string
  defesa_outros?: number
  deslocamento?: number
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

// --- Atributo radial (círculo no estilo CRIS) ---
function AttrCircle({
  label,
  abbr,
  value,
  size = 'md',
}: {
  label: string
  abbr: string
  value: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const mod = getAttrMod(value)
  const sizeClasses = {
    sm: 'w-14 h-14 text-[10px]',
    md: 'w-18 h-18 text-xs',
    lg: 'w-22 h-22 text-sm',
  }
  const valueClasses = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }
  const modClasses = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs' }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-primary/40 bg-card flex flex-col items-center justify-center relative`}
      >
        {/* Anel decorativo externo */}
        <div className="absolute inset-0 rounded-full border border-primary/10" />
        <span className={`${valueClasses[size]} font-bold leading-none`}>{value}</span>
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
  color: 'red' | 'blue' | 'orange'
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
  }

  const c = colorMap[color]

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${c.label}`}>{label}</span>
        <span className={`text-[10px] font-mono ${c.text}`}>
          {atual} / {maximo}
        </span>
      </div>

      {/* Barra */}
      <div className={`h-3 rounded-full ${c.track} overflow-hidden mb-2 relative`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
        {/* Grade visual */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-black/20 last:border-r-0" />
          ))}
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1">
        <button
          aria-label={`Zerar ${label}`}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${c.btn}`}
          onClick={onFullDecrement}
        >
          <ChevronsLeft className="w-3 h-3" />
        </button>
        <button
          aria-label={`Decrementar ${label}`}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${c.btn}`}
          onClick={onDecrement}
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <input
          type="number"
          aria-label={`Valor atual de ${label}`}
          className={`flex-1 h-6 text-center text-sm font-bold bg-transparent border-none outline-none ${c.text} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          value={atual}
          onChange={(e) => onSetValue(parseInt(e.target.value) || 0)}
        />
        <button
          aria-label={`Incrementar ${label}`}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${c.btn}`}
          onClick={onIncrement}
        >
          <ChevronRight className="w-3 h-3" />
        </button>
        <button
          aria-label={`Maximizar ${label}`}
          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${c.btn}`}
          onClick={onFullIncrement}
        >
          <ChevronsRight className="w-3 h-3" />
        </button>
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
      <span className={`w-8 text-right font-mono text-[10px] ${outros !== 0 ? 'text-yellow-400/80' : 'text-muted-foreground/40'}`}>
        {outros !== 0 ? (outros > 0 ? `+${outros}` : outros) : '—'}
      </span>
      <span className={`w-10 text-right font-bold font-mono ${total >= 10 ? 'text-foreground' : 'text-muted-foreground'}`}>
        {formatMod(total)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface CharacterSheetViewProps {
  character: CharacterData
  /** Se verdadeiro, os recursos são somente leitura (ex: visualização do mestre) */
  readOnly?: boolean
  onResourceChange?: (resource: 'vida' | 'mana' | 'prana', newValue: number) => void
  onRollSkill?: (skillName: string, total: number) => void
}

export function CharacterSheetView({
  character,
  readOnly = false,
  onResourceChange,
  onRollSkill,
}: CharacterSheetViewProps) {
  const [skillFilter, setSkillFilter] = useState('')
  const [activeTab, setActiveTab] = useState('combate')

  const char = character

  // --- Cálculos derivados ---
  const totalLevel = useMemo(() => calcTotalLevel(char), [char])
  const halfLevel = useMemo(() => Math.floor(totalLevel / 2), [totalLevel])
  const defense = useMemo(() => calcDefense(char), [char])
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

  // Recursos com fallback
  const vida = char.recursos?.vida ?? { atual: 0, maximo: 0 }
  const mana = char.recursos?.mana ?? { atual: 0, maximo: 0 }
  const prana = char.recursos?.prana ?? { atual: 0, maximo: 0 }

  const handleResource = (resource: 'vida' | 'mana' | 'prana', delta: number) => {
    if (readOnly || !onResourceChange) return
    const cur = char.recursos?.[resource]?.atual ?? 0
    const max = char.recursos?.[resource]?.maximo ?? 0
    const next = Math.max(0, Math.min(max, cur + delta))
    onResourceChange(resource, next)
  }

  const handleResourceSet = (resource: 'vida' | 'mana' | 'prana', value: number) => {
    if (readOnly || !onResourceChange) return
    const max = char.recursos?.[resource]?.maximo ?? 0
    onResourceChange(resource, Math.max(0, Math.min(max, value)))
  }

  const handleResourceMax = (resource: 'vida' | 'mana' | 'prana') => {
    if (readOnly || !onResourceChange) return
    const max = char.recursos?.[resource]?.maximo ?? 0
    onResourceChange(resource, max)
  }

  // Armas equipadas para o painel de combate
  const weapons = char.inventario?.armas ?? []
  const equippedWeapons = weapons.filter((w) => w.equipada)
  const allWeapons = equippedWeapons.length > 0 ? equippedWeapons : weapons

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* Cabeçalho da ficha */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start gap-3 p-3 border-b border-border/50 shrink-0">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-lg border-2 border-primary/30 bg-muted flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-primary">
            {(char.nome || 'P')[0].toUpperCase()}
          </span>
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
            {totalLevel > 0 && <span>• Nível {totalLevel}</span>}
          </div>
        </div>
        {/* Stats rápidos */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Defesa</p>
            <p className="text-lg font-bold leading-none">{defense}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Desl.</p>
            <p className="text-lg font-bold leading-none">{char.deslocamento ?? 9}m</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Layout principal: esquerda + conteúdo das abas */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ---- Coluna esquerda: atributos + recursos ---- */}
        <div className="w-44 shrink-0 border-r border-border/50 flex flex-col gap-3 p-3 overflow-y-auto">
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
        <div className="w-56 shrink-0 border-r border-border/50 flex flex-col min-h-0">
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
              <span className="w-8 text-right">Outros</span>
              <span className="w-10 text-right">Total</span>
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
                  onRoll={onRollSkill}
                  highlight={isTrained}
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
                          <span className="font-mono font-bold">{armor.ca != null ? `+${armor.ca}` : '?'} CA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* PODERES */}
            <TabsContent value="poderes" className="flex-1 overflow-y-auto p-3 mt-0">
              {(char.poderes?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum poder registrado.</p>
              ) : (
                <div className="space-y-2">
                  {char.poderes!.map((poder, i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{poder.nome}</p>
                        {poder.tipo && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{poder.tipo}</Badge>
                        )}
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
              {(char.magias?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma magia registrada.</p>
              ) : (
                <div className="space-y-2">
                  {char.magias!.map((magia, i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{magia.nome}</p>
                        {magia.nivel != null && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-blue-500/40 text-blue-400">
                            Nível {magia.nivel}
                          </Badge>
                        )}
                        {magia.escola && (
                          <span className="text-[10px] text-muted-foreground">{magia.escola}</span>
                        )}
                      </div>
                      {magia.descricao && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{magia.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* INVENTÁRIO */}
            <TabsContent value="inventario" className="flex-1 overflow-y-auto p-3 mt-0">
              {(char.inventario?.itens?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum item no inventário.</p>
              ) : (
                <div className="space-y-1">
                  {char.inventario!.itens!.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded border border-border/30 bg-muted/10 text-xs">
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        {item.descricao && <p className="text-muted-foreground">{item.descricao}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {item.qtd != null && (
                          <span className="text-muted-foreground">×{item.qtd}</span>
                        )}
                        {item.peso != null && (
                          <span className="text-muted-foreground font-mono">{item.peso}kg</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* DESCRIÇÃO */}
            <TabsContent value="descricao" className="flex-1 overflow-y-auto p-3 mt-0">
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Nome', value: char.nome },
                  { label: 'Raça', value: char.raca },
                  { label: 'Origem', value: char.origem },
                  { label: 'Divindade', value: char.divindade },
                ].filter(f => f.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2 border-b border-border/30 pb-2">
                    <span className="text-muted-foreground w-20 shrink-0 text-xs uppercase tracking-wide">{label}</span>
                    <span className="text-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
