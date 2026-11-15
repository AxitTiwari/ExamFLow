@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.env" (
  echo Missing backend\.env. Run setup_windows.bat first, then set your MySQL password.
  pause
  exit /b 1
)
start "ExamFlow Backend" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "ExamFlow Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
timeout /t 3 >nul
start "" "http://localhost:5173"
