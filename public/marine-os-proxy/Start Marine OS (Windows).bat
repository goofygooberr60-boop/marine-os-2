@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org , install it, then run this again.
  pause
  exit /b
)
if not exist node_modules (
  echo Installing for the first time, this can take a minute...
  call npm install
)
start "" cmd /c "timeout /t 4 >nul & start http://localhost:8080"
call npm start
pause
