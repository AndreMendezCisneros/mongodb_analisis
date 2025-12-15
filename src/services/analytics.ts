// Detectar si estamos en desarrollo o producción
const getApiBaseUrl = () => {
  // En desarrollo, usar el proxy de Vite
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // En producción, usar la variable de entorno o la URL del servidor
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  
  // Si no hay variable de entorno, intentar usar la misma URL pero con el puerto del backend
  const currentHost = window.location.hostname;
  const backendPort = import.meta.env.VITE_BACKEND_PORT || '3001';
  
  // Si estamos en localhost, usar localhost:3001
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return `http://${currentHost}:${backendPort}/api`;
  }
  
  // En producción, asumir que el backend está en el mismo dominio
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface SATEAnalysisResult {
  success: boolean;
  version: string;
  fecha_analisis: string;
  total_estudiantes: number;
  metricas: {
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
  };
  factores_riesgo: {
    asistencia: { sin_riesgo: number; con_riesgo: number };
    incidencias: { sin_riesgo: number; con_riesgo: number };
    sentimiento: { sin_riesgo: number; con_riesgo: number };
    situacion_familiar: { sin_riesgo: number; con_riesgo: number };
  };
  resultados: Array<{
    DNI: string;
    Apellidos_Nombres: string;
    Genero: string;
    Seccion: string;
    Grado: string;
    NotaBim1: number;
    NotaBim2: number;
    NotaBim3: number;
    Analisis_Asistencia: number;
    Analisis_Incidencias: number;
    Analisis_Sentimiento_Estudiante: number;
    Analisis_Situacion_Familiar: number;
    Nota_Proyectada_B4: number;
    Prediccion_Final_Binaria: number;
    Estado: string;
  }>;
}

/**
 * Ejecuta el análisis SATE-SR completo
 * @param signal - AbortSignal opcional para cancelar la petición
 */
export async function ejecutarAnalisisSATE(signal?: AbortSignal): Promise<SATEAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/sate-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal, // Agregar soporte para cancelación
    });

    if (!response.ok) {
      // Manejar específicamente el error 404
      if (response.status === 404) {
        throw new Error('Endpoint no encontrado. Por favor, reinicia el servidor para cargar el endpoint de análisis SATE-SR.');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // No lanzar error si fue cancelado
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    
    console.error('Error ejecutando análisis SATE:', error);
    
    // Si es un error de red, proporcionar un mensaje más útil
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.');
    }
    
    throw error instanceof Error ? error : new Error('Error desconocido al ejecutar análisis');
  }
}
