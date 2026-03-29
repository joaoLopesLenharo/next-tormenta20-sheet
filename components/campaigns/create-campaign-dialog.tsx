'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { revalidateCampanhasPage } from '@/app/campanhas/actions'

interface CreateCampaignDialogProps {
  children: ReactNode
  onSuccess?: () => void | Promise<void>
}

export function CreateCampaignDialog({ children, onSuccess }: CreateCampaignDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError('Nome da campanha eh obrigatorio')
      setLoading(false)
      return
    }

    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Voce precisa estar logado')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('campaigns')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        master_id: user.id,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await revalidateCampanhasPage()
    await onSuccess?.()
    setOpen(false)
    setName('')
    setDescription('')
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
          <DialogDescription>
            Crie uma nova campanha de Tormenta 20. Voce sera o Mestre.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
          <div className="flex flex-col gap-4 py-4">
            <div className="form-group">
              <Label htmlFor="name" className="form-label">
                Nome da Campanha *
              </Label>
              <Input
                id="name"
                placeholder="Ex: A Maldição de Arton"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <Label htmlFor="description" className="form-label">
                Descricao (opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva brevemente sua campanha..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input min-h-[100px]"
              />
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
                  Criando...
                </>
              ) : (
                'Criar Campanha'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
