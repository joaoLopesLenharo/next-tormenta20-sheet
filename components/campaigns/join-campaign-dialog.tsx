'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Loader2 } from 'lucide-react'
import { normalizeInviteCodeForLookup } from '@/lib/invite-code'

interface JoinCampaignDialogProps {
  children: ReactNode
  userId: string
  onSuccess?: () => void | Promise<void>
}

export function JoinCampaignDialog({ children, userId, onSuccess }: JoinCampaignDialogProps) {
  const [open, setOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [characterName, setCharacterName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!inviteCode.trim()) {
      setError('Codigo de convite eh obrigatorio')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Buscar campanha pelo codigo
    const { data: campaign, error: findError } = await supabase
      .from('campaigns')
      .select('id, master_id, status')
      .eq('invite_code', normalizeInviteCodeForLookup(inviteCode))
      .single()

    if (findError || !campaign) {
      setError('Campanha nao encontrada. Verifique o codigo.')
      setLoading(false)
      return
    }

    if (campaign.status === 'encerrada') {
      setError('Esta campanha foi encerrada e nao aceita novos jogadores.')
      setLoading(false)
      return
    }

    if (campaign.master_id === userId) {
      setError('Voce eh o Mestre desta campanha!')
      setLoading(false)
      return
    }

    // Verificar se ja eh membro
    const { data: existingMember } = await supabase
      .from('campaign_members')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      setError('Voce ja participa desta campanha.')
      setLoading(false)
      return
    }

    // Entrar na campanha
    const { error: joinError } = await supabase
      .from('campaign_members')
      .insert({
        campaign_id: campaign.id,
        user_id: userId,
        character_name: characterName.trim() || null,
      })

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
      return
    }

    await onSuccess?.()
    setOpen(false)
    setInviteCode('')
    setCharacterName('')
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar em Campanha</DialogTitle>
          <DialogDescription>
            Insira o codigo de convite fornecido pelo Mestre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoin}>
          <div className="flex flex-col gap-4 py-4">
            <div className="form-group">
              <Label htmlFor="inviteCode" className="form-label">
                Codigo de Convite *
              </Label>
              <Input
                id="inviteCode"
                placeholder="Ex: A1B2C3D4"
                value={inviteCode}
                onChange={(e) => {
                  const v = e.target.value
                    .toLowerCase()
                    .replace(/[^0-9A-F]/g, '')
                    .slice(0, 8)
                  setInviteCode(v)
                }}
                className="form-input font-mono"
                maxLength={8}
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="characterName" className="form-label">
                Nome do Personagem (opcional)
              </Label>
              <Input
                id="characterName"
                placeholder="Ex: Zarak, o Bárbaro"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="form-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Voce pode definir ou alterar depois.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar na Campanha'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
