@echo off
title PC Monitor Pro - Dashboard
color 0E

cd /d "%~dp0"

:: Check Python
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo [LOI] Python chua cai dat!
    pause
    exit /b 1
)

:: Check Flask
python -c "import flask" >nul 2>&1
if %errorLevel% neq 0 (
    echo Dang cai dat Flask...
    pip install flask --quiet
)

:: Start dashboard and open browser
echo.
echo  Dang khoi dong Dashboard...
echo  URL: http://127.0.0.1:5555
echo  Auto-refresh: 5 giay
echo.
echo  Nhan Ctrl+C de dung server
echo.

python app.py
