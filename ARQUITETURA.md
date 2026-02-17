# 🏗️ Arquitetura do Sistema OFS

## 📊 Diagrama de Fluxo da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUÁRIO FINAL                                │
│         (Navegador / Cliente Web)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Contexts  │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ Login        │  │ Button       │  │ AuthContext │          │
│  │ Register     │  │ Card         │  └──────────────┘          │
│  │ AdminPages   │  │ Badge        │                            │
│  │ MemberPages  │  │ Layout       │  ┌──────────────┐          │
│  └──────────────┘  │ Toast        │  │   Hooks     │          │
│                    └──────────────┘  ├──────────────┤          │
│                                       │ useAuth     │          │
│                    ┌──────────────┐   └──────────────┘          │
│                    │   Services   │                            │
│                    ├──────────────┤   ┌──────────────┐          │
│                    │ api.ts       │   │    Types    │          │
│                    │ (Axios)      │   │ (TypeScript)│          │
│                    └──────────────┘   └──────────────┘          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ REST API (JSON)
                     │ Port 3000
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (Node.js + Express)                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Routes                                      │   │
│  │  /api/auth  │  /api/users  │  /api/contribuicoes       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Middlewares                                    │   │
│  │  authenticate │ authorize │ validate │ errorHandler     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────┬──────────────────┬──────────────────┐      │
│  │  Controllers    │   Services       │  Repositories    │      │
│  ├─────────────────┼──────────────────┼──────────────────┤      │
│  │AuthController   │AuthService       │UserRepository    │      │
│  │UserController   │UserService       │ContribuicaoRepo  │      │
│  │Contrib.Control. │Contrib.Service   │                  │      │
│  └─────────────────┴──────────────────┴──────────────────┘      │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Prisma ORM                                       │   │
│  │  (Validação de Query)                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ SQLite (Dev) / PostgreSQL (Prod)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE                                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │    User      │  │  Endereco    │  │ ContribuicaoAnual│      │
│  ├──────────────┤  ├──────────────┤  ├──────────────────┤      │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)          │      │
│  │ nome         │  │ rua          │  │ ano              │      │
│  │ cpf (UQ)     │  │ numero       │  │ status           │      │
│  │ email (UQ)   │  │ bairro       │  │ dataPagamento    │      │
│  │ senha        │  │ cidade       │  │ userId (FK)      │      │
│  │ role         │  │ estado       │  │ UQ(userId, ano)  │      │
│  │ status       │  │ cep          │  └──────────────────┘      │
│  │ tipoMembro   │  │ userId (FK)  │                            │
│  │ createdAt    │  │ createdAt    │  ┌──────────────────┐      │
│  │ updatedAt    │  │ updatedAt    │  │ContribuicaoMensal│      │
│  └──────────────┘  └──────────────┘  ├──────────────────┤      │
│                                       │ id (PK)          │      │
│                                       │ mes (1-12)       │      │
│                                       │ ano              │      │
│                                       │ status           │      │
│                                       │ dataPagamento    │      │
│                                       │ userId (FK)      │      │
│                                       │ UQ(userId,mes,ano)      │
│                                       └──────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Fluxo de Autenticação

```
LOGIN
┌─────────────────────────────────────────┐
│ 1. Usuário entra email e senha          │
│    no formulário de login               │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 2. Frontend envia POST /api/auth/login  │
│    com email e senha                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 3. Backend valida credenciais           │
│    - Verifica se email existe           │
│    - Compara senha com hash bcrypt      │
│    - Valida status da conta             │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
┌──────────────┐        ┌──────────────────┐
│ Credenciais  │        │ Status != ATIVO  │
│ Inválidas    │        │ ou Email Inválid │
│ (401)        │        │ (403)            │
└──────────────┘        └──────────────────┘
                             │
                             ▼
                        ┌──────────────┐
                        │ Erro no login│
                        │ Toast error  │
                        └──────────────┘
    │
    │ ✅ Válido & Admin ou Status ATIVO
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. Backend gera JWT token               │
│    { id, email, role, status }          │
│    Expiração: 24h                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 5. Frontend recebe token                │
│    - Armazena em localStorage           │
│    - Define em estado AuthContext       │
│    - Adiciona header em axios           │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 6. Usuário redirecionado para dash      │
│    - Admin → /admin                     │
│    - Member → /member                   │
└─────────────────────────────────────────┘


REQUISIÇÃO AUTENTICADA
┌─────────────────────────────────────────┐
│ 1. Frontend faz requisição GET           │
│    /api/users/1                         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 2. Axios Interceptor adiciona header    │
│    Authorization: Bearer token          │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 3. Backend recebe requisição            │
│    Middlewares verificam:               │
│    - Header Authorization existe?       │
│    - Token é válido (JWT)?              │
│    - Não expirou?                       │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
┌──────────────┐        ┌──────────────────┐
│ Token OK     │        │ Token Inválido   │
│ Role OK?     │        │ ou Expirado      │
│ Status OK?   │        │ (401)            │
└──┬───────────┘        └──────────────────┘
   │                         │
   ├─────────────────────────┼────────────────┐
   │                         │                │
   ✅ SIM            Frontend intercepta 401 │
   │                 ├─ Remove token         │
   │                 ├─ Remove user         │
   ▼                 ├- Redireciona login   │
┌─────────────────┐ │                       │
│ Controller      │ │                       │
│ processa req    │ │                       │
│ Resposta 200    │ │                       │
└─────────────────┘ └──────────────────────┘

❌ NÃO - Erro de autorização (403)
```

