export const metadata = {
  title: "Página não encontrada | Tormenta 20"
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-2">404 - Página não encontrada</h1>
        <p className="text-muted-foreground mb-6">
          A página que você tentou acessar não existe ou foi movida.
        </p>
        <a href="/" className="inline-flex items-center px-4 py-2 rounded-md border bg-primary text-primary-foreground hover:opacity-90 transition">
          Voltar para a página inicial
        </a>
      </div>
    </div>
  )
}
