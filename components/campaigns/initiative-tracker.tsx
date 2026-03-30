'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Swords,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  SkipForward,
  Dices,
  Loader2,
  RotateCcw,
  Crown,
  User,
} from 'lucide-react'
import type { InitiativeEntry, CampaignMember, Profile } from '@/lib/types/database'

interface MemberWithProfile extends CampaignMember {
  profiles: Profile
}

interface InitiativeTrackerProps {
  sessionId: string
  campaignId: string
  members: MemberWithProfile[]
  initialEntries: InitiativeEntry[]
  isMaster: boolean
  userId: string
}

export function InitiativeTracker({
  sessionId,
  campaignId,
  members,
  initialEntries,
  isMaster,
  userId,
}: InitiativeTrackerProps) {
  const [entries, setEntries] = useState<InitiativeEntry[]>(
    [...initialEntries].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [rolling, setRolling] = useState(false)
  const [addNpcOpen, setAddNpcOpen] = useState(false)
  const [npcName, setNpcName] = useState('')
  const [npcModifier, setNpcModifier] = useState('')
  const [addingNpc, setAddingNpc] = useState(false)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`initiative_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'initiative_entries',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          // Re-fetch all entries on any change
          const { data } = await supabase
            .from('initiative_entries')
            .select('*')
            .eq('session_id', sessionId)
            .order('sort_order', { ascending: true })

          if (data) {
            setEntries(data as InitiativeEntry[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const rollInitiativeForAll = async () => {
    setRolling(true)
    const supabase = createClient()

    // Limpar entradas existentes
    await supabase
      .from('initiative_entries')
      .delete()
      .eq('session_id', sessionId)

    // Rolar para cada membro
    const newEntries: Omit<InitiativeEntry, 'id' | 'created_at'>[] = members.map(
      (member, index) => {
        const rollValue = Math.floor(Math.random() * 20) + 1
        const modifier = 0 // Could be loaded from character sheet
        const total = rollValue + modifier

        return {
          session_id: sessionId,
          campaign_member_id: member.id,
          character_name: member.character_name || member.profiles?.display_name || 'Jogador',
          roll_value: rollValue,
          modifier,
          total,
          sort_order: 0,
          is_current: false,
          is_npc: false,
        }
      }
    )

    // Ordenar por total (maior primeiro)
    newEntries.sort((a, b) => b.total - a.total)
    newEntries.forEach((entry, idx) => {
      entry.sort_order = idx
    })

    // Marcar o primeiro como atual
    if (newEntries.length > 0) {
      newEntries[0].is_current = true
    }

    const { data } = await supabase
      .from('initiative_entries')
      .insert(newEntries)
      .select()

    if (data) {
      setEntries(data as InitiativeEntry[])
    }

    setRolling(false)
  }

  const addNpc = async () => {
    if (!npcName.trim()) return
    setAddingNpc(true)
    const supabase = createClient()

    const mod = parseInt(npcModifier) || 0
    const rollValue = Math.floor(Math.random() * 20) + 1
    const total = rollValue + mod

    // Encontrar posição correta (inserir e reordenar)
    const insertIndex = entries.findIndex((e) => e.total < total)
    const sortOrder = insertIndex >= 0 ? insertIndex : entries.length

    const { data: newEntry } = await supabase
      .from('initiative_entries')
      .insert({
        session_id: sessionId,
        campaign_member_id: null,
        character_name: npcName.trim(),
        roll_value: rollValue,
        modifier: mod,
        total,
        sort_order: sortOrder,
        is_current: false,
        is_npc: true,
      })
      .select()
      .single()

    if (newEntry) {
      // Reordenar todas as entradas
      const updated = [...entries]
      updated.splice(sortOrder, 0, newEntry as InitiativeEntry)
      
      // Atualizar sort_order de todas
      const updates = updated.map((entry, idx) => ({
        ...entry,
        sort_order: idx,
      }))

      for (const entry of updates) {
        await supabase
          .from('initiative_entries')
          .update({ sort_order: entry.sort_order })
          .eq('id', entry.id)
      }

      setEntries(updates)
    }

    setNpcName('')
    setNpcModifier('')
    setAddingNpc(false)
    setAddNpcOpen(false)
  }

  const removeEntry = async (entryId: string) => {
    const supabase = createClient()
    await supabase.from('initiative_entries').delete().eq('id', entryId)
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  const moveEntry = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= entries.length) return

    const supabase = createClient()
    const updated = [...entries]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIndex, 0, moved)

    // Atualizar sort_order
    const promises = updated.map((entry, idx) =>
      supabase
        .from('initiative_entries')
        .update({ sort_order: idx })
        .eq('id', entry.id)
    )

    await Promise.all(promises)
    setEntries(updated.map((e, idx) => ({ ...e, sort_order: idx })))
  }

  const advanceTurn = async () => {
    const supabase = createClient()
    const currentIndex = entries.findIndex((e) => e.is_current)
    const nextIndex = currentIndex >= entries.length - 1 ? 0 : currentIndex + 1

    // Desmarcar atual
    if (currentIndex >= 0) {
      await supabase
        .from('initiative_entries')
        .update({ is_current: false })
        .eq('id', entries[currentIndex].id)
    }

    // Marcar próximo
    await supabase
      .from('initiative_entries')
      .update({ is_current: true })
      .eq('id', entries[nextIndex].id)

    setEntries((prev) =>
      prev.map((e, idx) => ({
        ...e,
        is_current: idx === nextIndex,
      }))
    )
  }

  const clearInitiative = async () => {
    const supabase = createClient()
    await supabase
      .from('initiative_entries')
      .delete()
      .eq('session_id', sessionId)
    setEntries([])
  }

  const currentEntry = entries.find((e) => e.is_current)

  return (
    <Card className="section-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Iniciativa
          </CardTitle>
          {isMaster && entries.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={advanceTurn}
                title="Proximo turno"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearInitiative}
                className="text-muted-foreground hover:text-destructive"
                title="Limpar iniciativa"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        {currentEntry && (
          <CardDescription>
            Vez de: <span className="font-semibold text-primary">{currentEntry.character_name}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-4">
            <Swords className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma iniciativa rolada
            </p>
            {isMaster && (
              <div className="flex flex-col gap-2">
                <Button onClick={rollInitiativeForAll} className="btn-primary" disabled={rolling || members.length === 0}>
                  {rolling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Dices className="w-4 h-4 mr-2" />
                  )}
                  Rolar Iniciativa
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Lista de iniciativa */}
            <div className="space-y-1">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                    entry.is_current
                      ? 'bg-primary/15 border border-primary/40 shadow-sm'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {/* Position number */}
                  <span className={`text-xs font-bold w-5 text-center ${
                    entry.is_current ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>

                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.is_npc
                      ? 'bg-red-500/20'
                      : 'bg-primary/10'
                  }`}>
                    {entry.is_npc ? (
                      <Crown className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      entry.is_current ? 'text-primary' : ''
                    }`}>
                      {entry.character_name}
                    </p>
                  </div>

                  {/* Total + details */}
                  <div className="flex items-center gap-1">
                    <Badge variant={entry.is_current ? 'default' : 'secondary'} className="text-xs font-mono tabular-nums">
                      {entry.total}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({entry.roll_value}{entry.modifier >= 0 ? '+' : ''}{entry.modifier})
                    </span>
                  </div>

                  {/* Master controls */}
                  {isMaster && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveEntry(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => moveEntry(index, 'down')}
                        disabled={index === entries.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:text-destructive"
                        onClick={() => removeEntry(entry.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Master action buttons */}
            {isMaster && (
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Dialog open={addNpcOpen} onOpenChange={setAddNpcOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Plus className="w-3 h-3 mr-1" />
                      NPC
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Adicionar NPC</DialogTitle>
                      <DialogDescription>
                        Adicione um NPC à ordem de iniciativa.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="form-group">
                        <Label>Nome do NPC *</Label>
                        <Input
                          placeholder="Ex: Goblin Arqueiro"
                          value={npcName}
                          onChange={(e) => setNpcName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <Label>Modificador de Iniciativa</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={npcModifier}
                          onChange={(e) => setNpcModifier(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={addNpc}
                        className="btn-primary"
                        disabled={addingNpc || !npcName.trim()}
                      >
                        {addingNpc ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={rollInitiativeForAll}
                  disabled={rolling}
                >
                  {rolling ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Dices className="w-3 h-3 mr-1" />
                  )}
                  Re-rolar
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
