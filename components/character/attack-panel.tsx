'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sword, Wand2, Shield } from 'lucide-react'
import { DiceRoller } from '@/components/dice-roller'

interface Weapon {
  id?: string
  nome: string
  tipo: string
  dano: string
  critico?: string
  especial?: string
  critico_multiplicador?: string
  equipada?: boolean
  alcance?: string
  categoria?: string
}

interface AttackPanelProps {
  weapons: Weapon[]
  defesa: number
  defesaOutros?: number
  attributeModifiers: Record<string, number>
  onRoll?: (formula: string, description: string) => void
  readOnly?: boolean
}

function calculateDamageBonus(weapon: Weapon, modifiers: Record<string, number>): number {
  const baseStr = modifiers['forca'] || 0
  const baseDex = modifiers['destreza'] || 0

  // Determine bonus based on weapon type
  if (weapon.tipo?.toLowerCase().includes('corpo') || weapon.tipo?.toLowerCase().includes('melee')) {
    return baseStr
  } else if (weapon.tipo?.toLowerCase().includes('distância') || weapon.tipo?.toLowerCase().includes('ranged')) {
    return baseDex
  }

  return baseStr > baseDex ? baseStr : baseDex
}

function parseDamageFormula(dano: string): { dice: string; bonus: number } {
  const match = dano.match(/(\d*d\d+)(?:\+(\d+))?/i)
  if (!match) return { dice: '1d6', bonus: 0 }

  return {
    dice: match[1],
    bonus: match[2] ? parseInt(match[2]) : 0,
  }
}

export function AttackPanel({
  weapons,
  defesa,
  defesaOutros = 0,
  attributeModifiers,
  onRoll,
  readOnly = false,
}: AttackPanelProps) {
  const equippedWeapons = useMemo(
    () => weapons.filter((w) => w.equipada),
    [weapons]
  )

  const totalDefesa = defesa + defesaOutros

  const renderAttackBonus = (weapon: Weapon): string => {
    const baseBonus = weapon.tipo?.toLowerCase().includes('distância') ? 
      (attributeModifiers['destreza'] || 0) : 
      (attributeModifiers['forca'] || 0)

    return baseBonus >= 0 ? `+${baseBonus}` : `${baseBonus}`
  }

  const renderDamageBonus = (weapon: Weapon): string => {
    const bonus = calculateDamageBonus(weapon, attributeModifiers)
    return bonus >= 0 ? `+${bonus}` : `${bonus}`
  }

  if (equippedWeapons.length === 0) {
    return (
      <Card className="p-4 bg-secondary/30">
        <div className="text-center text-sm text-muted-foreground">
          <Sword className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Nenhuma arma equipada
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Defense Display */}
      <Card className="p-4 bg-gradient-to-r from-blue-900/20 to-transparent border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-foreground">Defesa</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{totalDefesa}</div>
        </div>
      </Card>

      {/* Equipped Weapons */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Sword className="w-4 h-4" />
          Armas Equipadas
        </h4>

        {equippedWeapons.map((weapon, index) => {
          const { dice, bonus } = parseDamageFormula(weapon.dano)
          const damageBonus = calculateDamageBonus(weapon, attributeModifiers)
          const totalDamageBonus = bonus + damageBonus
          const attackBonus = weapon.tipo?.toLowerCase().includes('distância') ? 
            (attributeModifiers['destreza'] || 0) : 
            (attributeModifiers['forca'] || 0)

          return (
            <Card key={weapon.id || index} className="p-4 bg-secondary/40 border-border/50">
              <div className="space-y-3">
                {/* Weapon name and type */}
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-foreground">{weapon.nome}</h5>
                    <p className="text-xs text-muted-foreground">{weapon.tipo}</p>
                  </div>
                  {weapon.alcance && (
                    <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      Alcance: {weapon.alcance}
                    </div>
                  )}
                </div>

                {/* Attack Roll Row */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => {
                      const formula = `d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`
                      onRoll?.(formula, `Ataque com ${weapon.nome}`)
                    }}
                    disabled={readOnly}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Ataque {attackBonus >= 0 ? '+' : ''}{attackBonus}
                  </Button>

                  {/* Damage Roll Row */}
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      const formula = `${dice}${totalDamageBonus >= 0 ? '+' : ''}${totalDamageBonus}`
                      onRoll?.(formula, `Dano com ${weapon.nome}`)
                    }}
                    disabled={readOnly}
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Dano {totalDamageBonus >= 0 ? '+' : ''}{totalDamageBonus}
                  </Button>

                  {/* Critical info */}
                  {weapon.critico && (
                    <div className="flex items-center justify-center text-xs bg-orange-900/40 border border-orange-500/50 rounded">
                      <span className="font-mono">
                        Crítico: {weapon.critico}
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional info */}
                {weapon.especial && (
                  <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded border border-border/30">
                    <strong>Especial:</strong> {weapon.especial}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {weapons.length > equippedWeapons.length && (
        <p className="text-xs text-muted-foreground text-center">
          +{weapons.length - equippedWeapons.length} arma(s) não equipada(s)
        </p>
      )}
    </div>
  )
}

export default React.memo(AttackPanel)
