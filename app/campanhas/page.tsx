import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Swords, LogOut, User } from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { CampanhasLists } from '@/components/campaigns/campanhas-lists'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampanhasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background to-muted/30">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold">Tormenta 20</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Link href="/perfil">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CampanhasLists userId={user.id} />
      </main>
    </div>
  )
}
