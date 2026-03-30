import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Auth callback handler.
 * O Supabase envia um link de confirmação de email do tipo:
 *   https://seusite.com/auth/callback?token_hash=xxx&type=signup
 *
 * Este route handler troca o token_hash por uma sessão autenticada
 * e redireciona o usuário para /campanhas.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'signup'
    | 'recovery'
    | 'invite'
    | 'email'
    | 'magiclink'
    | null
  const next = searchParams.get('next') ?? '/campanhas'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redireciona para a página desejada após confirmação bem-sucedida
      return NextResponse.redirect(new URL(next, origin))
    }

    // Se houve erro na verificação, redireciona para página de erro
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  // Se não tiver os parâmetros necessários, redireciona para login
  return NextResponse.redirect(new URL('/auth/login', origin))
}
