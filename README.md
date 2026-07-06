# 🕊️ OFS - Ordem Franciscana Secular

Sistema web completo, seguro e escalável para gerenciamento de membros da Ordem Franciscana Secular, incluindo controle de contribuições financeiras.

## ✨ Características

- ✅ Autenticação segura com JWT + bcrypt
- ✅ RBAC (Role-Based Access Control) - ADMIN e MEMBER
- ✅ Controle de contribuições anuais e mensais
- ✅ Dashboard administrativo com estatísticas
- ✅ Dashboard do membro com painel de contribuições
- ✅ Validação robusta com Zod
- ✅ Rate limiting e segurança
- ✅ Interface responsiva com TailwindCSS
- ✅ Arquitetura limpa e escalável

## 🏗️ Tecnologias

### Backend
- **Node.js** com TypeScript
- **Express** para API REST
- **Prisma ORM** para banco de dados
- **SQLite** para armazenamento inicial
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Zod** para validação

### Frontend
- **React 18** com TypeScript
- **Vite** como build tool
- **TailwindCSS** para estilos
- **Context API** para gerenciamento de estado
- **Axios** para comunicação com API
- **React Router** para navegação

## 📋 Requisitos

- Node.js 16+ instalado
- npm ou yarn
- Git (opcional)

## 🚀 Instalação & Execução

### 1. Preparar o Ambiente

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` se necessário. O padrão funciona para desenvolvimento:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET=seu_secret_jwt_muito_seguro_aqui
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 2. Instalar Dependências do Backend

```bash
cd backend
npm install
```

### 3. Configurar Banco de Dados

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Esto criará o banco de dados, tabelas e adicionará dados iniciais:
- **Admin**: admin@ofs.com | Senha: Admin@123456
- **Membro Pendente**: jose@ofs.com | Senha: Membro@123456
- **Membro Ativo**: maria@ofs.com | Senha: AtivaMembro@123

### 4. Iniciar o Backend

```bash
cd backend
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### 5. Instalar Dependências do Frontend

```bash
cd frontend
npm install
```

### 6. Configurar Frontend (Opcional)

```bash
cd frontend
cp .env.example .env
```

O padrão já funciona com o backend local.

### 7. Iniciar o Frontend

```bash
cd frontend
npm run dev
```

O aplicação estará disponível em `http://localhost:5173`

## 👤 Credenciais Padrão

| Usuário | Email | Senha | Perfil | Status |
|---------|-------|-------|--------|--------|
| Admin | admin@ofs.com | Admin@123456 | ADMIN | ATIVO |
| José | jose@ofs.com | Membro@123456 | MEMBER | PENDENTE |
| Maria | maria@ofs.com | AtivaMembro@123 | MEMBER | ATIVO |

## 📱 Fluxos de Uso

### Admin
1. Login com credenciais
2. Acesso ao Dashboard com estatísticas
3. Gerenciar membros (aprovar, inativar, editar)
4. Gerenciar contribuições
5. Visualizar relatórios de inadimplência

### Member
1. Cadastro na plataforma (status PENDENTE)
2. Aguardar aprovação do admin
3. Login após aprovação
4. Visualizar dados pessoais
5. Visualizar painel de contribuições (mensal e anual)
6. Editar perfil pessoal

## 🔐 Segurança

Implementadas as seguintes medidas:

- ✅ Hash bcrypt com salt >= 10
- ✅ JWT com expiração configurável
- ✅ Middleware de autenticação
- ✅ Middleware de autorização por role
- ✅ Middleware para verificar status ATIVO
- ✅ Validação com Zod
- ✅ Sanitização de dados
- ✅ Rate limiting básico (15 min/100 req por IP)
- ✅ Rate limiting para login (15 min/5 tentativas)
- ✅ CORS configurado
- ✅ Tratamento global de erros
- ✅ Variáveis sensíveis no .env

## 📊 Estrutura do Banco de Dados

