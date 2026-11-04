@echo off
chcp 65001 >nul
title ContábilDAS - Automação de Guias DAS via SERPRO
echo ============================================================================
echo   INICIANDO SISTEMA WEB DE AUTOMAÇÃO CONTÁBIL (EMISSÃO DE DAS VIA SERPRO)
echo ============================================================================
echo.
echo [1/2] Iniciando Servidor Back-end (Node.js + Express + Prisma SQLite) na porta 3001...
start "ContabilDAS - Backend (Porta 3001)" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Interface Web Front-end (React + Vite) na porta 5173...
start "ContabilDAS - Frontend (Porta 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Sistema iniciado! Acesse no navegador: http://localhost:5173
pause

