'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, MoreVertical, Trash2, Copy, User, ChevronDown, Loader2 } from 'lucide-react'

interface Character {
  id: string
  name: string
  data: any
  createdAt?: string
  updatedAt?: string
}

interface CharacterSelectorProps {
  characters: Character[]
  activeCharacterId: string | null
  onSelect: (characterId: string) => void
  onCreate: (name: string) => void
  onDelete: (characterId: string) => void
  onDuplicate?: (characterId: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function CharacterSelector({
  characters,
  activeCharacterId,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  isLoading = false,
  disabled = false,
}: CharacterSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [creating, setCreating] = useState(false)

  const activeCharacter = characters.find(c => c.id === activeCharacterId)

  const handleCreate = async () => {
    if (!newCharacterName.trim()) return
    setCreating(true)
    try {
      await onCreate(newCharacterName.trim())
      setNewCharacterName('')
      setCreateDialogOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteConfirm = () => {
    if (characterToDelete) {
      onDelete(characterToDelete.id)
      setDeleteDialogOpen(false)
      setCharacterToDelete(null)
    }
  }

  if (characters.length === 0) {
    return (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Personagem
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Personagem</DialogTitle>
            <DialogDescription>
              Digite o nome do seu novo personagem para começar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do personagem"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newCharacterName.trim() || creating}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Seletor de Personagem */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/50">
        <User className="w-4 h-4 text-muted-foreground" />
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <>
            <Select
              value={activeCharacterId || ''}
              onValueChange={onSelect}
              disabled={disabled}
            >
              <SelectTrigger className="border-none bg-transparent h-auto py-0 px-1 w-auto min-w-[120px]">
                <SelectValue placeholder="Selecionar personagem">
                  <span className="font-medium">
                    {activeCharacter?.name || 'Selecionar...'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    <div className="flex items-center gap-2">
                      <span>{char.name}</span>
                      {char.data?.classes?.length > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {char.data.classes.map((c: any) => `${c.nome} ${c.nivel}`).join(', ')}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Menu de ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={disabled}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Personagem
                </DropdownMenuItem>
                
                {onDuplicate && activeCharacter && (
                  <DropdownMenuItem
                    onClick={() => onDuplicate(activeCharacter.id)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar Atual
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {activeCharacter && characters.length > 1 && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setCharacterToDelete(activeCharacter)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Atual
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Dialog de Criar Personagem */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Personagem</DialogTitle>
            <DialogDescription>
              Digite o nome do seu novo personagem para começar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do personagem"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newCharacterName.trim() || creating}
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Personagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o personagem &quot;{characterToDelete?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
