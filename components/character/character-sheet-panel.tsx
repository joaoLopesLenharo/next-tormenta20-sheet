'use client'

import React, { useCallback, useMemo } from 'react'
import { CharacterSheetView } from './character-sheet-view'
import { validateAndRepairCharacterData, type CharacterData } from '@/lib/schemas/character'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface CharacterSheetPanelProps {
  character: any | null
  onUpdateCharacter?: (updates: Partial<CharacterData>) => void
  readOnly?: boolean
}

/**
 * Wrapper que integra validação e reparo de dados com o CharacterSheetView
 * Valida dados do localStorage e do Supabase antes de renderizar
 */
export function CharacterSheetPanel({
  character,
  onUpdateCharacter,
  readOnly = false,
}: CharacterSheetPanelProps) {
  // Default character structure para fallback
  const defaultCharacter: CharacterData = useMemo(() => ({
    nome: 'Personagem',
    nivel: 1,
    raca: '',
    classes: [],
    origem: '',
    foto: '',
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
    },
    defesa: 10,
    defesa_outros: 0,
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

  const handleUpdate = useCallback(
    (updates: Partial<CharacterData>) => {
      if (onUpdateCharacter) {
        // Valida antes de chamar o callback
        try {
          const merged = { ...validatedCharacter, ...updates }
          const validated = validateAndRepairCharacterData(merged, defaultCharacter)
          onUpdateCharacter(validated)
        } catch (error) {
          console.error('[v0] Failed to update character:', error)
        }
      }
    },
    [validatedCharacter, onUpdateCharacter, defaultCharacter]
  )

  if (!validatedCharacter.nome) {
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
    <CharacterSheetView
      character={validatedCharacter}
      onUpdate={handleUpdate}
      readOnly={readOnly}
      showActions={!readOnly}
    />
  )
}

export default React.memo(CharacterSheetPanel)
