'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, Zap } from 'lucide-react'
import type { DiceRoll } from '@/lib/types/database'

interface RollResultDisplayProps {
  roll: DiceRoll
  onDismiss?: () => void
}

export function RollResultDisplay({ roll, onDismiss }: RollResultDisplayProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(() => {
        setShow(false)
        onDismiss()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [onDismiss])

  if (!show) return null

  const getResultColor = () => {
    if (roll.is_critical) return 'from-yellow-500 to-orange-500'
    if (roll.is_fumble) return 'from-red-500 to-red-600'
    if (roll.total >= 20) return 'from-green-500 to-emerald-500'
    return 'from-blue-500 to-cyan-500'
  }

  const getResultLabel = () => {
    if (roll.is_critical) return 'ACERTO CRÍTICO!'
    if (roll.is_fumble) return 'FALHA CRÍTICA!'
    if (roll.total >= 20) return 'SUCESSO!'
    return 'RESULTADO'
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm animate-in fade-in duration-300',
        'pointer-events-auto'
      )}
      onClick={onDismiss}
    >
      <div
        className={cn(
          'relative text-center animate-in scale-in duration-500',
          'pointer-events-auto'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Background */}
        <div
          className={cn(
            'absolute inset-0 -z-10 rounded-full blur-3xl opacity-50',
            `bg-gradient-to-r ${getResultColor()}`
          )}
          style={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />

        {/* Card Principal */}
        <div
          className={cn(
            'relative rounded-2xl border-2 p-8 backdrop-blur-xl',
            'bg-gradient-to-br from-card/95 to-card/80',
            roll.is_critical && 'border-yellow-500/50 shadow-lg shadow-yellow-500/20',
            roll.is_fumble && 'border-red-500/50 shadow-lg shadow-red-500/20',
            !roll.is_critical && !roll.is_fumble && 'border-primary/30'
          )}
        >
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            {roll.is_critical ? (
              <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
            ) : roll.is_fumble ? (
              <Zap className="w-8 h-8 text-red-400 animate-bounce" />
            ) : null}
          </div>

          {/* Label */}
          <h2
            className={cn(
              'text-3xl font-bold mb-2',
              roll.is_critical && 'text-yellow-400',
              roll.is_fumble && 'text-red-400',
              !roll.is_critical && !roll.is_fumble && 'text-foreground'
            )}
          >
            {getResultLabel()}
          </h2>

          {/* Total */}
          <div className="mb-6">
            <div className={cn(
              'text-6xl font-black mb-1',
              roll.is_critical && 'text-yellow-400',
              roll.is_fumble && 'text-red-400',
              !roll.is_critical && !roll.is_fumble && 'text-primary'
            )}>
              {roll.total}
            </div>
            <p className="text-sm text-muted-foreground">
              {roll.formula}
            </p>
          </div>

          {/* Dados Individuais */}
          {roll.individual_results && roll.individual_results.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Dados:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {roll.individual_results.map((value, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                      'border-2 transition-all duration-300',
                      (roll.is_critical || roll.is_fumble) && value >= 19
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : value === 1
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-muted border-muted-foreground/30 text-foreground'
                    )}
                    style={{
                      animation: `scaleIn 0.3s ease-out ${i * 0.1}s both`,
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modificador */}
          {roll.modifier !== 0 && (
            <div className="text-sm text-muted-foreground mb-4">
              {roll.modifier > 0 ? '+' : ''}{roll.modifier}
            </div>
          )}

          {/* Observação */}
          {roll.observation && (
            <div className="text-sm text-muted-foreground italic border-t border-border/50 pt-3 mt-3">
              "{roll.observation}"
            </div>
          )}

          {/* Dismiss Hint */}
          <p className="text-xs text-muted-foreground mt-4">
            Clique para fechar
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
