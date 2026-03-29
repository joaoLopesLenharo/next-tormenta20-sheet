'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function DiceAnimation() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        {/* Dado principal girando */}
        <div
          className={cn(
            'w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-accent',
            'flex items-center justify-center text-4xl font-bold text-primary-foreground',
            'animate-dice-roll shadow-2xl'
          )}
          style={{
            animation: 'diceRoll 1s ease-out forwards',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-12 h-12"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Particulas */}
        <div className="absolute inset-0 -z-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-accent"
              style={{
                top: '50%',
                left: '50%',
                animation: `particle ${0.8 + i * 0.1}s ease-out forwards`,
                animationDelay: `${i * 0.05}s`,
                transform: `rotate(${i * 45}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes diceRoll {
          0% {
            transform: scale(0.5) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
        }

        @keyframes particle {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(-50% + var(--x, 0) * 60px),
                calc(-50% + var(--y, 0) * 60px)
              )
              scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
