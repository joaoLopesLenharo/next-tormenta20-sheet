# Guia de Testes - Verificação da Implementação

Este documento descreve como testar as melhorias implementadas de forma manual e automatizada.

## 1. Testes Manuais - Players no Dashboard Mestre

### Pré-requisitos
1. Variáveis de ambiente configuradas em `.env.local`
2. Supabase com tables criadas e RLS ativado
3. Pelo menos uma campanha com membros criada

### Teste 1: Exibição de Players
**Objetivo:** Verificar se players aparecem no card de players

**Passos:**
1. Acesse `/campanhas/[campaign-id]/mestre`
2. Vá para aba "PLAYERS" ou busque o card de players
3. Verifique se os membros aparecem com:
   - [ ] Nome do personagem
   - [ ] Classe e nível
   - [ ] Barras de vida/mana/prana
   - [ ] Avatar (se fornecido)

**Resultado Esperado:**
```
✅ Players: João (Combatente Nível 3)
   Vida: 36/36
   Mana: 12/12
   Prana: 8/8
```

**Se não aparecer:**
1. Abra DevTools (F12)
2. Verifique Console para erros
3. Verifique Network → `/api/campaign-members?campaignId=...`
4. Resposta deve ter: `{"members": [...]}`

### Teste 2: Character Sheet View (Novo Layout)
**Objetivo:** Testar nova interface inspirada em CRIS

**Passos:**
1. No player panel, abra a aba "Ficha Completa"
2. Verifique se aparecem:
   - [ ] Avatar do personagem
   - [ ] Nome, nível, classe, raça
   - [ ] Roda de atributos (Força, Destreza, etc.)
   - [ ] Barras de Vida, Mana, Prana editáveis
   - [ ] Abas: COMBATE, HABILIDADES, RITUAIS, INVENTÁRIO, DESCRIÇÃO

**Teste de Abas:**
- [ ] **COMBATE**: Mostra roda de atributos + barras + armas equipadas
- [ ] **HABILIDADES**: Mostra tabela de perícias com filtro
- [ ] **RITUAIS**: Placeholder (desenvolvimento)
- [ ] **INVENTÁRIO**: Placeholder (desenvolvimento)
- [ ] **DESCRIÇÃO**: Mostra texto descritivo

**Resultado Esperado:**
Layout limpo e profissional similar ao CRIS, com navegação fluida entre abas.

### Teste 3: Validação de Character Data
**Objetivo:** Testar se dados quebrados são corrigidos

**Passos:**
1. Abra DevTools Console
2. Execute:
```javascript
// Simular dados quebrados no localStorage
const broken = {
  nome: "Teste",
  atributos: { forca: 99 }, // Atributo inválido
  recursos: null // Inválido
}
localStorage.setItem('t20_sheets', JSON.stringify([{
  id: 'test',
  meta: { nome: 'Teste', nivel: 1 },
  data: broken
}]))
location.reload()
```
3. Verifique se a ficha ainda carrega com valores padrão

**Resultado Esperado:**
✅ Ficha carrega sem erro, com dados reparados (atributo limitado a 20, recursos com defaults)

## 2. Testes de Segurança

### Teste 1: RLS - Acesso Não Autorizado
**Objetivo:** Verificar que RLS bloqueia acesso indevido

**Passos:**
1. Abra DevTools Console
2. Tente acessar como jogador:
```javascript
const { data: unauthorizedMembers } = await supabase
  .from('campaign_members')
  .select('*')
  .neq('campaign_id', 'campanha-do-usuario')
  .limit(1)

console.log(unauthorizedMembers) // Deve ser []
```

**Resultado Esperado:**
✅ Array vazio - RLS bloqueia acesso

### Teste 2: Character Data Sanitization
**Objetivo:** Verificar que character_data inválido é tratado

**Passos:**
1. Manipule character_data no Supabase (admin)
2. Adicione um campo malformado:
```json
{
  "nome": "Teste",
  "atributos": { "forca": "invalid" },
  "recursos": { "vida": -999 }
}
```
3. Acesse `/api/campaign-members?campaignId=...`
4. Verifique resposta

**Resultado Esperado:**
✅ character_data é null ou com defaults (não quebra a API)

### Teste 3: Service Role Key Exposure
**Objetivo:** Verificar que Service Role Key não está exposto

**Passos:**
1. Procure no código-fonte:
```bash
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.tsx" --include="*.ts"
```
2. Não deve aparecer em arquivos do `/app` ou `/components` (apenas `/app/api`)

**Resultado Esperado:**
✅ Service Role Key usado apenas em `/app/api` (server-side)

## 3. Testes de Componentes

### Teste AttributeWheel
```tsx
import { AttributeWheel } from '@/components/character/attribute-wheel'

<AttributeWheel
  attributes={{
    forca: 15,
    destreza: 12,
    constituicao: 14,
    inteligencia: 10,
    sabedoria: 13,
    carisma: 11
  }}
  size="md"
/>
```