---

## 👥 Fluxo de Cadastro

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuário acessa /register                         │
│    Preenche formulário com dados pessoais           │
│    - Nome, CPF, Email, Telefone, Endereço, Senha   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. Frontend valida dados de forma local             │
│    - Email válido?                                  │
│    - CPF tem 11 dígitos?                            │
│    - Senha >= 8 caracteres?                         │
│    - Senhas conferem?                               │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────┐            ┌──────────────┐
    │ Válido │            │ Inválido     │
    └────┬───┘            │ Mostrar erro │
         │                │ Toast        │
         │                └──────────────┘
         ▼
┌─────────────────────────────────────────────────────┐
│ 3. Frontend envia POST /api/auth/register           │
│    com todos os dados                               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. Backend valida dados com Zod                     │
│    - CPF válido?                                    │
│    - Email já existe?                               │
│    - CPF já existe?                                 │
│    - Todos campos obrigatórios?                     │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌────────┐            ┌──────────────┐
    │ Válido │            │ Inválido     │
    └────┬───┘            │ Erro 400/409 │
         │                │ Mensagem erro│
         │                └──────────────┘
         │                       │
         │                       ▼
         │                ┌──────────────────┐
         │                │ Frontend mostra  │
         │                │ Toast error      │
         │                └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ 5. Backend cria usuário                             │
│    - Hash da senha com bcrypt                       │
│    - role = "MEMBER"                                │
│    - status = "PENDENTE"                            │
│    - Criar endereço relacionado                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 6. Frontend mostra Toast de sucesso                 │
│    "Cadastro realizado!"                            │
│    "Aguarde aprovação do administrador"             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 7. Frontend redireciona para /login                 │
│    Usuário faz login (não funciona, status PENDENTE)│
│    Erro: "Conta não ativa"                          │
└─────────────────────────────────────────────────────┘

                    | (ADMIN APROVA)
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ 8. Admin acessa admin/membros                       │
│    Filtra por "PENDENTE"                            │
│    Clica botão "Aprovar" no usuário                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 9. Backend altera:                                  │
│    - status = "ATIVO"                               │
│    - tipoMembro = "INICIANTE" (padrão)              │
│    - Cria contribuições anuais                      │
│    - Cria contribuições mensais                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 10. Usuário agora pode fazer login com sucesso     │
│     Acesso liberado ao dashboard                    │
└─────────────────────────────────────────────────────┘
```

---

## 💰 Fluxo de Contribuições

```
AO APROVAR MEMBRO:
┌──────────────────────────────────────┐
│ 1. Admin aprova membro               │
│    POST /users/:id/approve           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. Backend cria automaticamente:      │
│                                      │
│    ContribuicaoAnual:                │
│    ├─ ano: 2025                      │
│    ├─ ano: 2026                      │
│    └─ status: PENDENTE               │
│                                      │
│    ContribuicaoMensal (2025):        │
│    ├─ mes: 1-12                      │
│    ├─ ano: 2025                      │
│    └─ status: PENDENTE               │
└──────────────────────────────────────┘


PAINEL DO MEMBRO:
┌──────────────────────────────────────┐
│ Contribuição Anual - 2025            │
├──────────────────────────────────────┤
│ 2025: ⭕ PENDENTE                    │
│ 2026: ⭕ PENDENTE                    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Contribuições Mensais - 2025         │
├─────────┬─────────┬─────────┬────────┤
│ Jan     │ Fev     │ Mar     │ Abr    │
│ ⭕      │ ⭕      │ ⭕      │ ⭕     │
│PENDENTE │PENDENTE │PENDENTE │PENDENTE│
├─────────┼─────────┼─────────┼────────┤
│ Mai     │ Jun     │ Jul     │ Ago    │
│ ⭕      │ ⭕      │ ⭕      │ ⭕     │
│PENDENTE │PENDENTE │PENDENTE │PENDENTE│
├─────────┼─────────┼─────────┼────────┤
│ Set     │ Out     │ Nov     │ Dez    │
│ ⭕      │ ⭕      │ ⭕      │ ⭕     │
│PENDENTE │PENDENTE │PENDENTE │PENDENTE│
└─────────┴─────────┴─────────┴────────┘

