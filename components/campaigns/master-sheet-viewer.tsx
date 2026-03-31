'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users } from 'lucide-react'
import { CharacterSheetView } from '@/components/campaigns/character-sheet-view'

interface MasterSheetViewerProps {
  member: any
  isOpen: boolean
  onClose: () => void
}

export function MasterSheetViewer({ member, isOpen, onClose }: MasterSheetViewerProps) {
  const char = member?.character_data

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl h-[90svh] p-0 flex flex-col gap-0 max-h-screen">
        <DialogHeader className="px-4 pt-4 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
            <Users className="w-4 h-4" />
            Ficha de{' '}
            <span className="text-foreground font-semibold">
              {member?.profiles?.display_name || 'Jogador'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {!char ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm text-muted-foreground">
              Este jogador ainda não possui uma ficha carregada no painel.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <CharacterSheetView
              character={char}
              readOnly={true}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

