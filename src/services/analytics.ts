const API_BASE_URL = '/api';

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
 */
export async function ejecutarAnalisisSATE(): Promise<SATEAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/sate-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('Error ejecutando análisis SATE:', error);
    
    // Si es un error de red, proporcionar un mensaje más útil
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar al servidor. Asegúrate de que el servidor esté corriendo en el puerto 3001.');
    }
    
    throw error instanceof Error ? error : new Error('Error desconocido al ejecutar análisis');
  }
}