QUANDO ADMIN MARCA COMO PAGO:
┌──────────────────────────────────────┐
│ 1. Admin acessa admin/contribuicoes  │
│    Vê relatório de todos os membros  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 2. Clica em "Editar" na contribuição │
│    Muda status para PAGO             │
│    Adiciona data de pagamento        │
│    PUT /contribuicoes/mensal/:id     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 3. Database atualiza:                │
│    status = "PAGO"                   │
│    dataPagamento = data do dia       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 4. Membro vê painel atualizado:      │
│                                      │
│    Jan                               │
│    🟢 (PAGO)                         │
│    Pago em: 15/01/2025               │
└──────────────────────────────────────┘

GERAÇÃO AUTOMÁTICA AO FIM DO ANO:
┌──────────────────────────────────────┐
│ 1. Ao mudar para novo ano (2026)     │
│    Sistema detecta falta de registros│
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ 2. Backend cria automaticamente:      │
│    ContribuicaoMensal para 2026      │
│    ├─ mes: 1-12                      │
│    ├─ ano: 2026                      │
│    └─ status: PENDENTE               │
└──────────────────────────────────────┘
```

---

## 🔐 Fluxo de Segurança

```
REQUISIÇÃO RECEBIDA
        │
        ▼
┌────────────────────────────────┐
│ 1. CORS Middleware              │
│    Verifica origem permitida    │
│    Rejeita cross-origin inválido│
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 2. Rate Limiting Middleware     │
│    Verifica requisições do IP   │
│    Max: 100/15min (global)      │
│    Max: 5/15min (login)         │
└────────┬───────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌────────┐ ┌──────────────┐
│ Tab.ok │ │ Tab. excedido│
│ Cont.  │ │ Retorna 429  │
└────┬───┘ └──────────────┘
     │
     ▼
┌────────────────────────────────┐
│ 3. Validação Content-Type      │
│    Verifica se é JSON válido   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 4. Rotas Abertas vs Protegidas │
│    /auth/login → Aberta        │
│    /users → Precisa auth       │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 5. Autenticação (Token)        │
│    Header Authorization existe?│
│    Bearer token valido?        │
│    Token expirado?             │
└────────┬───────────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
┌────────┐        ┌──────────┐
│ Token  │        │ 401      │
│ Valid  │        │ Rejected │
└────┬───┘        └──────────┘
     │
     ▼
┌────────────────────────────────┐
│ 6. Autorização por Role        │
│    /users → RequireAdmin       │
│    User tem role ADMIN?        │
└────────┬───────────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
┌────────┐        ┌──────────┐
│ Role   │        │ 403      │
│ Valid  │        │ Rejected │
└────┬───┘        └──────────┘
     │
     ▼
┌────────────────────────────────┐
│ 7. Validação Body (Zod)        │
│    Estrutura correta?          │
│    Tipos corretos?             │
│    Constraints satisfeitos?    │
└────────┬───────────────────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
┌────────┐        ┌──────────┐
│ Valid  │        │ 400      │
│ Body   │        │ Rejected │
└────┬───┘        └──────────┘
     │
     ▼
┌────────────────────────────────┐
│ 8. Controller / Service        │
│    Executa lógica de negócio   │
│    Acesso ao banco via ORM     │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ 9. Resposta                    │
│    200, 201, 404, 500, etc     │
│    JSON com dados              │
│    Sem dados sensíveis         │
└────────────────────────────────┘
```

---

## 📊 Status Codes HTTP Utilizados

| Código | Significado | Exemplo |
|--------|-------------|---------|
| **200** | OK | GET usuário com sucesso |
| **201** | Created | POST criar usuário |
| **400** | Bad Request | Validação falhou |
| **401** | Unauthorized | Token inválido/expirado |
| **403** | Forbidden | Sem permissão (role/status) |
| **404** | Not Found | Usuário não existe |
| **409** | Conflict | Email/CPF já existe |
| **429** | Too Many Requests | Rate limit excedido |
| **500** | Internal Server Error | Erro do servidor |

---

**Desenvolvido com ❤️ para a Ordem Franciscana Secular**
