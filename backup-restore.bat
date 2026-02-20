@echo off
setlocal

cd /d "%~dp0"

if not exist "scripts\backup\backup.config.json" (
  echo Arquivo scripts\backup\backup.config.json nao encontrado.
  echo Copie scripts\backup\backup.config.example.json para backup.config.json e ajuste os valores.
  pause
  exit /b 1
)

set /p BACKUP_FILE=Informe o caminho completo do arquivo .zip de backup: 
if "%BACKUP_FILE%"=="" (
  echo Caminho de backup nao informado.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\backup\Restore-OFSBackup.ps1" -BackupFile "%BACKUP_FILE%"
if errorlevel 1 (
  echo.
  echo Falha ao restaurar backup.
  pause
  exit /b 1
)

echo.
echo Restauracao finalizada com sucesso.
pause
