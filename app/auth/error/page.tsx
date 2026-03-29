import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Sword, Shield } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

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
          </div>

          <Card className="section-card border-destructive/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-center text-destructive">
                    Codigo do erro: {params.error}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Ocorreu um erro inesperado durante a autenticacao.
                  Tente novamente ou entre em contato com o suporte.
                </p>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild className="btn-primary">
                  <Link href="/auth/login">
                    Tentar novamente
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">
                    Voltar ao inicio
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