### Usuário
```typescript
User {
  id: string
  nome: string
  cpf: string (unique)
  dataNascimento: DateTime
  telefone: string
  email: string (unique)
  senha: string (hash)
  role: "ADMIN" | "MEMBER"
  status: "PENDENTE" | "ATIVO" | "INATIVO"
  tipoMembro?: "INICIANTE" | "FORMANDO" | "PROFESSO"
  endereco?: Endereco
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Endereco
```typescript
Endereco {
  id: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  userId: string (FK)
}
```

### ContribuicaoAnual
```typescript
ContribuicaoAnual {
  id: string
  ano: int
  status: "PAGO" | "PENDENTE"
  dataPagamento?: DateTime
  userId: string (FK)
  unique(userId, ano)
}
```

### ContribuicaoMensal
```typescript
ContribuicaoMensal {
  id: string
  mes: int (1-12)
  ano: int
  status: "PAGO" | "PENDENTE"
  dataPagamento?: DateTime
  userId: string (FK)
  unique(userId, mes, ano)
}
```

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil autenticado
- `PUT /api/auth/profile` - Atualizar perfil

### Usuários (Admin)
- `GET /api/users` - Listar todos usuários
- `GET /api/users/status/:status` - Filtrar por status
- `GET /api/users/tipo/:tipoMembro` - Filtrar por tipo
- `GET /api/users/dashboard/stats` - Estatísticas do sistema
- `GET /api/users/:id` - Detalhe do usuário
- `POST /api/users/:id/approve` - Aprovar membro
- `PUT /api/users/:id/status` - Alterar status
- `PUT /api/users/:id/tipo/:tipoMembro` - Definir tipo

### Contribuições
- `GET /api/contribuicoes/anual/:userId` - Listar contribuições anuais
- `PUT /api/contribuicoes/anual/:id` - Atualizar anual
- `GET /api/contribuicoes/mensal/:userId` - Listar contribuições mensais
- `PUT /api/contribuicoes/mensal/:id` - Atualizar mensal
- `GET /api/contribuicoes/dashboard/member/:userId` - Dashboard do membro
- `GET /api/contribuicoes/dashboard/admin/report` - Relatório admin

## 📁 Estrutura do Projeto

```
sistema-ofs/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .env.example
│
└── README.md
```

## 🔄 Fluxo de Arquitetura

### Backend
```
Request → Middleware (Auth/Validation) → Controller → Service → Repository → Database
```

### Frontend
```
User → Component → Hook (useAuth) → Context (AuthContext) → API Service → Backend
```

## 🚢 Preparação para Produção

Para preparar para migração de SQLite para PostgreSQL:

1. **Backend**: Altere `DATABASE_URL` no `.env`
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/ofs"
   ```

2. **Rodar migrações Prisma**:
   ```bash
   cd backend
   npm run prisma:migrate -- --name initial
   npm run prisma:seed
   ```

3. **Compilar TypeScript**:
   ```bash
   cd backend
   npm run build
   npm start
   ```

4. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

## 💾 Backup e Restauração

- Guia completo em [BACKUP.md](BACKUP.md)
- Checklist mensal em [BACKUP_CHECKLIST.md](BACKUP_CHECKLIST.md)
- Scripts PowerShell em `scripts/backup`
- Clique duplo: `backup-now.bat`, `backup-schedule.bat`, `backup-restore.bat`
- Comando único: `npm run backup`

## 🐛 Troubleshooting

### Erro: "CORS blocked"
- Verifique `CORS_ORIGIN` no `.env` do backend
- Defina como URL do frontend

### Erro: "Token inválido"
- Limpe localStorage do navegador (F12 → Application → Local Storage)
- Faça login novamente

### Erro: Database locked
- Delete `dev.db` na pasta backend
- Rode `npm run prisma:migrate` e `npm run prisma:seed`

### Erro: Port já em uso
- Backend: `PORT=3001 npm run dev`
- Frontend: `vite --port 5174`

## 📧 Contato e Suporte

Para dúvidas ou sugestões, abra uma issue.

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para a Ordem Franciscana Secular**
