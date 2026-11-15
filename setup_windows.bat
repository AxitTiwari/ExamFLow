@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo ExamFlow - first-time setup
echo ==============================================
if not exist "backend\.env" (
  copy "backend\.env.example" "backend\.env" >nul
  echo Created backend\.env. Edit it and enter your MySQL password.
)
echo.
echo Installing backend packages...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 goto failed
echo.
echo Installing frontend packages...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 goto failed
echo.
echo Setup complete. Make sure backend\.env has your MySQL password
echo and import the SQL files in MySQL Workbench in the numbered order.
pause
exit /b 0
:failed
echo.
echo Setup failed. Check the error above and your internet connection.
pause
exit /b 1
