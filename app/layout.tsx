import type React from "react"
import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Ficha Tormenta 20 - Gerenciador de Personagens",
  description: "Sistema moderno para gerenciar fichas de personagem do RPG Tormenta 20",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark-32x32.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon-light-32x32.png", type: "image/png", media: "(prefers-color-scheme: light)" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${cinzel.variable} font-sans antialiased`}>
        <ThemeProvider>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                </div>
              </div>
            }
          >
            {children}
            <Analytics />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
