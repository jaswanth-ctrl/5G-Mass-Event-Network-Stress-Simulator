@echo off
title 5G Mass Event Network Simulator
echo.
echo  ============================================
echo   5G MASS EVENT NETWORK STRESS SIMULATOR
echo  ============================================
echo.
echo  Starting Backend...
cd /d "%~dp0backend"
start "5G-Backend" cmd /k "node index.js"

echo  Starting Frontend...
cd /d "%~dp0frontend"
start "5G-Frontend" cmd /k "npm run dev"

echo.
echo  ============================================
echo  Both servers are starting!
echo.
echo  Open this in your browser:
echo  http://localhost:5173
echo  ============================================
echo.
timeout /t 5 >nul
start http://localhost:5173
