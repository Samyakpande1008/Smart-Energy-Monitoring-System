@echo off
title Smart Energy Guardian - Master Launcher
echo ========================================================
echo  SMART ENERGY GUARDIAN - Launching All Services
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Starting Python ML Microservice on port 8000...
start "SEG - Python ML Service (Port 8000)" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir ml-service"

timeout /t 3 /nobreak >nul

echo [2/4] Starting Node.js Backend API on port 5000...
start "SEG - Backend API (Port 5000)" cmd /k "node backend/src/server.js"

timeout /t 3 /nobreak >nul

echo [3/4] Starting IoT Hardware Simulator...
start "SEG - IoT Hardware Simulator" cmd /k "node simulator/simulator.js"

timeout /t 2 /nobreak >nul

echo [4/4] Starting Frontend Dashboard on port 4173...
start "SEG - Frontend UI (Port 4173)" cmd /k "npm run dev"

echo.
echo ========================================================
echo  All services started successfully!
echo  Open your browser at: http://localhost:4173
echo  Demo login: demo@smartenergy.local / demo1234
echo ========================================================
pause

