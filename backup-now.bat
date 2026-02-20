@echo off
setlocal

cd /d "%~dp0"

if not exist "scripts\backup\backup.config.json" (
  echo Arquivo scripts\backup\backup.config.json nao encontrado.
  echo Copie scripts\backup\backup.config.example.json para backup.config.json e ajuste os valores.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\backup\New-OFSBackup.ps1"
if errorlevel 1 (
  echo.
  echo Falha ao executar backup.
  pause
  exit /b 1
)

echo.
echo Backup finalizado com sucesso.
pause
