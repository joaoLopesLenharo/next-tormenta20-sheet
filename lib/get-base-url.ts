export function getBaseUrl(): string {
  // Em produção, use a URL do Vercel
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Em desenvolvimento ou ambiente customizado
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Fallback para localhost em desenvolvimento local
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3000'
}
