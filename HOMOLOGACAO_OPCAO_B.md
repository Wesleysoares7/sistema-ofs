# Homologacao - Opcao B (Cadastro Pendente com Fraternidade)

Data: 2026-06-27
Escopo: validar o fluxo de pre-cadastro publico com status PENDENTE, triagem pelo ADMIN_LOCAL e transferencia de membro entre fraternidades exclusiva do ADMIN_REGIONAL.

## 1) Preparacao

1. Garantir que exista ao menos uma fraternidade ATIVA cadastrada.
2. Garantir existencia de usuarios de teste:
- ADMIN_REGIONAL
- ADMIN_LOCAL (com fraternidade vinculada)
- IRMAO_MEMBRO ativo
3. Limpar cache/localStorage do navegador antes de cada perfil.

## 2) Matriz de testes por perfil

### Perfil: Publico (nao autenticado)

Caso B1 - Carregar formulario de pre-cadastro
1. Acessar /register.
2. Confirmar exibicao do campo Fraternidade de interesse.
3. Confirmar opcoes no select no formato Nome - Cidade (Distrito).
Resultado esperado:
- O select e carregado com fraternidades ativas.
- O campo Fraternidade de interesse e obrigatorio.
Evidencia:
- Screenshot do formulario com o select aberto.

Caso B2 - Bloquear registro sem fraternidade
1. Preencher formulario valido.
2. Nao selecionar fraternidade.
3. Enviar cadastro.
Resultado esperado:
- Cadastro nao e enviado.
- Interface exibe mensagem de erro solicitando selecao da fraternidade.
Evidencia:
- Screenshot da mensagem de validacao.

Caso B3 - Registrar selecionando fraternidade
1. Preencher formulario valido.
2. Selecionar uma fraternidade no campo.
3. Enviar cadastro.
Resultado esperado:
- Cadastro criado com status PENDENTE.
- Registro salva fraternidadeId informado.
Evidencia:
- Registro no banco/API com status PENDENTE e fraternidadeId preenchido.

### Perfil: ADMIN_LOCAL

Caso L1 - Visualizar area Cadastros Pendentes
1. Login como ADMIN_LOCAL.
2. Ir para tela de membros.
3. Confirmar existencia da secao Cadastros Pendentes.
Resultado esperado:
- Lista mostra somente usuarios PENDENTE da fraternidade do ADMIN_LOCAL.
- Exibe fraternidade solicitada em cada card.
Evidencia:
- Screenshot da secao.

Caso L2 - Aprovacao de pendente da propria fraternidade
1. Na secao Cadastros Pendentes, escolher usuario da propria fraternidade.
2. Clicar em Aprovar.
Resultado esperado:
- Aprovacao realizada com sucesso para pendente da propria fraternidade.
Evidencia:
- Screenshot com status atualizado.

Caso L3 - Nao visualizar pendentes de outras fraternidades
1. Com ADMIN_LOCAL autenticado, validar lista de pendentes exibida.
2. Confirmar que pendentes de outras fraternidades nao aparecem.
Resultado esperado:
- Visibilidade estrita por fraternidade do ADMIN_LOCAL.
Evidencia:
- Screenshot da lista e comparacao com consulta regional.

Caso L4 - Restricao de transferencia para ADMIN_LOCAL
1. Login como ADMIN_LOCAL e abrir Edicao de Membro.
2. Validar campo Fraternidade no modal.
Resultado esperado:
- Campo de fraternidade em modo somente leitura para ADMIN_LOCAL.
- Nao ha opcao de transferencia de membro na interface local.
Evidencia:
- Screenshot do modal com campo de fraternidade bloqueado.

### Perfil: ADMIN_REGIONAL

Caso R1 - Triagem regional e transferencia
1. Login como ADMIN_REGIONAL.
2. Acessar tela de membros.
3. Revisar pendentes, transferir fraternidade de um membro e aprovar quando aplicavel.
Resultado esperado:
- Regional consegue editar fraternidade (transferencia) e aprovar.
- Transferencia e persistida com sucesso.
Evidencia:
- Screenshot antes/depois da fraternidade do membro.

Caso R2 - Endpoint publico de fraternidades
1. Chamar GET /api/fraternidades/public sem token.
Resultado esperado:
- Retorno 200 com lista de fraternidades ativas.
- Campos minimos: id, nomeFraternidade, cidade, distrito, status.
Evidencia:
- Resposta JSON da chamada.

### Perfil: IRMAO_MEMBRO

Caso M1 - Login de pendente
1. Tentar login com conta ainda pendente.
Resultado esperado:
- Acesso negado ate aprovacao (mensagem de conta nao ativa).
Evidencia:
- Mensagem de erro no login.

Caso M2 - Login apos aprovacao
1. Login com conta aprovada.
2. Verificar redirecionamento para area do membro.
Resultado esperado:
- Login permitido.
- Navegacao para /member/profile.
Evidencia:
- Screenshot da tela de membro autenticado.

## 3) Validacao de seguranca (API)

Caso S1 - Registro sem fraternidade por API
1. Enviar POST /api/auth/register sem fraternidadeId.
Resultado esperado:
- HTTP 400 por validacao de campo obrigatorio.

Caso S2 - Admin local tentar transferir membro por API
1. Autenticar como ADMIN_LOCAL.
2. Enviar PUT /api/users/{id} com fraternidadeId de outra fraternidade.
Resultado esperado:
- HTTP 403 com mensagem de que somente administrador regional pode transferir.

Caso S3 - Registro com fraternidade inexistente
1. Enviar POST /api/auth/register com fraternidadeId invalido.
Resultado esperado:
- HTTP 400 com mensagem Fraternidade selecionada nao encontrada.

## 4) Criterios de aceite

1. Todo pre-cadastro entra como PENDENTE.
2. Fraternidade e obrigatoria no pre-cadastro.
3. ADMIN_LOCAL enxerga apenas pendentes da propria fraternidade.
4. Transferencia de membro entre fraternidades ocorre somente por ADMIN_REGIONAL.
5. Nao ha regressao de RBAC legado (ADMIN, MEMBER) nem do escopo multi-tenant.

## 5) Resultado final da homologacao

Preencher ao final da execucao:

- B1: [x] OK  [ ] NOK
- B2: [x] OK  [ ] NOK
- B3: [x] OK  [ ] NOK
- L1: [x] OK  [ ] NOK
- L2: [x] OK  [ ] NOK
- L3: [x] OK  [ ] NOK
- L4: [x] OK  [ ] NOK
- R1: [x] OK  [ ] NOK
- R2: [x] OK  [ ] NOK
- M1: [ ] OK  [ ] NOK
- M2: [ ] OK  [ ] NOK
- S1: [x] OK  [ ] NOK
- S2: [x] OK  [ ] NOK
- S3: [ ] OK  [ ] NOK

Observacoes:

Responsavel:
Data:
