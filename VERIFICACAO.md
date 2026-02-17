✅ # GUIA DE VERIFICAÇÃO - Sistema OFS

Use este checklist para garantir que tudo está funcionando corretamente.

---

## 🔍 Verificação de Instalação

### Backend

- [ ] Pasta `backend` existe
- [ ] `npm install` foi executado com sucesso
- [ ] Arquivo `node_modules` existe
- [ ] Arquivo `dev.db` foi criado em `backend/`
- [ ] Variáveis de ambiente em `backend/.env`

```bash
cd backend
npm list express    # Deve listar express
npm list prisma     # Deve listar prisma
npm list typescript # Deve listar typescript
```

### Frontend

- [ ] Pasta `frontend` existe
- [ ] `npm install` foi executado com sucesso
- [ ] Arquivo `node_modules` existe
- [ ] Variáveis de ambiente em `frontend/.env`

```bash
cd frontend
npm list react      # Deve listar react
npm list vite       # Deve listar vite
npm list typescript # Deve listar typescript
```

---

## 🗄️ Verificação do Banco de Dados

### Tabelas Criadas

Execute no backend:
```bash
npm run prisma:studio
```

Deve retornar interface web e as tabelas:
- [ ] User
- [ ] Endereco
- [ ] ContribuicaoAnual
- [ ] ContribuicaoMensal

### Dados Seed

No Prisma Studio, verificar em `User`:
- [ ] admin@ofs.com (ADMIN, ATIVO)
- [ ] jose@ofs.com (MEMBER, PENDENTE)
- [ ] maria@ofs.com (MEMBER, ATIVO)

Em `Endereco` (3 endereços relacionados)
- [ ] 3 endereços existem

Em `ContribuicaoAnual`
- [ ] Contribuições para maria (2025, 2026)

Em `ContribuicaoMensal`
- [ ] 12 registros para maria em 2025

---

## 🚀 Verificação de Execução

### Backend Rodando

```bash
Terminal 1:
cd backend
npm run dev
```

Verificar na saída:
- [ ] `✅ Servidor rodando na porta 3000`
- [ ] `🌍 Ambiente: development`
- [ ] Nenhum erro vermelho

### Frontend Rodando

```bash
Terminal 2:
cd frontend
npm run dev
```

Verificar na saída:
- [ ] `VITE v... ready in ... ms`
- [ ] `➜  Local:   http://localhost:5173/`
- [ ] Nenhum erro vermelho

---

## 🌐 Verificação de URLs

### Backend

```bash
curl http://localhost:3000/health
# Deve retornar: {"status":"OK","timestamp":"..."}

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ofs.com","senha":"Admin@123456"}'
# Deve retornar: {"token":"...","user":{...}}
```

### Frontend

- [ ] Abrir http://localhost:5173 no navegador
- [ ] Página de login deve carregar
- [ ] Logo OFS deve ser visível
- [ ] Formulário de login deve estar presente

---

## 🔐 Verificação de Autenticação

### Login Admin

1. Ir para http://localhost:5173
2. Email: `admin@ofs.com`
3. Senha: `Admin@123456`
4. Verificar:
   - [ ] Botão "Entrar" funciona
   - [ ] Redirecionado para `/admin`
   - [ ] Dashboard mostra estatísticas
   - [ ] Sidebar com menu aparece

### Login Member Ativo

1. Logout do admin (clique no botão "Sair")
2. Email: `maria@ofs.com`
3. Senha: `AtivaMembro@123`
4. Verificar:
   - [ ] Login com sucesso
   - [ ] Redirecionado para `/member`
   - [ ] Painel de contribuições mostra
   - [ ] Status "ATIVO" exibido

### Login Member Pendente (deve falhar)

1. Email: `jose@ofs.com`
2. Senha: `Membro@123456`
3. Verificar:
   - [ ] Erro: "Sua conta não está ativa"
   - [ ] Não faz login

---

## 📊 Verificação de Funcionalidades Admin

### Dashboard

