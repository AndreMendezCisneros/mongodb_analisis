# DataViz - Sistema de Visualización y Análisis de Datos MongoDB

**DataViz** es una aplicación web completa para visualizar, analizar y gestionar datos almacenados en MongoDB. Incluye un sistema avanzado de análisis predictivo educativo (SATE-SR v2.0) para identificar estudiantes en riesgo académico.

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Guía de Uso](#guía-de-uso)
- [Sistema SATE-SR](#sistema-sate-sr)
- [API Endpoints](#api-endpoints)
- [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Características Principales

### 1. **Dashboard**
- Vista general del sistema
- Estadísticas rápidas
- Acceso rápido a todas las funcionalidades

### 2. **Analytics - SATE-SR v2.0**
Sistema de Alerta Temprana Educativa San Ramón que incluye:
- **Análisis Predictivo**: Predicción de rendimiento académico para el Bimestre 4
- **Métricas de Validación**: Precisión, Recall, F1-Score, AUC-ROC
- **Matriz de Confusión Visual**: Gráfico interactivo de predicciones vs realidad
- **Curva ROC**: Evaluación del poder de discriminación del modelo
- **Factores de Riesgo**: Análisis de asistencia, incidencias, sentimiento y situación familiar
- **Tabla de Resultados**: Vista detallada por estudiante con filtros

### 3. **Datos**
- Explorador de colecciones MongoDB
- Visualización tabular de documentos
- Paginación y búsqueda
- Formato automático de valores

### 4. **Colecciones**
- Listado de todas las colecciones disponibles
- Búsqueda y filtrado
- Información de cada colección

### 5. **Gráficos**
- **Generación Automática Inteligente**: El sistema analiza automáticamente los datos y sugiere gráficos intuitivos
- **Tipos de Gráficos Soportados**:
  - Barras (Bar)
  - Columnas (Column)
  - Barras Agrupadas (Grouped Bar)
  - Columnas Agrupadas (Grouped Column)
  - Líneas (Line)
  - Áreas (Area)
  - Áreas Apiladas (Stacked Area)
  - Circular/Pastel (Pie)
  - Radar
  - Compuestos (Composed)
- **Editor de Gráficos**: Creación y edición manual de gráficos
- **Actualización Automática**: Refresco automático de datos

### 6. **Configuración**
- Conexión personalizada a MongoDB
- Configuración de URI y nombre de base de datos
- Gestión de conexiones

---

## 🛠 Tecnologías Utilizadas

### Frontend
- **React 18.3** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **shadcn/ui** - Componentes UI
- **Recharts** - Biblioteca de gráficos
- **React Router** - Enrutamiento
- **Lucide React** - Iconos

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB Driver** - Cliente oficial de MongoDB
- **CORS** - Manejo de CORS
- **dotenv** - Variables de entorno

---

## 📁 Estructura del Proyecto

```
mongodb-insights-hub/
├── src/
│   ├── components/
│   │   ├── charts/              # Componentes de gráficos
│   │   │   ├── BarChartComponent.tsx
│   │   │   ├── LineChartComponent.tsx
│   │   │   ├── PieChartComponent.tsx
│   │   │   ├── ConfusionMatrixChart.tsx
│   │   │   └── ROCCurveChart.tsx
│   │   ├── dashboard/           # Componentes del dashboard
│   │   │   ├── AnalyticsView.tsx
│   │   │   ├── ChartsView.tsx
│   │   │   ├── CollectionsView.tsx
│   │   │   ├── DataExplorerView.tsx
│   │   │   ├── SettingsView.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                  # Componentes UI reutilizables
│   ├── hooks/
│   │   └── useMongoDB.ts        # Hook para gestión de MongoDB
│   ├── services/
│   │   ├── mongodb.ts           # Servicio API MongoDB
│   │   └── analytics.ts        # Servicio API Analytics
│   ├── types/
│   │   └── chart.ts             # Tipos TypeScript
│   ├── utils/
│   │   ├── mongodbTransform.ts  # Transformación de datos
│   │   └── autoChartGenerator.ts # Generación automática de gráficos
│   └── pages/
│       └── Index.tsx             # Página principal
├── server/
│   ├── index.js                 # Servidor Express
│   └── sateAnalysis.js          # Lógica del análisis SATE-SR
├── .env                          # Variables de entorno (no incluido en git)
├── package.json
├── vite.config.ts
└── README.md
```

---

## 📦 Instalación

### Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (Atlas o local)

### Pasos de Instalación

1. **Clonar el repositorio** (si aplica):
```bash
git clone <URL_DEL_REPOSITORIO>
cd mongodb-insights-hub
```

2. **Instalar dependencias**:
```bash
npm install
```

Esto instalará todas las dependencias del frontend y backend.

---

## ⚙️ Configuración

### 1. Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto (`mongodb-insights-hub/.env`) con el siguiente contenido:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=app-name
MONGODB_DB_NAME=nombre_base_datos

# Server Configuration
SERVER_PORT=3001
```

### 2. Configurar MongoDB Atlas (si usas Atlas)

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster
3. Crea un usuario de base de datos
4. Configura Network Access para permitir tu IP (o `0.0.0.0/0` para desarrollo)
5. Obtén la connection string y reemplázala en `.env`

### 3. Variables de Entorno Explicadas

- **MONGODB_URI**: URI de conexión a MongoDB (puede ser Atlas o local)
- **MONGODB_DB_NAME**: Nombre de la base de datos a usar
- **SERVER_PORT**: Puerto donde correrá el servidor backend (default: 3001)

---

## ▶️ Ejecución

### Opción 1: Ejecutar Todo Junto (Recomendado)

Si tienes `concurrently` instalado (se instala automáticamente con `npm install`):

```bash
npm run dev:all
```

Esto iniciará tanto el servidor backend como el frontend simultáneamente.

### Opción 2: Ejecutar por Separado

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

Deberías ver:
```
🚀 Servidor ejecutándose en http://localhost:3001
📊 MongoDB URI configurada: Sí
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Deberías ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
```

### Verificación

- **Backend**: Abre `http://localhost:3001/api/health` en tu navegador. Deberías ver `{"status":"ok","timestamp":"..."}`
- **Frontend**: Abre `http://localhost:8080` en tu navegador. Deberías ver la aplicación DataViz.

---

## 📖 Guía de Uso

### 1. Conectar a MongoDB

#### Método 1: Usando Configuración por Defecto (.env)

1. Asegúrate de que el archivo `.env` esté configurado correctamente
2. Haz clic en el botón **"Conectar MongoDB"** en el header
3. El estado cambiará a **"MongoDB Conectado - [nombre_db]"**

#### Método 2: Usando Configuración Personalizada

1. Ve a la categoría **"Configuración"** en el sidebar
2. Ingresa tu URI de MongoDB y nombre de base de datos
3. Haz clic en **"Conectar"**
4. El sistema se conectará a tu base de datos personalizada

### 2. Explorar Colecciones

1. Ve a la categoría **"Colecciones"**
2. Verás una lista de todas las colecciones disponibles
3. Puedes buscar colecciones usando el campo de búsqueda
4. Haz clic en una colección para ver sus detalles

### 3. Explorar Datos

1. Ve a la categoría **"Datos"**
2. Selecciona una colección del dropdown
3. Explora los documentos con paginación
4. Usa la búsqueda para filtrar documentos

### 4. Crear Gráficos

#### Generación Automática (Recomendado)

1. Ve a la categoría **"Gráficos"**
2. Haz clic en **"Generar Automáticamente"**
3. Selecciona una colección
4. El sistema analizará los datos y sugerirá gráficos intuitivos
5. Revisa las sugerencias (incluyen pregunta, descripción, ejes y unidades)
6. Selecciona los gráficos que deseas generar
7. Haz clic en **"Generar Gráficos Seleccionados"**

#### Creación Manual

1. Ve a la categoría **"Gráficos"**
2. Haz clic en **"Añadir Gráfico"** (botón en el sidebar o en la vista)
3. Selecciona el tipo de gráfico
4. Configura los datos (colección, campos, agregaciones)
5. Personaliza el diseño (colores, títulos, etc.)
6. Guarda el gráfico

### 5. Ejecutar Análisis SATE-SR

1. Asegúrate de estar conectado a MongoDB
2. Ve a la categoría **"Analytics"**
3. El análisis se ejecutará automáticamente al cargar (si hay conexión)
4. O haz clic en **"Ejecutar Análisis"** para ejecutarlo manualmente
5. Revisa los resultados:
   - **Métricas Principales**: Total estudiantes, aprobados, en riesgo
   - **Métricas de Validación**: Precisión, Recall, F1-Score, AUC-ROC
   - **Matriz de Confusión**: Visualización de predicciones correctas e incorrectas
   - **Curva ROC**: Evaluación del poder de discriminación del modelo
   - **Factores de Riesgo**: Distribución de factores que influyen en el rendimiento
   - **Resultados por Estudiante**: Tabla detallada con filtros

---

## 🎓 Sistema SATE-SR

### ¿Qué es SATE-SR?

**SATE-SR v2.0** (Sistema de Alerta Temprana Educativa San Ramón) es un modelo predictivo híbrido que analiza múltiples factores para predecir el rendimiento académico de los estudiantes en el Bimestre 4.

### Colecciones Requeridas

El sistema requiere las siguientes colecciones en MongoDB:

1. **`nomina`**: Información básica de estudiantes
   - Campos: `DNI`, `Apellidos_Nombres`, `sexo`, `padre_vive`, `madre_vive`, `trabaja_estudiante`, `tipo_discapacidad`, `situacion_matricula`

2. **`asistencia`**: Registro de asistencia diaria
   - Campos: `DNI`, `Apellidos_Nombres`, columnas de días (valores: 1=asistencia, 0=falta, 2=justificada)

3. **`primer_bimestre`**: Calificaciones del primer bimestre
   - Campo: `PROMEDIO_APRENDIZAJE_AUTONOMO` (valores: C, B, A, AD)

4. **`segundo_bimestre`**: Calificaciones del segundo bimestre
   - Campo: `PROMEDIO_APRENDIZAJE_AUTONOMO`

5. **`tercer_bimestre`**: Calificaciones del tercer bimestre
   - Campo: `PROMEDIO_APRENDIZAJE_AUTONOMO`

6. **`incidente`**: Registro de incidencias disciplinarias
   - Campos: `Nombre y Apellido`, `Tipo de Falta` (Leve/Grave)

7. **`encuesta`**: Respuestas de encuestas de sentimiento
   - Campos: `DNI`, `sugerencia_sentimientos` (texto libre)

### Proceso de Análisis

1. **Extracción**: Lee datos de todas las colecciones
2. **Transformación**: 
   - Convierte calificaciones cualitativas (C, B, A, AD) a numéricas (5, 13, 16, 19)
   - Calcula porcentaje de faltas de asistencia
   - Analiza sentimiento de las encuestas
   - Evalúa situación familiar
3. **Integración**: Une todos los datos por DNI
4. **Predicción**: 
   - Proyecta nota del Bimestre 4 usando regresión lineal robusta
   - Aplica penalizaciones por factores de riesgo
   - Clasifica como "Aprueba" (≥12) o "Desaprueba" (<12)
5. **Validación**: Calcula métricas comparando predicciones con realidad (Bimestre 3)

### Factores de Riesgo

El modelo considera 4 factores principales:

1. **Asistencia**: Porcentaje de faltas ≥ 30% = riesgo
2. **Incidencias**: Faltas graves = riesgo
3. **Sentimiento**: Análisis de texto negativo = riesgo
4. **Situación Familiar**: Factores como padres ausentes, trabajo del estudiante, discapacidad, etc.

### Métricas de Validación

- **Precisión**: Proporción de predicciones positivas correctas
- **Recall (Sensibilidad)**: Proporción de casos positivos identificados correctamente
- **F1-Score**: Media armónica de precisión y recall
- **AUC-ROC**: Área bajo la curva ROC (poder de discriminación)
  - > 0.9: Excelente
  - > 0.7: Bueno
  - < 0.7: Requiere mejoras

---

## 🔌 API Endpoints

### Conexión MongoDB

- **POST** `/api/mongodb/connect`
  - Body: `{ "uri": "...", "database": "..." }` (opcional)
  - Conecta a MongoDB

- **GET** `/api/mongodb/status`
  - Verifica estado de conexión
  - Retorna: `{ "connected": true/false, "database": "...", "collections": [...] }`

- **POST** `/api/mongodb/disconnect`
  - Desconecta de MongoDB

### Colecciones

- **GET** `/api/mongodb/collections`
  - Lista todas las colecciones
  - Retorna: `{ "collections": ["coleccion1", "coleccion2", ...] }`

- **GET** `/api/mongodb/collection/:collectionName`
  - Obtiene documentos de una colección
  - Query params:
    - `limit` (default: 100): Número máximo de documentos
    - `skip` (default: 0): Documentos a saltar
    - `filter` (opcional): JSON string con filtro MongoDB
  - Retorna: `{ "collection": "...", "total": 100, "limit": 100, "skip": 0, "data": [...] }`

### Agregaciones

- **POST** `/api/mongodb/aggregate/:collectionName`
  - Ejecuta un pipeline de agregación
  - Body: `{ "pipeline": [...] }`
  - Retorna: `{ "collection": "...", "count": 10, "data": [...] }`

### Analytics

- **POST** `/api/analytics/sate-analysis`
  - Ejecuta el análisis SATE-SR completo
  - Retorna: Objeto `SATEAnalysisResult` con todas las métricas y resultados

### Salud

- **GET** `/api/health`
  - Verifica que el servidor está funcionando
  - Retorna: `{ "status": "ok", "timestamp": "..." }`

---

## 🐛 Solución de Problemas

### Error: "No hay conexión a MongoDB"

**Causas posibles:**
1. El servidor backend no está corriendo
2. La URI de MongoDB es incorrecta
3. Tu IP no está permitida en MongoDB Atlas
4. Las credenciales son incorrectas

**Soluciones:**
1. Verifica que el servidor esté corriendo: `npm run dev:server`
2. Revisa el archivo `.env` y la URI de MongoDB
3. En MongoDB Atlas, ve a Network Access y agrega tu IP (o `0.0.0.0/0` para desarrollo)
4. Verifica usuario y contraseña en MongoDB Atlas

### Error: "Endpoint no encontrado (404)"

**Causa:** El servidor necesita reiniciarse para cargar nuevos endpoints.

**Solución:**
1. Detén el servidor (Ctrl+C)
2. Reinícialo: `npm run dev:server`

### Error: "Puerto 3001 ya está en uso"

**Solución:**
1. Cambia `SERVER_PORT` en el archivo `.env` a otro puerto (ej: 3002)
2. Actualiza `vite.config.ts` para apuntar al nuevo puerto en el proxy

### Los gráficos no se generan automáticamente

**Causas posibles:**
1. Los datos no tienen la estructura adecuada
2. No hay campos numéricos o categóricos detectables
3. Los campos son principalmente IDs

**Soluciones:**
1. Revisa `REQUISITOS_GRAFICOS.md` para ver qué estructura de datos se necesita
2. Asegúrate de tener campos numéricos (edades, precios, cantidades) y categóricos (categorías, estados)
3. Evita usar solo IDs o códigos como valores

### El análisis SATE-SR no se ejecuta

**Causas posibles:**
1. No hay conexión a MongoDB
2. Faltan colecciones requeridas
3. Las colecciones están vacías
4. Los campos tienen nombres diferentes a los esperados

**Soluciones:**
1. Verifica la conexión en el header
2. Asegúrate de tener todas las colecciones: `nomina`, `asistencia`, `primer_bimestre`, `segundo_bimestre`, `tercer_bimestre`, `incidente`, `encuesta`
3. Verifica que las colecciones tengan datos
4. Revisa los nombres de campos en `server/sateAnalysis.js` y ajusta si es necesario

### Error de CORS

**Causa:** El frontend y backend están en puertos diferentes.

**Solución:** El servidor ya tiene CORS habilitado. Si persiste el error, verifica que:
- El frontend esté en `http://localhost:8080`
- El backend esté en `http://localhost:3001`
- El proxy en `vite.config.ts` esté configurado correctamente

---

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo del frontend
- `npm run dev:server` - Inicia el servidor backend
- `npm run dev:all` - Inicia frontend y backend simultáneamente
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

---

## 📄 Licencia

Este proyecto es de uso educativo y está diseñado para el análisis de datos educativos.

---

## 👥 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📞 Soporte

Para problemas o preguntas:
- Revisa la sección [Solución de Problemas](#solución-de-problemas)
- Consulta `REQUISITOS_GRAFICOS.md` para información sobre generación de gráficos
- Consulta `SETUP.md` para configuración rápida

---

**Desarrollado con ❤️ para análisis educativo**
