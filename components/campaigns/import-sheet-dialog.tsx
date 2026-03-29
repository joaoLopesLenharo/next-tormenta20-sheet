'use client'

/**
 * Melhoria 3: Componente de importação de ficha para campanha online
 * 
 * Este componente permite:
 * - Importar ficha de arquivo JSON
 * - Carregar fichas salvas localmente (localStorage)
 * 
 * Funciona no contexto de campanha online, permitindo que o jogador
 * carregue uma ficha existente para usar durante a sessão.
 */

import { useState, useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, HardDrive, FileJson, Loader2, User, Crown } from 'lucide-react'

// Tipos baseados na estrutura existente em app/page.tsx
interface CharacterType {
  nome: string
  nivel: number
  raca: string
  classes: any[]
  divindade: string
  tendencia: string
  origem: string
  deslocamento: number
  foto: string | { src: string; zoom: number; offsetX: number; offsetY: number }
  defenseAttribute?: string
  defenseAttributes?: string[]
  atributos: {
    forca: number
    destreza: number
    constituicao: number
    inteligencia: number
    sabedoria: number
    carisma: number
  }
  recursos: {
    vida: { atual: number; maximo: number; cor: string }
    mana: { atual: number; maximo: number; cor: string }
    prana: { atual: number; maximo: number; cor: string }
    recursos_extras: any[]
  } & Record<string, any>
  defesa: number
  defesa_outros?: number
  spellDCAttributes?: string[]
  spellDC_outros?: number
  pericias: Record<string, any>
  inventario: {
    armas: any[]
    armaduras: any[]
    itens: any[]
    dinheiro: Record<string, number>
  }
  magias: {
    arcana: Record<string, any[]>
    divina: Record<string, any[]>
  } & Record<string, any>
  habilidades: any[]
  poderes: any[]
  // Melhoria 4: Campo para perícias de ofício personalizadas
  oficiosPersonalizados?: Array<{
    id: string
    nome: string
    atributo: string
    treinada: boolean
    outros: number
  }>
}

interface Sheet {
  id: string
  meta: {
    nome: string
    nivel: number
  }
  data: CharacterType
}

interface ImportSheetDialogProps {
  children: ReactNode
  onImport: (character: CharacterType, sheetName: string) => void
}

// Função para obter o personagem padrão (igual à do app/page.tsx)
const getDefaultCharacter = (): CharacterType => ({
  nome: '',
  nivel: 1,
  raca: '',
  classes: [],
  divindade: '',
  tendencia: '',
  origem: '',
  deslocamento: 9,
  foto: '',
  defenseAttributes: ['destreza'],
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
  spellDCAttributes: ['inteligencia'],
  spellDC_outros: 0,
  pericias: {},
  inventario: {
    armas: [],
    armaduras: [],
    itens: [],
    dinheiro: { 'T$': 0, PP: 0, PO: 0, PE: 0, PC: 0 },
  },
  magias: {
    arcana: { '1º': [], '2º': [], '3º': [], '4º': [], '5º': [] },
    divina: { '1º': [], '2º': [], '3º': [], '4º': [], '5º': [] },
  },
  habilidades: [],
  poderes: [],
  oficiosPersonalizados: [],
})

