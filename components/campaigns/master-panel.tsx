'use client'

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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Play,
  Pause,
  Users,
  Copy,
  Check,
  Trash2,
  Dices,
  Crown,
  Loader2,
  Eye,
  EyeOff,
  History,
  Shield,
} from 'lucide-react'
import { DiceRollCard } from '@/components/dice/dice-roll-card'
import { MasterDiceRoller } from '@/components/dice/master-dice-roller'
import { ManageMembersDialog } from '@/components/campaigns/manage-members-dialog'
import { InitiativeTracker } from '@/components/campaigns/initiative-tracker'
import { MasterSheetViewer } from '@/components/campaigns/master-sheet-viewer'
import type { Campaign, Session, DiceRoll, CampaignMember, Profile, InitiativeEntry } from '@/lib/types/database'
import { formatInviteCodeDisplay } from '@/lib/invite-code'

interface MemberWithProfile extends CampaignMember {
  profiles: Profile
  character_data?: any
}

interface RollWithProfile extends DiceRoll {
  profiles: Profile
}

interface MasterPanelProps {
  campaign: Campaign
  activeSession: Session | null
  members: MemberWithProfile[]
  initialRolls: unknown[]
  initialInitiative: InitiativeEntry[]
  userId: string
}

export function MasterPanel({
  campaign,
  activeSession: initialSession,
  members,
  initialRolls,
  initialInitiative,
  userId,
}: MasterPanelProps) {
  const [activeSession, setActiveSession] = useState<Session | null>(initialSession)
  const [rolls, setRolls] = useState<RollWithProfile[]>(initialRolls as RollWithProfile[])
  const [copied, setCopied] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [showSecretRolls, setShowSecretRolls] = useState(true)
  const [selectedMemberSheet, setSelectedMemberSheet] = useState<any>(null)
  const router = useRouter()

  // Supabase Realtime para rolagens
  useEffect(() => {
    if (!activeSession) return

    const supabase = createClient()

    const channel = supabase
      .channel(`dice_rolls_${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dice_rolls',
          filter: `session_id=eq.${activeSession.id}`,
        },
        async (payload) => {
          // Buscar o perfil do usuario
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          const newRoll = {
            ...payload.new,
            profiles: profile,
          } as RollWithProfile

          setRolls((prev) => [newRoll, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeSession])

  const inviteCodeDisplay = formatInviteCodeDisplay(campaign.invite_code)

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(inviteCodeDisplay)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startSession = async () => {
    setCreatingSession(true)
    const supabase = createClient()

    // Encerrar sessao ativa atual se houver
    if (activeSession) {
      await supabase
        .from('sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', activeSession.id)
    }

    // Criar nova sessao
    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        campaign_id: campaign.id,
        name: sessionName.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (!error && newSession) {
      setActiveSession(newSession)
      setRolls([])
      setSessionName('')
    }

    setCreatingSession(false)
  }

  const endSession = async () => {
    if (!activeSession) return

    const supabase = createClient()
    await supabase
      .from('sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('id', activeSession.id)

    setActiveSession(null)
    router.refresh()
  }

  const clearRolls = () => {
    setRolls([])
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/30">
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
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-accent" />
                  <h1 className="text-xl font-bold">{campaign.name}</h1>
                </div>
                <p className="text-sm text-muted-foreground">Painel do Mestre</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href={`/campanhas/${campaign.id}/historico`}>
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteCode}
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                <code className="font-mono">{inviteCodeDisplay}</code>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Esquerda - Controles */}
          <div className="space-y-6">
            {/* Sessao */}
            <Card className="section-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dices className="w-5 h-5 text-primary" />
                  Sessao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSession ? (
                  <>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-400">
                          Sessao Ativa
                        </span>
                      </div>
                      {activeSession.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeSession.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={endSession}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Encerrar Sessao
                    </Button>
                  </>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full btn-primary">
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Sessao
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Iniciar Nova Sessao</DialogTitle>
                        <DialogDescription>
                          Comece uma sessao para receber rolagens em tempo real.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="sessionName">Nome da Sessao (opcional)</Label>
                        <Input
                          id="sessionName"
                          placeholder="Ex: Sessao 15 - A Torre Sombria"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={startSession}
                          className="btn-primary"
                          disabled={creatingSession}
                        >
                          {creatingSession ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Iniciar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Jogadores */}
            <Card className="section-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Jogadores ({members.length})
                  </CardTitle>
                  {members.length > 0 && (
                    <ManageMembersDialog
                      campaignId={campaign.id}
                      members={members}
                      onMembersChange={() => router.refresh()}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const char = member.character_data
                      const hasSheet = !!char
                      const vida = char?.recursos?.vida
                      const mana = char?.recursos?.mana
                      const prana = char?.recursos?.prana
                      const vidaPct = vida?.maximo ? Math.min(100, Math.max(0, (vida.atual / vida.maximo) * 100)) : 0
                      const manaPct = mana?.maximo ? Math.min(100, Math.max(0, (mana.atual / mana.maximo) * 100)) : 0
                      const pranaPct = prana?.maximo ? Math.min(100, Math.max(0, (prana.atual / prana.maximo) * 100)) : 0

                      return (
                        <div
                          key={member.id}
                          className="rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-all overflow-hidden"
                        >
                          {/* Header do card */}
                          <div className="flex items-center gap-3 p-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${hasSheet ? 'bg-primary/10' : 'bg-muted/80'}`}>
                              <span className={`text-sm font-bold ${hasSheet ? 'text-primary' : 'text-muted-foreground'}`}>
                                {(char?.nome || member.profiles?.display_name || 'J')[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {char?.nome || member.character_name || member.profiles?.display_name || 'Jogador'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {hasSheet ? (
                                  <>
                                    {char.raca || 'Raça?'}
                                    {char.classes?.length > 0 && ` • ${char.classes.map((c: any) => `${c.nome || '?'} ${c.nivel || 1}`).join(', ')}`}
                                  </>
                                ) : (
                                  <span className="italic">Ficha não carregada</span>
                                )}
                              </p>
                            </div>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="text-xs px-2 h-7 shrink-0"
                              onClick={() => setSelectedMemberSheet(member)}
                            >
                              Ver Ficha
                            </Button>
                          </div>

                          {/* Barras de recursos */}
                          {hasSheet && (vida?.maximo > 0 || mana?.maximo > 0 || prana?.maximo > 0) && (
                            <div className="px-3 pb-3 space-y-1.5">
                              {/* Vida */}
                              {vida?.maximo > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-red-400 w-7">PV</span>
                                  <div className="flex-1 h-2 rounded-full bg-red-500/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        vidaPct > 50 ? 'bg-red-500' : vidaPct > 25 ? 'bg-orange-500' : 'bg-red-700 animate-pulse'
                                      }`}
                                      style={{ width: `${vidaPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-red-400/80 w-14 text-right">
                                    {vida.atual}/{vida.maximo}
                                  </span>
                                </div>
                              )}
                              {/* Mana */}
                              {mana?.maximo > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-blue-400 w-7">PM</span>
                                  <div className="flex-1 h-2 rounded-full bg-blue-500/10 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                      style={{ width: `${manaPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-blue-400/80 w-14 text-right">
                                    {mana.atual}/{mana.maximo}
                                  </span>
                                </div>
                              )}
                              {/* Prana */}
                              {prana?.maximo > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-yellow-400 w-7">PP</span>
                                  <div className="flex-1 h-2 rounded-full bg-yellow-500/10 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                                      style={{ width: `${pranaPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-yellow-400/80 w-14 text-right">
                                    {prana.atual}/{prana.maximo}
                                  </span>
                                </div>
                              )}
                              {/* Defesa */}
                              <div className="flex items-center gap-3 pt-1">
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-primary/60" />
                                  <span className="text-[10px] text-muted-foreground">CA</span>
                                  <span className="text-xs font-bold">{(() => {
                                    const base = 10
                                    const selectedAttrs = char.defenseAttributes || (char.defenseAttribute ? [char.defenseAttribute] : ['destreza'])
                                    const attrMod = selectedAttrs.reduce((sum: number, a: string) => sum + Math.floor(((char.atributos?.[a] || 10) - 10) / 2), 0)
                                    const equippedArmor = char.inventario?.armaduras?.find((a: any) => a.equipada && a.categoria !== 'escudo')
                                    const equippedShield = char.inventario?.armaduras?.find((a: any) => a.equipada && a.categoria === 'escudo')
                                    return base + attrMod + (equippedArmor?.ca || 0) + (equippedShield?.ca || 0) + (char.defesa_outros || 0)
                                  })()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum jogador ainda. Compartilhe o codigo de convite!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Viewer da Ficha do Jogador */}
            <MasterSheetViewer 
              member={selectedMemberSheet}
              isOpen={!!selectedMemberSheet}
              onClose={() => setSelectedMemberSheet(null)}
            />

            {/* Rolagem do Mestre */}
            {activeSession && (
              <MasterDiceRoller
                sessionId={activeSession.id}
                campaignId={campaign.id}
                userId={userId}
              />
            )}

            {/* Iniciativa */}
            {activeSession && (
              <InitiativeTracker
                sessionId={activeSession.id}
                campaignId={campaign.id}
                members={members}
                initialEntries={initialInitiative}
                isMaster={true}
                userId={userId}
              />
            )}
          </div>

          {/* Coluna Direita - Historico de Rolagens */}
          <div className="lg:col-span-2">
            <Card className="section-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Dices className="w-5 h-5 text-primary" />
                    Rolagens
                    {activeSession && (
                      <Badge variant="secondary">{rolls.length}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecretRolls(!showSecretRolls)}
                    >
                      {showSecretRolls ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    {rolls.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRolls}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {activeSession
                    ? 'Rolagens em tempo real dos jogadores'
                    : 'Inicie uma sessao para ver as rolagens'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!activeSession ? (
                  <div className="text-center py-12">
                    <Dices className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">
                      Inicie uma sessao para comecar a receber rolagens.
                    </p>
                  </div>
                ) : rolls.length === 0 ? (
                  <div className="text-center py-12">
                    <Dices className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30 animate-bounce" />
                    <p className="text-muted-foreground">
                      Aguardando rolagens dos jogadores...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {rolls
                      .filter((roll) => showSecretRolls || !roll.is_secret || roll.user_id === userId)
                      .map((roll) => (
                        <DiceRollCard
                          key={roll.id}
                          roll={roll}
                          playerName={roll.profiles?.display_name || 'Jogador'}
                          characterName={roll.character_name}
                          isMasterView
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
