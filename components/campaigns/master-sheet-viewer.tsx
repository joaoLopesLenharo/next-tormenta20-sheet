'use client'

import { useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Users, X } from 'lucide-react'
import { CharacterSheetView, type CampaignSheetData } from '@/components/campaigns/character-sheet-view'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { CharacterData } from '@/lib/schemas/character'

interface MasterSheetViewerProps {
  member: any
  isOpen: boolean
  onClose: () => void
  /** Chamado quando a ficha muda (inclui debounce antes do Supabase) */
  onCharacterSaved?: (data: CampaignSheetData) => void
}

export function MasterSheetViewer({
  member,
  isOpen,
  onClose,
  onCharacterSaved,
}: MasterSheetViewerProps) {
  const char = member?.character_data
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistCharacter = useCallback(
    async (data: CharacterData) => {
      if (!member?.id) return
      const supabase = createClient()
      const { error } = await supabase
        .from('campaign_members')
        .update({ character_data: data })
        .eq('id', member.id)
      if (error) {
        console.error('[MasterSheetViewer] Falha ao salvar ficha:', error)
      }
    },
    [member?.id]
  )

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    }
  }, [])

  const handleCharacterChange = useCallback(
    (next: CampaignSheetData) => {
      onCharacterSaved?.(next)
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
      persistTimerRef.current = setTimeout(() => {
        persistTimerRef.current = null
        void persistCharacter(next as CharacterData)
      }, 500)
    },
    [onCharacterSaved, persistCharacter]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] max-h-[90vh] p-0 border border-border/50 rounded-xl flex flex-col bg-background overflow-hidden" showCloseButton={false}>
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/50 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Ficha de {char?.nome || member?.profiles?.display_name || 'Jogador'}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {!char ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm text-muted-foreground">
              Este jogador ainda não possui uma ficha carregada no painel.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <CharacterSheetView
              key={member.id}
              character={char}
              readOnly={false}
              onCharacterChange={handleCharacterChange}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
