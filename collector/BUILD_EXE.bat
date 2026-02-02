@echo off
title Build PCMonitor.exe
color 0E

echo.
echo  ==================================================
echo         BUILD PCMONITOR.EXE TU CLOUD_COLLECTOR.PY
echo  ==================================================
echo.
echo  LUU Y: De ho tro Windows 7 32-bit, ban can:
echo  - Cai Python 3.8.x (phien ban cuoi ho tro Win7)
echo  - Chay tren may Windows 7 32-bit de build
echo.

cd /d "%~dp0"

:: Check Python
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo  [LOI] Python chua cai dat!
    pause
    exit /b 1
)

:: Show Python version
echo  [INFO] Python version:
python --version
echo.

:: Install PyInstaller
echo  [1/3] Cai dat PyInstaller...
python -m pip install pyinstaller --quiet --disable-pip-version-check

:: Build exe
echo  [2/3] Dang build PCMonitor.exe (doi 1-2 phut)...
python -m PyInstaller --onefile --noconsole --name PCMonitor cloud_collector.py

:: Copy to portable folder
echo  [3/3] Copy file...
if exist "dist\PCMonitor.exe" (
    copy "dist\PCMonitor.exe" "..\portable\" /Y >nul
    echo.
    echo  ==========================================
    echo  [OK] BUILD THANH CONG!
    echo  ==========================================
    echo.
    echo  File exe tai: portable\PCMonitor.exe
    echo.
    echo  LUU Y VE TUONG THICH:
    echo  - Build tren Win10/11 64-bit: Chi chay tren Win10/11 64-bit
    echo  - Build tren Win7 32-bit: Chay duoc tren Win7+ 32-bit va 64-bit
    echo.
) else (
    echo  [LOI] Build that bai!
)

:: Cleanup
rmdir /s /q build >nul 2>&1
rmdir /s /q dist >nul 2>&1
del PCMonitor.spec >nul 2>&1

pause
