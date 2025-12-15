import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto (un nivel arriba de server/)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

let client = null;
let db = null;

// Conectar a MongoDB
async function connectToMongoDB(customUri = null, customDbName = null) {
  try {
    // Si ya hay una conexión, desconectar primero
    if (client) {
      await client.close();
      client = null;
      db = null;
    }

    const uri = customUri || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI no está configurada. Por favor, proporciona una URI de conexión.');
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const dbName = customDbName || process.env.MONGODB_DB_NAME || 'escuela_db';
    db = client.db(dbName);
    
    console.log('✅ Conectado a MongoDB');
    return { success: true, message: 'Conectado exitosamente a MongoDB', database: dbName };
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    client = null;
    db = null;
    throw error;
  }
}

// Verificar conexión
async function checkConnection() {
  try {
    if (!client || !db) {
      return { connected: false };
    }
    
    // Ping a la base de datos para verificar conexión
    await db.admin().ping();
    return { 
      connected: true, 
      database: db.databaseName,
      collections: await db.listCollections().toArray()
    };
  } catch (error) {
    client = null;
    db = null;
    return { connected: false, error: error.message };
  }
}

// Endpoint: Conectar a MongoDB
app.post('/api/mongodb/connect', async (req, res) => {
  try {
    const { uri, database } = req.body;
    const result = await connectToMongoDB(uri, database);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint: Verificar estado de conexión
app.get('/api/mongodb/status', async (req, res) => {
  try {
    const status = await checkConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      connected: false, 
      error: error.message 
    });
  }
});

// Endpoint: Listar colecciones
app.get('/api/mongodb/collections', async (req, res) => {
  try {
    const status = await checkConnection();
    if (!status.connected) {
      return res.status(400).json({ error: 'No hay conexión a MongoDB' });
    }

    const collections = await db.listCollections().toArray();
    res.json({ collections: collections.map(c => c.name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Obtener datos de una colección
app.get('/api/mongodb/collection/:collectionName', async (req, res) => {
  try {
    const status = await checkConnection();
    if (!status.connected) {
      return res.status(400).json({ error: 'No hay conexión a MongoDB' });
    }

    const { collectionName } = req.params;
    const { limit = 100, skip = 0, filter } = req.query;

    const collection = db.collection(collectionName);
    
    // Parsear filtro si está presente
    let queryFilter = {};
    if (filter) {
      try {
        queryFilter = JSON.parse(filter);
      } catch (e) {
        return res.status(400).json({ error: 'Filtro JSON inválido' });
      }
    }

    const documents = await collection
      .find(queryFilter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();

    const count = await collection.countDocuments(queryFilter);

    res.json({
      collection: collectionName,
      total: count,
      limit: parseInt(limit),
      skip: parseInt(skip),
      data: documents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Ejecutar agregación
app.post('/api/mongodb/aggregate/:collectionName', async (req, res) => {
  try {
    const status = await checkConnection();
    if (!status.connected) {
      return res.status(400).json({ error: 'No hay conexión a MongoDB' });
    }

    const { collectionName } = req.params;
    const { pipeline = [] } = req.body;

    const collection = db.collection(collectionName);
    const results = await collection.aggregate(pipeline).toArray();

    res.json({
      collection: collectionName,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Desconectar
app.post('/api/mongodb/disconnect', async (req, res) => {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      res.json({ success: true, message: 'Desconectado de MongoDB' });
    } else {
      res.json({ success: true, message: 'No había conexión activa' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configuración del servicio Python (SOLO PYTHON - sin fallback a JavaScript)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

// Endpoint: Ejecutar análisis SATE-SR (SOLO PYTHON)
app.post('/api/analytics/sate-analysis', async (req, res) => {
  try {
    const status = await checkConnection();
    if (!status.connected) {
      return res.status(400).json({ 
        success: false,
        error: 'No hay conexión a MongoDB. Por favor, conecta primero a la base de datos.' 
      });
    }

    if (!db) {
      return res.status(500).json({ 
        success: false,
        error: 'Error interno: Base de datos no inicializada' 
      });
    }

    console.log('📊 Iniciando análisis SATE-SR (Python - único método)...');
    
    // Verificar si el servicio Python está disponible
    let healthCheck;
    try {
      healthCheck = await fetch(`${PYTHON_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
      });
    } catch (healthError) {
      return res.status(503).json({
        success: false,
        error: `El servicio Python no está disponible en ${PYTHON_SERVICE_URL}. Por favor, asegúrate de que el servicio Python esté corriendo.`,
        detalles: `Ejecuta: cd server/python_analysis && py app.py`,
        tipo_error: 'SERVICIO_PYTHON_NO_DISPONIBLE'
      });
    }

    if (!healthCheck || !healthCheck.ok) {
      return res.status(503).json({
        success: false,
        error: `El servicio Python no está respondiendo correctamente en ${PYTHON_SERVICE_URL}. Verifica que el servicio esté corriendo y funcionando.`,
        detalles: `Ejecuta: cd server/python_analysis && py app.py`,
        tipo_error: 'SERVICIO_PYTHON_NO_RESPONDE'
      });
    }

    // Usar servicio Python (único método)
    const response = await fetch(`${PYTHON_SERVICE_URL}/sate-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mongodb_uri: process.env.MONGODB_URI,
        database_name: db.databaseName
      }),
      signal: AbortSignal.timeout(300000) // Timeout de 5 minutos para el análisis
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Error del servicio Python: ${response.status} ${response.statusText}`;
      
      return res.status(response.status || 500).json({
        success: false,
        error: errorMessage,
        detalles: errorData.detalles || errorData.stack,
        tipo_error: 'ERROR_SERVICIO_PYTHON'
      });
    }

    const resultado = await response.json();
    console.log('✅ Análisis SATE-SR completado exitosamente (Python)');
    return res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error ejecutando análisis SATE:', error);
    
    // Proporcionar mensajes de error más descriptivos
    let mensajeError = error.message || 'Error desconocido al ejecutar el análisis';
    let tipoError = 'ERROR_DESCONOCIDO';
    
    // Mensajes específicos para errores comunes
    if (mensajeError.includes('No se encontraron estudiantes')) {
      mensajeError = 'No se encontraron estudiantes para analizar. Verifica que las colecciones (nomina, asistencia, primer_bimestre, segundo_bimestre, tercer_bimestre, incidente, encuesta) contengan datos.';
      tipoError = 'SIN_DATOS';
    } else if (mensajeError.includes('collection')) {
      mensajeError = `Error al acceder a las colecciones de MongoDB: ${mensajeError}`;
      tipoError = 'ERROR_MONGODB';
    } else if (mensajeError.includes('fetch') || mensajeError.includes('ECONNREFUSED') || mensajeError.includes('timeout')) {
      mensajeError = `No se puede conectar al servicio Python en ${PYTHON_SERVICE_URL}. Asegúrate de que el servicio Python esté corriendo.`;
      tipoError = 'SERVICIO_PYTHON_NO_DISPONIBLE';
    }
    
    res.status(500).json({ 
      success: false,
      error: mensajeError,
      tipo_error: tipoError,
      detalles: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 MongoDB URI configurada: ${process.env.MONGODB_URI ? 'Sí' : 'No'}`);
});

// Manejar cierre limpio
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB desconectado');
  }
  process.exit(0);
});

