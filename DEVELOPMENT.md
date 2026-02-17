# 🚀 Guia de Desenvolvimento

## Iniciando o Projeto (Script Rápido)

### Windows PowerShell

```powershell
# Terminal 1 - Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### macOS/Linux

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## URLs de Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Prisma Studio**: `npm run prisma:studio` na pasta backend

## Comandos Úteis

### Backend

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot reload

# Database
npm run prisma:generate # Gera cliente Prisma
npm run prisma:migrate  # Executa migrações
npm run prisma:seed     # Popula dados iniciais
npm run prisma:studio   # Interface gráfica do banco

# Build
npm run build           # Compila TypeScript
npm start              # Inicia produção

# Lint
npm run lint           # Valida código
```

### Frontend

```bash
# Desenvolvimento
npm run dev            # Inicia dev server

# Build
npm run build          # Compila para produção
npm run preview        # Preview da build

# Lint
npm run lint           # Valida código
```

## Estrutura de Pastas - Backend

```
backend/src/
├── config/          # Configurações do app
├── controllers/     # Tratam requisições HTTP
├── services/        # Lógica de negócio
├── repositories/    # Acesso ao banco
├── routes/          # Definição de rotas
├── middlewares/     # Middlewares Express
├── schemas/         # Validações Zod
├── utils/           # Funções utilitárias
└── server.ts        # Entrada principal
```

## Estrutura de Pastas - Frontend

```
frontend/src/
├── pages/           # Páginas da aplicação
├── components/      # Componentes reutilizáveis
├── contexts/        # Context API
├── hooks/           # Custom hooks
├── services/        # Serviços (API, etc)
├── types/           # Tipos TypeScript
├── App.tsx          # App principal
├── main.tsx         # Entrada React
└── index.css        # Estilos globais
```

## 🔑 Credenciais Padrão para Teste

| Email | Senha | Tipo |
|-------|-------|------|
| admin@ofs.com | Admin@123456 | ADMIN (ATIVO) |
| jose@ofs.com | Membro@123456 | MEMBER (PENDENTE) |
| maria@ofs.com | AtivaMembro@123 | MEMBER (ATIVO) |

## Fluxo de Dados

### Autenticação
1. User submete login no frontend
2. Frontend envia requisição para `/api/auth/login`
3. Backend valida credenciais
4. Se válido, retorna JWT token
5. Frontend armazena token em localStorage
6. Frontend adiciona token em todas as requisições

### Requisição Autenticada
1. Frontend lê token do localStorage
2. Frontend adiciona header `Authorization: Bearer token`
3. Middleware `authenticate` valida token
4. Se válido, continua para controller
5. Se inválido, retorna 401

### Controle de Acesso
1. Middleware `requireAdmin` verifica role
2. Middleware `requireActive` verifica status
3. Se não passa em validação, retorna 403

## Validação de Dados - Zod

Exemplos de validação implementada:

```typescript
// Criação de usuário - Must have all fields
{
  nome: string (min 3)
  cpf: string (11 dígitos)
  dataNascimento: DateTime
  telefone: string (min 10)
  email: string (valid email)
  senha: string (min 8)
  endereco: { rua, numero, bairro, cidade, estado, cep }
}

// Login
{
  email: string (valid email)
  senha: string (required)
}

// Contribuição
{
  status: "PAGO" | "PENDENTE"
  dataPagamento?: DateTime (nullable)
}
```

## 🔒 Segurança

### Implementadas
- ✅ Hash bcrypt (salt 10)
- ✅ JWT com expiração 24h
- ✅ Rate limiting (100 req/15min)
- ✅ Rate limiting login (5 tentativas/15min)
- ✅ CORS habilitado
- ✅ Validação Zod
- ✅ Tratamento de erros global

### Não Expor
- ❌ Senhas em logs
- ❌ Stack traces em produção
- ❌ Detalhes internos do DB
- ❌ Tokens em URL/logs

## Desenvolvimento - Adicionando Nova Feature

### 1. Criar Schema Zod (se necessário)
```typescript
// schemas/index.ts
export const novaFeatureSchema = z.object({
  campo: z.string()
});
```

### 2. Criar Repository
```typescript
// repositories/NovaRepository.ts
export class NovaRepository {
  static async criar(data: any) {
    return prisma.modelo.create({ data });
  }
}
```

### 3. Criar Service
```typescript
// services/NovaService.ts
export class NovaService {
  static async criar(input: NovaFeatureInput) {
    return NovaRepository.criar(input);
  }
}
```

### 4. Criar Controller
```typescript
// controllers/NovaController.ts
export class NovaController {
  static async criar(req: Request, res: Response) {
    try {
      const result = await NovaService.criar(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
}
```

### 5. Adicionar Rota
```typescript
// routes/nova.ts
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateBody(novaFeatureSchema),
  NovaController.criar
);
```

### 6. Registrar Rota no Server
```typescript
// server.ts
app.use("/api/nova", authenticate, novaRoutes);
```

## 🐛 Debug

### Backend
```bash
# VSCode - adicione em .vscode/launch.json
"configurations": [
  {
    "type": "node",
    "request": "launch",
    "name": "Debug Backend",
    "runtimeExecutable": "npm",
    "runtimeArgs": ["run", "dev"],
    "cwd": "${workspaceFolder}/backend"
  }
]
```

### Frontend
- Use React Dev Tools (Chrome Extension)
- Use Vite Dev Tools
- Use browser DevTools (F12)

## 📝 Logging

### Backend
```typescript
console.log("ℹ️ Info");
console.warn("⚠️ Warning");
console.error("❌ Error");
```

### Frontend
```typescript
console.log("ℹ️ Info");
console.warn("⚠️ Warning");
console.error("❌ Error");
```

## Performance

### Backend Otimizações
- Adicionar índices no Prisma
- Implementar paginação
- Cache com Redis (future)
- Lazy loading de relações

### Frontend Otimizações
- Code splitting automático Vite
- Lazy load de componentes React
- Otimizar imagens
- Memoização com useMemo

## Próximos Passos

- [ ] Adicionar testes unitários (Jest)
- [ ] Adicionar testes E2E (Playwright)
- [ ] Implementar refresh token
- [ ] Adicionar 2FA
- [ ] Backup automático
- [ ] Email de notificação
- [ ] Dashboard de relatórios avançados
- [ ] Migração PostgreSQL
- [ ] Deploy na cloud

---

**Happy coding! 🚀**
