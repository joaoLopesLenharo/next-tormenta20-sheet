'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'

interface ResourceBarProps {
  label: string
  current: number
  maximum: number
  color?: string
  onChange?: (current: number) => void
  onChangeMax?: (maximum: number) => void
  readOnly?: boolean
}

export function ResourceBar({
  label,
  current,
  maximum,
  color = '#ef4444',
  onChange,
  onChangeMax,
  readOnly = false,
}: ResourceBarProps) {
  const [isEditingCurrent, setIsEditingCurrent] = useState(false)
  const [isEditingMax, setIsEditingMax] = useState(false)
  const percentage = maximum > 0 ? Math.min(100, Math.max(0, (current / maximum) * 100)) : 0

  const handleCurrentChange = (value: number) => {
    const newValue = Math.max(0, Math.min(value, maximum))
    onChange?.(newValue)
  }

  const handleMaxChange = (value: number) => {
    const newValue = Math.max(1, value)
    onChangeMax?.(newValue)
  }

  return (
    <div className="space-y-2">
      {/* Label and values */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isEditingCurrent ? (
            <Input
              type="number"
              value={current}
              onChange={(e) => handleCurrentChange(parseInt(e.target.value) || 0)}
              onBlur={() => setIsEditingCurrent(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingCurrent(false)
              }}
              autoFocus
              className="w-16 h-6 text-xs"
              disabled={readOnly}
            />
          ) : (
            <button
              onClick={() => !readOnly && setIsEditingCurrent(true)}
              className={cn(
                'px-2 py-1 rounded text-xs font-semibold font-mono',
                'bg-secondary/50 hover:bg-secondary transition-colors',
                readOnly && 'cursor-default'
              )}
            >
              {current}
            </button>
          )}
          <span>/</span>
          {isEditingMax ? (
            <Input
              type="number"
              value={maximum}
              onChange={(e) => handleMaxChange(parseInt(e.target.value) || 1)}
              onBlur={() => setIsEditingMax(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingMax(false)
              }}
              autoFocus
              className="w-16 h-6 text-xs"
              disabled={readOnly}
            />
          ) : (
            <button
              onClick={() => !readOnly && setIsEditingMax(true)}
              className={cn(
                'px-2 py-1 rounded text-xs font-semibold font-mono',
                'bg-secondary/50 hover:bg-secondary transition-colors',
                readOnly && 'cursor-default'
              )}
            >
              {maximum}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-6 rounded-sm border border-border/50 bg-secondary/30 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground drop-shadow-sm pointer-events-none">
          {percentage.toFixed(0)}%
        </div>
      </div>

      {/* Quick adjustment buttons */}
      {!readOnly && (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => handleCurrentChange(0)}
            title="Zerar"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 flex-1"
            onClick={() => handleCurrentChange(Math.max(0, current - 1))}
            title="Diminuir 1"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 flex-1"
            onClick={() => handleCurrentChange(Math.min(maximum, current + 1))}
            title="Aumentar 1"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => handleCurrentChange(maximum)}
            title="Restaurar tudo"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface ResourceBarsProps {
  vida: { atual: number; maximo: number; cor?: string }
  mana: { atual: number; maximo: number; cor?: string }
  prana: { atual: number; maximo: number; cor?: string }
  onVidaChange?: (current: number, maximum: number) => void
  onManaChange?: (current: number, maximum: number) => void
  onPranaChange?: (current: number, maximum: number) => void
  readOnly?: boolean
}

export function ResourceBars({
  vida,
  mana,
  prana,
  onVidaChange,
  onManaChange,
  onPranaChange,
  readOnly = false,
}: ResourceBarsProps) {
  return (
    <div className="space-y-4">
      <ResourceBar
        label="Vida"
        current={vida.atual}
        maximum={vida.maximo}
        color={vida.cor || '#ef4444'}
        onChange={(current) => onVidaChange?.(current, vida.maximo)}
        onChangeMax={(maximum) => onVidaChange?.(vida.atual, maximum)}
        readOnly={readOnly}
      />
      <ResourceBar
        label="Mana"
        current={mana.atual}
        maximum={mana.maximo}
        color={mana.cor || '#3b82f6'}
        onChange={(current) => onManaChange?.(current, mana.maximo)}
        onChangeMax={(maximum) => onManaChange?.(mana.atual, maximum)}
        readOnly={readOnly}
      />
      <ResourceBar
        label="Prana"
        current={prana.atual}
        maximum={prana.maximo}
        color={prana.cor || '#eab308'}
        onChange={(current) => onPranaChange?.(current, prana.maximo)}
        onChangeMax={(maximum) => onPranaChange?.(prana.atual, maximum)}
        readOnly={readOnly}
      />
    </div>
  )
}

export default React.memo(ResourceBars)
