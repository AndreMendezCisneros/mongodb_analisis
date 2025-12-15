// Detectar si estamos en desarrollo o producción y obtener la URL base del API
const getApiBaseUrl = () => {
  // En desarrollo, usar el proxy de Vite
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // En producción, usar la variable de entorno VITE_API_URL si está definida
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Asegurarse de que termine con /api
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/api`;
  }
  
  // Si no hay variable de entorno, intentar inferirla desde la URL actual
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  const backendPort = import.meta.env.VITE_BACKEND_PORT || '3001';
  
  // Si estamos en localhost, usar localhost con el puerto del backend
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return `${currentProtocol}//${currentHost}:${backendPort}/api`;
  }
  
  // En producción, intentar usar el mismo dominio pero con el puerto del backend
  // O si el backend está en un subdominio, ajustar según sea necesario
  // Por defecto, intentar usar una ruta relativa (asume que el backend está en el mismo servidor)
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log para depuración (siempre, para ayudar en producción)
console.log('🔧 Configuración del API:');
console.log('  - Entorno:', import.meta.env.DEV ? 'Desarrollo' : 'Producción');
console.log('  - API Base URL:', API_BASE_URL);
console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL || 'No configurada');
console.log('  - Hostname actual:', window.location.hostname);
console.log('  - Protocolo actual:', window.location.protocol);

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
  const url = `${API_BASE_URL}/mongodb/connect`;
  
  // Log para depuración
  console.log('🔌 Intentando conectar a MongoDB');
  console.log('📍 URL del API:', url);
  console.log('🌍 Entorno:', import.meta.env.DEV ? 'Desarrollo' : 'Producción');
  if (import.meta.env.VITE_API_URL) {
    console.log('⚙️ VITE_API_URL configurada:', import.meta.env.VITE_API_URL);
  }
  
  try {
    const requestBody = { uri, database };
    console.log('📤 Enviando petición:', { 
      url, 
      method: 'POST',
      hasUri: !!uri,
      hasDatabase: !!database 
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    if (!response.ok) {
      let errorMessage = 'Error al conectar a MongoDB';
      let errorDetails = '';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorDetails = JSON.stringify(errorData, null, 2);
      } catch (parseError) {
        const responseText = await response.text().catch(() => '');
        errorDetails = responseText || 'No se pudo parsear la respuesta';
        
        if (response.status === 0 || !response.status) {
          errorMessage = `No se puede conectar al servidor backend.\n\nURL intentada: ${url}\n\nPosibles causas:\n1. El servidor backend no está corriendo\n2. La URL del servidor es incorrecta\n3. Problemas de CORS o firewall`;
        } else if (response.status === 404) {
          errorMessage = `Endpoint no encontrado.\n\nURL intentada: ${url}\n\nVerifica que:\n1. El servidor backend esté corriendo\n2. La ruta /api/mongodb/connect exista\n3. La configuración de VITE_API_URL sea correcta`;
        } else if (response.status === 500) {
          errorMessage = `Error del servidor (500).\n\nDetalles: ${errorDetails}\n\nVerifica los logs del servidor backend.`;
        } else if (response.status >= 400) {
          errorMessage = `Error ${response.status}: ${response.statusText}\n\nDetalles: ${errorDetails}`;
        }
      }
      
      console.error('❌ Error de conexión:', {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        errorDetails
      });
      
      throw new Error(errorMessage);
    }

    // Verificar Content-Type antes de parsear
    const contentType = response.headers.get('content-type') || '';
    console.log('📋 Content-Type:', contentType);
    
    const text = await response.text();
    if (!text) {
      throw new Error('El servidor devolvió una respuesta vacía');
    }

    // Detectar si la respuesta es HTML (problema común en producción)
    const isHTML = contentType.includes('text/html') || 
                   text.trim().startsWith('<!') || 
                   text.trim().startsWith('<!DOCTYPE') ||
                   text.includes('<!doctype') ||
                   text.includes('<!DOCTYPE');
    
    if (isHTML) {
      console.error('❌ El servidor devolvió HTML en lugar de JSON');
      console.error('📄 Primeros caracteres:', text.substring(0, 200));
      
      const isProduction = !import.meta.env.DEV;
      let errorMsg = '⚠️ El servidor backend no está respondiendo correctamente.\n\n';
      errorMsg += 'El servidor está devolviendo HTML (la página del frontend) en lugar de JSON.\n\n';
      errorMsg += `URL intentada: ${url}\n\n`;
      
      if (isProduction) {
        errorMsg += '🔍 Diagnóstico:\n';
        errorMsg += 'Las rutas /api/* están siendo capturadas por el servidor del frontend.\n\n';
        errorMsg += '✅ Soluciones:\n';
        errorMsg += '1. Despliega el servidor backend en un servidor separado (Railway, Render, Heroku, etc.)\n';
        errorMsg += '2. Configura VITE_API_URL con la URL completa del backend antes del build:\n';
        errorMsg += '   VITE_API_URL=https://tu-backend.com:3001\n';
        errorMsg += '3. O configura un proxy/rewrite en tu plataforma de hosting para redirigir /api/* al backend\n\n';
        errorMsg += '📝 Ejemplo para Vercel (vercel.json):\n';
        errorMsg += '{\n';
        errorMsg += '  "rewrites": [\n';
        errorMsg += '    { "source": "/api/:path*", "destination": "https://tu-backend.com/api/:path*" }\n';
        errorMsg += '  ]\n';
        errorMsg += '}';
      } else {
        errorMsg += 'En desarrollo, verifica que:\n';
        errorMsg += '1. El servidor backend esté corriendo: npm run dev:server\n';
        errorMsg += '2. El proxy de Vite esté configurado en vite.config.ts';
      }
      
      throw new Error(errorMsg);
    }

    // Intentar parsear JSON
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Error al parsear JSON:', parseError);
      console.error('📄 Respuesta recibida:', text.substring(0, 500));
      
      throw new Error(
        `Error al parsear la respuesta del servidor como JSON.\n\n` +
        `El servidor devolvió: ${text.substring(0, 200)}...\n\n` +
        `Esto indica que el backend no está respondiendo correctamente. Verifica que el servidor backend esté corriendo y accesible.`
      );
    }
    
    console.log('✅ Conexión exitosa:', result);
    return result;
  } catch (error) {
    console.error('❌ Error completo:', error);
    
    // Mejorar mensajes de error para errores de red
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const isProduction = !import.meta.env.DEV;
      let errorMsg = '';
      
      if (isProduction) {
        errorMsg = `No se puede conectar al servidor backend.\n\nURL intentada: ${url}\n\nEn producción, asegúrate de:\n1. Configurar VITE_API_URL antes del build\n2. Que el servidor backend esté accesible públicamente\n3. Verificar que no haya problemas de CORS\n\nEjemplo de configuración:\nVITE_API_URL=https://tu-servidor.com:3001`;
      } else {
        errorMsg = `No se puede conectar al servidor.\n\nURL intentada: ${url}\n\nAsegúrate de que:\n1. El servidor backend esté corriendo (npm run dev:server)\n2. El servidor esté en el puerto 3001\n3. No haya errores en la consola del servidor`;
      }
      
      throw new Error(errorMsg);
    }
    throw error;
  }
}

// Verificar estado de conexión
export async function checkMongoDBStatus(): Promise<MongoDBStatus> {
  try {
    const url = `${API_BASE_URL}/mongodb/status`;
    const response = await fetch(url);
    
    // Verificar Content-Type
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = 'Error al verificar conexión';
      try {
        // Solo intentar parsear JSON si el Content-Type es correcto
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          if (text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
            errorMessage = 'El servidor backend no está respondiendo. Las rutas /api/* están siendo capturadas por el frontend.';
          } else {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        }
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

    // Verificar si es HTML
    if (contentType && contentType.includes('text/html')) {
      return { 
        connected: false, 
        error: 'El servidor devolvió HTML en lugar de JSON. Verifica que el backend esté corriendo y accesible.' 
      };
    }

    // Verificar si el texto empieza con < (HTML)
    if (text.trim().startsWith('<')) {
      return { 
        connected: false, 
        error: 'El servidor devolvió HTML en lugar de JSON. El backend no está respondiendo correctamente.' 
      };
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
    
    // Manejar errores de parsing
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        connected: false,
        error: 'El servidor devolvió una respuesta inválida (no es JSON). Verifica que el backend esté corriendo correctamente.'
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