- [ ] Título "Dashboard Administrativo" visível
- [ ] 5 cards mostram:
  - [ ] Total de Membros (2)
  - [ ] Membros Ativos (1)
  - [ ] Pendentes (1)
  - [ ] Inativos (0)
  - [ ] Administradores (1)

### Membros

1. Acesse `/admin/membros`
2. Verificar:
   - [ ] Tabela com usuários
   - [ ] Filtros funcionam (Todos, Pendentes, Ativos, Inativos)
   - [ ] Jose aparece como PENDENTE
   - [ ] Maria aparece como ATIVO
   - [ ] Admin aparece com role ADMIN

3. Aprovar Jose:
   - [ ] Clique no botão "✓ Aprovar" de Jose
   - [ ] Status muda para ATIVO
   - [ ] Jose agora pode fazer login

### Contribuições

1. Acesse `/admin/contribuicoes`
2. Verificar:
   - [ ] Dropdown de ano (2025, 2026)
   - [ ] Relatório com 2 membros (Maria e Jose após aprovação)
   - [ ] Colunas: Nome, Email, Tipo, Anual, Mensal, Status
   - [ ] Maria mostra: 8 pagas / 12 total em 2025

---

## 📱 Verificação de Funcionalidades Member

### Dashboard do Membro

1. Login como Maria
2. Acesse `/member`
3. Verificar:
   - [ ] Saudação de boas-vindas ("Olá, Maria!")
   - [ ] Cards mostram:
     - [ ] Contribuições Mensais Pagas: 8
     - [ ] Contribuições Mensais Pendentes: 4

4. Contribuição Anual:
   - [ ] Mostra 2025: PENDENTE
   - [ ] Mostra 2026: PENDENTE

5. Contribuições Mensais 2025:
   - [ ] Janeiro a Agosto: 🟢 (verde, PAGO)
   - [ ] Setembro a Dezembro: 🔴 (vermelho, PENDENTE)

### Perfil do Membro

1. Acesse `/member/profile`
2. Verificar:
   - [ ] Todas as informações de Maria aparecem
   - [ ] Botão "Editar" disponível

3. Clique "Editar":
   - [ ] Campos ficam editáveis
   - [ ] Campos CPF, Email, DataNasc permanecem desabilitados
   - [ ] Pode editar: Nome, Telefone, Endereço

4. Faça uma alteração e salve:
   - [ ] Toast de sucesso aparece
   - [ ] Dados são salvos

---

## 🔐 Verificação de Segurança

### Rate Limiting

```bash
# Teste rate limit de login (max 5 tentativas em 15 min)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ofs.com","senha":"SenhaErrada"}'
  echo ""
done
# 6ª requisição deve retornar 429 (Too Many Requests)
```

- [ ] Primeira a quinta: 401 (senha errada)
- [ ] Sexta em diante: 429 (limite excedido)

### Validação Zod

1. Abra DevTools (F12)
2. Registre com CPF inválido:
   - [ ] Erro: "CPF deve ter 11 dígitos"

3. Registre com email inválido:
   - [ ] Erro: "Email inválido"

4. Registre com senha < 8 caracteres:
   - [ ] Erro: "Senha deve ter no mínimo 8 caracteres"

### JWT Token

1. Faça login
2. Abra DevTools → Console
3. Execute:
   ```javascript
   localStorage.getItem('token')
   ```
   - [ ] Deve retornar um token JWT longo

4. Tente acessar com token inválido:
   - [ ] Remova token do localStorage
   - [ ] Tente atualizar página
   - [ ] Deve redirecionar para login

### Hash Bcrypt

Verificar no banco com Prisma Studio:
- [ ] Campo `senha` em User não é texto plano
- [ ] Começa com `$2a$` ou `$2b$` (bcrypt hash)

---

## 🎨 Verificação de Interface

### Responsividade

1. Redimensione o navegador (F12 → Device Toggle)
2. Verifique em:
   - [ ] Desktop (1920x1080)
   - [ ] Tablet (768x1024)
   - [ ] Mobile (375x667)
