@echo off
setlocal

cd /d "%~dp0"

if not exist "scripts\backup\backup.config.json" (
  echo Arquivo scripts\backup\backup.config.json nao encontrado.
  echo Copie scripts\backup\backup.config.example.json para backup.config.json e ajuste os valores.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\backup\Register-OFSBackupTask.ps1" -Time 10:00
if errorlevel 1 (
  echo.
  echo Falha ao registrar tarefa agendada.
  pause
  exit /b 1
)

echo.
echo Tarefa agendada criada com sucesso.
pause
