'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { FullCharacterSheet } from '@/components/character/full-character-sheet'
import { validateAndRepairCharacterData, type CharacterData } from '@/lib/schemas/character'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface CharacterSheetPanelProps {
  character: any | null
  onUpdateCharacter?: (updates: Partial<CharacterData>) => void
  readOnly?: boolean
  persistLocalSheets?: boolean
}

/**
 * Wrapper que integra validação e reparo de dados com o FullCharacterSheet.
 */
export function CharacterSheetPanel({
  character,
  onUpdateCharacter,
  readOnly = false,
  persistLocalSheets = true,
}: CharacterSheetPanelProps) {
  // Default character structure para fallback
  const defaultCharacter: CharacterData = useMemo(() => ({
    nome: 'Personagem',
    nivel: 1,
    raca: '',
    classes: [],
    divindade: '',
    tendencia: '',
    deslocamento: 9,
    origem: '',
    foto: '',
    defenseAttributes: ['destreza'],
    spellDCAttributes: ['inteligencia'],
    atributos: {
      forca: 10,
      destreza: 10,
      constituicao: 10,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10,
    },
    recursos: {
      vida: { atual: 0, maximo: 0, cor: '#ef4444' },
      mana: { atual: 0, maximo: 0, cor: '#3b82f6' },
      prana: { atual: 0, maximo: 0, cor: '#eab308' },
      recursos_extras: [],
    },
    defesa: 10,
    defesa_outros: 0,
    spellDC_outros: 0,
    pericias: {},
    inventario: {
      armas: [],
      armaduras: [],
      itens: [],
      dinheiro: {},
    },
    magias: {
      arcana: {},
      divina: {},
    },
    habilidades: [],
    poderes: [],
    oficiosPersonalizados: [],
  }), [])

  // Valida e repara os dados do personagem
  const validatedCharacter = useMemo(() => {
    if (!character) {
      return defaultCharacter
    }

    try {
      // Tenta validar com o schema Zod
      return validateAndRepairCharacterData(character, defaultCharacter)
    } catch (error) {
      console.error('[v0] Character validation failed:', error)
      // Retorna com dados reparados
      return validateAndRepairCharacterData(character, defaultCharacter)
    }
  }, [character, defaultCharacter])

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSheetChange = useCallback(
    (next: CharacterData) => {
      if (!onUpdateCharacter) return
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = setTimeout(() => {
        saveDebounceRef.current = null
        try {
          const validated = validateAndRepairCharacterData(next, defaultCharacter)
          onUpdateCharacter(validated)
        } catch (error) {
          console.error('[v0] Failed to update character:', error)
        }
      }, 450)
    },
    [onUpdateCharacter, defaultCharacter]
  )

  useEffect(() => {
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    }
  }, [])

  if (character == null) {
    return (
      <Card className="p-8 flex items-center gap-4 bg-yellow-900/20 border-yellow-600/40">
        <AlertCircle className="w-6 h-6 text-yellow-600" />
        <div>
          <h3 className="font-semibold text-foreground mb-1">Nenhuma ficha carregada</h3>
          <p className="text-sm text-muted-foreground">
            Importe ou crie uma ficha de personagem para visualizar aqui
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full h-full relative">
      <FullCharacterSheet
        initialCharacter={validatedCharacter as any}
        readOnly={readOnly}
        hideSidebar={true}
        persistLocalSheets={persistLocalSheets}
        onCharacterChange={onUpdateCharacter ? (handleSheetChange as any) : undefined}
      />
    </div>
  )
}

export default React.memo(CharacterSheetPanel)
