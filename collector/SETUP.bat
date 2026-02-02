@echo off
title PC Monitor Pro - Cloud Setup
color 0A

echo.
echo  ==============================================================
echo.
echo         PC MONITOR PRO - CLOUD COLLECTOR SETUP
echo.
echo     Gui du lieu len cloud de giam sat tu bat ky dau!
echo.
echo  ==============================================================
echo.

cd /d "%~dp0"

:: Check Python
echo  [1/3] Kiem tra Python...
where python >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [LOI] Python chua duoc cai dat!
    echo  Vui long cai Python tu: https://www.python.org/downloads/
    echo  Nho tick "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
echo  [OK] Python da cai dat
echo.

:: Install psutil
echo  [2/3] Cai dat thu vien...
python -m pip install psutil --quiet --disable-pip-version-check
echo  [OK] Thu vien da cai dat
echo.

:: Check config
echo  [3/3] Kiem tra cau hinh Supabase...
if exist "config.json" (
    echo  [OK] File config.json da ton tai
) else (
    echo  [CANH BAO] Chua co file config.json!
    echo.
    echo  Vui long tao file config.json voi noi dung:
    echo  {
    echo      "SUPABASE_URL": "https://xxxxx.supabase.co",
    echo      "SUPABASE_KEY": "your-anon-key"
    echo  }
    echo.
)

echo.
echo  ==============================================================
echo                        SETUP HOAN TAT!
echo  ==============================================================
echo.
echo  HUONG DAN SU DUNG:
echo.
echo  1. Tao tai khoan Supabase (mien phi):
echo     https://supabase.com
echo.
echo  2. Tao project moi trong Supabase
echo.
echo  3. Vao SQL Editor, chay file: docs/supabase_schema.sql
echo.
echo  4. Lay thong tin tu Settings ^> API:
echo     - Project URL
echo     - anon public key
echo.
echo  5. Sua file config.json voi thong tin tren
echo.
echo  6. Chay START_COLLECTOR.bat de bat dau thu thap du lieu
echo.
echo  ==============================================================
echo.
pause