3. Verificar:
   - [ ] Sidebar se adapta/desaparece
   - [ ] Tabelas ficam scrolláveis
   - [ ] Botões continuam clicáveis
   - [ ] Texto legível

### Componentes

- [ ] Botões têm feedback visual (hover, ativo)
- [ ] Cards têm sombra
- [ ] Badges mostram status com cores corretas
- [ ] Toast notifications aparecem e somem
- [ ] Loading states funcionam

### Cores

- [ ] Primária (roxo): #7c3aed
- [ ] Sucesso (verde): #22c55e
- [ ] Alerta (vermelho): #ef4444
- [ ] Informação (azul): #3b82f6

---

## 🔄 Verificação de Fluxos

### Cadastro → Aprovação → Login

1. [ ] Registre novo usuário em `/register`
2. [ ] Receba mensagem "Cadastro realizado"
3. [ ] Tente fazer login (deve falhar, status PENDENTE)
4. [ ] Como admin, aprove o usuário
5. [ ] Novo usuário consegue fazer login
6. [ ] Painel de contribuições aparece (12 meses PENDENTE)

### Editar Contribuição

1. Como admin, vá para `/admin/contribuicoes`
2. [ ] Selecione um mês para editar
3. [ ] Mude status para PAGO
4. [ ] Cole data de hoje
5. [ ] Salve
6. [ ] Como member, veja o mês agora 🟢
7. [ ] Contador no topo muda (+1 pago)

---

## 📊 Verificação de Dados

### Endpoints de API

Teste estes endpoints (com token válido):

```bash
# Listar usuários
GET http://localhost:3000/api/users

# Listar por status
GET http://localhost:3000/api/users/status/ATIVO

# Dashboard stats
GET http://localhost:3000/api/users/dashboard/stats

# Contribuições do membro
GET http://localhost:3000/api/contribuicoes/anual/[userId]

# Relatório contribuições
GET http://localhost:3000/api/contribuicoes/dashboard/admin/report

# Perfil autenticado
GET http://localhost:3000/api/auth/profile
```

- [ ] Todos retornam status 200
- [ ] Dados estão estruturados corretamente
- [ ] Sem expor senhas ou dados sensíveis

---

## 🐛 Debugging (Se algo não funciona)

### Backend não inicia

```bash
# Verificar porta em uso
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Limpar database
rm backend/dev.db
npm run prisma:migrate
npm run prisma:seed

# Verificar variáveis
cat backend/.env
```

### Frontend não carrega

```bash
# Verificar porta em uso
lsof -i :5173  # Mac/Linux
netstat -ano | findstr :5173  # Windows

# Limpar cache
rm -rf frontend/node_modules/.vite
npm run dev

# Verificar VITE_API_URL
cat frontend/.env
```

### Login não funciona

- [ ] Credenciais corretas?
- [ ] Backend está rodando?
- [ ] Network tab (F12) mostra 200?
- [ ] Token sendo armazenado?

### Contribuições não aparecem

```bash
# Verificar database
npm run prisma:studio

# Recriar dados
npm run prisma:seed

# Checkar console do browser (F12)
# Procure por erros de API
```

---

## ✅ Checklist Final

- [ ] Backend está rodando na porta 3000
- [ ] Frontend está rodando na porta 5173
- [ ] Login funciona com todas as 3 contas
- [ ] Admin consegue aprovar membros
- [ ] Member consegue ver contribuições
- [ ] Dashboard mostra dados corretos
- [ ] Rate limiting funciona
- [ ] Token JWT está sendo gerado
- [ ] Dados estão siendo salvos no banco
- [ ] Responsividade funciona
- [ ] Sem erros nas consoles

---

## 🎉 Se Tudo Passou!

Parabéns! O sistema está totalmente funcional e pronto para uso.

Próximos passos:
- [ ] Ler documentação completa em README.md
- [ ] Explorar código em backend/src
- [ ] Explorar componentes em frontend/src
- [ ] Adicionar mais features conforme necessário
- [ ] Preparar para deploy

---

**Desenvolvido com ❤️ para a Ordem Franciscana Secular**
