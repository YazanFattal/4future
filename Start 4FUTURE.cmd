@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 20.19+ or 22.12+ and run this launcher again.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 (
    echo Dependency installation failed. Please check your internet connection.
    pause
    exit /b 1
  )
)
call npm.cmd run dev -- --open
pause
