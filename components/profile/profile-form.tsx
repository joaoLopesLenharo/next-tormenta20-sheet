'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, LogOut, Edit2, Save, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'

interface ProfileFormProps {
  user: User
  profile: Profile | null
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', user.id)

    if (!error) {
      setIsEditing(false)
      router.refresh()
    }

    setIsSaving(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="space-y-6">
      {/* Informações da Conta */}
      <Card className="section-card">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Detalhes da sua conta no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email - Readonly */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">{user.email}</p>
              <Badge variant="secondary" className="ml-auto">Verificado</Badge>
            </div>
          </div>

          {/* Nome de Exibição */}
          <div>
            <Label htmlFor="displayName" className="text-xs text-muted-foreground mb-2 block">
              Nome de Exibição
            </Label>
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  id="displayName"
                  placeholder="Como você quer ser chamado?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setDisplayName(profile?.display_name || '')
                    }}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {displayName || 'Não definido'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Data de Criação */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Membro desde
            </Label>
            <p className="text-sm font-medium">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR')
                : 'Data não disponível'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card className="section-card border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Segurança</CardTitle>
          <CardDescription>
            Gerenciar sua sessão e segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Sair da Conta
          </Button>
          <p className="text-xs text-muted-foreground">
            Você será desconectado de todas as suas sessões.
          </p>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card className="section-card">
        <CardHeader>
          <CardTitle>Sobre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Este é um sistema de RPG para Tormenta 20 que permite gerenciar campanhas
            e rolagens de dados em tempo real com seus amigos.
          </p>
          <p>
            Para reportar problemas ou sugestões, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
