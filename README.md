# Ficha Tormenta 20 - Gerenciador de Personagens

Sistema moderno e completo para gerenciar fichas de personagem do RPG Tormenta 20, desenvolvido com Next.js 15, React 19 e Tailwind CSS v4.

<div align="center">
  <img src="https://img.shields.io/badge/Tormenta_20-8A2BE2?style=for-the-badge&logo=dungeons-and-dragons&logoColor=white" alt="Tormenta 20">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</div>

## 📋 Índice

- [Características](#-características)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tecnologias](#-tecnologias)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Funcionalidades](#-funcionalidades)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## ✨ Características

- 🎲 **Rolagem de Dados Integrada** - Sistema completo de rolagem de dados com histórico
- 📊 **Gestão Completa de Atributos** - Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma
- 🎯 **Sistema de Perícias** - Todas as perícias do Tormenta 20 com modificadores automáticos
- ⚔️ **Gerenciamento de Combate** - PV, PM, defesas, iniciativa e ataques
- 🎒 **Inventário Detalhado** - Gestão de itens, equipamentos e dinheiro
- 📜 **Magias e Poderes** - Organização de magias conhecidas e poderes de classe
- 🌙 **Tema Escuro** - Interface moderna com tema escuro em tons de roxo e magenta
- 💾 **Salvamento Automático** - Dados salvos localmente no navegador
- 📱 **Responsivo** - Funciona perfeitamente em desktop, tablet e mobile
- 🚀 **Performance Otimizada** - Carregamento rápido e interface fluida

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.x ou superior ([Download](https://nodejs.org/))
- **pnpm** 8.x ou superior (gerenciador de pacotes recomendado)

### Instalando o pnpm

Se você ainda não tem o pnpm instalado, execute:

```bash
npm install -g pnpm
```

Ou usando o Corepack (recomendado para Node.js 16.13+):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Instalação

1. **Clone o repositório** (ou extraia o ZIP):

```bash
git clone <url-do-repositorio>
cd tormenta20
```

2. **Instale as dependências** usando pnpm:

```bash
pnpm install
```

3. **Aguarde a instalação** - O pnpm irá baixar e instalar todas as dependências necessárias.

## Uso

### Modo Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
pnpm dev
```

O aplicativo estará disponível em:
- **Local**: [http://localhost:3000](http://localhost:3000)
- **Rede**: http://192.168.x.x:3000 (acessível por outros dispositivos na mesma rede)

### Build de Produção

Para criar uma build otimizada para produção:

```bash
pnpm build
```

### Iniciar Servidor de Produção

Após o build, inicie o servidor de produção:

```bash
pnpm start
```

### Linting

Para verificar problemas de código:

```bash
pnpm lint
```

## Estrutura do Projeto

```
tormenta20/
├── app/                      # Diretório principal do Next.js App Router
│   ├── layout.tsx           # Layout raiz da aplicação
│   ├── page.tsx             # Página principal (ficha de personagem)
│   ├── globals.css          # Estilos globais e tema
│   └── not-found.tsx        # Página 404
├── components/              # Componentes React reutilizáveis
│   ├── ui/                  # Componentes de UI (shadcn/ui)
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ... (outros componentes)
│   ├── dice-roller.tsx      # Componente de rolagem de dados
│   └── theme-provider.tsx   # Provider do tema escuro/claro
├── hooks/                   # React Hooks customizados
│   ├── use-mobile.tsx       # Hook para detecção de mobile
│   └── use-toast.ts         # Hook para notificações toast
├── lib/                     # Utilitários e funções auxiliares
│   └── utils.ts             # Funções utilitárias (cn, etc)
├── public/                  # Arquivos estáticos
│   └── favicon.ico
├── next.config.mjs          # Configuração do Next.js
├── postcss.config.mjs       # Configuração do PostCSS
├── tsconfig.json            # Configuração do TypeScript
├── package.json             # Dependências e scripts
└── README.md                # Este arquivo
```

## Tecnologias

### Core

- **[Next.js 14](https://nextjs.org/)** - Framework React com App Router
- **[React 18](https://react.dev/)** - Biblioteca para interfaces de usuário
- **[TypeScript 5](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[Tailwind CSS 3](https://tailwindcss.com/)** - Framework CSS utilitário

### UI Components

- **[Radix UI](https://www.radix-ui.com/)** - Componentes acessíveis e não estilizados
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
  - Hover Card, Label, Popover, Progress, Radio Group, Select
  - Slider, Switch, Tabs, Toast, Tooltip, e mais
- **[Lucide React](https://lucide.dev/)** - Ícones modernos e customizáveis
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes reutilizáveis baseados em Radix UI

### Formulários e Validação

- **[React Hook Form 7](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[Zod 3](https://zod.dev/)** - Validação de schemas TypeScript-first
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Integração Zod + React Hook Form

### Utilitários

- **[clsx](https://github.com/lukeed/clsx)** - Construção de classNames condicionais
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge inteligente de classes Tailwind
- **[class-variance-authority](https://cva.style/)** - Variantes de componentes
- **[date-fns](https://date-fns.org/)** - Manipulação de datas
- **[sonner](https://sonner.emilkowal.ski/)** - Notificações toast elegantes

### Animações e Interações

- **[tw-animate-css](https://www.npmjs.com/package/tw-animate-css)** - Animações CSS com Tailwind
- **[tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)** - Utilitários de animação
- **[embla-carousel-react](https://www.embla-carousel.com/)** - Carrossel responsivo

### Analytics

- **[@vercel/analytics](https://vercel.com/analytics)** - Analytics da Vercel

### Temas

- **[next-themes](https://github.com/pacocoursey/next-themes)** - Gerenciamento de temas (dark/light)

## Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Desenvolvimento | `pnpm dev` | Inicia o servidor de desenvolvimento |
| Build | `pnpm build` | Cria build otimizada para produção |
| Produção | `pnpm start` | Inicia servidor de produção |
| Lint | `pnpm lint` | Verifica problemas de código |

## Funcionalidades

### 1. Informações Básicas
- Nome do personagem
- Raça, classe e origem
- Nível e experiência
- Divindade e tendência
- Foto do personagem

### 2. Atributos
- Força (FOR)
- Destreza (DES)
- Constituição (CON)
- Inteligência (INT)
- Sabedoria (SAB)
- Carisma (CAR)
- Cálculo automático de modificadores

### 3. Recursos
- Pontos de Vida (PV) atual e máximo
- Pontos de Mana (PM) atual e máximo
- Barras visuais de progresso

### 4. Defesas
- Defesa
- Fortitude
- Reflexos
- Vontade
- Cálculo automático baseado em atributos

### 5. Combate
- Iniciativa
- Deslocamento
- Ataques corpo a corpo e à distância
- Dano e crítico

### 6. Perícias
- Todas as 17 perícias do Tormenta 20
- Modificadores automáticos
- Sistema de treinamento
- Filtros por atributo

### 7. Inventário
- Gestão de itens e equipamentos
- Controle de dinheiro (TO, TP, TC, TL)
- Carga e encumbramento

### 8. Magias
- Lista de magias conhecidas
- Círculo, escola e alcance
- Descrição e efeitos

### 9. Poderes
- Poderes de classe e raça
- Habilidades especiais
- Descrições detalhadas

### 10. Rolagem de Dados
- Rolagem de d4, d6, d8, d10, d12, d20, d100
- Histórico de rolagens
- Rolagens com modificadores
- Interface flutuante e intuitiva

## Personalização

### Tema de Cores

O projeto usa um tema escuro com tons de roxo e magenta. Para personalizar as cores, edite o arquivo `app/globals.css`:

```css
.dark {
  --background: 260 15% 8%;
  --foreground: 300 20% 95%;
  --primary: 280 100% 70%;
  --accent: 290 80% 60%;
  /* ... outras variáveis */
}
```

### Componentes

Os componentes UI estão em `components/ui/` e podem ser customizados individualmente. Eles seguem o padrão do shadcn/ui.

## Solução de Problemas

### Erro: "tailwindcss directly as a PostCSS plugin"

**Solução**: Este projeto já está configurado corretamente com `@tailwindcss/postcss`. Se você encontrar este erro, verifique se o arquivo `postcss.config.mjs` está usando:

```javascript
plugins: {
  '@tailwindcss/postcss': {},
  autoprefixer: {},
}
```

### Erro ao instalar dependências

**Solução**: Limpe o cache e reinstale:

```bash
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Porta 3000 já em uso

**Solução**: Use uma porta diferente:

```bash
pnpm dev -- -p 3001
```

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🙏 Agradecimentos

- **Jambô Editora** - Criadores do sistema Tormenta 20
- **Vercel** - Hospedagem e ferramentas de desenvolvimento
- **shadcn** - Componentes UI de alta qualidade
- **Comunidade Open Source** - Todas as bibliotecas incríveis utilizadas

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões:

1. Abra uma [Issue](../../issues) no GitHub
2. Descreva o problema ou sugestão detalhadamente
3. Inclua screenshots se possível

---

**Desenvolvido com ❤️ para a comunidade Tormenta 20**

**Versão**: 0.1.0  
**Última atualização**: Outubro 2025
