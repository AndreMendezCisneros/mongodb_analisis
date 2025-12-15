# Requisitos para Generar Gráficos Automáticos e Intuitivos

## 📊 ¿Qué se necesita?

### 1. **Estructura de Datos en MongoDB**

#### ✅ Datos que funcionan bien:

```javascript
// Ejemplo 1: Datos categóricos con valores numéricos
{
  "SECCIÓN": "A",
  "Día_1": 25,
  "Día_2": 30,
  "ALUMNOS/AS": "Juan Pérez"
}

// Ejemplo 2: Datos temporales
{
  "fecha": "2024-01-15",
  "ventas": 1500,
  "producto": "Laptop"
}

// Ejemplo 3: Datos de conteo
{
  "categoria": "Electrónica",
  "producto": "Smartphone",
  "precio": 500
}
```

### 2. **Tipos de Campos Requeridos**

#### 🔢 **Campos Numéricos (para valores)**
- ✅ **Deben tener:**
  - Valores variados (no todos iguales)
  - Al menos 10% de valores no cero
  - No ser identificadores (evita DNI, código, número, etc.)
  
- ✅ **Ejemplos buenos:**
  - `total`, `cantidad`, `precio`, `monto`
  - `nota`, `asistencia`, `día_1`, `día_2`
  - `ventas`, `ingresos`, `puntuación`

- ❌ **Ejemplos malos (se excluyen automáticamente):**
  - `DNI`, `codigo`, `numero`, `id`
  - Valores todos iguales (ej: todos son 0)
  - Números muy grandes y únicos (probablemente IDs)

#### 📝 **Campos Categóricos/Texto (para agrupar)**
- ✅ **Deben tener:**
  - Valores repetidos (categorías)
  - No ser identificadores únicos
  
- ✅ **Ejemplos buenos:**
  - `nombre`, `sección`, `categoría`, `tipo`
  - `alumno`, `estudiante`, `producto`
  - `departamento`, `ciudad`, `marca`

- ❌ **Ejemplos malos:**
  - `DNI`, `codigo`, `numero`, `id`
  - Valores únicos para cada documento

#### 📅 **Campos de Fecha (para series temporales)**
- ✅ **Formatos aceptados:**
  - Objetos `Date` de MongoDB
  - Strings con formato `YYYY-MM-DD` (ej: "2024-01-15")
  
- ✅ **Ejemplos buenos:**
  - `fecha`, `fecha_creacion`, `mes`, `año`
  - `fecha_venta`, `fecha_registro`

### 3. **Combinaciones que Generan Gráficos Intuitivos**

#### 📊 **Gráfico de Barras/Columnas**
**Necesitas:**
- 1 campo categórico (texto) + 1 campo numérico
- O solo campos categóricos (genera conteo)

**Ejemplo:**
```javascript
{
  "SECCIÓN": "A",      // Categórico
  "Día_1": 25          // Numérico
}
```
**Genera:** "¿Cuál es el valor de día 1 para cada sección?"

#### 🥧 **Gráfico Circular/Pie**
**Necesitas:**
- 1 campo categórico + 1 campo numérico
- Máximo 10 categorías únicas

**Ejemplo:**
```javascript
{
  "categoria": "Electrónica",  // Categórico
  "ventas": 1500               // Numérico
}
```
**Genera:** "¿Qué proporción del total de ventas representa cada categoría?"

#### 📈 **Gráfico de Línea**
**Necesitas:**
- 1 campo de fecha + 1 campo numérico

**Ejemplo:**
```javascript
{
  "fecha": "2024-01-15",  // Fecha
  "ventas": 1500          // Numérico
}
```
**Genera:** "¿Cómo cambian las ventas a lo largo del tiempo?"

#### 📊 **Gráfico de Área**
**Necesitas:**
- 1 campo de fecha + 1 o más campos numéricos

