@echo off
title PC Monitor Pro - Cloud Collector
color 0B

echo.
echo  Dang khoi dong Cloud Collector...
echo.

cd /d "%~dp0"

:: Check config
if not exist "config.json" (
    echo  [LOI] Chua co file config.json!
    echo  Vui long chay SETUP.bat truoc.
    pause
    exit /b 1
)

:: Start collector
python cloud_collector.py

pause
