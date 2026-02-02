@echo off
title PC Monitor Pro - Install Auto Start
color 0A

echo.
echo  ==============================================================
echo         CAI DAT TU DONG CHAY KHI KHOI DONG WINDOWS
echo  ==============================================================
echo.

cd /d "%~dp0"

echo  Chon phuong thuc:
echo.
echo  [1] Task Scheduler (chuyen nghiep, chay ngam hoan toan)
echo  [2] Windows Startup (don gian, co the hien CMD nhanh)
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

:: Tao XML cho Task Scheduler
set "TASK_XML=%TEMP%\pc_monitor_task.xml"
set "COLLECTOR_PATH=%~dp0cloud_collector.py"

echo ^<?xml version="1.0" encoding="UTF-16"?^> > "%TASK_XML%"
echo ^<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^> >> "%TASK_XML%"
echo   ^<RegistrationInfo^> >> "%TASK_XML%"
echo     ^<Description^>PC Monitor Pro Cloud Collector^</Description^> >> "%TASK_XML%"
echo   ^</RegistrationInfo^> >> "%TASK_XML%"
echo   ^<Triggers^> >> "%TASK_XML%"
echo     ^<LogonTrigger^> >> "%TASK_XML%"
echo       ^<Enabled^>true^</Enabled^> >> "%TASK_XML%"
echo     ^</LogonTrigger^> >> "%TASK_XML%"
echo   ^</Triggers^> >> "%TASK_XML%"
echo   ^<Principals^> >> "%TASK_XML%"
echo     ^<Principal id="Author"^> >> "%TASK_XML%"
echo       ^<LogonType^>InteractiveToken^</LogonType^> >> "%TASK_XML%"
echo       ^<RunLevel^>LeastPrivilege^</RunLevel^> >> "%TASK_XML%"
echo     ^</Principal^> >> "%TASK_XML%"
echo   ^</Principals^> >> "%TASK_XML%"
echo   ^<Settings^> >> "%TASK_XML%"
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^> >> "%TASK_XML%"
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^> >> "%TASK_XML%"
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^> >> "%TASK_XML%"
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^> >> "%TASK_XML%"
echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^> >> "%TASK_XML%"
echo     ^<RunOnlyIfNetworkAvailable^>false^</RunOnlyIfNetworkAvailable^> >> "%TASK_XML%"
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^> >> "%TASK_XML%"
echo     ^<Enabled^>true^</Enabled^> >> "%TASK_XML%"
echo     ^<Hidden^>true^</Hidden^> >> "%TASK_XML%"
echo     ^<ExecutionTimeLimit^>PT0S^</ExecutionTimeLimit^> >> "%TASK_XML%"
echo     ^<Priority^>7^</Priority^> >> "%TASK_XML%"
echo     ^<RestartOnFailure^> >> "%TASK_XML%"
echo       ^<Interval^>PT1M^</Interval^> >> "%TASK_XML%"
echo       ^<Count^>3^</Count^> >> "%TASK_XML%"
echo     ^</RestartOnFailure^> >> "%TASK_XML%"
echo   ^</Settings^> >> "%TASK_XML%"
echo   ^<Actions Context="Author"^> >> "%TASK_XML%"
echo     ^<Exec^> >> "%TASK_XML%"
echo       ^<Command^>pythonw.exe^</Command^> >> "%TASK_XML%"
echo       ^<Arguments^>"%COLLECTOR_PATH%"^</Arguments^> >> "%TASK_XML%"
echo       ^<WorkingDirectory^>%~dp0^</WorkingDirectory^> >> "%TASK_XML%"
echo     ^</Exec^> >> "%TASK_XML%"
echo   ^</Actions^> >> "%TASK_XML%"
echo ^</Task^> >> "%TASK_XML%"

:: Import task
schtasks /create /tn "PC Monitor Pro Collector" /xml "%TASK_XML%" /f >nul 2>&1

if %errorLevel% equ 0 (
    echo  [OK] Da cai Task Scheduler thanh cong!
    echo.
    echo  - Task se chay khi ban dang nhap Windows
    echo  - Chay hoan toan an, khong hien CMD
    echo  - De quan ly: Mo Task Scheduler, tim "PC Monitor Pro Collector"
) else (
    echo  [LOI] Khong the tao task. Thu chay voi quyen Admin.
)

del "%TASK_XML%" >nul 2>&1
goto end

:startup_folder
echo.
echo  Dang them vao Startup folder...
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_PATH=%STARTUP%\PC_Monitor_Pro.vbs"

:: Tao file VBS trong Startup
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_PATH%"
echo WshShell.Run "pythonw ""%~dp0cloud_collector.py""", 0, False >> "%VBS_PATH%"

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
schtasks /delete /tn "PC Monitor Pro Collector" /f >nul 2>&1
echo  [OK] Da xoa khoi Task Scheduler

:: Xoa Startup folder
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
del "%STARTUP%\PC_Monitor_Pro.vbs" >nul 2>&1
echo  [OK] Da xoa khoi Startup folder

echo.
echo  Hoan tat go cai dat!
goto end

:end
echo.
echo  Nhan phim bat ky de thoat...
pause >nul
