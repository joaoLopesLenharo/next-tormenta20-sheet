'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Settings, Share2 } from 'lucide-react'
import { AttributeWheel } from './attribute-wheel'
import { ResourceBars } from './resource-bars'
import { SkillsTable } from './skills-table'
import { AttackPanel } from './attack-panel'

export interface CharacterSheetData {
  nome: string
  nivel: number
  raca: string
  classes: any[]
  origem?: string
  foto?: string | { src: string }
  atributos: {
    forca: number
    destreza: number
    constituicao: number
    inteligencia: number
    sabedoria: number
    carisma: number
  }
  recursos: {
    vida: { atual: number; maximo: number; cor?: string }
    mana: { atual: number; maximo: number; cor?: string }
    prana: { atual: number; maximo: number; cor?: string }
  }
  defesa: number
  defesa_outros?: number
  pericias: Record<string, any>
  inventario?: {
    armas: any[]
  }
  habilidades?: any[]
  descricao?: string
}

interface CharacterSheetViewProps {
  character: CharacterSheetData
  onUpdate?: (updates: Partial<CharacterSheetData>) => void
  readOnly?: boolean
  showActions?: boolean
}

export function CharacterSheetView({
  character,
  onUpdate,
  readOnly = false,
  showActions = true,
}: CharacterSheetViewProps) {
  const [activeTab, setActiveTab] = useState('combate')

  const getAttributeModifier = (value: number): number => {
    return Math.floor((value - 10) / 2)
  }

  const attributeModifiers = {
    forca: getAttributeModifier(character.atributos.forca),
    destreza: getAttributeModifier(character.atributos.destreza),
    constituicao: getAttributeModifier(character.atributos.constituicao),
    inteligencia: getAttributeModifier(character.atributos.inteligencia),
    sabedoria: getAttributeModifier(character.atributos.sabedoria),
    carisma: getAttributeModifier(character.atributos.carisma),
  }

  const classNames = character.classes
    .map((c: any) => (typeof c === 'string' ? c : c.nome || c.name))
    .join(' / ')

  const getPhotoUrl = (): string => {
    if (!character.foto) return ''
    if (typeof character.foto === 'string') return character.foto
    if (typeof character.foto === 'object' && 'src' in character.foto) {
      return (character.foto as any).src
    }
    return ''
  }

  const handleRoll = (formula: string, description: string) => {
    console.log(`[v0] Roll requested: ${formula} - ${description}`)
    // This will be connected to the DiceRoller component in parent
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-4">
        <div className="max-w-7xl mx-auto flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={getPhotoUrl()} alt={character.nome} />
            <AvatarFallback>{character.nome.charAt(0)}</AvatarFallback>
          </Avatar>

          {/* Character Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{character.nome}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Nível {character.nivel}</span>
              <span>•</span>
              <span>{classNames}</span>
              {character.raca && (
                <>
                  <span>•</span>
                  <span>{character.raca}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {/* Tab Navigation */}
          <TabsList className="w-full justify-start border-b rounded-none bg-secondary/40 p-0 h-auto">
            <TabsTrigger
              value="combate"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              COMBATE
            </TabsTrigger>
            <TabsTrigger
              value="habilidades"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              HABILIDADES
            </TabsTrigger>
            <TabsTrigger
              value="rituais"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              RITUAIS
            </TabsTrigger>
            <TabsTrigger
              value="inventario"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              INVENTÁRIO
            </TabsTrigger>
            <TabsTrigger
              value="descricao"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              DESCRIÇÃO
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="combate" className="p-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Attributes Wheel */}
                <div className="flex flex-col items-center justify-center">
                  <AttributeWheel attributes={character.atributos} size="md" className="mb-6" />
                  <div className="text-xs text-muted-foreground text-center mt-4">
                    Clique nos atributos para visualizar detalhes
                  </div>
                </div>

                {/* Center: Resources and Defense */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-4 text-foreground">Recursos</h3>
                    <ResourceBars
                      vida={character.recursos.vida}
                      mana={character.recursos.mana}
                      prana={character.recursos.prana}
                      onVidaChange={(current, maximum) => {
                        onUpdate?.({
                          ...character,
                          recursos: {
                            ...character.recursos,
                            vida: { ...character.recursos.vida, atual: current, maximo: maximum },
                          },
                        })
                      }}
                      onManaChange={(current, maximum) => {
                        onUpdate?.({
                          ...character,
                          recursos: {
                            ...character.recursos,
                            mana: { ...character.recursos.mana, atual: current, maximo: maximum },
                          },
                        })
                      }}
                      onPranaChange={(current, maximum) => {
                        onUpdate?.({
                          ...character,
                          recursos: {
                            ...character.recursos,
                            prana: { ...character.recursos.prana, atual: current, maximo: maximum },
                          },
                        })
                      }}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Right: Combat Actions */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-4 text-foreground">Ataque</h3>
                    <AttackPanel
                      weapons={character.inventario?.armas || []}
                      defesa={character.defesa}
                      defesaOutros={character.defesa_outros}
                      attributeModifiers={attributeModifiers}
                      onRoll={handleRoll}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="habilidades" className="p-6">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Perícias</h2>
                <SkillsTable
                  skills={character.pericias || {}}
                  attributeModifiers={attributeModifiers}
                  readOnly={readOnly}
                />
              </div>
            </TabsContent>

            <TabsContent value="rituais" className="p-6">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Rituais e Magias</h2>
                <Card className="p-8 text-center text-muted-foreground">
                  Sistema de magias em desenvolvimento
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventario" className="p-6">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Inventário</h2>
                <Card className="p-8 text-center text-muted-foreground">
                  Sistema de inventário em desenvolvimento
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="descricao" className="p-6">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Descrição do Personagem</h2>
                <Card className="p-6">
                  <p className="text-muted-foreground">
                    {character.descricao || 'Nenhuma descrição adicionada'}
                  </p>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default React.memo(CharacterSheetView)
