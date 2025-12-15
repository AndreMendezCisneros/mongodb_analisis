# Servicio de Análisis SATE-SR en Python

Este servicio permite ejecutar el análisis SATE-SR usando Python en lugar de JavaScript.

## Instalación

```bash
cd server/python_analysis
pip install -r requirements.txt
```

## Ejecución

```bash
python app.py
```

El servicio estará disponible en `http://localhost:5000`

## Endpoints

### POST /sate-analysis

Ejecuta el análisis SATE-SR completo.

**Request Body:**
```json
{
  "mongodb_uri": "mongodb+srv://...",
  "database_name": "escuela_db"
}
```

**Response:**
```json
{
  "success": true,
  "version": "2.0.0",
  "total_estudiantes": 150,
  "metricas": { ... },
  "resultados": [ ... ]
}
```

## Integración con Node.js

Para usar este servicio desde Node.js, modifica `server/index.js`:

```javascript
// En lugar de importar sateAnalysis.js
app.post('/api/analytics/sate-analysis', async (req, res) => {
  try {
    const response = await fetch('http://localhost:5000/sate-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mongodb_uri: process.env.MONGODB_URI,
        database_name: process.env.MONGODB_DB_NAME
      })
    });
    
    const resultado = await response.json();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Ventajas de usar Python

1. **Librerías de ML**: scikit-learn, pandas, numpy
2. **Mejor rendimiento** en análisis numéricos
3. **Más fácil de mantener** código de análisis complejo
4. **Comunidad científica** más grande para ML



