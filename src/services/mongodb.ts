const API_BASE_URL = '/api';

export interface MongoDBStatus {
  connected: boolean;
  database?: string;
  collections?: Array<{ name: string }>;
  error?: string;
}

export interface MongoDBConnection {
  success: boolean;
  message: string;
  database?: string;
}

export interface CollectionData {
  collection: string;
  total: number;
  limit: number;
  skip: number;
  data: any[];
}

// Conectar a MongoDB
export async function connectToMongoDB(uri?: string, database?: string): Promise<MongoDBConnection> {
  try {
    const response = await fetch(`${API_BASE_URL}/mongodb/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uri, database }),
    });

    if (!response.ok) {
      let errorMessage = 'Error al conectar a MongoDB';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 0 || !response.status) {
          errorMessage = 'No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.';
        }
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('El servidor devolvió una respuesta vacía');
    }

    return JSON.parse(text);
  } catch (error) {
    // Mejorar mensajes de error para errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.');
    }
    throw error;
  }
}

// Verificar estado de conexión
export async function checkMongoDBStatus(): Promise<MongoDBStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/mongodb/status`);
    
    if (!response.ok) {
      let errorMessage = 'Error al verificar conexión';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 0 || !response.status) {
          errorMessage = 'No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo.';
        }
      }
      return { connected: false, error: errorMessage };
    }

    const text = await response.text();
    if (!text) {
      return { connected: false, error: 'El servidor devolvió una respuesta vacía' };
    }

    return JSON.parse(text);
  } catch (error) {
    // Manejar errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        connected: false, 
        error: 'No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.'
      };
    }
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Listar colecciones
export async function listCollections(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/mongodb/collections`);
    
    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      let errorMessage = 'Error al listar colecciones';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Si no se puede parsear el error, usar el mensaje por defecto
        if (response.status === 400) {
          errorMessage = 'No hay conexión a MongoDB. Por favor, conéctate primero.';
        } else if (response.status === 0 || !response.status) {
          errorMessage = 'No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo.';
        }
      }
      throw new Error(errorMessage);
    }

    // Verificar que la respuesta tenga contenido antes de parsear
    const text = await response.text();
    if (!text) {
      throw new Error('El servidor devolvió una respuesta vacía');
    }

    const data = JSON.parse(text);
    return data.collections || [];
  } catch (error) {
    // Mejorar mensajes de error para errores de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.');
    }
    throw error;
  }
}

// Obtener datos de una colección
export async function getCollectionData(
  collectionName: string,
  options?: { limit?: number; skip?: number; filter?: any }
): Promise<CollectionData> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());
    if (options?.filter) {
      params.append('filter', JSON.stringify(options.filter));
    }

    const response = await fetch(
      `${API_BASE_URL}/mongodb/collection/${collectionName}?${params.toString()}`
    );

    if (!response.ok) {
      let errorMessage = 'Error al obtener datos';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (response.status === 400) {
          errorMessage = 'No hay conexión a MongoDB. Por favor, conéctate primero.';
        } else if (response.status === 0 || !response.status) {
          errorMessage = 'No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo.';
        }
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('El servidor devolvió una respuesta vacía');
    }

    return JSON.parse(text);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se puede conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.');
    }
    throw error;
  }
}

// Ejecutar agregación
export async function executeAggregation(
  collectionName: string,
  pipeline: any[]
): Promise<{ collection: string; count: number; data: any[] }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/mongodb/aggregate/${collectionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pipeline }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al ejecutar agregación');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Desconectar de MongoDB
export async function disconnectFromMongoDB(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/mongodb/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al desconectar');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

