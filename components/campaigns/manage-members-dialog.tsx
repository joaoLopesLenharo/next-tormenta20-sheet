'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, MoreVertical, Trash2, Edit2, Loader2 } from 'lucide-react'
import type { CampaignMember, Profile } from '@/lib/types/database'

interface MemberWithProfile extends CampaignMember {
  profiles: Profile
}

interface ManageMembersDialogProps {
  campaignId: string
  members: MemberWithProfile[]
  onMembersChange: () => void
}

export function ManageMembersDialog({
  campaignId,
  members,
  onMembersChange,
}: ManageMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleEditCharacterName = async (memberId: string, newName: string) => {
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('campaign_members')
      .update({ character_name: newName })
      .eq('id', memberId)

    if (!error) {
      setEditingId(null)
      setEditingName('')
      onMembersChange()
    }

    setSaving(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este jogador?')) return

    const supabase = createClient()

    const { error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      onMembersChange()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Gerenciar Jogadores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Jogadores da Campanha</DialogTitle>
          <DialogDescription>
            {members.length} jogador{members.length !== 1 ? 'es' : ''} na campanha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum jogador na campanha ainda.</p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{member.profiles?.display_name || 'Jogador'}</h3>
                  {editingId === member.id ? (
                    <div className="mt-2 space-y-2">
                      <Label htmlFor={`char-${member.id}`} className="text-xs">
                        Nome do Personagem
                      </Label>
                      <Input
                        id={`char-${member.id}`}
                        placeholder="Nome do personagem"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {member.character_name || 'Personagem não definido'}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(member.id)
                        setEditingName(member.character_name || '')
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar Personagem
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {editingId === member.id && (
                  <Button
                    size="sm"
                    onClick={() => handleEditCharacterName(member.id, editingName)}
                    disabled={saving}
                    className="ml-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
