@echo off
echo.
echo ========================================
echo   Performance Dashboard - Starting...
echo ========================================
echo.

echo Cleaning up old processes...
echo.

REM Kill Node.js processes (frontend)
taskkill /F /IM node.exe >nul 2>&1
echo Cleared Node.js processes

REM Kill Python Flask processes (backend)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Performance Dashboard - Backend*" >nul 2>&1
echo Cleared Python processes

REM Wait a moment for ports to be released
timeout /t 2 /nobreak >nul

echo Starting Backend (Flask API)...
start "Performance Dashboard - Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python app.py"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend (React UI)...
start "Performance Dashboard - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev:react"

echo Waiting 8 seconds for frontend to initialize...
timeout /t 8 /nobreak >nul

echo Starting Electron Desktop App...
cd /d "%~dp0frontend"
start "Performance Dashboard - Electron" cmd /c "npm run dev:electron"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo   Electron: Opening automatically...
echo ========================================
echo.
echo Press any key to close this window...
echo (The servers will keep running in other windows)
pause >nul
