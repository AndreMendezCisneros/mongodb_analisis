# Documentación Completa - Sistema SATE-SR v2.0

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Código Detallado](#código-detallado)
4. [Modelo SATE-SR](#modelo-sate-sr)
5. [Componentes Frontend](#componentes-frontend)
6. [API y Endpoints](#api-y-endpoints)
7. [Resultados y Métricas](#resultados-y-métricas)
8. [Gráficos y Visualizaciones](#gráficos-y-visualizaciones)
9. [Tablas de Datos](#tablas-de-datos)
10. [Flujos de Datos](#flujos-de-datos)
11. [Configuración Técnica](#configuración-técnica)

---

## 1. Introducción

### 1.1 ¿Qué es SATE-SR?

**SATE-SR v2.0** (Sistema de Alerta Temprana Educativa San Ramón) es un sistema predictivo híbrido diseñado para identificar estudiantes en riesgo académico antes de que desaprueben. Utiliza análisis de múltiples factores educativos y técnicas de machine learning para predecir el rendimiento académico en el Bimestre 4.

### 1.2 Objetivos del Sistema

- **Predicción Temprana**: Identificar estudiantes en riesgo antes del Bimestre 4
- **Análisis Multifactorial**: Evaluar asistencia, incidencias, sentimiento y situación familiar
- **Validación Estadística**: Calcular métricas de precisión, recall, F1-score y AUC-ROC
- **Visualización Interactiva**: Presentar resultados en gráficos y tablas comprensibles
- **Intervención Oportuna**: Permitir a educadores tomar acciones preventivas

### 1.3 Tecnologías Utilizadas

#### Frontend
- **React 18.3** - Biblioteca de UI moderna
- **TypeScript** - Tipado estático para mayor seguridad
- **Vite** - Build tool rápido y eficiente
- **Tailwind CSS** - Framework de estilos utility-first
- **shadcn/ui** - Componentes UI accesibles y personalizables
- **Recharts** - Biblioteca de gráficos interactivos
- **React Router** - Enrutamiento del lado del cliente
- **React Query** - Gestión de estado y caché de datos

#### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web minimalista
- **MongoDB Driver** - Cliente oficial de MongoDB
- **CORS** - Manejo de políticas de origen cruzado
- **dotenv** - Gestión de variables de entorno

#### Análisis (Python)
- **Flask** - Framework web ligero para microservicio
- **PyMongo** - Cliente MongoDB para Python
- **pysentimiento** - Análisis de sentimiento en español (NLP)
- **scikit-learn** (opcional) - Métricas de machine learning
- **numpy** (opcional) - Cálculos numéricos eficientes
- **pandas** (opcional) - Manipulación de datos

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AnalyticsView│  │ ChartsView    │  │ DataExplorer │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  Services   │                          │
│                    │ (analytics) │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────┐
│              BACKEND (Node.js/Express)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Endpoints                                         │   │
│  │  - /api/mongodb/*                                     │   │
│  │  - /api/analytics/sate-analysis                       │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                        │
│              ┌───────▼────────┐                              │
│              │  MongoDB       │                              │
│              │  Connection    │                              │
│              └───────┬────────┘                              │
└──────────────────────┼───────────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼───────────────────────────────────────┐
│          SERVICIO PYTHON (Flask Microservice)                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Endpoints:                                            │    │
│  │  - /health                                             │    │
│  │  - /sate-analysis                                       │    │
│  └───────────────────┬───────────────────────────────────┘    │
│                      │                                         │
│              ┌───────▼────────┐                               │
│              │  sate_analysis  │                               │
│              │  .py            │                               │
│              │  - ETL          │                               │
│              │  - Predicción   │                               │
│              │  - Validación   │                               │
│              └───────┬─────────┘                               │
└──────────────────────┼─────────────────────────────────────────┘
                        │ PyMongo
┌───────────────────────▼─────────────────────────────────────────┐
│                    MONGODB DATABASE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ nomina   │  │asistencia│  │bimestres │  │ incidente│         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐                                      │
│  │ encuesta │  │  ...     │                                      │
│  └──────────┘  └──────────┘                                      │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

1. **Usuario ejecuta análisis** → Frontend (`AnalyticsView.tsx`)
2. **Petición HTTP** → Backend Node.js (`/api/analytics/sate-analysis`)
3. **Backend valida conexión** → Verifica MongoDB conectado
4. **Llamada a Python** → Backend llama al microservicio Python (`http://localhost:5000/sate-analysis`)
5. **Python ejecuta ETL** → Lee datos de MongoDB, transforma, integra
6. **Python ejecuta predicción** → Calcula proyecciones y clasificaciones
7. **Python ejecuta validación** → Calcula métricas (Precision, Recall, F1, AUC-ROC)
8. **Respuesta JSON** → Python retorna resultados al Backend
9. **Backend retorna** → Backend retorna JSON al Frontend
10. **Frontend renderiza** → Muestra gráficos, tablas y métricas

### 2.3 Estructura de Directorios

```
mongodb_analisis/
├── src/
│   ├── components/
│   │   ├── charts/                    # Componentes de gráficos
│   │   │   ├── ConfusionMatrixChart.tsx
│   │   │   ├── ROCCurveChart.tsx
│   │   │   ├── BarChartComponent.tsx
│   │   │   └── ...
│   │   ├── dashboard/                  # Vistas principales
│   │   │   ├── AnalyticsView.tsx       # Vista principal de análisis
│   │   │   ├── ChartsView.tsx
│   │   │   ├── DataExplorerView.tsx
│   │   │   └── ...
│   │   └── ui/                         # Componentes UI reutilizables
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── hooks/
│   │   └── useMongoDB.ts               # Hook para gestión MongoDB
│   ├── services/
│   │   ├── mongodb.ts                  # API MongoDB
│   │   └── analytics.ts                # API Analytics
│   ├── types/
│   │   └── chart.ts                    # Tipos TypeScript
│   └── utils/
│       └── ...
├── server/
│   ├── index.js                        # Servidor Express principal
│   └── python_analysis/
│       ├── app.py                      # Servicio Flask
│       ├── sate_analysis.py             # Lógica principal SATE-SR
│       ├── requirements.txt             # Dependencias Python completas
│       └── requirements_minimal.txt     # Dependencias mínimas
├── .env                                 # Variables de entorno
├── package.json                         # Dependencias Node.js
└── README.md                            # Documentación principal
```

---

## 3. Código Detallado

### 3.1 Backend - Servidor Express (`server/index.js`)

#### 3.1.1 Configuración Inicial

```javascript
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

let client = null;
let db = null;
```

#### 3.1.2 Endpoint Principal: Análisis SATE-SR

```javascript
app.post('/api/analytics/sate-analysis', async (req, res) => {
  try {
    // 1. Verificar conexión MongoDB
    const status = await checkConnection();
    if (!status.connected) {
      return res.status(400).json({
        success: false,
        error: 'No hay conexión a MongoDB.'
      });
    }

    // 2. Obtener URL del servicio Python
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

    // 3. Verificar salud del servicio Python
    const healthCheck = await fetch(`${pythonServiceUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    }).catch(() => null);

    if (!healthCheck || !healthCheck.ok) {
      throw new Error('Servicio Python no disponible.');
    }

    // 4. Ejecutar análisis en Python
    const response = await fetch(`${pythonServiceUrl}/sate-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mongodb_uri: process.env.MONGODB_URI,
        database_name: db.databaseName
      }),
      signal: AbortSignal.timeout(300000) // 5 minutos timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servicio Python: ${response.status}`);
    }

    // 5. Retornar resultados
    const resultado = await response.json();
    return res.json(resultado);
  } catch (error) {
    return res.status(503).json({
      success: false,
      error: `El servicio Python no está disponible: ${error.message}`
    });
  }
});
```

### 3.2 Python - Lógica de Análisis (`server/python_analysis/sate_analysis.py`)

#### 3.2.1 Configuración del Modelo

```python
MODEL_CONFIG = {
    "version": "2.0.0",
    "conversion_notas": {
        'C': 5,   # En Inicio
        'B': 13,  # En Proceso
        'A': 16,  # Logro Esperado
        'AD': 19  # Logro Destacado
    },
    "umbral_aprobacion": 12,           # Nota mínima para aprobar
    "umbral_faltas_critico": 30,       # Porcentaje de faltas crítico
    "pesos_penalizacion": {
        "asistencia": 1.0,
        "incidencias": 1.0,
        "sentimiento": 1.0,
        "familia": 1.0
    },
    "max_proyeccion_cambio": 4,        # Máximo cambio permitido entre bimestres
    "nota_escala": [5, 20]             # Rango válido de notas
}
```

#### 3.2.2 Función Principal: `ejecutar_analisis_sate()`

```python
def ejecutar_analisis_sate(mongodb_uri: str, database_name: str) -> Dict:
    """
    Función principal que ejecuta todo el pipeline ETL + Predicción + Validación
    
    Flujo:
    1. Conectar a MongoDB
    2. Extraer datos de todas las colecciones
    3. Transformar datos (conversión de notas, cálculo de porcentajes)
    4. Integrar datos por DNI
    5. Ejecutar predicciones
    6. Validar modelo
    7. Calcular métricas
    8. Retornar resultados
    """
    client = MongoClient(mongodb_uri)
    db = client[database_name]
    
    # ETAPA 1: EXTRACCIÓN
    df_nomina = extraer_nomina(db)
    df_asistencias = extraer_asistencias(db)
    df_bim1 = extraer_bimestre(db, 'primer_bimestre', 1)
    df_bim2 = extraer_bimestre(db, 'segundo_bimestre', 2)
    df_bim3 = extraer_bimestre(db, 'tercer_bimestre', 3)
    df_incidencias = extraer_incidencias(db)
    df_encuestas = extraer_encuestas(db)
    
    # ETAPA 2: TRANSFORMACIÓN
    df_nomina_final = transformar_nomina(df_nomina)
    df_asistencias_final = transformar_asistencias(df_asistencias)
    df_bim1_final = transformar_bimestre(df_bim1, 1)
    df_bim2_final = transformar_bimestre(df_bim2, 2)
    df_bim3_final = transformar_bimestre(df_bim3, 3)
    df_incidencias_final = transformar_incidencias(df_incidencias)
    df_encuestas_final = transformar_encuestas(df_encuestas)
    
    # ETAPA 3: INTEGRACIÓN (Merge por DNI)
    estudiantes_map = {}
    # ... merge de todas las fuentes ...
    
    # ETAPA 4: PREDICCIÓN
    for est in df_final:
        est['Nota_Proyectada_B4'] = proyectar_nota_robusta(est)
        est['Prediccion_Final_Binaria'] = clasificar_resultado(est['Nota_Proyectada_B4'])
    
    # ETAPA 5: VALIDACIÓN TEMPORAL
    # Usar Bim1 y Bim2 para predecir Bim3, validar con Bim3 real
    y_true_temporal = []
    y_pred_temporal = []
    # ... cálculo de validación temporal ...
    metricas = calcular_metricas(y_true_temporal, y_pred_temporal)
    
    # ETAPA 6: PREPARAR RESULTADOS
    return {
        "success": True,
        "metricas": {
            "total_estudiantes": total_estudiantes,
            "aprueba": aprueba_count,
            "desaprueba": desaprueba_count,
            "precision": metricas["precision"],
            "recall": metricas["recall"],
            "f1_score": metricas["f1_score"],
            "auc_roc": metricas["auc_roc"],
            "matriz_confusion": metricas["matriz_confusion"],
            # ... más métricas ...
        },
        "resultados": df_final
    }
```

#### 3.2.3 Proyección de Notas: `proyectar_nota_robusta()`

```python
def proyectar_nota_robusta(fila: Dict, config: Dict = MODEL_CONFIG) -> float:
    """
    Proyecta la nota del Bimestre 4 usando regresión lineal robusta
    con detección de outliers (Z-score) y penalización por factores de riesgo.
    
    Algoritmo:
    1. Obtener notas de Bim1, Bim2, Bim3
    2. Validar rango [5, 20]
    3. Detectar outliers con Z-score (umbral: 2)
    4. Si hay outlier: usar cambio promedio simple
    5. Si no hay outlier: usar regresión lineal (y = mx + b)
    6. Aplicar límite de cambio máximo (±4 puntos)
    7. Aplicar penalización por factores de riesgo
    8. Garantizar rango válido final
    """
    notas = [fila.get('NotaBim1', 5), fila.get('NotaBim2', 5), fila.get('NotaBim3', 5)]
    nota_min, nota_max = config["nota_escala"]
    notas_validadas = [max(nota_min, min(nota_max, n)) for n in notas]
    
    # Detectar outliers con Z-score
    media = sum(notas_validadas) / len(notas_validadas)
    desviacion = math.sqrt(sum((x - media) ** 2 for x in notas_validadas) / len(notas_validadas))
    z_scores = [abs((n - media) / (desviacion if desviacion > 0 else 1)) for n in notas_validadas]
    tiene_outlier = any(z > 2 for z in z_scores)
    
    if tiene_outlier:
        # Método robusto: cambio promedio simple
        cambio = (notas_validadas[2] - notas_validadas[0]) / 2
        proyeccion_b4 = notas_validadas[2] + cambio
    else:
        # Regresión lineal: y = mx + b
        # x = [1, 2, 3], y = notas
        n = 3
        sum_x = 6  # 1 + 2 + 3
        sum_y = sum(notas_validadas)
        sum_xy = notas_validadas[0] * 1 + notas_validadas[1] * 2 + notas_validadas[2] * 3
        sum_x2 = 14  # 1² + 2² + 3²
        
        m = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        b = (sum_y - m * sum_x) / n
        proyeccion_b4 = m * 4 + b
    
    # Límite de cambio máximo (±4 puntos)
    max_cambio = config["max_proyeccion_cambio"]
    proyeccion_b4 = max(
        notas_validadas[2] - max_cambio,
        min(notas_validadas[2] + max_cambio, proyeccion_b4)
    )
    
    # Penalización por factores de riesgo
    pesos = config["pesos_penalizacion"]
    castigo = (
        (1 - fila.get('Analisis_Asistencia', 1)) * pesos["asistencia"] +
        (1 - fila.get('Analisis_Incidencias', 1)) * pesos["incidencias"] +
        (1 - fila.get('Analisis_Sentimiento_Estudiante', 1)) * pesos["sentimiento"] +
        (1 - fila.get('Analisis_Situacion_Familiar', 1)) * pesos["familia"]
    )
    
    nota_final = proyeccion_b4 - castigo
    
    # Garantizar rango válido
    return max(nota_min, min(nota_max, nota_final))
```

#### 3.2.4 Análisis de Sentimiento: `analizar_sentimiento_espanol()`

```python
def analizar_sentimiento_espanol(texto: Any) -> int:
    """
    Analiza sentimiento en español usando pysentimiento (NLP) si está disponible,
    sino usa análisis manual basado en palabras clave.
    
    Retorna:
        1 = Sentimiento positivo o neutro (sin riesgo)
        0 = Sentimiento negativo (con riesgo)
    """
    if not texto or str(texto).strip() == '':
        return 1  # Ausencia = Positivo por defecto
    
    texto_limpio = str(texto).strip()
    
    # Casos especiales neutros
    casos_neutros = ['nada', '.', '', 'ninguno', 'ninguna', 'n/a', ...]
    if texto_limpio.lower() in casos_neutros:
        return 1
    
    # Usar pysentimiento si está disponible (más preciso)
    if HAS_PYSENTIMIENTO and sentiment_analyzer is not None:
        try:
            resultado = sentiment_analyzer.predict(texto_limpio)
            sentimiento = resultado.output
            # pysentimiento retorna: 'POS', 'NEU', 'NEG'
            return 1 if sentimiento in ['POS', 'NEU'] else 0
        except Exception as e:
            logger.warning(f'Error usando pysentimiento, usando método manual: {e}')
    
    # Método manual (fallback)
    # Palabras negativas FUERTES (peso 2)
    palabras_negativas_fuertes = [
        'no me gusta', 'odio', 'terrible', 'horrible', 'aburrido',
        'triste', 'enojado', 'preocupado', 'molesto', 'frustrado',
        'violencia', 'peleas', 'conflicto', 'miedo', 'ansiedad',
        'bullying', 'acoso', 'discriminación', ...
    ]
    
    # Palabras negativas REGULARES (peso 1)
    palabras_negativas = ['mal', 'malo', 'problema', 'difícil', ...]
    
    # Palabras positivas
    palabras_positivas = [
        'bien', 'bueno', 'excelente', 'genial', 'me gusta',
        'feliz', 'contento', 'satisfecho', 'perfecto', ...
    ]
    
    # Contar ocurrencias con regex para palabras completas
    negativas_fuertes = sum(len(re.findall(rf'\b{re.escape(p)}\b', texto_limpio.lower()))
                           for p in palabras_negativas_fuertes) * 2
    negativas_regulares = sum(len(re.findall(rf'\b{re.escape(p)}\b', texto_limpio.lower()))
                             for p in palabras_negativas)
    negativas_total = negativas_fuertes + negativas_regulares
    positivas_total = sum(len(re.findall(rf'\b{re.escape(p)}\b', texto_limpio.lower()))
                          for p in palabras_positivas)
    
    # Lógica de clasificación
    if negativas_total > 0 and positivas_total == 0:
        return 0  # Negativo
    elif negativas_total > positivas_total:
        return 0  # Negativo
    else:
        return 1  # Positivo/Neutro
```

#### 3.2.5 Validación Temporal: Método Realista

```python
# Validación temporal: usar Bim1 y Bim2 para predecir Bim3, validar con Bim3 real
y_true_temporal = []
y_pred_temporal = []

for est in df_final:
    if est.get('NotaBim1') and est.get('NotaBim2') and est.get('NotaBim3'):
        # Realidad: clasificar Bim3 real
        realidad_bim3 = clasificar_resultado(est['NotaBim3'])
        
        # Predicción: usar solo Bim1 y Bim2 para predecir Bim3
        notas_para_validacion = [est.get('NotaBim1', 5), est.get('NotaBim2', 5)]
        notas_validadas = [max(5, min(20, n)) for n in notas_para_validacion]
        
        # Regresión lineal simple con solo 2 puntos
        cambio = notas_validadas[1] - notas_validadas[0]
        proyeccion_bim3 = notas_validadas[1] + cambio
        
        # Aplicar límite de cambio máximo
        proyeccion_bim3 = max(
            notas_validadas[1] - 4,
            min(notas_validadas[1] + 4, proyeccion_bim3)
        )
        
        # Aplicar penalización por factores de riesgo
        castigo = (
            (1 - est.get('Analisis_Asistencia', 1)) * 1.0 +
            (1 - est.get('Analisis_Incidencias', 1)) * 1.0 +
            (1 - est.get('Analisis_Sentimiento_Estudiante', 1)) * 1.0 +
            (1 - est.get('Analisis_Situacion_Familiar', 1)) * 1.0
        )
        
        nota_final_validacion = max(5, min(20, proyeccion_bim3 - castigo))
        prediccion_bim3 = clasificar_resultado(nota_final_validacion)
        
        y_true_temporal.append(realidad_bim3)
        y_pred_temporal.append(prediccion_bim3)

metricas = calcular_metricas(y_true_temporal, y_pred_temporal)
```

#### 3.2.6 Cálculo de Métricas: `calcular_metricas()`

```python
def calcular_metricas(y_true: List[int], y_pred: List[int]) -> Dict:
    """
    Calcula métricas de validación del modelo:
    - Precision: TP / (TP + FP)
    - Recall: TP / (TP + FN)
    - F1-Score: 2 * (Precision * Recall) / (Precision + Recall)
    - AUC-ROC: Área bajo la curva ROC
    - Matriz de Confusión: TP, FP, TN, FN
    """
    # Calcular matriz de confusión
    tp = fp = tn = fn = 0
    for i in range(len(y_true)):
        if y_true[i] == 1 and y_pred[i] == 1:
            tp += 1  # Verdadero Positivo
        elif y_true[i] == 0 and y_pred[i] == 1:
            fp += 1  # Falso Positivo
        elif y_true[i] == 0 and y_pred[i] == 0:
            tn += 1  # Verdadero Negativo
        elif y_true[i] == 1 and y_pred[i] == 0:
            fn += 1  # Falso Negativo
    
    # Calcular métricas
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    # AUC-ROC (usar sklearn si está disponible, sino manual)
    if HAS_SKLEARN:
        auc_roc = roc_auc_score(y_true, y_pred)
    else:
        auc_roc = calcular_auc_roc_manual(y_true, y_pred)
    
    return {
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "auc_roc": float(auc_roc),
        "matriz_confusion": {
            "verdaderos_positivos": int(tp),
            "falsos_positivos": int(fp),
            "verdaderos_negativos": int(tn),
            "falsos_negativos": int(fn)
        }
    }
```

### 3.3 Frontend - Componente Principal (`src/components/dashboard/AnalyticsView.tsx`)

#### 3.3.1 Estado y Hooks

```typescript
export const AnalyticsView = () => {
  const { isConnected } = useMongoDB();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SATEAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeccion, setFilterSeccion] = useState<string>('todas');
  const [filterGrado, setFilterGrado] = useState<string>('todos');
  const [filterEstadoTab, setFilterEstadoTab] = useState<string>('todos');
  const [filterFactores, setFilterFactores] = useState({...});
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
```

#### 3.3.2 Función de Ejecución con Cancelación

```typescript
const ejecutarAnalisis = useCallback(async () => {
  if (!isConnected) {
    setError('Debes estar conectado a MongoDB para ejecutar el análisis');
    return;
  }

  // Cancelar petición anterior si existe
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  // Crear nuevo AbortController
  const abortController = new AbortController();
  abortControllerRef.current = abortController;

  setLoading(true);
  setError(null);

  try {
    const resultado = await ejecutarAnalisisSATE(abortController.signal);
    setAnalysisResult(resultado);
    setLastAnalysisTime(new Date());
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return; // No mostrar error si fue cancelado
    }
    setError(err instanceof Error ? err.message : 'Error al ejecutar el análisis');
  } finally {
    setLoading(false);
    abortControllerRef.current = null;
  }
}, [isConnected]);
```

#### 3.3.3 Filtrado y Búsqueda

```typescript
const resultadosFiltrados = useMemo(() => {
  if (!analysisResult?.resultados) return [];
  
  return analysisResult.resultados.filter((r) => {
    // Búsqueda por nombre o DNI
    const matchSearch = searchTerm === '' || 
      r.Apellidos_Nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.DNI?.toString().includes(searchTerm);
    
    // Filtro por sección
    const matchSeccion = filterSeccion === 'todas' || r.Seccion === filterSeccion;
    
    // Filtro por grado
    const matchGrado = filterGrado === 'todos' || r.Grado === filterGrado;
    
    // Filtro por factores de riesgo
    const matchFactores = 
      (!filterFactores.asistencia || r.Analisis_Asistencia === 0) &&
      (!filterFactores.incidencias || r.Analisis_Incidencias === 0) &&
      (!filterFactores.sentimiento || r.Analisis_Sentimiento_Estudiante === 0) &&
      (!filterFactores.situacion_familiar || r.Analisis_Situacion_Familiar === 0);
    
    return matchSearch && matchSeccion && matchGrado && matchFactores;
  });
}, [searchTerm, filterSeccion, filterGrado, filterFactores, analysisResult]);
```

---

## 4. Modelo SATE-SR

### 4.1 Factores de Riesgo

El modelo evalúa 4 factores principales:

#### 4.1.1 Asistencia
- **Cálculo**: `Porcentaje de faltas = (Total faltas / Total días) * 100`
- **Riesgo**: Si `Porcentaje de faltas >= 30%` → `Analisis_Asistencia = 0` (con riesgo)
- **Sin riesgo**: Si `Porcentaje de faltas < 30%` → `Analisis_Asistencia = 1`

#### 4.1.2 Incidencias
- **Cálculo**: Contar faltas graves en colección `incidente`
- **Riesgo**: Si tiene al menos 1 falta grave → `Analisis_Incidencias = 0`
- **Sin riesgo**: Si no tiene faltas graves → `Analisis_Incidencias = 1`

#### 4.1.3 Sentimiento
- **Fuente**: Campo `sugerencia_sentimientos` en colección `encuesta`
- **Método**: 
  - **Primario**: `pysentimiento` (NLP) si está disponible
  - **Fallback**: Análisis manual con palabras clave
- **Riesgo**: Si sentimiento negativo → `Analisis_Sentimiento_Estudiante = 0`
- **Sin riesgo**: Si sentimiento positivo/neutro → `Analisis_Sentimiento_Estudiante = 1`

#### 4.1.4 Situación Familiar
- **Factores evaluados**:
  - `padre_vive = false` → Riesgo
  - `madre_vive = false` → Riesgo
  - `trabaja_estudiante = true` → Riesgo
  - `tipo_discapacidad` presente → Riesgo
  - `situacion_matricula` problemática → Riesgo
- **Riesgo**: Si al menos 1 factor presente → `Analisis_Situacion_Familiar = 0`
- **Sin riesgo**: Si todos los factores son favorables → `Analisis_Situacion_Familiar = 1`

### 4.2 Fórmulas Matemáticas

#### 4.2.1 Regresión Lineal

Para proyectar la nota del Bimestre 4:

```
y = mx + b

Donde:
- x = número de bimestre (1, 2, 3, 4)
- y = nota del bimestre
- m = pendiente
- b = intercepto

Cálculo de m y b:
m = (n * Σ(xy) - Σ(x) * Σ(y)) / (n * Σ(x²) - (Σ(x))²)
b = (Σ(y) - m * Σ(x)) / n

Proyección B4:
Nota_B4 = m * 4 + b
```

#### 4.2.2 Detección de Outliers (Z-score)

```
Z = |(x - μ) / σ|

Donde:
- x = valor individual
- μ = media
- σ = desviación estándar

Si Z > 2 → Outlier detectado
```

#### 4.2.3 Penalización por Factores de Riesgo

```
Castigo = Σ((1 - Factor_i) * Peso_i)

Donde:
- Factor_i = 1 si sin riesgo, 0 si con riesgo
- Peso_i = peso del factor (default: 1.0)

Nota_Final = Nota_Proyectada - Castigo
```

#### 4.2.4 Clasificación Binaria

```
Si Nota_Final >= Umbral_Aprobacion (12):
    Prediccion = 1 (APRUEBA)
Sino:
    Prediccion = 0 (DESAPRUEBA)
```

### 4.3 Métricas de Validación

#### 4.3.1 Precision

```
Precision = TP / (TP + FP)

Interpretación: De todas las predicciones positivas, ¿cuántas fueron correctas?
```

#### 4.3.2 Recall (Sensibilidad)

```
Recall = TP / (TP + FN)

Interpretación: De todos los casos positivos reales, ¿cuántos identificamos?
```

#### 4.3.3 F1-Score

```
F1-Score = 2 * (Precision * Recall) / (Precision + Recall)

Interpretación: Media armónica de Precision y Recall (balance entre ambos)
```

#### 4.3.4 AUC-ROC

```
AUC-ROC = Área bajo la curva ROC

Interpretación:
- 0.9 - 1.0: Excelente discriminación
- 0.7 - 0.9: Buena discriminación
- 0.5 - 0.7: Discriminación pobre
- < 0.5: Peor que aleatorio
```

#### 4.3.5 Matriz de Confusión

```
                Predicción
              APRUEBA  DESAPRUEBA
Realidad APRUEBA   TP       FN
        DESAPRUEBA FP       TN

Donde:
- TP (True Positive): Predijo APRUEBA y realmente APRUEBA
- FP (False Positive): Predijo APRUEBA pero realmente DESAPRUEBA
- TN (True Negative): Predijo DESAPRUEBA y realmente DESAPRUEBA
- FN (False Negative): Predijo DESAPRUEBA pero realmente APRUEBA
```

---

## 5. Componentes Frontend

### 5.1 AnalyticsView.tsx - Vista Principal

#### 5.1.1 Estructura de Componentes

```
AnalyticsView
├── Header (título, botón ejecutar, botón refrescar)
├── Loading State (spinner)
├── Error State (alert)
├── Resultados (si hay datos)
│   ├── Métricas Principales (Cards)
│   │   ├── Total Estudiantes
│   │   ├── Estado Seguro (Aprueba)
│   │   ├── Estado Riesgo (Desaprueba)
│   │   └── Promedio Nota Proyectada
│   ├── Métricas de Validación (Card)
│   │   ├── Precision
│   │   ├── Recall
│   │   ├── F1-Score
│   │   └── AUC-ROC (con badge de evaluación)
│   ├── Matriz de Confusión (Card + Chart)
│   ├── Curva ROC (Card + Chart)
│   ├── Factores de Riesgo (Card + Charts)
│   │   ├── Asistencia (Pie Chart)
│   │   ├── Incidencias (Pie Chart)
│   │   ├── Sentimiento (Pie Chart)
│   │   └── Situación Familiar (Pie Chart)
│   └── Tabla de Resultados
│       ├── Filtros (búsqueda, sección, grado, factores)
│       ├── Tabs (Todos, Aprueba, Desaprueba)
│       └── Tabla con paginación
```

#### 5.1.2 Cards de Métricas Principales

```typescript
<Card>
  <CardHeader>
    <CardTitle>Total Estudiantes</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {analysisResult.metricas.total_estudiantes}
    </div>
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Estado Seguro</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-green-600">
      {analysisResult.metricas.aprueba}
    </div>
    <p className="text-xs text-muted-foreground">
      {analysisResult.metricas.porcentaje_aprueba.toFixed(1)}% del total
    </p>
  </CardContent>
</Card>
```

#### 5.1.3 Gráfico de Matriz de Confusión

```typescript
<ConfusionMatrixChart
  data={analysisResult.metricas.matriz_confusion}
/>
```

**Componente**: `src/components/charts/ConfusionMatrixChart.tsx`

- Visualiza TP, FP, TN, FN en una matriz 2x2
- Colores: Verde (correctos), Rojo (incorrectos)
- Muestra porcentajes y valores absolutos

#### 5.1.4 Gráfico de Curva ROC

```typescript
<ROCCurveChart
  aucRoc={analysisResult.metricas.auc_roc}
  matrizConfusion={analysisResult.metricas.matriz_confusion}
/>
```

**Componente**: `src/components/charts/ROCCurveChart.tsx`

- Dibuja curva ROC aproximada
- Muestra punto de operación actual
- Indica área bajo la curva (AUC-ROC)

#### 5.1.5 Gráficos de Factores de Riesgo

```typescript
{Object.entries(analysisResult.metricas.factores_riesgo).map(([factor, datos]) => (
  <Card key={factor}>
    <CardHeader>
      <CardTitle>{factor}</CardTitle>
    </CardHeader>
    <CardContent>
      <PieChart
        data={[
          { name: 'Sin Riesgo', value: datos.sin_riesgo, fill: '#22c55e' },
          { name: 'Con Riesgo', value: datos.con_riesgo, fill: '#ef4444' }
        ]}
      />
    </CardContent>
  </Card>
))}
```

### 5.2 Tabla de Resultados

#### 5.2.1 Columnas de la Tabla

| Columna | Descripción | Tipo |
|---------|-------------|------|
| DNI | Documento Nacional de Identidad | String |
| Apellidos y Nombres | Nombre completo del estudiante | String |
| Sección | Sección del estudiante | String |
| Grado | Grado del estudiante | String |
| NotaBim1 | Nota del primer bimestre | Number |
| NotaBim2 | Nota del segundo bimestre | Number |
| NotaBim3 | Nota del tercer bimestre | Number |
| Nota Proyectada B4 | Nota proyectada para el cuarto bimestre | Number |
| Estado | Estado predicho ([OK] APRUEBA / [X] DESAPRUEBA) | Badge |
| Factores | Indicadores de factores de riesgo | Badges |

#### 5.2.2 Badges de Factores

```typescript
{estudiante.Analisis_Asistencia === 1 ? (
  <Badge variant="outline" className="text-xs">✓A</Badge>
) : (
  <Badge variant="destructive" className="text-xs">✗A</Badge>
)}
```

- **✓A**: Asistencia sin riesgo (verde)
- **✗A**: Asistencia con riesgo (rojo)
- **✓I**: Incidencias sin riesgo
- **✗I**: Incidencias con riesgo
- **✓S**: Sentimiento sin riesgo
- **✗S**: Sentimiento con riesgo
- **✓F**: Situación familiar sin riesgo
- **✗F**: Situación familiar con riesgo

#### 5.2.3 Filtros Disponibles

1. **Búsqueda por texto**: Nombre o DNI
2. **Filtro por sección**: Dropdown con todas las secciones
3. **Filtro por grado**: Dropdown con todos los grados
4. **Filtro por estado**: Tabs (Todos, Aprueba, Desaprueba)
5. **Filtro por factores**: Checkboxes para cada factor de riesgo

#### 5.2.4 Paginación

- **Items por página**: 50
- **Navegación**: Botones Anterior/Siguiente
- **Indicador**: "Página X de Y"

#### 5.2.5 Exportación

```typescript
const exportarCSV = () => {
  const csv = convertirAJSON(resultadosFiltrados);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sate-sr-resultados-${new Date().toISOString()}.csv`;
  a.click();
};
```

---

## 6. API y Endpoints

### 6.1 Backend Node.js

#### 6.1.1 Endpoints MongoDB

**POST** `/api/mongodb/connect`
- **Body**: `{ "uri": "...", "database": "..." }` (opcional)
- **Respuesta**: `{ "success": true, "message": "...", "database": "..." }`
- **Descripción**: Conecta a MongoDB

**GET** `/api/mongodb/status`
- **Respuesta**: `{ "connected": true/false, "database": "...", "collections": [...] }`
- **Descripción**: Verifica estado de conexión

**POST** `/api/mongodb/disconnect`
- **Respuesta**: `{ "success": true }`
- **Descripción**: Desconecta de MongoDB

**GET** `/api/mongodb/collections`
- **Respuesta**: `{ "collections": ["coleccion1", "coleccion2", ...] }`
- **Descripción**: Lista todas las colecciones

**GET** `/api/mongodb/collection/:collectionName`
- **Query params**: `limit`, `skip`, `filter`
- **Respuesta**: `{ "collection": "...", "total": 100, "limit": 100, "skip": 0, "data": [...] }`
- **Descripción**: Obtiene documentos de una colección

#### 6.1.2 Endpoint Analytics

**POST** `/api/analytics/sate-analysis`
- **Body**: Ninguno (usa conexión MongoDB existente)
- **Respuesta**: `SATEAnalysisResult`
- **Descripción**: Ejecuta análisis SATE-SR completo
- **Timeout**: 5 minutos (300 segundos)

**Estructura de Respuesta**:

```typescript
interface SATEAnalysisResult {
  success: boolean;
  metricas: {
    total_estudiantes: number;
    aprueba: number;
    desaprueba: number;
    porcentaje_aprueba: number;
    porcentaje_desaprueba: number;
    promedio_nota_proyectada: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
    matriz_confusion: {
      verdaderos_positivos: number;
      falsos_positivos: number;
      verdaderos_negativos: number;
      falsos_negativos: number;
    };
    factores_riesgo: {
      asistencia: { sin_riesgo: number; con_riesgo: number };
      incidencias: { sin_riesgo: number; con_riesgo: number };
      sentimiento: { sin_riesgo: number; con_riesgo: number };
      situacion_familiar: { sin_riesgo: number; con_riesgo: number };
    };
  };
  resultados: Array<{
    DNI: string;
    Apellidos_Nombres: string;
    Seccion: string;
    Grado: string;
    NotaBim1: number;
    NotaBim2: number;
    NotaBim3: number;
    Nota_Proyectada_B4: number;
    Prediccion_Final_Binaria: 0 | 1;
    Estado: string;
    Analisis_Asistencia: 0 | 1;
    Analisis_Incidencias: 0 | 1;
    Analisis_Sentimiento_Estudiante: 0 | 1;
    Analisis_Situacion_Familiar: 0 | 1;
  }>;
}
```

### 6.2 Servicio Python (Flask)

#### 6.2.1 Endpoint Health

**GET** `/health`
- **Respuesta**: `{ "status": "ok", "service": "python-analysis" }`
- **Descripción**: Verifica que el servicio está funcionando

#### 6.2.2 Endpoint Análisis

**POST** `/sate-analysis`
- **Body**: 
```json
{
  "mongodb_uri": "mongodb+srv://...",
  "database_name": "escuela_db"
}
```
- **Respuesta**: `SATEAnalysisResult` (misma estructura que arriba)
- **Descripción**: Ejecuta el análisis SATE-SR completo
- **Timeout**: 5 minutos

---

## 7. Resultados y Métricas

### 7.1 Ejemplo de Resultados

#### 7.1.1 Métricas Principales

```json
{
  "total_estudiantes": 150,
  "aprueba": 120,
  "desaprueba": 30,
  "porcentaje_aprueba": 80.0,
  "porcentaje_desaprueba": 20.0,
  "promedio_nota_proyectada": 14.5
}
```

#### 7.1.2 Métricas de Validación

```json
{
  "precision": 0.85,
  "recall": 0.90,
  "f1_score": 0.875,
  "auc_roc": 0.87
}
```

**Interpretación**:
- **Precision 85%**: De 100 estudiantes predichos como "Aprueba", 85 realmente aprueban
- **Recall 90%**: De 100 estudiantes que realmente aprueban, identificamos 90
- **F1-Score 87.5%**: Balance entre Precision y Recall
- **AUC-ROC 0.87**: Buena capacidad de discriminación

#### 7.1.3 Matriz de Confusión

```json
{
  "verdaderos_positivos": 108,
  "falsos_positivos": 12,
  "verdaderos_negativos": 24,
  "falsos_negativos": 6
}
```

**Visualización**:
```
                Predicción
              APRUEBA  DESAPRUEBA
Realidad APRUEBA   108      6
        DESAPRUEBA  12     24
```

#### 7.1.4 Factores de Riesgo

```json
{
  "asistencia": {
    "sin_riesgo": 130,
    "con_riesgo": 20
  },
  "incidencias": {
    "sin_riesgo": 140,
    "con_riesgo": 10
  },
  "sentimiento": {
    "sin_riesgo": 135,
    "con_riesgo": 15
  },
  "situacion_familiar": {
    "sin_riesgo": 125,
    "con_riesgo": 25
  }
}
```

### 7.2 Interpretación de Resultados

#### 7.2.1 Estado Seguro vs Estado Riesgo

- **Estado Seguro (Aprueba)**: Estudiantes con `Nota_Proyectada_B4 >= 12`
- **Estado Riesgo (Desaprueba)**: Estudiantes con `Nota_Proyectada_B4 < 12`

#### 7.2.2 Factores de Riesgo Individuales

Cada estudiante puede tener múltiples factores de riesgo:
- **Sin riesgo**: Factor = 1
- **Con riesgo**: Factor = 0

Un estudiante puede tener riesgo en:
- Solo asistencia
- Solo incidencias
- Múltiples factores combinados

#### 7.2.3 Nota Proyectada

La nota proyectada es el resultado de:
1. Proyección por regresión lineal (o método robusto si hay outliers)
2. Aplicación de límite de cambio máximo (±4 puntos)
3. Penalización por factores de riesgo
4. Validación de rango [5, 20]

---

## 8. Gráficos y Visualizaciones

### 8.1 Matriz de Confusión

**Tipo**: Matriz 2x2 con colores

**Componente**: `ConfusionMatrixChart.tsx`

**Características**:
- 4 celdas: TP, FP, TN, FN
- Colores: Verde (correctos), Rojo (incorrectos)
- Valores absolutos y porcentajes
- Tooltips con información detallada

**Ejemplo Visual**:
```
┌─────────────┬─────────────┐
│     TP      │     FN      │
│  108 (72%)  │   6 (4%)    │ Verde
├─────────────┼─────────────┤
│     FP      │     TN      │
│  12 (8%)    │  24 (16%)   │ Rojo
└─────────────┴─────────────┘
```

### 8.2 Curva ROC

**Tipo**: Línea con área sombreada

**Componente**: `ROCCurveChart.tsx`

**Características**:
- Eje X: Tasa de Falsos Positivos (1 - Especificidad)
- Eje Y: Tasa de Verdaderos Positivos (Sensibilidad/Recall)
- Punto de operación actual marcado
- Área bajo la curva (AUC-ROC) mostrada
- Línea diagonal de referencia (AUC = 0.5)

**Interpretación**:
- Curva cerca de la esquina superior izquierda → Mejor modelo
- Curva cerca de la diagonal → Modelo pobre
- AUC-ROC > 0.9 → Excelente
- AUC-ROC 0.7-0.9 → Bueno
- AUC-ROC < 0.7 → Requiere mejoras

### 8.3 Factores de Riesgo (Pie Charts)

**Tipo**: Gráficos circulares (Pie Charts)

**Componente**: `PieChartComponent.tsx` (de Recharts)

**Características**:
- 4 gráficos: Asistencia, Incidencias, Sentimiento, Situación Familiar
- Colores: Verde (Sin Riesgo), Rojo (Con Riesgo)
- Porcentajes y valores absolutos
- Tooltips interactivos

**Ejemplo Visual**:
```
Asistencia:
┌─────────────────┐
│  Sin Riesgo     │ 86.7% (130)
│  Con Riesgo     │ 13.3% (20)
└─────────────────┘
```

### 8.4 Tabla de Resultados

**Tipo**: Tabla interactiva con paginación

**Características**:
- Columnas: DNI, Nombre, Sección, Grado, Notas, Proyección, Estado, Factores
- Filtros: Búsqueda, Sección, Grado, Estado, Factores
- Paginación: 50 items por página
- Ordenamiento: Por sección y nombre
- Exportación: CSV

**Badges de Estado**:
- `[OK] APRUEBA`: Verde (`bg-green-500`)
- `[X] DESAPRUEBA`: Rojo (`destructive`)

**Badges de Factores**:
- `✓A`, `✓I`, `✓S`, `✓F`: Verde (outline)
- `✗A`, `✗I`, `✗S`, `✗F`: Rojo (destructive)

---

## 9. Tablas de Datos

### 9.1 Estructura de Datos de Entrada

#### 9.1.1 Colección `nomina`

```json
{
  "DNI": "12345678",
  "Apellidos_Nombres": "García López, Juan",
  "sexo": "M",
  "padre_vive": true,
  "madre_vive": true,
  "trabaja_estudiante": false,
  "tipo_discapacidad": null,
  "situacion_matricula": "Regular"
}
```

#### 9.1.2 Colección `asistencia`

```json
{
  "DNI": "12345678",
  "Apellidos_Nombres": "García López, Juan",
  "Lunes": 1,
  "Martes": 1,
  "Miercoles": 0,
  "Jueves": 1,
  "Viernes": 1,
  ...
}
```

**Valores**:
- `1`: Asistió
- `0`: Faltó
- `2`: Justificada

#### 9.1.3 Colección `primer_bimestre` / `segundo_bimestre` / `tercer_bimestre`

```json
{
  "DNI": "12345678",
  "Apellidos_Nombres": "García López, Juan",
  "PROMEDIO_APRENDIZAJE_AUTONOMO": "A"
}
```

**Valores posibles**: `C`, `B`, `A`, `AD`

#### 9.1.4 Colección `incidente`

```json
{
  "Nombre y Apellido": "García López, Juan",
  "Tipo de Falta": "Grave"
}
```

**Valores**: `Leve`, `Grave`

#### 9.1.5 Colección `encuesta`

```json
{
  "DNI": "12345678",
  "sugerencia_sentimientos": "Me siento bien en la escuela, los profesores son amables."
}
```

### 9.2 Estructura de Datos de Salida

#### 9.2.1 Resultado por Estudiante

```json
{
  "DNI": "12345678",
  "Apellidos_Nombres": "García López, Juan",
  "Seccion": "A",
  "Grado": "5",
  "NotaBim1": 16,
  "NotaBim2": 17,
  "NotaBim3": 18,
  "Nota_Proyectada_B4": 18.5,
  "Prediccion_Final_Binaria": 1,
  "Estado": "[OK] APRUEBA",
  "Analisis_Asistencia": 1,
  "Analisis_Incidencias": 1,
  "Analisis_Sentimiento_Estudiante": 1,
  "Analisis_Situacion_Familiar": 1
}
```

### 9.3 Transformaciones de Datos

#### 9.3.1 Conversión de Notas Cualitativas a Numéricas

```
C  → 5  (En Inicio)
B  → 13 (En Proceso)
A  → 16 (Logro Esperado)
AD → 19 (Logro Destacado)
```

#### 9.3.2 Cálculo de Porcentaje de Asistencia

```
Total días = Suma de todas las columnas de días
Total faltas = Suma de valores 0
Porcentaje faltas = (Total faltas / Total días) * 100
```

#### 9.3.3 Normalización de DNI

- Eliminar espacios
- Convertir a string
- Manejar diferentes formatos de campo (`DNI`, `dni`, `documento`)

---

## 10. Flujos de Datos

### 10.1 Flujo Completo de Análisis

```
1. Usuario hace clic en "Ejecutar Análisis"
   ↓
2. Frontend: AnalyticsView.tsx → ejecutarAnalisis()
   ↓
3. Frontend: ejecutarAnalisisSATE() → POST /api/analytics/sate-analysis
   ↓
4. Backend: Verifica conexión MongoDB
   ↓
5. Backend: Verifica servicio Python (/health)
   ↓
6. Backend: POST http://localhost:5000/sate-analysis
   ↓
7. Python: Conecta a MongoDB con PyMongo
   ↓
8. Python: Extrae datos (ETL)
   - Lee colección 'nomina'
   - Lee colección 'asistencia'
   - Lee colección 'primer_bimestre'
   - Lee colección 'segundo_bimestre'
   - Lee colección 'tercer_bimestre'
   - Lee colección 'incidente'
   - Lee colección 'encuesta'
   ↓
9. Python: Transforma datos
   - Convierte notas cualitativas a numéricas
   - Calcula porcentaje de asistencia
   - Analiza sentimiento (pysentimiento o manual)
   - Evalúa situación familiar
   - Identifica incidencias graves
   ↓
10. Python: Integra datos por DNI
    - Merge de todas las fuentes
    - Un estudiante = un registro completo
    ↓
11. Python: Ejecuta predicciones
    - Para cada estudiante:
      - Proyecta nota B4 (regresión lineal o robusta)
      - Aplica penalización por factores de riesgo
      - Clasifica (Aprueba/Desaprueba)
    ↓
12. Python: Valida modelo (temporal)
    - Usa Bim1 y Bim2 para predecir Bim3
    - Compara con Bim3 real
    - Calcula métricas (Precision, Recall, F1, AUC-ROC)
    ↓
13. Python: Prepara resultados JSON
    - Métricas agregadas
    - Lista de estudiantes con predicciones
    ↓
14. Python: Retorna JSON al Backend
    ↓
15. Backend: Retorna JSON al Frontend
    ↓
16. Frontend: Actualiza estado (analysisResult)
    ↓
17. Frontend: Renderiza gráficos y tablas
    - Cards de métricas
    - Matriz de confusión
    - Curva ROC
    - Factores de riesgo (pie charts)
    - Tabla de resultados
```

### 10.2 Flujo de Filtrado y Búsqueda

```
1. Usuario ingresa término de búsqueda o selecciona filtros
   ↓
2. Frontend: Estados actualizados (searchTerm, filterSeccion, etc.)
   ↓
3. Frontend: useMemo recalcula resultadosFiltrados
   ↓
4. Frontend: Aplica filtros:
   - Búsqueda por nombre/DNI
   - Filtro por sección
   - Filtro por grado
   - Filtro por estado (tab)
   - Filtro por factores de riesgo
   ↓
5. Frontend: Renderiza tabla con resultados filtrados
   ↓
6. Frontend: Aplica paginación (50 items por página)
   ↓
7. Frontend: Muestra página actual
```

### 10.3 Flujo de Validación Temporal

```
1. Python: Para cada estudiante con Bim1, Bim2 y Bim3:
   ↓
2. Realidad: Clasifica Bim3 real (≥12 = 1, <12 = 0)
   ↓
3. Predicción: Usa solo Bim1 y Bim2:
   - Calcula cambio: Bim2 - Bim1
   - Proyecta Bim3: Bim2 + cambio
   - Aplica límite de cambio máximo (±4)
   - Aplica penalización por factores de riesgo
   - Clasifica (≥12 = 1, <12 = 0)
   ↓
4. Compara: Realidad vs Predicción
   ↓
5. Acumula: y_true_temporal, y_pred_temporal
   ↓
6. Calcula métricas: Precision, Recall, F1, AUC-ROC
```

---

## 11. Configuración Técnica

### 11.1 Variables de Entorno

#### 11.1.1 Backend (.env)

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=app-name
MONGODB_DB_NAME=escuela_db

# Server Configuration
SERVER_PORT=3001

# Python Service (opcional, default: http://localhost:5000)
PYTHON_SERVICE_URL=http://localhost:5000
```

#### 11.1.2 Frontend (producción)

```env
VITE_API_URL=https://tu-servidor-backend.com:3001
```

### 11.2 Dependencias Python

#### 11.2.1 Completas (requirements.txt)

```
Flask==3.0.0
Flask-CORS==4.0.0
pymongo==4.6.0
scikit-learn==1.3.2
numpy==1.24.3
pandas==2.1.4
pysentimiento==0.7.0
torch==2.1.0
transformers==4.35.0
```

#### 11.2.2 Mínimas (requirements_minimal.txt)

```
Flask==3.0.0
Flask-CORS==4.0.0
pymongo==4.6.0
pysentimiento==0.7.0
torch==2.1.0
transformers==4.35.0
```

### 11.3 Scripts npm

```json
{
  "dev": "vite",
  "dev:server": "node server/index.js",
  "dev:python": "cd server/python_analysis && py app.py",
  "dev:all": "concurrently \"npm run dev:server\" \"npm run dev\"",
  "dev:all-with-python": "concurrently \"npm run dev:server\" \"npm run dev:python\" \"npm run dev\"",
  "python:install": "cd server/python_analysis && py -m pip install -r requirements.txt",
  "python:install:minimal": "cd server/python_analysis && py -m pip install -r requirements_minimal.txt",
  "python:install:pysentimiento": "cd server/python_analysis && py -m pip install pysentimiento torch transformers"
}
```

### 11.4 Puertos por Defecto

- **Frontend**: `http://localhost:8080`
- **Backend Node.js**: `http://localhost:3001`
- **Servicio Python**: `http://localhost:5000`

### 11.5 Timeouts

- **Health Check Python**: 2 segundos
- **Análisis SATE-SR**: 5 minutos (300 segundos)

---

## 12. Ejemplos de Uso

### 12.1 Ejecutar Análisis Completo

1. **Conectar a MongoDB**:
   - Ir a Configuración
   - Ingresar URI y nombre de base de datos
   - Clic en "Conectar"

2. **Ejecutar Análisis**:
   - Ir a Analytics
   - El análisis se ejecuta automáticamente al cargar
   - O hacer clic en "Ejecutar Análisis"

3. **Revisar Resultados**:
   - Métricas principales en cards superiores
   - Métricas de validación en card central
   - Matriz de confusión y curva ROC
   - Factores de riesgo en pie charts
   - Tabla detallada con todos los estudiantes

### 12.2 Filtrar Resultados

1. **Búsqueda por nombre**:
   - Escribir en campo de búsqueda
   - La tabla se filtra automáticamente

2. **Filtro por sección**:
   - Seleccionar sección en dropdown
   - La tabla muestra solo esa sección

3. **Filtro por estado**:
   - Clic en tab "Aprueba" o "Desaprueba"
   - La tabla muestra solo ese estado

4. **Filtro por factores de riesgo**:
   - Marcar checkboxes de factores
   - La tabla muestra solo estudiantes con esos factores

### 12.3 Exportar Resultados

1. **Exportar a CSV**:
   - Clic en botón "Exportar CSV"
   - Se descarga archivo `sate-sr-resultados-YYYY-MM-DDTHH-MM-SS.csv`
   - Contiene todos los resultados filtrados actuales

### 12.4 Interpretar Métricas

1. **AUC-ROC**:
   - Si > 0.9: Excelente modelo
   - Si 0.7-0.9: Buen modelo
   - Si < 0.7: Requiere mejoras

2. **Precision**:
   - Si alta (>0.8): Pocos falsos positivos
   - Si baja (<0.7): Muchos estudiantes predichos como "Aprueba" realmente desaprueban

3. **Recall**:
   - Si alta (>0.8): Identifica la mayoría de estudiantes que aprueban
   - Si baja (<0.7): Se pierden muchos estudiantes que realmente aprueban

4. **F1-Score**:
   - Balance entre Precision y Recall
   - Útil cuando hay desbalance entre clases

---

## 13. Troubleshooting

### 13.1 Error: "No hay conexión a MongoDB"

**Causas**:
- Servidor backend no está corriendo
- URI de MongoDB incorrecta
- IP no permitida en MongoDB Atlas
- Credenciales incorrectas

**Soluciones**:
1. Verificar que el servidor esté corriendo: `npm run dev:server`
2. Revisar `.env` y la URI de MongoDB
3. En MongoDB Atlas, agregar IP en Network Access
4. Verificar usuario y contraseña

### 13.2 Error: "Servicio Python no disponible"

**Causas**:
- Servicio Python no está corriendo
- Puerto 5000 ocupado
- Dependencias Python no instaladas

**Soluciones**:
1. Ejecutar servicio Python: `npm run dev:python`
2. Verificar que el puerto 5000 esté libre
3. Instalar dependencias: `npm run python:install`

### 13.3 Error: "No se encontraron estudiantes"

**Causas**:
- Colecciones vacías
- Nombres de colecciones incorrectos
- Campos con nombres diferentes

**Soluciones**:
1. Verificar que las colecciones tengan datos
2. Verificar nombres: `nomina`, `asistencia`, `primer_bimestre`, etc.
3. Revisar nombres de campos en `sate_analysis.py`

### 13.4 AUC-ROC = 1.000 (Demasiado Alto)

**Causa**: Data leakage (usar NotaBim3 para predecir y validar)

**Solución**: Ya corregido - ahora usa validación temporal (Bim1+Bim2 → Bim3)

### 13.5 Sentimiento siempre "Sin Riesgo"

**Causas**:
- `pysentimiento` no instalado
- Textos vacíos o neutros
- Análisis manual no detecta palabras negativas

**Soluciones**:
1. Instalar `pysentimiento`: `npm run python:install:pysentimiento`
2. Verificar que las encuestas tengan texto
3. Revisar logs de Python para ver análisis de sentimiento

---

## 14. Conclusión

El sistema SATE-SR v2.0 es una solución completa para la predicción temprana de riesgo académico. Combina:

- **Análisis Multifactorial**: Evalúa 4 factores de riesgo principales
- **Validación Estadística**: Métricas robustas (Precision, Recall, F1, AUC-ROC)
- **Visualización Interactiva**: Gráficos y tablas comprensibles
- **Arquitectura Modular**: Frontend React, Backend Node.js, Análisis Python
- **Escalabilidad**: Preparado para crecer con más datos y estudiantes

El sistema está diseñado para ser:
- **Fácil de usar**: Interfaz intuitiva
- **Confiable**: Validación temporal realista
- **Extensible**: Fácil agregar nuevos factores o métricas
- **Mantenible**: Código bien estructurado y documentado

---

**Versión del Documento**: 1.0  
**Última Actualización**: 2024  
**Autor**: Sistema SATE-SR v2.0

