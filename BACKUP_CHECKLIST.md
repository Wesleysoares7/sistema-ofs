# ✅ Checklist Mensal de Restauração

Use este checklist 1x por mês para validar que o backup realmente pode ser restaurado.

## Antes de iniciar

- [ ] Escolher um backup recente em `backupRoot`
- [ ] Confirmar ambiente de homologação separado da produção
- [ ] Confirmar `pg_restore` disponível no computador
- [ ] Garantir acesso ao banco de homologação

## Etapa 1 — Restaurar banco

- [ ] Executar restauração do banco:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Restore-OFSBackup.ps1 -BackupFile "C:\\OFS\\backups\\ofs-backup-YYYYMMDD-HHMMSS.zip"
```

- [ ] Confirmar no log a mensagem `Banco restaurado com sucesso.`

## Etapa 2 — (Opcional) Restaurar arquivos

- [ ] Se usar arquivos adicionais, executar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Restore-OFSBackup.ps1 -BackupFile "C:\\OFS\\backups\\ofs-backup-YYYYMMDD-HHMMSS.zip" -RestoreFiles
```

- [ ] Se necessário restaurar `.env`, executar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Restore-OFSBackup.ps1 -BackupFile "C:\\OFS\\backups\\ofs-backup-YYYYMMDD-HHMMSS.zip" -RestoreEnvFiles
```

## Etapa 3 — Validação funcional mínima

- [ ] Subir backend e frontend em homologação
- [ ] Validar login ADMIN
- [ ] Validar listagem de membros
- [ ] Validar dashboard de contribuições
- [ ] Validar leitura de avisos/configurações

## Etapa 4 — Registro de auditoria

- [ ] Registrar data/hora do teste
- [ ] Registrar backup usado
- [ ] Registrar duração total do restore (RTO observado)
- [ ] Registrar problemas encontrados e correções
- [ ] Definir responsável e data do próximo teste

## Critérios de sucesso

- [ ] Restore concluído sem erro técnico
- [ ] Aplicação operando em homologação
- [ ] Dados críticos conferidos com sucesso
- [ ] Evidência documentada (print/log/anotação)
