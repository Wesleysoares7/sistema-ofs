#!/bin/bash

# 🕊️ OFS - Sistema de Gerenciamento
# Script de inicialização rápida

echo "==============================================="
echo "🕊️ OFS - Ordem Franciscana Secular"
echo "Sistema de Gerenciamento de Membros"
echo "==============================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "📥 Baixe em: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"
echo ""

# Backend
echo "==============================================="
echo "🔧 Instalando Backend..."
echo "==============================================="
cd backend
npm install

echo ""
echo "📚 Configurando Banco de Dados..."
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

echo ""
echo "✅ Backend pronto!"
echo "   URL: http://localhost:3000"
echo "   Health: http://localhost:3000/health"
echo ""
echo "Para iniciar o backend, execute:"
echo "  cd backend && npm run dev"
echo ""

# Frontend
echo "==============================================="
echo "⚛️  Instalando Frontend..."
echo "==============================================="
cd ../frontend
npm install

echo ""
echo "✅ Frontend pronto!"
echo "   URL: http://localhost:5173"
echo ""
echo "Para iniciar o frontend, execute:"
echo "  cd frontend && npm run dev"
echo ""

# Resumo
echo "==============================================="
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo "==============================================="
echo ""
echo "🚀 Próximos passos:"
echo ""
echo "1. Abra dois terminais:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   ► cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   ► cd frontend && npm run dev"
echo ""
echo "2. Acesse a aplicação:"
echo "   🌐 http://localhost:5173"
echo ""
echo "3. Credenciais de teste:"
echo "   👤 ADMIN: admin@ofs.com / Admin@123456"
echo "   👤 MEMBER (Ativo): maria@ofs.com / AtivaMembro@123"
echo "   👤 MEMBER (Pendente): jose@ofs.com / Membro@123456"
echo ""
echo "📖 Documentação:"
echo "   Veja README.md e DEVELOPMENT.md"
echo ""
echo "==============================================="
