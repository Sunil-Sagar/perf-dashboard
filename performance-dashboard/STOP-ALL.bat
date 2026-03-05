@echo off
echo.
echo ========================================
echo   Stopping Performance Dashboard
echo ========================================
echo.

echo Stopping Backend CMD window...
taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Backend*" >nul 2>&1
if %errorlevel%==0 (echo Backend window closed) else (echo No backend window found)

echo.
echo Stopping Frontend CMD window...
taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Frontend*" >nul 2>&1
if %errorlevel%==0 (echo Frontend window closed) else (echo No frontend window found)

echo.
echo Stopping Electron CMD window...
taskkill /F /FI "WINDOWTITLE eq Performance Dashboard - Electron*" >nul 2>&1
if %errorlevel%==0 (echo Electron window closed) else (echo No Electron window found)

echo.
echo Stopping Python processes (Flask backend)...
taskkill /F /IM python.exe >nul 2>&1
if %errorlevel%==0 (echo Backend process stopped) else (echo No backend process found)

echo.
echo Stopping Node.js processes (React frontend)...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (echo Frontend process stopped) else (echo No frontend process found)

echo.
echo Stopping Electron app...
taskkill /F /IM electron.exe >nul 2>&1
if %errorlevel%==0 (echo Electron app stopped) else (echo No Electron app found)

echo.
echo ========================================
echo   All processes stopped!
echo ========================================
echo.
echo You can now run start-all.bat again
echo.
pause
