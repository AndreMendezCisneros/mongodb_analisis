#!/bin/bash

# Script para iniciar el servicio Python de análisis SATE-SR

echo "🐍 Iniciando servicio Python de análisis SATE-SR..."

# Detectar comando de Python (py o python3)
if command -v py &> /dev/null; then
    PYTHON_CMD="py"
    PIP_CMD="py -m pip"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo "❌ Python no está instalado. Por favor, instálalo primero."
    exit 1
fi

# Verificar si las dependencias están instaladas
if ! $PYTHON_CMD -c "import flask, pymongo" 2>/dev/null; then
    echo "⚠️  Las dependencias no están instaladas."
    echo "📦 Instalando dependencias..."
    $PIP_CMD install -r requirements_minimal.txt
fi

# Cargar variables de entorno si existe .env
if [ -f "../../.env" ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Iniciar el servicio
echo "🚀 Iniciando servicio en http://localhost:${PYTHON_SERVICE_PORT:-5000}"
$PYTHON_CMD app.py

