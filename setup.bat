@echo off
REM 🕊️ OFS - Sistema de Gerenciamento
REM Script de inicialização rápida (Windows)

echo ===============================================
echo 🕊️  OFS - Ordem Franciscana Secular
echo Sistema de Gerenciamento de Membros
echo ===============================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    echo 📥 Baixe em: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detectado
echo.

REM Backend
cls
echo ===============================================
echo 🔧 Instalando Backend...
echo ===============================================
cd backend
call npm install

echo.
echo 📚 Configurando Banco de Dados...
call npm run prisma:generate
call npm run prisma:migrate
call npm run prisma:seed

echo.
echo ✅ Backend pronto!
echo    URL: http://localhost:3000
echo    Health: http://localhost:3000/health
echo.
echo Para iniciar o backend, execute:
echo   cd backend ^&^& npm run dev
echo.

REM Frontend
cls
echo ===============================================
echo ⚛️  Instalando Frontend...
echo ===============================================
cd ..\frontend
call npm install

echo.
echo ✅ Frontend pronto!
echo    URL: http://localhost:5173
echo.
echo Para iniciar o frontend, execute:
echo   cd frontend ^&^& npm run dev
echo.

REM Resumo
cls
echo ===============================================
echo ✅ INSTALAÇÃO CONCLUÍDA!
echo ===============================================
echo.
echo 🚀 Próximos passos:
echo.
echo 1. Abra dois terminais (PowerShell ou CMD):
echo.
echo    Terminal 1 (Backend):
echo    ^► cd backend ^&^& npm run dev
echo.
echo    Terminal 2 (Frontend):
echo    ^► cd frontend ^&^& npm run dev
echo.
echo 2. Acesse a aplicação:
echo    🌐 http://localhost:5173
echo.
echo 3. Credenciais de teste:
echo    👤 ADMIN: admin@ofs.com / Admin@123456
echo    👤 MEMBER (Ativo): maria@ofs.com / AtivaMembro@123
echo    👤 MEMBER (Pendente): jose@ofs.com / Membro@123456
echo.
echo 📖 Documentação:
echo    Veja README.md e DEVELOPMENT.md
echo.
echo ===============================================
pause
