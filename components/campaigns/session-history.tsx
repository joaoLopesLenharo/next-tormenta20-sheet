'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DiceRollCard } from '@/components/dice/dice-roll-card'
import { Calendar, Dices, ChevronDown, Loader2 } from 'lucide-react'
import type { Session, DiceRoll } from '@/lib/types/database'

interface SessionWithRolls extends Session {
  roll_count?: number
  profiles?: { display_name: string }
}

interface SessionHistoryProps {
  campaignId: string
  isMaster: boolean
  sessions: Session[]
  userId: string
}

export function SessionHistory({ campaignId, isMaster, sessions, userId }: SessionHistoryProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [sessionRolls, setSessionRolls] = useState<Record<string, DiceRoll[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const loadSessionRolls = async (sessionId: string) => {
    if (sessionRolls[sessionId]) return

    setLoading((prev) => ({ ...prev, [sessionId]: true }))
    const supabase = createClient()

    let query = supabase
      .from('dice_rolls')
      .select('*')
      .eq('session_id', sessionId)

    // Jogador vê apenas suas próprias rolagens
    if (!isMaster) {
      query = query.eq('user_id', userId)
    }

    const { data: rolls } = await query.order('created_at', { ascending: false })

    if (rolls) {
      setSessionRolls((prev) => ({ ...prev, [sessionId]: rolls as DiceRoll[] }))
    }

    setLoading((prev) => ({ ...prev, [sessionId]: false }))
  }

  const handleExpandSession = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null)
    } else {
      setExpandedSession(sessionId)
      loadSessionRolls(sessionId)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSessionDuration = (startedAt: string, endedAt: string | null) => {
    const start = new Date(startedAt).getTime()
    const end = endedAt ? new Date(endedAt).getTime() : Date.now()
    const diff = end - start
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <Card className="section-card">
          <CardContent className="pt-8 text-center">
            <Dices className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              Nenhuma sessão registrada nesta campanha ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        sessions.map((session) => {
          const isExpanded = expandedSession === session.id
          const rolls = sessionRolls[session.id] || []
          const isLoadingRolls = loading[session.id] || false

          return (
            <Card key={session.id} className="section-card">
              <div
                className="cursor-pointer"
                onClick={() => handleExpandSession(session.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">
                          {session.name || `Sessão de ${formatDate(session.started_at).split(' ')[0]}`}
                        </h3>
                        {!session.ended_at && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Ativa
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {formatDate(session.started_at)} - {session.ended_at ? formatDate(session.ended_at) : 'Em andamento'}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duração: {getSessionDuration(session.started_at, session.ended_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Dices className="w-3 h-3 mr-1" />
                        {rolls.length} rolagens
                      </Badge>
                      <ChevronDown
                        className="w-4 h-4 text-muted-foreground transition-transform"
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
              </div>

              {isExpanded && (
                <CardContent className="space-y-3 border-t border-border/50 pt-4">
                  {isLoadingRolls ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : rolls.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma rolagem registrada nesta sessão.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {rolls.map((roll) => (
                        <DiceRollCard
                          key={roll.id}
                          roll={roll}
                          playerName={roll.character_name || 'Jogador'}
                          characterName={undefined}
                          isMasterView={isMaster}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
