# Guia de Implementação - Revisão de Segurança e Melhorias de Interface

## Resumo das Mudanças

Este documento detalha todas as melhorias implementadas para resolver os problemas de exibição de players e segurança do projeto.

## 1. Problemas Identificados e Soluções

### Problema 1: Players não aparecem no card de players (Dashboard Mestre)

**Causa Raiz:** 
- Variáveis de ambiente do Supabase não configuradas
- API retorna dados vazios sem erro explícito
- Sem validação de dados ao sincronizar character_data

**Soluções Implementadas:**

1. **Schemas de Validação** (`lib/schemas/character.ts`)
   - Schema Zod completo para `CharacterData`
   - Funções de validação com fallback seguro
   - Reparação automática de dados quebrados

2. **Validação em API** (`app/api/campaign-members/route.ts`)
   - Validação de character_data antes de retornar
   - Sanitização de profiles (remove dados sensíveis)
   - Tratamento de erro silencioso com fallback

3. **Suporte de Desenvolvimento**
   - Debug logs: `console.log("[v0] ...")` para diagnosticar problemas
   - Mensagens de erro detalhadas quando configuração falta

### Problema 2: Interface de players pouco intuitiva

**Antes:** 
- Visualização genérica de péricias
- Sem clareza visual de atributos
- Layout não otimizado para RPG

**Depois:**
- Interface inspirada em CRIS (Ordem Paranormal)
- Visualização radial de atributos
- Barras de recursos interativas
- Tabela de perícias com filtro
- Painel de combate com cálculo automático

## 2. Arquivos Criados

### Componentes de Character Sheet (Novo Layout CRIS)

```
components/character/
├── character-sheet-view.tsx        # Componente principal CRIS-inspired
├── attribute-wheel.tsx             # Visualização radial de atributos
├── resource-bars.tsx               # Barras de vida/mana/prana editáveis
├── skills-table.tsx                # Tabela de perícias com filtro
├── attack-panel.tsx                # Painel de combate com armas
└── character-sheet-panel.tsx       # Wrapper com validação integrada
```

### Schemas e Validação

```
lib/schemas/
└── character.ts                    # Schemas Zod para validação
```

### Documentação de Segurança

```
├── SECURITY.md                     # Guia completo de segurança
└── IMPLEMENTATION_GUIDE.md         # Este arquivo
```

## 3. Como Usar os Novos Componentes

### CharacterSheetView (Exibição Principal)

```tsx
import { CharacterSheetView } from '@/components/character/character-sheet-view'

<CharacterSheetView
  character={characterData}
  onUpdate={(updates) => updateCharacter(updates)}
  readOnly={false}
  showActions={true}
/>
```

**Props:**
- `character`: Dados do personagem (validados)
- `onUpdate`: Callback para atualizações
- `readOnly`: Se true, componente é apenas leitura
- `showActions`: Mostra botões de ação (compartilhar, configurar)

### CharacterSheetPanel (Com Validação Integrada)

```tsx
import { CharacterSheetPanel } from '@/components/character/character-sheet-panel'

<CharacterSheetPanel
  character={rawCharacterData}  // Dados não validados
  onUpdateCharacter={(validated) => saveToSupabase(validated)}
  readOnly={false}
/>
```

**Características:**
- Valida automaticamente dados de entrada
- Repara dados corrompidos
- Mostra mensagem se nenhuma ficha carregada
- Integra com localStorage e Supabase

### AttributeWheel (Visualização de Atributos)

```tsx
import { AttributeWheel } from '@/components/character/attribute-wheel'

<AttributeWheel
  attributes={character.atributos}
  size="md"  // 'sm' | 'md' | 'lg'
/>
```

### ResourceBars (Barras Editáveis)

```tsx
import { ResourceBars } from '@/components/character/resource-bars'

<ResourceBars
  vida={character.recursos.vida}
  mana={character.recursos.mana}
  prana={character.recursos.prana}
  onVidaChange={(current, max) => updateVida(current, max)}
  readOnly={false}
/>
```

