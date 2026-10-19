@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 20.19+ or 22.12+ and run this launcher again.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4173 in your browser after the server is ready.
node serve.mjs
pause
