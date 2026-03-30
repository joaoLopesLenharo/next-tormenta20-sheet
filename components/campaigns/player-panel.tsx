'use client'

import dynamic from 'next/dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Swords,
  Shield,
  Target,
  Sparkles,
  Dices,
  Loader2,
  Edit2,
  Check,
  X,
  History,
  Heart,
  Zap,
  Droplets,
} from 'lucide-react'
import { DiceRollCard } from '@/components/dice/dice-roll-card'
import { DiceAnimation } from '@/components/dice/dice-animation'
import { RollResultDisplay } from '@/components/dice/roll-result-display'
import { ToastContainer } from '@/components/ui/toast-notification'
import { rollDice, isValidDiceFormula, createD20Formula } from '@/lib/dice-engine'
import { TORMENTA_SKILLS, RESISTANCE_TYPES } from '@/lib/types/database'
import type { Campaign, CampaignMember, Session, DiceRoll, RollType } from '@/lib/types/database'
// Melhoria 3: Import do componente de importação de ficha
import { ImportSheetDialog } from '@/components/campaigns/import-sheet-dialog'
import { Upload } from 'lucide-react'
import { InitiativeTracker } from '@/components/campaigns/initiative-tracker'
import type { InitiativeEntry, Profile } from '@/lib/types/database'

// Import dinÃ¢mico do CharacterSheet para evitar SSR issues
const CharacterSheet = dynamic(() => import('@/app/page'), { ssr: false })

interface MemberWithProfile extends CampaignMember {
  profiles: Profile
}

interface PlayerPanelProps {
  campaign: Campaign
  membership: CampaignMember
  activeSession: Session | null
  initialRolls: unknown[]
  initialInitiative: InitiativeEntry[]
  members: MemberWithProfile[]
  userId: string
}

