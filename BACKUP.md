# 💾 Rotina de Backup e Restauração (Windows)

Este projeto inclui scripts para executar backup local no seu computador, mantendo o sistema em produção na web.

## O que é salvo

- Banco PostgreSQL (`pg_dump` em formato custom)
- Arquivos de ambiente configurados em `includeEnvFiles` (por padrão: `backend/.env` e `frontend/.env`)
- Pastas opcionais configuradas em `includePaths`

## Pré-requisitos

- Windows com PowerShell 5.1+
- `pg_dump` e `pg_restore` instalados (PostgreSQL Client Tools)
- Acesso de rede ao banco em produção

## 1) Configurar uma vez

1. Copie o arquivo de exemplo:
   - `scripts/backup/backup.config.example.json` → `scripts/backup/backup.config.json`
2. Ajuste os campos:
   - `backupRoot`: pasta local onde os backups ficarão (ex.: `C:\\OFS\\backups`)
   - `databaseUrl`: opcional. Se vazio, o script tenta ler `DATABASE_URL` de `backend/.env`
   - `pgDumpPath` e `pgRestorePath`: opcionais. Preencha apenas se os comandos não estiverem no `PATH`
   - `retentionDays`: dias para manter backups antigos
   - `includePaths`: caminhos extras do projeto para backup (ex.: `backend/uploads`)

## 2) Executar backup manual

No PowerShell, na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\New-OFSBackup.ps1
```

Com config custom:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\New-OFSBackup.ps1 -ConfigPath .\scripts\backup\backup.config.json
```

Saída: um arquivo `ofs-backup-AAAAMMDD-HHMMSS.zip` em `backupRoot`.

## Execução simplificada (recomendado)

### Opção A: clique duplo (Windows)

- `backup-now.bat`: executa backup imediato
- `backup-schedule.bat`: cria tarefa diária às 02:00
- `backup-restore.bat`: solicita o `.zip` e executa restauração

### Opção B: comando único

Na raiz do projeto:

```powershell
npm run backup
```

Para agendar:

```powershell
npm run backup:schedule
```

Para verificar saúde do backup (gera log e retorna erro em falha):

```powershell
npm run backup:check
```

Log de monitoramento: `C:\OFS\backups\backup-health.log`

## 3) Agendar backup diário no Windows

No PowerShell (executar como Administrador):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Register-OFSBackupTask.ps1 -Time 10:00
```

Isso cria a tarefa `OFS-Daily-Backup` para rodar todo dia às 10:00.

## 4) Restaurar banco

### Restaurar somente banco

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Restore-OFSBackup.ps1 -BackupFile "C:\\OFS\\backups\\ofs-backup-20260220-020000.zip"
```

### Restaurar também arquivos extras (`includePaths`)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Restore-OFSBackup.ps1 -BackupFile "C:\\OFS\\backups\\ofs-backup-20260220-020000.zip" -RestoreFiles
```

### Restaurar também `.env`

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup\Restore-OFSBackup.ps1 -BackupFile "C:\\OFS\\backups\\ofs-backup-20260220-020000.zip" -RestoreEnvFiles
```

## Frequência recomendada

- Diário: backup automático às 10:00
- Semanal: testar restauração em ambiente de homologação
- Mensal: validar integridade (subida da aplicação + login + consulta principal)
- Checklist mensal: [BACKUP_CHECKLIST.md](BACKUP_CHECKLIST.md)

## Boas práticas

- Mantenha pelo menos 1 cópia externa (HD externo ou nuvem)
- Não compartilhe arquivos `.zip` sem criptografia
- Teste restore regularmente (backup sem restore testado não é backup confiável)

## Solução de problemas

- `pg_dump não encontrado`: instale PostgreSQL Client Tools ou configure `pgDumpPath`
- `pg_restore não encontrado`: configure `pgRestorePath`
- Erro de conexão no banco: valide firewall/IP liberado, SSL e `DATABASE_URL`
