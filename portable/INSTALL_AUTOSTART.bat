@echo off
title PC Monitor Pro - Install Auto Start
color 0A

echo.
echo  ==============================================================
echo         CAI DAT TU DONG CHAY KHI KHOI DONG WINDOWS
echo  ==============================================================
echo.

cd /d "%~dp0"

:: Check PCMonitor.exe exists
if not exist "PCMonitor.exe" (
    echo  [LOI] Khong tim thay PCMonitor.exe!
    echo  Vui long dam bao file PCMonitor.exe nam cung thu muc.
    pause
    exit /b 1
)

echo  Chon phuong thuc:
echo.
echo  [1] Task Scheduler (chuyen nghiep, chay ngam hoan toan)
echo  [2] Windows Startup (don gian)
echo  [3] Huy cai dat (xoa khoi Startup/Task Scheduler)
echo  [4] Thoat
echo.

set /p choice="  Nhap lua chon (1-4): "

if "%choice%"=="1" goto task_scheduler
if "%choice%"=="2" goto startup_folder
if "%choice%"=="3" goto uninstall
if "%choice%"=="4" goto end

:task_scheduler
echo.
echo  Dang cai dat Task Scheduler...
echo.

set "EXE_PATH=%~dp0PCMonitor.exe"

:: Tao task bang schtasks
schtasks /create /tn "PC Monitor Pro" /tr "\"%EXE_PATH%\"" /sc onlogon /rl limited /f >nul 2>&1

if %errorLevel% equ 0 (
    echo  [OK] Da cai Task Scheduler thanh cong!
    echo.
    echo  - Task se chay khi ban dang nhap Windows
    echo  - Chay hoan toan an, khong hien CMD
    echo  - De quan ly: Mo Task Scheduler, tim "PC Monitor Pro"
) else (
    echo  [LOI] Khong the tao task. Thu chay voi quyen Admin.
)
goto end

:startup_folder
echo.
echo  Dang them vao Startup folder...
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_PATH=%STARTUP%\PCMonitor.vbs"
set "EXE_PATH=%~dp0PCMonitor.exe"

:: Tao file VBS trong Startup
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_PATH%"
echo WshShell.Run """%EXE_PATH%""", 0, False >> "%VBS_PATH%"

if exist "%VBS_PATH%" (
    echo  [OK] Da them vao Windows Startup!
    echo.
    echo  File: %VBS_PATH%
    echo  Collector se tu dong chay khi Windows khoi dong.
) else (
    echo  [LOI] Khong the tao file startup.
)
goto end

:uninstall
echo.
echo  Dang go cai dat...
echo.

:: Xoa Task Scheduler
schtasks /delete /tn "PC Monitor Pro" /f >nul 2>&1
echo  [OK] Da xoa khoi Task Scheduler

:: Xoa Startup folder
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
del "%STARTUP%\PCMonitor.vbs" >nul 2>&1
echo  [OK] Da xoa khoi Startup folder

echo.
echo  Hoan tat go cai dat!
goto end

:end
echo.
echo  ==============================================================
echo.
pause