### SkillsTable (Perícias com Filtro)

```tsx
import { SkillsTable } from '@/components/character/skills-table'

const attributeModifiers = {
  forca: 2,
  destreza: 1,
  // ...
}

<SkillsTable
  skills={character.pericias}
  attributeModifiers={attributeModifiers}
  readOnly={false}
/>
```

### AttackPanel (Combate)

```tsx
import { AttackPanel } from '@/components/character/attack-panel'

<AttackPanel
  weapons={character.inventario.armas}
  defesa={character.defesa}
  attributeModifiers={attributeModifiers}
  onRoll={(formula, description) => rollDice(formula)}
  readOnly={false}
/>
```

## 4. Validação de Dados

### Validar Character Data

```typescript
import { 
  validateCharacterData, 
  tryValidateCharacterData,
  validateAndRepairCharacterData 
} from '@/lib/schemas/character'

// Opção 1: Validação com erro (usar em try/catch)
try {
  const validated = validateCharacterData(rawData)
} catch (error) {
  // Handle validation error
}

// Opção 2: Validação sem erro (retorna null se inválido)
const validated = tryValidateCharacterData(rawData)
if (!validated) {
  console.error('Invalid character data')
}

// Opção 3: Validação com fallback (recomendado)
const safe = validateAndRepairCharacterData(rawData, defaults)
// Sempre retorna dados válidos, mergeando com defaults
```

## 5. Configuração de Ambiente

Para que o projeto funcione corretamente, configure as variáveis de ambiente:

### `.env.local` (Desenvolvimento)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Vercel (Produção)
Configure as mesmas variáveis em Settings → Environment Variables

## 6. Debug e Troubleshooting

### Players não aparecem no dashboard

**Checklist:**
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase auth funcionando (`/campanhas` mostra campanhas)
- [ ] Membros da campanha existem no banco
- [ ] character_data não é null no banco

**Debug:**
```typescript
// Adicionar no master-panel.tsx
console.log('[v0] Members fetched:', members)
console.log('[v0] Character data:', members[0]?.character_data)
```

### Ficha não carrega do localStorage

**Checklist:**
- [ ] localStorage tem dados: `localStorage.getItem('t20_sheets')`
- [ ] Formato JSON válido
- [ ] Fields obrigatórios presentes

**Debug:**
```typescript
const raw = localStorage.getItem('t20_sheets')
const validated = validateAndRepairCharacterData(JSON.parse(raw), defaults)
console.log('[v0] Validated character:', validated)
```

## 7. Segurança - Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] SECURITY.md lido e compreendido
- [ ] Variáveis de ambiente configuradas
- [ ] RLS ativado em todas as tabelas
- [ ] Service Role Key **NÃO** exposto no código
- [ ] CORS configurado para origin esperada
- [ ] Testes de validação de character_data passando

## 8. Próximas Melhorias Sugeridas

### Curto Prazo
- [ ] Adicionar suporte a múltiplas perícias customizadas
- [ ] Implementar sistema de inventário visual
- [ ] Adicionar edição de atributos pelo AttributeWheel

### Médio Prazo
- [ ] Cache de character_data para performance
- [ ] Sistema de versionamento de fichas
- [ ] Export/Import de fichas com PDF

### Longo Prazo
- [ ] Sincronização em tempo real (Realtime Supabase)
- [ ] Suporte a múltiplas classes
- [ ] Sistema de progressão de nível automático

## 9. Contato e Suporte

Para dúvidas ou problemas:
1. Verifique SECURITY.md para políticas de RLS
2. Verifique este arquivo para uso de componentes
3. Execute testes: `npm test`
4. Verifique logs: `console.log("[v0] ...")`

---

**Versão:** 1.0  
**Data:** 30 de Março de 2026  
**Autor:** v0 AI