// Função para ler fichas do localStorage
const getSheetsFromStorage = (): Sheet[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('t20_sheets')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function ImportSheetDialog({ children, onImport }: ImportSheetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localSheets, setLocalSheets] = useState<Sheet[]>([])
  const [selectedLocalSheet, setSelectedLocalSheet] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carrega fichas locais quando o diálogo abre
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setLocalSheets(getSheetsFromStorage())
      setSelectedLocalSheet(null)
      setError(null)
    }
  }

  // Importar de arquivo JSON
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // O JSON exportado pode ter o campo 'character' ou ser o objeto direto
        const characterData = data.character || data
        
        // Mescla com valores padrão para garantir campos ausentes
        const mergedCharacter: CharacterType = {
          ...getDefaultCharacter(),
          ...characterData,
          // Garante que objetos aninhados também são mesclados
          atributos: {
            ...getDefaultCharacter().atributos,
            ...(characterData.atributos || {}),
          },
          recursos: {
            ...getDefaultCharacter().recursos,
            ...(characterData.recursos || {}),
          },
          inventario: {
            ...getDefaultCharacter().inventario,
            ...(characterData.inventario || {}),
          },
          magias: {
            ...getDefaultCharacter().magias,
            ...(characterData.magias || {}),
          },
        }

        const sheetName = mergedCharacter.nome || 'Ficha Importada'
        onImport(mergedCharacter, sheetName)
        
        setLoading(false)
        setOpen(false)
        
        // Reset do input
        if (event.target) {
          event.target.value = ''
        }
      } catch (err) {
        console.error('Import error:', err)
        setError('Erro ao importar arquivo JSON. Verifique se o arquivo esta no formato correto.')
        setLoading(false)
        if (event.target) {
          event.target.value = ''
        }
      }
    }

    reader.onerror = () => {
      setError('Erro ao ler o arquivo.')
      setLoading(false)
    }

    reader.readAsText(file)
  }

  // Carregar ficha local selecionada
  const handleLoadLocalSheet = () => {
    if (!selectedLocalSheet) return

    setLoading(true)
    setError(null)

    const sheet = localSheets.find((s) => s.id === selectedLocalSheet)
    if (!sheet) {
      setError('Ficha nao encontrada.')
      setLoading(false)
      return
    }

    // Mescla com valores padrão
    const mergedCharacter: CharacterType = {
      ...getDefaultCharacter(),
      ...sheet.data,
      atributos: {
        ...getDefaultCharacter().atributos,
        ...(sheet.data.atributos || {}),
      },
      recursos: {
        ...getDefaultCharacter().recursos,
        ...(sheet.data.recursos || {}),
      },
      inventario: {
        ...getDefaultCharacter().inventario,
        ...(sheet.data.inventario || {}),
      },
      magias: {
        ...getDefaultCharacter().magias,
        ...(sheet.data.magias || {}),
      },
    }

    const sheetName = sheet.meta?.nome || mergedCharacter.nome || 'Ficha Local'
    onImport(mergedCharacter, sheetName)
    
    setLoading(false)
    setOpen(false)
  }

  // Calcula o nível total das classes
  const getTotalLevel = (char: CharacterType) => {
    return (char.classes || []).reduce((acc: number, c: any) => acc + (parseInt(c.nivel) || 0), 0) || char.nivel || 1
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Ficha
          </DialogTitle>
          <DialogDescription>
            Importe uma ficha de personagem para usar nesta campanha.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="text-sm">
              <FileJson className="w-4 h-4 mr-2" />
              Arquivo JSON
            </TabsTrigger>
            <TabsTrigger value="local" className="text-sm">
              <HardDrive className="w-4 h-4 mr-2" />
              Fichas Locais
            </TabsTrigger>
          </TabsList>

          {/* Importar de Arquivo */}
          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileJson className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Selecione um arquivo JSON exportado do sistema de fichas.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Selecionar Arquivo
              </Button>
            </div>
          </TabsContent>

          {/* Carregar Fichas Locais */}
          <TabsContent value="local" className="space-y-4 mt-4">
            {localSheets.length === 0 ? (
              <div className="text-center py-8">
                <HardDrive className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma ficha encontrada no armazenamento local.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie fichas na pagina principal para ve-las aqui.
                </p>
              </div>
            ) : (
              <>
                <Label className="text-sm">Selecione uma ficha para carregar:</Label>
                <ScrollArea className="h-60 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {localSheets.map((sheet) => (
                      <Card
                        key={sheet.id}
                        className={`cursor-pointer transition-all ${
                          selectedLocalSheet === sheet.id
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedLocalSheet(sheet.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {sheet.meta?.nome || sheet.data?.nome || 'Sem Nome'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  Nivel {sheet.meta?.nivel || getTotalLevel(sheet.data)}
                                </span>
                                {sheet.data?.raca && (
                                  <Badge variant="outline" className="text-xs">
                                    {sheet.data.raca}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                <Button
                  onClick={handleLoadLocalSheet}
                  className="w-full btn-primary"
                  disabled={loading || !selectedLocalSheet}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Carregar Ficha Selecionada
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