export function PlayerPanel({
  campaign,
  membership,
  activeSession,
  initialRolls,
  initialInitiative,
  members,
  userId,
}: PlayerPanelProps) {
  const [rolls, setRolls] = useState<DiceRoll[]>(initialRolls as DiceRoll[])
  const [characterName, setCharacterName] = useState(membership.character_name || '')
  const [editingName, setEditingName] = useState(false)
  
  // Melhoria 3: Estado para ficha carregada/importada
  const [loadedCharacter, setLoadedCharacter] = useState<any>(null)
  const [savingName, setSavingName] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [lastResult, setLastResult] = useState<DiceRoll | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'info'
    duration?: number
  }>>([])
  const router = useRouter()

  // Tab principal (sessao vs ficha)
  const [mainTab, setMainTab] = useState<'sessao' | 'ficha'>('sessao')

  // Dados das perícias para cálculo automático
  const skillsData: Record<string, { attr: string; armorPenalty?: boolean; trainedOnly?: boolean }> = {
    'Acrobacia': { attr: 'destreza', armorPenalty: true },
    'Adestramento': { attr: 'carisma', trainedOnly: true },
    'Atletismo': { attr: 'forca' },
    'Atuação': { attr: 'carisma' },
    'Cavalgar': { attr: 'destreza' },
    'Conhecimento': { attr: 'inteligencia', trainedOnly: true },
    'Cura': { attr: 'sabedoria' },
    'Diplomacia': { attr: 'carisma' },
    'Enganação': { attr: 'carisma' },
    'Fortitude': { attr: 'constituicao' },
    'Furtividade': { attr: 'destreza', armorPenalty: true },
    'Guerra': { attr: 'inteligencia', trainedOnly: true },
    'Iniciativa': { attr: 'destreza' },
    'Intimidação': { attr: 'carisma' },
    'Intuição': { attr: 'sabedoria' },
    'Investigação': { attr: 'inteligencia' },
    'Jogatina': { attr: 'carisma', trainedOnly: true },
    'Ladinagem': { attr: 'destreza', trainedOnly: true, armorPenalty: true },
    'Luta': { attr: 'forca' },
    'Misticismo': { attr: 'inteligencia', trainedOnly: true },
    'Nobreza': { attr: 'inteligencia', trainedOnly: true },
    'Ofício': { attr: 'inteligencia', trainedOnly: true },
    'Percepção': { attr: 'sabedoria' },
    'Pilotagem': { attr: 'destreza', trainedOnly: true },
    'Pontaria': { attr: 'destreza' },
    'Reflexos': { attr: 'destreza' },
    'Religião': { attr: 'sabedoria', trainedOnly: true },
    'Sobrevivência': { attr: 'sabedoria' },
    'Vontade': { attr: 'sabedoria' },
  }

  // Auto-load ficha do localStorage ao montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('t20_sheets')
      if (raw) {
        const sheets = JSON.parse(raw)
        const activeId = localStorage.getItem('t20_active_sheet_id')
        const activeSheet = sheets.find((s: any) => s.id === activeId) || sheets[0]
        if (activeSheet?.data) {
          setLoadedCharacter(activeSheet.data)
          if (!characterName && activeSheet.data.nome) {
            setCharacterName(activeSheet.data.nome)
          }
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Calcula o modificador de uma perícia baseado na ficha carregada
  const getSkillModFromCharacter = (skillName: string): number | null => {
    if (!loadedCharacter) return null
    const sd = skillsData[skillName]
    if (!sd) return null

    const skill = loadedCharacter.pericias?.[skillName] || {}
    const selectedAttr = (skill.atributo || sd.attr).toLowerCase()
    const attrValue = loadedCharacter.atributos?.[selectedAttr] || 10
    const attrMod = Math.floor((attrValue - 10) / 2)

    const totalLevel = (loadedCharacter.classes || []).reduce(
      (acc: number, c: any) => acc + (parseInt(c.nivel) || 0), 0
    ) || loadedCharacter.nivel || 1
    const halfLevel = Math.floor(totalLevel / 2)

    let trainingBonus = 0
    const isTrained = skill.treinada === true || (typeof skill.treinada === 'string' && skill.treinada !== 'destreinado')
    if (isTrained) {
      if (totalLevel >= 15) trainingBonus = 6
      else if (totalLevel >= 7) trainingBonus = 4
      else trainingBonus = 2
    }

    const outros = skill.outros || 0
    const bonusExtra = typeof skill.bonusExtra === 'number' ? skill.bonusExtra : parseInt(skill.bonusExtra) || 0

    return halfLevel + attrMod + trainingBonus + outros + bonusExtra
  }

  // Formulario de Pericia
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [skillModifier, setSkillModifier] = useState('')

  // Formulario de Ataque
  const [attackBonus, setAttackBonus] = useState('')

  // Formulario de Dano
  const [damageFormula, setDamageFormula] = useState('')

  // Formulario de Resistencia
  const [resistanceType, setResistanceType] = useState<string>('')
  const [resistanceModifier, setResistanceModifier] = useState('')

  // Formulario Livre
  const [freeFormula, setFreeFormula] = useState('1d20')

  // Observacao geral
  const [observation, setObservation] = useState('')

  // Auto-preencher modificador quando perícia é selecionada
  useEffect(() => {
    if (selectedSkill && loadedCharacter) {
      const mod = getSkillModFromCharacter(selectedSkill)
      if (mod !== null) {
        setSkillModifier(mod.toString())
      }
    }
  }, [selectedSkill, loadedCharacter])

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration: 4000 }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Melhoria 3: Handler para importação de ficha
  const handleImportSheet = (character: any, sheetName: string) => {
    // Salvar no localStorage (mesmo formato do app/page.tsx)
    try {
      const raw = localStorage.getItem('t20_sheets')
      const sheets: Array<{ id: string; meta: { nome: string; nivel: number }; data: any }> = raw ? JSON.parse(raw) : []

      const totalLevel = (character.classes || []).reduce(
        (acc: number, c: any) => acc + (parseInt(c.nivel) || 0), 0
      ) || character.nivel || 1

      // Verificar se já existe uma ficha com o mesmo nome
      const existingIndex = sheets.findIndex(
        (s) => (s.meta?.nome || s.data?.nome || '').toLowerCase() === sheetName.toLowerCase()
      )

      if (existingIndex >= 0) {
        const replace = confirm(
          `Já existe uma ficha chamada "${sheetName}". Deseja substituí-la?\n\n` +
          `• OK = Substituir a ficha existente\n` +
          `• Cancelar = Criar uma nova ficha com o mesmo nome`
        )

        if (replace) {
          // Substituir a ficha existente
          sheets[existingIndex] = {
            ...sheets[existingIndex],
            data: character,
            meta: { nome: sheetName, nivel: totalLevel },
          }
          localStorage.setItem('t20_sheets', JSON.stringify(sheets))
          localStorage.setItem('t20_active_sheet_id', sheets[existingIndex].id)
        } else {
          // Criar nova ficha com o mesmo nome
          const newId = 't20_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
          const newSheet = {
            id: newId,
            meta: { nome: sheetName, nivel: totalLevel },
            data: character,
          }
          sheets.push(newSheet)
          localStorage.setItem('t20_sheets', JSON.stringify(sheets))
          localStorage.setItem('t20_active_sheet_id', newId)
        }
      } else {
        // Criar nova ficha
        const newId = 't20_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
        const newSheet = {
          id: newId,
          meta: { nome: sheetName, nivel: totalLevel },
          data: character,
        }
        sheets.push(newSheet)
        localStorage.setItem('t20_sheets', JSON.stringify(sheets))
        localStorage.setItem('t20_active_sheet_id', newId)
      }
    } catch (err) {
      console.error('Error saving to localStorage:', err)
    }

    setLoadedCharacter(character)

    // Atualiza o nome do personagem
    if (sheetName) {
      setCharacterName(sheetName)
    }

    // Mudar para a aba "Ficha Completa"
    setMainTab('ficha')

    addToast(`Ficha "${sheetName}" carregada e salva com sucesso!`, 'success')
  }
  
  const saveCharacterName = async () => {
    setSavingName(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('campaign_members')
      .update({ character_name: characterName.trim() || null })
      .eq('id', membership.id)

    setSavingName(false)
    if (!error) {
      setEditingName(false)
      addToast('Nome do personagem salvo!', 'success')
      router.refresh()
    } else {
      addToast('Erro ao salvar nome do personagem', 'error')
    }
  }

  const performRoll = async (
    formula: string,
    rollType: RollType,
    customObservation?: string
  ) => {
    if (!activeSession) return
    if (!isValidDiceFormula(formula)) return

    setRolling(true)
    setShowAnimation(true)

    // Aguardar animacao
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const result = rollDice(formula)
    if (!result) {
      setRolling(false)
      setShowAnimation(false)
      return
    }

    const supabase = createClient()

    const rollData = {
      session_id: activeSession.id,
      user_id: userId,
      character_name: characterName || null,
      roll_type: rollType,
      formula: formula,
      individual_results: result.individualResults,
      modifier: result.modifier,
      total: result.total,
      is_critical: result.isCritical,
      is_fumble: result.isFumble,
      natural_roll: result.naturalRoll,
      observation: customObservation || observation.trim() || null,
      is_secret: false,
    }

    const { data: newRoll, error } = await supabase
      .from('dice_rolls')
      .insert(rollData)
      .select()
      .single()

    if (!error && newRoll) {
      setRolls((prev) => [newRoll, ...prev].slice(0, 50))
      setLastResult(newRoll)
      setShowResult(true)
      setObservation('')
      
      // Toast de sucesso
      if (newRoll.is_critical) {
        addToast('Acerto Crítico! 🎉', 'success')
      } else if (newRoll.is_fumble) {
        addToast('Falha Crítica... 😱', 'error')
      } else {
        addToast(`Rolagem enviada ao Mestre! (${newRoll.total})`, 'success')
      }
    } else {
      addToast('Erro ao enviar rolagem', 'error')
    }

    setShowAnimation(false)
    setRolling(false)
  }

  const rollSkill = () => {
    if (!selectedSkill) return
    const mod = parseInt(skillModifier) || 0
    const formula = createD20Formula(mod)
    performRoll(formula, 'pericia', `${selectedSkill}${observation ? ` - ${observation}` : ''}`)
  }

  const rollAttack = () => {
    const mod = parseInt(attackBonus) || 0
    const formula = createD20Formula(mod)
    performRoll(formula, 'ataque')
  }

  const rollDamage = () => {
    if (!damageFormula || !isValidDiceFormula(damageFormula)) return
    performRoll(damageFormula, 'dano')
  }

  const rollResistance = () => {
    if (!resistanceType) return
    const mod = parseInt(resistanceModifier) || 0
    const formula = createD20Formula(mod)
    const typeLabel = RESISTANCE_TYPES.find((t) => t.value === resistanceType)?.label
    performRoll(formula, 'resistencia', `${typeLabel}${observation ? ` - ${observation}` : ''}`)
  }

  const rollFree = () => {
    if (!freeFormula || !isValidDiceFormula(freeFormula)) return
    performRoll(freeFormula, 'livre')
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/30">
      {/* Animacao de Dados */}
      {showAnimation && <DiceAnimation />}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/campanhas">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{campaign.name}</h1>
                <div className="flex items-center gap-2">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        className="h-7 text-sm w-40"
                        placeholder="Nome do personagem"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveCharacterName}
                        disabled={savingName}
                      >
                        {savingName ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCharacterName(membership.character_name || '')
                          setEditingName(false)
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingName(true)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {characterName || 'Definir personagem'}
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Melhoria 3: Botão para importar ficha */}
              <ImportSheetDialog onImport={handleImportSheet}>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Ficha
                </Button>
              </ImportSheetDialog>
              
              <Link href={`/campanhas/${campaign.id}/historico`}>
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </Link>
              {activeSession ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  Sessao Ativa
                </Badge>
              ) : (
                <Badge variant="secondary">Sem sessao ativa</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Tabs principais: Sessao vs Ficha */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'sessao' | 'ficha')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sessao" className="text-sm">
              <Dices className="w-4 h-4 mr-2" />
              Sessão
            </TabsTrigger>
            <TabsTrigger value="ficha" className="text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Ficha Completa
            </TabsTrigger>
          </TabsList>

          {/* Tab Sessão */}
          <TabsContent value="sessao">
        {!activeSession ? (
          <Card className="section-card">
            <CardContent className="py-12 text-center">
              <Dices className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-semibold mb-2">Aguardando o Mestre</h2>
              <p className="text-muted-foreground">
                O Mestre ainda nao iniciou uma sessao. Aguarde...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Roladores */}
            <div className="space-y-6">
              {/* Barra de Status do Personagem */}
              {loadedCharacter && (
                <Card className="section-card">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {(loadedCharacter.nome || 'P')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{loadedCharacter.nome || 'Personagem'}</p>
                        <p className="text-xs text-muted-foreground">
                          {loadedCharacter.raca}{loadedCharacter.classes?.length > 0 ? ` • ${loadedCharacter.classes.map((c: any) => `${c.nome || 'Classe'} ${c.nivel || 1}`).join(', ')}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Recursos */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                        <Heart className="w-3.5 h-3.5 text-red-500 mx-auto mb-0.5" />
                        <p className="text-xs text-muted-foreground">Vida</p>
                        <p className="text-sm font-bold text-red-400">
                          {loadedCharacter.recursos?.vida?.atual ?? 0}/{loadedCharacter.recursos?.vida?.maximo ?? 0}
                        </p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                        <Zap className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                        <p className="text-xs text-muted-foreground">Mana</p>
                        <p className="text-sm font-bold text-blue-400">
                          {loadedCharacter.recursos?.mana?.atual ?? 0}/{loadedCharacter.recursos?.mana?.maximo ?? 0}
                        </p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                        <Droplets className="w-3.5 h-3.5 text-yellow-500 mx-auto mb-0.5" />
                        <p className="text-xs text-muted-foreground">Prana</p>
                        <p className="text-sm font-bold text-yellow-400">
                          {loadedCharacter.recursos?.prana?.atual ?? 0}/{loadedCharacter.recursos?.prana?.maximo ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Atributos */}
                    <div className="grid grid-cols-6 gap-1">
                      {(['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma'] as const).map((attr) => {
                        const labels: Record<string, string> = {
                          forca: 'FOR', destreza: 'DES',
                          constituicao: 'CON', inteligencia: 'INT',
                          sabedoria: 'SAB', carisma: 'CAR'
                        }
                        const value = loadedCharacter.atributos?.[attr] || 10
                        const mod = Math.floor((value - 10) / 2)
                        return (
                          <div key={attr} className="bg-muted/50 rounded-lg p-1 text-center">
                            <p className="text-[10px] text-muted-foreground font-medium">{labels[attr]}</p>
                            <p className="text-xs font-bold">{value}</p>
                            <p className="text-[10px] text-primary font-mono">{mod >= 0 ? '+' : ''}{mod}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Defesa e Recursos extras */}
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">Defesa:</span>
                        <span className="text-xs font-bold">{(() => {
                          const base = 10
                          const selectedAttrs = loadedCharacter.defenseAttributes || (loadedCharacter.defenseAttribute ? [loadedCharacter.defenseAttribute] : ['destreza'])
                          const attrMod = selectedAttrs.reduce((sum: number, a: string) => sum + Math.floor(((loadedCharacter.atributos?.[a] || 10) - 10) / 2), 0)
                          const equippedArmor = loadedCharacter.inventario?.armaduras?.find((a: any) => a.equipada && a.categoria !== 'escudo')
                          const equippedShield = loadedCharacter.inventario?.armaduras?.find((a: any) => a.equipada && a.categoria === 'escudo')
                          return base + attrMod + (equippedArmor?.ca || 0) + (equippedShield?.ca || 0) + (loadedCharacter.defesa_outros || 0)
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Desl:</span>
                        <span className="text-xs font-bold">{loadedCharacter.deslocamento || 9}m</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Tabs defaultValue="pericia" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="pericia" className="text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Pericia</span>
                  </TabsTrigger>
                  <TabsTrigger value="ataque" className="text-xs sm:text-sm">
                    <Swords className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Ataque</span>
                  </TabsTrigger>
                  <TabsTrigger value="dano" className="text-xs sm:text-sm">
                    <Target className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Dano</span>
                  </TabsTrigger>
                  <TabsTrigger value="resistencia" className="text-xs sm:text-sm">
                    <Shield className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Resist.</span>
                  </TabsTrigger>
                  <TabsTrigger value="livre" className="text-xs sm:text-sm">
                    <Dices className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Livre</span>
                  </TabsTrigger>
                </TabsList>

                {/* Pericia */}
                <TabsContent value="pericia">
                  <Card className="section-card">
                    <CardHeader>
                      <CardTitle>Teste de Pericia</CardTitle>
                      <CardDescription>
                        Selecione a pericia e seu modificador
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="form-group">
                        <Label>Pericia</Label>
                        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha uma pericia" />
                          </SelectTrigger>
                          <SelectContent>
                            {TORMENTA_SKILLS.map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                {skill}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="form-group">
                        <Label>Modificador</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={skillModifier}
                          onChange={(e) => setSkillModifier(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <Label>Observacao (opcional)</Label>
                        <Input
                          placeholder="Ex: com flanqueamento"
                          value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={rollSkill}
                        className="w-full btn-primary"
                        disabled={rolling || !selectedSkill}
                      >
                        {rolling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Dices className="w-4 h-4 mr-2" />
                        )}
                        Rolar Pericia
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Ataque */}
                <TabsContent value="ataque">
                  <Card className="section-card">
                    <CardHeader>
                      <CardTitle>Teste de Ataque</CardTitle>
                      <CardDescription>1d20 + bonus de ataque</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="form-group">
                        <Label>Bonus de Ataque</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={attackBonus}
                          onChange={(e) => setAttackBonus(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <Label>Observacao (opcional)</Label>
                        <Input
                          placeholder="Ex: ataque furtivo"
                          value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={rollAttack}
                        className="w-full btn-primary"
                        disabled={rolling}
                      >
                        {rolling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Swords className="w-4 h-4 mr-2" />
                        )}
                        Rolar Ataque
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Dano */}
                <TabsContent value="dano">
                  <Card className="section-card">
                    <CardHeader>
                      <CardTitle>Rolagem de Dano</CardTitle>
                      <CardDescription>
                        Formula livre (ex: 2d6+4, 1d8+3)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="form-group">
                        <Label>Formula de Dano</Label>
                        <Input
                          placeholder="2d6+4"
                          value={damageFormula}
                          onChange={(e) => setDamageFormula(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="form-group">
                        <Label>Observacao (opcional)</Label>
                        <Input
                          placeholder="Ex: dano critico"
                          value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={rollDamage}
                        className="w-full btn-primary"
                        disabled={rolling || !isValidDiceFormula(damageFormula)}
                      >
                        {rolling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Target className="w-4 h-4 mr-2" />
                        )}
                        Rolar Dano
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Resistencia */}
                <TabsContent value="resistencia">
                  <Card className="section-card">
                    <CardHeader>
                      <CardTitle>Teste de Resistencia</CardTitle>
                      <CardDescription>
                        Fortitude, Reflexos ou Vontade
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="form-group">
                        <Label>Tipo</Label>
                        <Select
                          value={resistanceType}
                          onValueChange={setResistanceType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESISTANCE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="form-group">
                        <Label>Modificador</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={resistanceModifier}
                          onChange={(e) => setResistanceModifier(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <Label>Observacao (opcional)</Label>
                        <Input
                          placeholder="Ex: contra veneno"
                          value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={rollResistance}
                        className="w-full btn-primary"
                        disabled={rolling || !resistanceType}
                      >
                        {rolling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4 mr-2" />
                        )}
                        Rolar Resistencia
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Livre */}
                <TabsContent value="livre">
                  <Card className="section-card">
                    <CardHeader>
                      <CardTitle>Rolagem Livre</CardTitle>
                      <CardDescription>
                        Qualquer formula (ex: 3d6, 1d100, 4d4+2)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="form-group">
                        <Label>Formula</Label>
                        <Input
                          placeholder="1d20"
                          value={freeFormula}
                          onChange={(e) => setFreeFormula(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <div className="form-group">
                        <Label>Observacao (opcional)</Label>
                        <Input
                          placeholder="Ex: teste de sorte"
                          value={observation}
                          onChange={(e) => setObservation(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={rollFree}
                        className="w-full btn-primary"
                        disabled={rolling || !isValidDiceFormula(freeFormula)}
                      >
                        {rolling ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Dices className="w-4 h-4 mr-2" />
                        )}
                        Rolar
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Ultimo Resultado */}
              {lastResult && (
                <Card className="section-card border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Ultima Rolagem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DiceRollCard roll={lastResult} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Historico */}
            <div className="space-y-6">
              {/* Iniciativa */}
              {activeSession && (
                <InitiativeTracker
                  sessionId={activeSession.id}
                  campaignId={campaign.id}
                  members={members}
                  initialEntries={initialInitiative}
                  isMaster={false}
                  userId={userId}
                />
              )}

              <Card className="section-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dices className="w-5 h-5 text-primary" />
                    Meu Historico
                    <Badge variant="secondary">{rolls.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Suas rolagens nesta sessao
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rolls.length === 0 ? (
                    <div className="text-center py-8">
                      <Dices className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma rolagem ainda
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {rolls.map((roll) => (
                        <DiceRollCard key={roll.id} roll={roll} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
          </TabsContent>

          {/* Tab Ficha Completa */}
          <TabsContent value="ficha">
            <div className="-mx-4 sm:mx-0">
              <CharacterSheet />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Animacao de Rolagem */}
      {showAnimation && <DiceAnimation />}

      {/* Exibicao do Resultado */}
      {showResult && lastResult && (
        <RollResultDisplay
          roll={lastResult}
          onDismiss={() => setShowResult(false)}
        />
      )}

      {/* Container de Toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}
