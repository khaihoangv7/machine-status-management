@echo off
title PC Monitor Pro - Cai dat lich chay 7h30 - 17h00
color 0A

echo.
echo  ==============================================================
echo       CAI DAT TU DONG CHAY TU 7:30 SANG DEN 5:00 CHIEU
echo  ==============================================================
echo.

cd /d "%~dp0"

:: Check PCMonitor.exe exists
if not exist "PCMonitor.exe" (
    echo  [LOI] Khong tim thay PCMonitor.exe!
    pause
    exit /b 1
)

set "EXE_PATH=%~dp0PCMonitor.exe"

echo  Chon thao tac:
echo.
echo  [1] Cai dat lich chay 7:30 - 17:00 (Thu 2 - Thu 6)
echo  [2] Cai dat lich chay 7:30 - 17:00 (Moi ngay)
echo  [3] Xoa lich da cai
echo  [4] Thoat
echo.

set /p choice="  Nhap lua chon (1-4): "

if "%choice%"=="1" goto weekdays
if "%choice%"=="2" goto everyday
if "%choice%"=="3" goto delete
if "%choice%"=="4" goto end

:weekdays
echo.
echo  Dang cai dat (Thu 2 - Thu 6, 7:30 - 17:00)...

:: Xoa task cu neu co
schtasks /delete /tn "PC Monitor Pro" /f >nul 2>&1
schtasks /delete /tn "PC Monitor Pro Stop" /f >nul 2>&1

:: Tao task chay luc 7:30 sang (chi Thu 2 - Thu 6)
schtasks /create /tn "PC Monitor Pro" /tr "\"%EXE_PATH%\"" /sc weekly /d MON,TUE,WED,THU,FRI /st 07:30 /f >nul 2>&1

:: Tao task dung luc 17:00 chieu
schtasks /create /tn "PC Monitor Pro Stop" /tr "taskkill /im PCMonitor.exe /f" /sc weekly /d MON,TUE,WED,THU,FRI /st 17:00 /f >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo  =============================================
    echo  [OK] CAI DAT THANH CONG!
    echo  =============================================
    echo.
    echo  - Bat dau : 7:30 sang (Thu 2 - Thu 6)
    echo  - Ket thuc: 17:00 chieu
    echo  - Chay ngam, khong hien CMD
    echo.
) else (
    echo  [LOI] Khong the cai dat. Thu chay voi quyen Admin.
)
goto end

:everyday
echo.
echo  Dang cai dat (Moi ngay, 7:30 - 17:00)...

:: Xoa task cu neu co
schtasks /delete /tn "PC Monitor Pro" /f >nul 2>&1
schtasks /delete /tn "PC Monitor Pro Stop" /f >nul 2>&1

:: Tao task chay luc 7:30 sang (moi ngay)
schtasks /create /tn "PC Monitor Pro" /tr "\"%EXE_PATH%\"" /sc daily /st 07:30 /f >nul 2>&1

:: Tao task dung luc 17:00 chieu
schtasks /create /tn "PC Monitor Pro Stop" /tr "taskkill /im PCMonitor.exe /f" /sc daily /st 17:00 /f >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo  =============================================
    echo  [OK] CAI DAT THANH CONG!
    echo  =============================================
    echo.
    echo  - Bat dau : 7:30 sang (moi ngay)
    echo  - Ket thuc: 17:00 chieu
    echo  - Chay ngam, khong hien CMD
    echo.
) else (
    echo  [LOI] Khong the cai dat. Thu chay voi quyen Admin.
)
goto end

:delete
echo.
echo  Dang xoa lich...

schtasks /delete /tn "PC Monitor Pro" /f >nul 2>&1
schtasks /delete /tn "PC Monitor Pro Stop" /f >nul 2>&1

echo  [OK] Da xoa lich thanh cong!
goto end

:end
echo.
pause
