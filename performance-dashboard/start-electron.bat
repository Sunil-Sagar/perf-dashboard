@echo off
echo.
echo ========================================
echo   Performance Dashboard - Electron
echo ========================================
echo.
echo Starting Electron Desktop App...
echo (Backend and Frontend will start automatically)
echo.

REM Clean up any existing processes
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

REM Wait a moment for ports to be released
timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
npm run electron

echo.
echo Electron closed. Cleaning up...
echo.

REM Kill any remaining backend/frontend processes
taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Frontend*" >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo All processes stopped.
timeout /t 2 /nobreak >nul