**Ejemplo:**
```javascript
{
  "fecha": "2024-01-15",
  "ventas": 1500,
  "costos": 800
}
```
**Genera:** "¿Cuál es el volumen acumulado de ventas a lo largo del tiempo?"

#### 🕸️ **Gráfico Radar**
**Necesitas:**
- 1 campo categórico + 3 o más campos numéricos

**Ejemplo:**
```javascript
{
  "alumno": "Juan Pérez",
  "matematica": 85,
  "ciencias": 90,
  "historia": 78,
  "literatura": 82
}
```
**Genera:** "¿Cómo se comparan múltiples métricas para diferentes alumnos?"

### 4. **Requisitos Mínimos**

#### ✅ **Para que funcione:**
1. **Conexión a MongoDB** activa
2. **Al menos 1 colección** con datos
3. **Mínimo 2 documentos** en la colección
4. **Al menos 1 campo numérico** O **campos categóricos** para conteo

#### ⚠️ **Limitaciones actuales:**
- Analiza máximo **100 documentos** por colección para sugerencias
- Genera gráficos con máximo **50 puntos de datos** para rendimiento
- Excluye automáticamente campos que parecen IDs
- Requiere variación en los datos (no todos iguales)

### 5. **Mejores Prácticas**

#### ✅ **Nombres de campos descriptivos:**
```javascript
// ✅ Bueno
{
  "nombre_alumno": "Juan",
  "nota_final": 85,
  "fecha_examen": "2024-01-15"
}

// ❌ Evitar
{
  "n": "Juan",        // Muy corto
  "v": 85,            // No descriptivo
  "d": "2024-01-15"  // Ambiguo
}
```

#### ✅ **Datos consistentes:**
- Mismo tipo de dato en todos los documentos
- Valores nulos mínimos
- Formato de fechas consistente

#### ✅ **Volumen de datos:**
- Mínimo: 2-5 documentos (para gráficos básicos)
- Óptimo: 10-100 documentos (para gráficos más significativos)
- Máximo recomendado: 1000 documentos por colección

### 6. **Qué hace el Sistema Automáticamente**

1. **Detecta tipos de campos** (numérico, texto, fecha)
2. **Filtra campos inútiles** (IDs, códigos, valores constantes)
3. **Selecciona mejores campos** (prefiere nombres descriptivos)
4. **Sugiere tipo de gráfico** apropiado según los datos
5. **Genera descripciones** que responden preguntas específicas
6. **Valida datos** antes de crear gráficos (evita gráficos vacíos)

### 7. **Ejemplo Completo**

```javascript
// Colección: "asistencia"
[
  {
    "SECCIÓN": "A",
    "ALUMNOS/AS": "Juan Pérez",
    "Día_1": 1,
    "Día_2": 1,
    "Día_3": 0
  },
  {
    "SECCIÓN": "A",
    "ALUMNOS/AS": "María García",
    "Día_1": 1,
    "Día_2": 0,
    "Día_3": 1
  },
  {
    "SECCIÓN": "B",
    "ALUMNOS/AS": "Pedro López",
    "Día_1": 0,
    "Día_2": 1,
    "Día_3": 1
  }
]

// El sistema generará automáticamente:
// ✅ "¿Cuál es el valor de día 1 para cada sección?" (Barras)
// ✅ "¿Cuántas veces aparece cada sección?" (Conteo)
// ✅ "Distribución de sección" (Circular)
```

### 8. **Solución de Problemas**

#### ❌ **No se generan gráficos:**
- Verifica que haya campos numéricos (no solo IDs)
- Asegúrate de que los valores tengan variación
- Revisa que haya al menos 10% de valores no cero

#### ❌ **Gráficos vacíos:**
- Verifica que los datos tengan valores reales
- Asegúrate de que los campos existan en los documentos
- Revisa que los nombres de campos sean correctos

#### ❌ **Gráficos poco intuitivos:**
- Usa nombres de campos descriptivos
- Evita campos que sean IDs o códigos
- Asegúrate de tener datos con sentido (no solo números aleatorios)
