import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Sword, Shield } from 'lucide-react'

export default function SignUpSuccessPage() {
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

          <Card className="section-card">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Conta criada!</CardTitle>
              <CardDescription>
                Verifique seu e-mail para confirmar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enviamos um link de confirmacao para o seu e-mail. 
                Clique no link para ativar sua conta e comecar a jogar.
              </p>
              
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-center text-muted-foreground">
                  Nao recebeu o e-mail? Verifique a pasta de spam ou lixo eletronico.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href="/auth/login">
                    Voltar para o login
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
