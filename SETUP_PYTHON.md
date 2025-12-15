# 🐍 Configuración del Servicio Python para Análisis SATE-SR

Esta guía te ayudará a configurar y usar el microservicio Python para el análisis SATE-SR.

## 📋 Requisitos Previos

- **Python 3.8+** instalado
- **pip** (gestor de paquetes de Python)
- **Node.js** (ya instalado para el resto del proyecto)

**Nota para Windows:** Si usas `py` en lugar de `python`, los scripts ya están configurados para detectarlo automáticamente.

## 🚀 Instalación Rápida

### Paso 1: Instalar Dependencias Python

**⚠️ IMPORTANTE EN WINDOWS:** Si tienes problemas con `scikit-learn` (requiere Visual C++), usa la versión mínima:

```bash
# Opción 1: Versión mínima (recomendada para Windows sin Visual C++)
npm run python:install:minimal

# Opción 2: Versión completa (requiere Visual C++ Build Tools)
npm run python:install

# Opción 3: Versión optimizada para Windows (intenta usar wheels precompilados)
npm run python:install:windows

# Opción 4: Manualmente (versión mínima)
cd server/python_analysis
py -m pip install -r requirements_minimal.txt
```

**Nota:** La versión mínima ahora incluye `pysentimiento` para análisis de sentimientos preciso (igual que en Colab). Si no puedes instalar `pysentimiento`, el código usará análisis manual basado en palabras clave, pero será menos preciso.

**⚠️ IMPORTANTE:** Para obtener los mismos resultados que en Colab, necesitas instalar `pysentimiento`:
```bash
npm run python:install:pysentimiento
```

### Paso 2: Verificar Instalación

```bash
# Verificar dependencias básicas (siempre debería funcionar)
npm run python:check

# Verificar todas las dependencias (incluyendo scikit-learn y numpy)
npm run python:check:full
```

Deberías ver: `✅ Dependencias básicas instaladas` (o `✅ Todas las dependencias están instaladas` si instalaste la versión completa)

## ▶️ Ejecución

### Opción 1: Ejecutar Todo Junto (Recomendado)

```bash
npm run dev:all-with-python
```

Esto iniciará:
- ✅ Servidor Node.js (puerto 3001)
- ✅ Servicio Python (puerto 5000) 
- ✅ Frontend React (puerto 8080)

### Opción 2: Ejecutar por Separado

**Terminal 1 - Servicio Python:**
```bash
# Windows (usa py o python según tu instalación)
cd server/python_analysis
start.bat

# O manualmente con py (Windows)
cd server/python_analysis
py app.py

# Linux/Mac
cd server/python_analysis
chmod +x start.sh
./start.sh

# O manualmente
cd server/python_analysis
python3 app.py
```

**Terminal 2 - Servidor Node.js:**
```bash
npm run dev:server
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env` (en la raíz del proyecto):

```env
# Servicio Python
PYTHON_SERVICE_URL=http://localhost:5000
USE_PYTHON_ANALYSIS=true  # Cambiar a false para usar JavaScript
PYTHON_SERVICE_PORT=5000
```

### Comportamiento del Sistema

El sistema funciona de la siguiente manera:

1. **Por defecto**, intenta usar el servicio Python
2. Si el servicio Python **no está disponible**, automáticamente usa JavaScript (fallback)
3. Puedes **forzar JavaScript** configurando `USE_PYTHON_ANALYSIS=false`

## 🔍 Verificación

### Verificar que el Servicio Python Está Corriendo

Abre en tu navegador: `http://localhost:5000/health`

Deberías ver:
```json
{
  "status": "ok",
  "service": "python-analysis"
}
```

### Probar el Análisis

1. Conecta a MongoDB desde la aplicación
2. Ve a la sección **Analytics**
3. Haz clic en **"Ejecutar Análisis"**
4. El sistema usará Python automáticamente si está disponible

## 🐛 Solución de Problemas

### Error: "No se puede conectar al servicio Python"

**Causas posibles:**
1. El servicio Python no está corriendo
2. El puerto 5000 está ocupado
3. La URL del servicio es incorrecta

**Soluciones:**
1. Verifica que el servicio esté corriendo: `npm run dev:python`
2. Cambia el puerto en `.env`: `PYTHON_SERVICE_PORT=5001`
3. Actualiza la URL: `PYTHON_SERVICE_URL=http://localhost:5001`
4. O deshabilita Python: `USE_PYTHON_ANALYSIS=false`

### Error: "ModuleNotFoundError: No module named 'flask'"

**Solución:**
```bash
# Versión mínima (recomendada si tienes problemas)
npm run python:install:minimal

# O manualmente
cd server/python_analysis
py -m pip install -r requirements_minimal.txt
```

### Error: "Microsoft Visual C++ 14.0 or greater is required" (Windows)

Este error ocurre al instalar `scikit-learn` o `numpy` porque requieren compilación.

**Soluciones:**

**Opción 1: Usar versión mínima (RECOMENDADO - No requiere compilación)**
```bash
npm run python:install:minimal
```
El código funcionará perfectamente sin `scikit-learn` ni `numpy`, usando implementaciones manuales.

**Opción 2: Instalar Visual C++ Build Tools**
1. Descarga desde: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Instala "C++ build tools"
3. Reinicia tu terminal
4. Ejecuta: `npm run python:install`

**Opción 3: Usar versión optimizada para Windows**
```bash
npm run python:install:windows
```
Intenta usar versiones más recientes con wheels precompilados.

### Error: "no se encontró Python" o "python no se reconoce"

**Causa:** El comando `python` no está disponible, pero `py` sí.

**Solución:** Los scripts ya están configurados para usar `py` automáticamente. Si aún tienes problemas:

1. Verifica que Python esté instalado:
```bash
py --version
```

2. Si `py` funciona pero los scripts no, puedes ejecutar manualmente:
```bash
cd server/python_analysis
py app.py
```

3. O modifica temporalmente el script en `package.json` para usar `py` explícitamente.

### El análisis sigue usando JavaScript

**Verifica:**
1. Que el servicio Python esté corriendo (`http://localhost:5000/health`)
2. Que `USE_PYTHON_ANALYSIS=true` en `.env`
3. Revisa los logs del servidor Node.js para ver qué está pasando

## 📊 Ventajas de Usar Python

- ✅ **Mejor rendimiento** en cálculos numéricos
- ✅ **Librerías avanzadas**: scikit-learn, pandas, numpy
- ✅ **Más fácil** agregar modelos de ML avanzados
- ✅ **Comunidad científica** más grande

## 🔄 Migración desde JavaScript

Si ya estabas usando JavaScript y quieres migrar a Python:

1. Instala las dependencias Python (ver arriba)
2. Inicia el servicio Python
3. El sistema automáticamente usará Python si está disponible
4. No necesitas cambiar nada en el frontend

## 📝 Notas Adicionales

- El servicio Python se conecta directamente a MongoDB usando las mismas credenciales
- Los resultados son **idénticos** entre Python y JavaScript
- Puedes cambiar entre ambos en cualquier momento sin afectar el frontend
- El sistema siempre tiene un fallback a JavaScript si Python falla
- En Windows, si usas `py` en lugar de `python`, los scripts lo detectan automáticamente

---

**¿Necesitas ayuda?** Revisa los logs del servicio Python para más detalles sobre errores específicos.
