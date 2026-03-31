# Guia de Segurança do Projeto Tormenta 20 Sheet

Este documento detalha as medidas de segurança implementadas no projeto para proteger dados de usuários e campanhas.

## 1. Autenticação e Autorização

### Supabase Auth
- Utilizamos Supabase Auth com JWT tokens
- Tokens são armazenados em cookies HTTP-only (lado servidor)
- Middleware valida tokens em cada requisição

### Row Level Security (RLS)
- **Ativado** em todas as tabelas críticas: `campaigns`, `campaign_members`, `sessions`, `dice_rolls`, `initiative_entries`, `profiles`
- **Funções SECURITY DEFINER** para controle granular de acesso:
  - `is_campaign_master()`: Verifica se usuário é mestre da campanha
  - `campaign_member_exists()`: Verifica se usuário pertence à campanha
  - `shares_campaign_with()`: Verifica se dois usuários compartilham uma campanha

### Política de Acesso

| Recurso | Mestre | Jogador | Anônimo |
|---------|--------|---------|---------|
| Campanha própria | ✅ RW | ❌ | ❌ |
| Campanha como membro | ❌ | ✅ R | ❌ |
| Membros da campanha | ✅ RW | ✅ R | ❌ |
| Sessão ativa | ✅ RW | ✅ R | ❌ |
| Rolagens públicas | ✅ RW | ✅ R | ❌ |
| Rolagens secretas | ✅ RW (all) | ✅ R (próprias) | ❌ |
| Ficha de personagem | ✅ R | ✅ RW | ❌ |

## 2. Validação de Dados

### Schema Validation (Zod)
Criado em `lib/schemas/character.ts` para validar estrutura de dados:

```typescript
// Validação obrigatória de character_data antes de usar
const validatedCharacter = CharacterDataSchema.parse(characterData)

// Validação com fallback seguro
const safeCharacter = validateAndRepairCharacterData(data, defaults)
```

**Campos Validados:**
- Atributos: 6 atributos base (3-20)
- Recursos: vida, mana, prana com valores mínimos (0) e máximos
- Perícias: dicionário tipado com schema de perícia
- Inventário: armas, armaduras, itens com estrutura validada
- Dados de classe: nível, nome, origem validados

### API Sanitization
**Arquivo:** `app/api/campaign-members/route.ts`

```typescript
// Sanitização de character_data na resposta da API
const validatedCharacterData = CharacterDataSchema.parse(m.character_data)

// Remoção de campos sensíveis de profiles
profiles: {
  id, display_name, avatar_url, role // Apenas campos públicos
}
```

## 3. Prevenção de Vulnerabilidades

### SQL Injection
- ✅ Uso exclusivo de Supabase client com queries parametrizadas
- ✅ Sem string concatenation em queries
- ✅ UUIDs validados com regex antes de uso em queries

### XSS (Cross-Site Scripting)
- ✅ React escape automático de conteúdo
- ✅ Validação de entrada em caracteres especiais
- ✅ Character Sheet view sanitiza dados antes de renderizar

### CSRF (Cross-Site Request Forgery)
- ✅ Supabase Auth com CSRF tokens internos
- ✅ SameSite cookies configurados
- ✅ Middleware valida origem de requisições

### Information Disclosure
- ✅ Erro 403 genérico ao rejeitar acesso (não revela existência de recurso)
- ✅ Remover timestamps sensíveis da resposta da API
- ✅ Validação de character_data com erro silencioso (fallback para null)

## 4. localStorage Security

### Validação de Character Data
**Problema:** localStorage é acessível via JavaScript (XSS)
**Solução:** 

1. **Validação ao carregar:** Schema Zod valida estrutura
2. **Sem dados sensíveis:** localStorage contém apenas dados não-sensíveis
3. **Sincronização:** Dados críticos sincronizam com Supabase (character_data)

```typescript
// Exemplo: Carregar com validação
const raw = localStorage.getItem('t20_sheets')
const validated = validateAndRepairCharacterData(
  JSON.parse(raw),
  defaultCharacter
)
```

## 5. Boas Práticas de Desenvolvimento

### Variáveis de Ambiente
- ✅ `SUPABASE_SERVICE_ROLE_KEY` nunca exposto ao cliente
- ✅ `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` públicos apenas
- ✅ Validação de env vars obrigatória no server

### Logging de Segurança
```typescript
// Log de operações sensíveis
console.log('[v0] Character validation failed:', error)
console.warn('[campaign-members] Invalid character_data for member ${m.id}')
```

### Tratamento de Erros
- ❌ Nunca exposer stack traces ao cliente
- ✅ Erros genéricos nas respostas 4xx/5xx
- ✅ Logging detalhado apenas no servidor

## 6. Fluxo de Validação de Character Data

```
localStorage
    ↓
validateAndRepairCharacterData() [client-side]
    ↓
Character Sheet View (com defaults mergidos)
    ↓
Sincronização com Supabase
    ↓
API campaign-members/route.ts
    ↓
CharacterDataSchema.parse() [server-side]
    ↓
Resposta sanitizada para cliente
```

## 7. Checklist de Segurança

### Antes de Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] RLS ativado em todas as tabelas
- [ ] CORS configurado corretamente
- [ ] Service Role Key não exposto
- [ ] Validação de schema em API endpoints

### Monitoramento
- [ ] Logs de falha de validação
- [ ] Alertas para tentativas de acesso não autorizado
- [ ] Monitoramento de padrões anormais de uso

## 8. Incidentes de Segurança

Para reportar vulnerabilidades, não abra issue pública. Entre em contato via:
- Email: security@example.com
- Responsável: [Seu Nome]

## 9. Atualizações de Segurança

- Supabase: Atualizado automaticamente
- Dependências: Executar `npm audit` regularmente
- Schemas: Revisar Zod schemas com mudanças de requirements

---

**Última atualização:** 30 de Março de 2026
**Revisão prevista:** A cada 3 meses
