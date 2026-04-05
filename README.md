# Tormenta 20 — Ficha Digital

Aplicação web para criar, editar e usar fichas de personagem do **Tormenta 20**, com suporte a **campanhas online**, **sessões ao vivo**, **rolagens de dados** e sincronização via **Supabase**.

## Funcionalidades

- **Ficha completa** — atributos, perícias, recursos (PV/PM/PP), inventário, magias, poderes e descrição, com validação (Zod) e persistência local na página principal.
- **Campanhas** — mestre cria campanha, código de convite, jogadores entram e compartilham fichas (`character_data` no banco).
- **Sessão** — iniciativa, histórico de rolagens em tempo real (Realtime), roladores para perícia, ataque, dano, resistência e rolagem livre.
- **Duas visões de ficha na campanha** — visual compacta estilo CRIS (`CharacterSheetView` em `components/campaigns/`) e, opcionalmente, o **editor completo** (mesmo núcleo da página inicial) em seção expansível.
- **Autenticação** — login/cadastro via Supabase Auth.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) |
| UI | React 19, Tailwind CSS 4, [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) |
| Backend / DB / Auth | [Supabase](https://supabase.com/) (Postgres, RLS, Realtime) |
| Validação | [Zod](https://zod.dev/) |

## Pré-requisitos

- **Node.js** 20+ (recomendado)
- Conta e projeto **Supabase** com o schema aplicado (scripts SQL em `scripts/`)

## Configuração

1. Clone o repositório e instale dependências:

```bash
pnpm install
# ou: npm install / yarn
```

2. Crie `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

3. Para **painel do mestre** e rota **API de membros** (`/api/campaign-members`) carregarem dados com privilégios elevados, configure também no servidor (nunca exponha no cliente):

```env
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

4. Opcional:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Aplique os scripts SQL do diretório `scripts/` no SQL Editor do Supabase (ordem sugerida nos nomes dos arquivos, conforme dependências entre tabelas e políticas RLS).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento ([http://localhost:3000](http://localhost:3000)) |
| `pnpm build` | Build de produção |
| `pnpm start` | Servidor após `build` |
| `pnpm lint` | ESLint (Next.js) |

## Estrutura do repositório (resumo)

```
app/                    # Rotas (App Router): /, /campanhas, /auth, APIs
components/
  campaigns/            # Painéis jogador/mestre, CharacterSheetView de campanha, diálogos
  character/            # Ficha completa (full-character-sheet), painel validado
  dice/                 # Rolagens e UI de dados
  ui/                   # Componentes shadcn/Radix reutilizáveis
lib/
  schemas/character.ts  # Schema Zod da ficha
  supabase/             # Clientes browser, server e middleware
  dice-engine.ts        # Motor de rolagens
scripts/                # Migrações e políticas SQL (Supabase)
```

## Documentação adicional

- `IMPLEMENTATION_GUIDE.md` — decisões de implementação, segurança e componentes.
- `TESTING.md` — cenários de teste manuais (se presente).
- `SECURITY.md` — notas de segurança (se presente).

## Deploy

Compatível com [Vercel](https://vercel.com/) e outros hosts Node. Defina as variáveis de ambiente no painel do provedor; use `SUPABASE_SERVICE_ROLE_KEY` apenas em variáveis **server-side**.

## Licença

Projeto **privado** — uso e distribuição conforme acordo do repositório.

---

*Sistema de RPG Tormenta 20 © Jambô Editora. Esta aplicação é um projeto de fã e não é afiliada oficialmente à editora.*
