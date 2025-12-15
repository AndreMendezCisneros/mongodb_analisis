@echo off
REM Script para iniciar el servicio Python de análisis SATE-SR (Windows)

echo 🐍 Iniciando servicio Python de análisis SATE-SR...

REM Verificar si Python está instalado (intentar py primero, luego python)
py --version >nul 2>&1
if errorlevel 1 (
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python no está instalado. Por favor, instálalo primero.
        exit /b 1
    )
    set PYTHON_CMD=python
    set PIP_CMD=pip
) else (
    set PYTHON_CMD=py
    set PIP_CMD=py -m pip
)

REM Verificar si las dependencias están instaladas
%PYTHON_CMD% -c "import flask, pymongo" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Las dependencias no están instaladas.
    echo 📦 Instalando dependencias...
    %PIP_CMD% install -r requirements_minimal.txt
)

REM Cargar variables de entorno si existe .env
if exist "..\..\.env" (
    for /f "tokens=1,* delims==" %%a in ('type "..\..\.env" ^| findstr /v "^#"') do set "%%a=%%b"
)

REM Iniciar el servicio
echo 🚀 Iniciando servicio en http://localhost:5000
%PYTHON_CMD% app.py

