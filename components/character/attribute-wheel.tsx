'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AttributeWheelProps {
  attributes: {
    forca: number
    destreza: number
    constituicao: number
    inteligencia: number
    sabedoria: number
    carisma: number
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ATTRIBUTE_LABELS = {
  forca: { pt: 'Força', abbr: 'FOR', color: 'from-red-600 to-red-500' },
  destreza: { pt: 'Destreza', abbr: 'DES', color: 'from-green-600 to-green-500' },
  constituicao: { pt: 'Constituição', abbr: 'CON', color: 'from-yellow-600 to-yellow-500' },
  inteligencia: { pt: 'Inteligência', abbr: 'INT', color: 'from-blue-600 to-blue-500' },
  sabedoria: { pt: 'Sabedoria', abbr: 'SAB', color: 'from-purple-600 to-purple-500' },
  carisma: { pt: 'Carisma', abbr: 'CAR', color: 'from-pink-600 to-pink-500' },
}

type AttributeKey = keyof typeof ATTRIBUTE_LABELS

const POSITIONS: Record<AttributeKey, { top: string; left: string }> = {
  constituicao: { top: '0%', left: '50%' },
  forca: { top: '25%', left: '13.4%' },
  inteligencia: { top: '25%', left: '86.6%' },
  sabedoria: { top: '75%', left: '13.4%' },
  carisma: { top: '75%', left: '86.6%' },
  destreza: { top: '50%', left: '50%' },
}

const SIZE_CONFIG = {
  sm: { container: 'w-32 h-32', circle: 'w-9 h-9', text: 'text-xs', label: 'text-[10px]' },
  md: { container: 'w-48 h-48', circle: 'w-14 h-14', text: 'text-sm', label: 'text-xs' },
  lg: { container: 'w-64 h-64', circle: 'w-16 h-16', text: 'text-base', label: 'text-sm' },
}

export function AttributeWheel({ attributes, size = 'md', className }: AttributeWheelProps) {
  const config = SIZE_CONFIG[size]
  const attrs = (Object.entries(attributes) as [AttributeKey, number][]).sort((a, b) => {
    const order = ['constituicao', 'forca', 'inteligencia', 'sabedoria', 'carisma', 'destreza']
    return order.indexOf(a[0]) - order.indexOf(b[0])
  })

  const getModifier = (value: number) => {
    const mod = Math.floor((value - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  return (
    <div className={cn('relative mx-auto', config.container, className)}>
      {/* Outer ring decorative */}
      <div className="absolute inset-0 rounded-full border-2 border-border/20" />

      {/* Inner ring decorative */}
      <div className="absolute inset-1/3 left-1/4 right-1/4 top-1/4 rounded-full border border-border/10" />

      {/* Center circle for destreza */}
      <div
        className={cn(
          'absolute rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300',
          'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700',
          config.circle,
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
        )}
      >
        <div className={cn('font-bold text-foreground', config.text)}>
          {ATTRIBUTE_LABELS['destreza'].abbr}
        </div>
        <div className={cn('font-black text-primary', config.text)}>
          {attributes.destreza}
        </div>
        <div className={cn('text-muted-foreground font-semibold', 'text-[10px]')}>
          {getModifier(attributes.destreza)}
        </div>
      </div>

      {/* Outer attribute circles */}
      {attrs.map(([key, value]) => {
        if (key === 'destreza') return null
        const pos = POSITIONS[key]
        const label = ATTRIBUTE_LABELS[key]
        const mod = getModifier(value)

        return (
          <div
            key={key}
            className={cn(
              'absolute rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300',
              'bg-gradient-to-br border-border/50 hover:scale-110',
              `bg-gradient-to-br ${label.color}`,
              config.circle,
            )}
            style={{
              top: pos.top,
              left: pos.left,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={cn('font-bold text-white drop-shadow-lg', config.text)}>
              {label.abbr}
            </div>
            <div className={cn('font-black text-white drop-shadow-lg', config.text)}>
              {value}
            </div>
            <div className={cn('text-white/80 font-semibold drop-shadow', 'text-[10px]')}>
              {mod}
            </div>
          </div>
        )
      })}

      {/* Attribute labels */}
      <div className="absolute inset-0">
        {attrs.map(([key, _]) => {
          if (key === 'destreza') return null
          const pos = POSITIONS[key]
          const label = ATTRIBUTE_LABELS[key]
          const distance = size === 'sm' ? 72 : size === 'md' ? 110 : 145

          return (
            <div
              key={`label-${key}`}
              className={cn('absolute text-center text-muted-foreground whitespace-nowrap font-semibold', config.label)}
              style={{
                top: pos.top,
                left: pos.left,
                transform: `translate(-50%, calc(-50% - ${distance}px))`,
              }}
            >
              {label.pt}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(AttributeWheel)
