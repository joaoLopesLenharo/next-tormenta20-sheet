'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Sword, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/campanhas')
    router.refresh()
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo/Header */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent">
              <Sword className="w-10 h-10 text-primary-foreground" />
              <Shield className="w-6 h-6 text-primary-foreground absolute bottom-2 right-2" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tormenta 20</h1>
            <p className="text-sm text-muted-foreground">Sistema de RPG</p>
          </div>

          <Card className="section-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta para gerenciar campanhas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="form-group">
                    <Label htmlFor="email" className="form-label">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="password" className="form-label">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="form-input"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  Ainda nao tem conta?{' '}
                </span>
                <Link
                  href="/auth/sign-up"
                  className="text-primary hover:text-accent underline underline-offset-4 font-medium"
                >
                  Criar conta
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Ao entrar, voce concorda com nossos termos de uso.
          </p>
        </div>
      </div>
    </div>
  )
}
