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

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration: 4000 }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Melhoria 3: Handler para importação de ficha
  const handleImportSheet = (character: any, sheetName: string) => {
    setLoadedCharacter(character)
    // Atualiza o nome do personagem se ainda não foi definido
    if (!characterName && sheetName) {
      setCharacterName(sheetName)
    }
    addToast(`Ficha "${sheetName}" carregada com sucesso!`, 'success')
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
