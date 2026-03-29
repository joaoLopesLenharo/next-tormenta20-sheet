'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Eye, Swords, Shield, Target, Dices, Sparkles } from 'lucide-react'
import type { DiceRoll } from '@/lib/types/database'

interface DiceRollCardProps {
  roll: DiceRoll
  playerName?: string
  characterName?: string | null
  isMasterView?: boolean
}

const rollTypeConfig = {
  pericia: { label: 'Pericia', icon: Sparkles, color: 'text-blue-400' },
  ataque: { label: 'Ataque', icon: Swords, color: 'text-red-400' },
  dano: { label: 'Dano', icon: Target, color: 'text-orange-400' },
  resistencia: { label: 'Resistencia', icon: Shield, color: 'text-green-400' },
  livre: { label: 'Livre', icon: Dices, color: 'text-purple-400' },
  secreto: { label: 'Secreto', icon: Eye, color: 'text-gray-400' },
}

export function DiceRollCard({
  roll,
  playerName,
  characterName,
  isMasterView = false,
}: DiceRollCardProps) {
  const config = rollTypeConfig[roll.roll_type] || rollTypeConfig.livre
  const Icon = config.icon

  const getResultClass = () => {
    if (roll.is_critical) return 'border-yellow-500/50 bg-yellow-500/10'
    if (roll.is_fumble) return 'border-red-500/50 bg-red-500/10'
    return 'border-border bg-card'
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        getResultClass(),
        roll.is_secret && 'opacity-75 border-dashed'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', config.color)} />
          <div>
            {playerName && (
              <span className="text-sm font-medium">{playerName}</span>
            )}
            {characterName && (
              <span className="text-xs text-muted-foreground ml-1">
                ({characterName})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          {roll.is_secret && isMasterView && (
            <Badge variant="secondary" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Secreto
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(roll.created_at)}
          </span>
        </div>
      </div>

      {/* Formula e Resultado */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <code className="text-sm text-muted-foreground">{roll.formula}</code>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {roll.individual_results.map((result, idx) => (
              <span
                key={idx}
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded text-sm font-mono font-bold',
                  roll.natural_roll === 20 && result === 20
                    ? 'bg-yellow-500 text-yellow-950'
                    : roll.natural_roll === 1 && result === 1
                    ? 'bg-red-500 text-red-950'
                    : 'bg-muted text-foreground'
                )}
              >
                {result}
              </span>
            ))}
            {roll.modifier !== 0 && (
              <span className="text-sm text-muted-foreground">
                {roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier}
              </span>
            )}
          </div>
        </div>

        {/* Total */}
        <div
          className={cn(
            'flex items-center justify-center min-w-[60px] h-14 rounded-lg text-2xl font-bold',
            roll.is_critical
              ? 'bg-yellow-500 text-yellow-950'
              : roll.is_fumble
              ? 'bg-red-500 text-red-950'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {roll.total}
        </div>
      </div>

      {/* Badges de Critico/Falha */}
      {(roll.is_critical || roll.is_fumble) && (
        <div className="mt-3">
          {roll.is_critical && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Acerto Critico!
            </Badge>
          )}
          {roll.is_fumble && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Falha Critica!
            </Badge>
          )}
        </div>
      )}

      {/* Observacao */}
      {roll.observation && (
        <p className="mt-2 text-sm text-muted-foreground italic">
          {roll.observation}
        </p>
      )}
    </div>
  )
}
