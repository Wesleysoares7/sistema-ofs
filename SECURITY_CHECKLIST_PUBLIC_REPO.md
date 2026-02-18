# Checklist de Segurança Antes de Tornar o Repositório Público

Use este checklist na ordem. Tempo médio: 10 a 20 minutos.

## 1) Confirmar que segredos não estão versionados

- Verifique se `.env` está no `.gitignore` (raiz, backend e frontend).
- Mantenha no repositório apenas `.env.example` sem valores reais.
- Nunca suba tokens, senhas, chaves privadas ou URLs de banco com credenciais.

## 2) Rotacionar credenciais que já apareceram em conversa, print ou terminal

Mesmo que não estejam no Git, considere comprometidas:

- `DATABASE_URL` e `DIRECT_URL` (Neon/Postgres)
- `JWT_SECRET`
- tokens de deploy (Railway, Vercel, Sonar)

Após rotacionar, atualize os valores nas plataformas:

- Railway: `Settings > Variables`
- Vercel: `Project Settings > Environment Variables`
- GitHub: `Settings > Secrets and variables > Actions`

## 3) Verificar histórico do Git por vazamentos

No terminal do projeto:

```powershell
git log -p --all -- . | Select-String -Pattern 'npg_|postgresql://|JWT_SECRET=|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY'
```

Se aparecer segredo real, reescreva o histórico antes de abrir o repositório.

## 4) Ativar varredura automática de segredos em PR

- Workflow já incluído em `.github/workflows/ci-sonar.yml` com job `Secret Scan`.
- Regra recomendada: exigir esse status check na branch `master`.

## 5) Ativar proteção da branch master no GitHub

No GitHub:

- `Settings > Branches > Add branch protection rule`
- Branch pattern: `master`
- Marcar:
  - `Require a pull request before merging`
  - `Require approvals` (mínimo 1)
  - `Require status checks to pass before merging`
  - `Require branches to be up to date before merging`
  - `Require conversation resolution before merging`
  - `Do not allow bypassing the above settings` (se disponível)

## 6) Exigir análise SonarCloud no merge

- Configure `SONAR_TOKEN` no GitHub Actions secrets.
- Ajuste `sonar-project.properties` com organização e project key reais.
- No branch protection, selecione os checks de CI/Sonar como obrigatórios.

## 7) Revisão final antes de mudar para público

- Confirme que não há dados reais de membros em seeds, dumps ou arquivos de teste.
- Revise `README` para remover credenciais de exemplo confusas.
- Faça um PR de teste e valide se o merge bloqueia quando checks falham.

## 8) Se encontrar vazamento após publicar

1. Revogue/rotacione a credencial imediatamente.
2. Remova o segredo do código e do histórico.
3. Force push do histórico limpo.
4. Regere tokens em todas as integrações relacionadas.
