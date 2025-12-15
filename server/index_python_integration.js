/**
 * Ejemplo de integración del análisis Python con Node.js
 * 
 * Para usar este archivo:
 * 1. Renombra index.js a index_backup.js
 * 2. Renombra este archivo a index.js
 * 3. Asegúrate de que el servicio Python esté corriendo en el puerto 5000
 */

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

app.use(cors());
app.use(express.json());

let client = null;
let db = null;

// ... (mantener todas las funciones de conexión MongoDB existentes)
// ... (mantener todos los endpoints existentes excepto el de análisis)

// Endpoint: Ejecutar análisis SATE-SR usando Python
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

    console.log('📊 Iniciando análisis SATE-SR (Python)...');
    
    // Llamar al servicio Python
    const response = await fetch(`${PYTHON_SERVICE_URL}/sate-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mongodb_uri: process.env.MONGODB_URI,
        database_name: db.databaseName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servicio Python: ${response.status}`);
    }

    const resultado = await response.json();
    
    console.log('✅ Análisis SATE-SR completado exitosamente (Python)');
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error ejecutando análisis SATE:', error);
    
    let mensajeError = error.message || 'Error desconocido al ejecutar el análisis';
    
    // Verificar si el servicio Python está disponible
    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      mensajeError = `No se puede conectar al servicio Python. Asegúrate de que esté corriendo en ${PYTHON_SERVICE_URL}`;
    }
    
    res.status(500).json({ 
      success: false,
      error: mensajeError,
      detalles: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ... (resto del código del servidor)