**Verificações:**
- [ ] Roda renderiza sem erro
- [ ] Atributos exibidos corretamente
- [ ] Modificadores calculados (+2, +1, etc.)
- [ ] Responsivo em mobile

### Teste ResourceBars
```tsx
import { ResourceBars } from '@/components/character/resource-bars'

<ResourceBars
  vida={{ atual: 25, maximo: 36, cor: '#ef4444' }}
  mana={{ atual: 8, maximo: 12, cor: '#3b82f6' }}
  prana={{ atual: 5, maximo: 8, cor: '#eab308' }}
  onVidaChange={(curr, max) => console.log('Vida:', curr, max)}
/>
```

**Verificações:**
- [ ] Barras renderizam com cores corretas
- [ ] Percentual calcula corretamente
- [ ] Botões +/- funcionam
- [ ] Input direto permite edição

### Teste SkillsTable
```tsx
import { SkillsTable } from '@/components/character/skills-table'

<SkillsTable
  skills={{
    'Acrobacia': { atributo: 'destreza', treinada: true, outros: 2 },
    'Atletismo': { atributo: 'forca', outros: 1 }
  }}
  attributeModifiers={{ forca: 2, destreza: 1 }}
/>
```

**Verificações:**
- [ ] Perícias listam sem erro
- [ ] Filtro por nome funciona
- [ ] Filtro por atributo funciona
- [ ] Filtro por treino funciona
- [ ] Total de bônus calcula correto

### Teste AttackPanel
```tsx
import { AttackPanel } from '@/components/character/attack-panel'

<AttackPanel
  weapons={[
    { nome: 'Espada', tipo: 'Melee', dano: '1d8+2', critico: '19-20', equipada: true }
  ]}
  defesa={14}
  attributeModifiers={{ forca: 2, destreza: 1 }}
/>
```

**Verificações:**
- [ ] Defesa exibida corretamente
- [ ] Arma equipada renderiza
- [ ] Botões de ataque/dano disponíveis
- [ ] Cálculos de bônus corretos

## 4. Testes de Performance

### Teste 1: Carregamento de CharacterSheetView
**Objetivo:** Verificar que interface não laga

**Passos:**
1. Abra DevTools → Performance
2. Carregue `/campanhas/[id]/jogador`
3. Mude entre abas (COMBATE, HABILIDADES, etc.)
4. Verifique FPS

**Resultado Esperado:**
- [ ] Carregamento < 1s
- [ ] FPS > 50 ao navegar abas
- [ ] Sem memory leaks

### Teste 2: Múltiplos Players
**Objetivo:** Verificar que interface aguenta múltiplos players

**Passos:**
1. Crie 10+ membros em uma campanha
2. Acesse dashboard do mestre
3. Verifique rendering de todos

**Resultado Esperado:**
- [ ] Todos players aparecem
- [ ] Sem lag ao scroll
- [ ] Performance aceitável

## 5. Testes de Validação Zod

### Teste Manual
```typescript
import { CharacterDataSchema, validateCharacterData } from '@/lib/schemas/character'

// Teste 1: Dados válidos
const valid = { nome: 'João', atributos: { forca: 15, ... }, ... }
console.log(validateCharacterData(valid)) // ✅ Sucesso

// Teste 2: Dados inválidos
const invalid = { nome: 'João', atributos: { forca: 99 } } // Força > 20
try {
  validateCharacterData(invalid)
} catch (error) {
  console.log('Erro esperado:', error.issues) // ✅ Erro capturado
}

// Teste 3: Repair
const broken = { nome: 'João' }
const repaired = validateAndRepairCharacterData(broken, defaults)
console.log(repaired.atributos) // ✅ Filled with defaults
```

## 6. Checklist Final

### Antes de Commitar
- [ ] Nenhum `console.log("[v0]")` deixado (ou comentado apropriadamente)
- [ ] Sem erros no Console do browser
- [ ] Sem warnings do TypeScript (`npm run build`)
- [ ] Validação de character_data funcionando
- [ ] RLS policies ativas

### Antes de Deploy
- [ ] `.env.local` removido (não commitar)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` em Vercel Settings
- [ ] CORS configurado para domain correto
- [ ] Backup do banco feito
- [ ] SECURITY.md lido e compreendido

## 7. Troubleshooting de Testes

### Problema: "character_data is undefined"
**Solução:**
- Verifique se member tem character_data no banco
- Valide schema: `CharacterDataSchema.parse(data)`
- Adicione debug log no API

### Problema: "RLS policy violation"
**Solução:**
- Verifique se user é mestre da campanha
- Verifique se campaign_member_exists() função executável
- Check logs: `SELECT * FROM campaign_members WHERE user_id = auth.uid()`

### Problema: "AttributeWheel não renderiza"
**Solução:**
- Verifique props: `attributes` deve ter todos 6 atributos
- Check values: devem estar entre 3-20
- Check size: 'sm' | 'md' | 'lg'

---

**Versão:** 1.0  
**Data:** 30 de Março de 2026  
**Autor:** v0 AI
