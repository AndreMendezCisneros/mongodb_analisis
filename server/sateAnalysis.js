/**
 * SATE-SR v2.0: Sistema de Alerta Temprana Educativa San Ramón
 * Modelo Híbrido de Analítica Predictiva + Validación Estadística
 * Adaptado a JavaScript/Node.js
 */

const MODEL_CONFIG = {
  version: "2.0.0",
  conversion_notas: {
    'C': 5,   // En Inicio
    'B': 13,  // En Proceso
    'A': 16,  // Logro Esperado
    'AD': 19  // Logro Destacado
  },
  umbral_aprobacion: 12,
  umbral_faltas_critico: 30,  // Porcentaje
  pesos_penalizacion: {
    asistencia: 1.0,
    incidencias: 1.0,
    sentimiento: 1.0,
    familia: 1.0
  },
  max_proyeccion_cambio: 4,
  nota_escala: [5, 20]
};

/**
 * Convierte calificación cualitativa a numérica
 */
function convertirCalificacion(valor) {
  if (!valor || valor === null || valor === undefined) {
    return null;
  }
  
  const valUpper = String(valor).trim().toUpperCase();
  return MODEL_CONFIG.conversion_notas[valUpper] || null;
}

/**
 * Normaliza columnas DNI con diferentes nombres
 */
function normalizarDNI(doc) {
  if (doc.DNI) return doc.DNI;
  if (doc['Nº']) return doc['Nº'];
  if (doc.dni) return doc.dni;
  return null;
}

/**
 * Normaliza columnas de nombres de estudiantes
 */
function normalizarNombres(doc) {
  // Lista de posibles nombres de columnas en orden de prioridad
  const posiblesNombres = [
    'Apellidos_Nombres',
    'APELLIDOS_Y_NOMBRES',
    'ALUMNOS/AS',
    'Nombre y Apellido',
    'nombre_completo',
    'Apellidos Nombres',
    'NOMBRE_COMPLETO'
  ];

  // Buscar en orden de prioridad
  for (const nombreCol of posiblesNombres) {
    if (doc[nombreCol] && String(doc[nombreCol]).trim() !== '') {
      return String(doc[nombreCol]).trim();
    }
  }
  
  // Buscar columnas que contengan 'apellido' o 'nombre' (excluyendo DNI)
  const keys = Object.keys(doc);
  const nameKey = keys.find(k => {
    const kLower = k.toLowerCase();
    return (kLower.includes('apellido') || kLower.includes('nombre')) &&
           k.toUpperCase() !== 'DNI' && k !== 'Nº' && k !== '_id';
  });
  
  if (nameKey && doc[nameKey] && String(doc[nameKey]).trim() !== '') {
    return String(doc[nameKey]).trim();
  }
  
  return '';
}

/**
 * Analiza sentimiento en español (versión mejorada)
 * En producción, usar una API de análisis de sentimiento o biblioteca especializada
 */
function analizarSentimientoEspanol(texto) {
  if (!texto || String(texto).trim() === '') {
    return 1; // Ausencia = Positivo por defecto
  }

  const textoLimpio = String(texto).trim().toLowerCase();
  
  // Casos especiales que son neutrales/positivos
  const casosNeutros = ['nada', '.', '', 'ninguno', 'ninguna', 'n/a', 'sin comentarios', 
                        'sin comentario', 'no hay', 'ningún', 'ninguna observación'];
  if (casosNeutros.some(caso => textoLimpio === caso || textoLimpio.startsWith(caso))) {
    return 1;
  }

  // Palabras negativas comunes en español (con más variaciones)
  const palabrasNegativas = [
    'mal', 'malo', 'mala', 'problema', 'problemas', 'difícil', 'dificil',
    'triste', 'tristeza', 'enojado', 'enojada', 'preocupado', 'preocupada',
    'no me gusta', 'no me gustó', 'no me gusta', 'odio', 'odiar', 'terrible', 'horrible',
    'aburrido', 'aburrida', 'cansado', 'cansada', 'estresado', 'estresada',
    'molesto', 'molesta', 'frustrado', 'frustrada', 'desanimado', 'desanimada',
    'preocupante', 'preocupación', 'injusto', 'injusta', 'maltrato', 'violencia',
    'peleas', 'pelea', 'conflicto', 'conflictos', 'agresión', 'agresiones'
  ];

  // Palabras positivas comunes en español (con más variaciones)
  const palabrasPositivas = [
    'bien', 'bueno', 'buena', 'excelente', 'genial', 'me gusta', 'me gustó',
    'feliz', 'contento', 'contenta', 'satisfecho', 'satisfecha', 'agradecido',
    'agradecida', 'perfecto', 'perfecta', 'maravilloso', 'maravillosa',
    'mejor', 'mejora', 'mejorado', 'mejorada', 'progreso', 'avance', 'avances',
    'apoyo', 'ayuda', 'compañerismo', 'amistad', 'respeto', 'tranquilo', 'tranquila',
    'motivado', 'motivada', 'entusiasmado', 'entusiasmada', 'orgulloso', 'orgullosa'
  ];

  // Contar ocurrencias de palabras negativas y positivas
  let negativas = 0;
  let positivas = 0;

  palabrasNegativas.forEach(palabra => {
    // Buscar palabra completa (no solo substring)
    const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
    const matches = textoLimpio.match(regex);
    if (matches) negativas += matches.length;
  });

  palabrasPositivas.forEach(palabra => {
    const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
    const matches = textoLimpio.match(regex);
    if (matches) positivas += matches.length;
  });

  // Si hay más negativas que positivas, es negativo
  if (negativas > positivas) {
    return 0; // Negativo
  }

  // Si hay igual cantidad o más positivas, es positivo/neutral
  return 1;
}

/**
 * Proyección robusta de nota con detección de outliers
 */
function proyectarNotaRobusta(fila, config = MODEL_CONFIG) {
  const notas = [fila.NotaBim1, fila.NotaBim2, fila.NotaBim3];
  
  // Validar rango válido de notas
  const notasValidadas = notas.map(n => 
    Math.max(config.nota_escala[0], Math.min(config.nota_escala[1], n))
  );

  // Detectar outliers con Z-score simplificado
  const media = notasValidadas.reduce((a, b) => a + b, 0) / 3;
  const desviacion = Math.sqrt(
    notasValidadas.reduce((sum, n) => sum + Math.pow(n - media, 2), 0) / 3
  );
  
  const zScores = notasValidadas.map(n => Math.abs((n - media) / (desviacion || 1)));
  const tieneOutlier = zScores.some(z => z > 2);

  let proyeccionB4;
  
  if (tieneOutlier) {
    // Si hay outlier, calcular cambio promedio simple
    const cambio = (notasValidadas[2] - notasValidadas[0]) / 2;
    proyeccionB4 = notasValidadas[2] + cambio;
  } else {
    // Regresión lineal estándar: y = mx + b
    // x = [1, 2, 3], y = notas
    const n = 3;
    const sumX = 6; // 1 + 2 + 3
    const sumY = notasValidadas.reduce((a, b) => a + b, 0);
    const sumXY = notasValidadas[0] * 1 + notasValidadas[1] * 2 + notasValidadas[2] * 3;
    const sumX2 = 14; // 1² + 2² + 3²

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    
    proyeccionB4 = m * 4 + b;
  }

  // Límite: No puede cambiar más de ±4 puntos respecto a Bim3
  const maxCambio = config.max_proyeccion_cambio;
  proyeccionB4 = Math.max(
    notasValidadas[2] - maxCambio,
    Math.min(notasValidadas[2] + maxCambio, proyeccionB4)
  );

  // PENALIZACIÓN POR FACTORES DE RIESGO
  const pesos = config.pesos_penalizacion;
  const castigo = (
    (1 - fila.Analisis_Asistencia) * pesos.asistencia +
    (1 - fila.Analisis_Incidencias) * pesos.incidencias +
    (1 - fila.Analisis_Sentimiento_Estudiante) * pesos.sentimiento +
    (1 - fila.Analisis_Situacion_Familiar) * pesos.familia
  );

  const notaFinal = proyeccionB4 - castigo;

  // Garantizar rango válido final
  return Math.max(
    config.nota_escala[0],
    Math.min(config.nota_escala[1], notaFinal)
  );
}

/**
 * Clasifica resultado: APRUEBA (1) vs DESAPRUEBA (0)
 */
function clasificarResultado(nota, umbral = MODEL_CONFIG.umbral_aprobacion) {
  return nota >= umbral ? 1 : 0;
}

/**
 * Calcula métricas de validación del modelo
 */
function calcularMetricas(yTrue, yPred) {
  // Matriz de confusión
  let verdaderosPositivos = 0;
  let falsosPositivos = 0;
  let verdaderosNegativos = 0;
  let falsosNegativos = 0;

  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1 && yPred[i] === 1) verdaderosPositivos++;
    else if (yTrue[i] === 0 && yPred[i] === 1) falsosPositivos++;
    else if (yTrue[i] === 0 && yPred[i] === 0) verdaderosNegativos++;
    else if (yTrue[i] === 1 && yPred[i] === 0) falsosNegativos++;
  }

  // Métricas
  const precision = verdaderosPositivos + falsosPositivos > 0
    ? verdaderosPositivos / (verdaderosPositivos + falsosPositivos)
    : 0;
  
  const recall = verdaderosPositivos + falsosNegativos > 0
    ? verdaderosPositivos / (verdaderosPositivos + falsosNegativos)
    : 0;
  
  const f1Score = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;

  // AUC-ROC simplificado (área bajo curva ROC)
  // Para simplificar, usamos una aproximación basada en la tasa de verdaderos positivos
  const aucRoc = calcularAUCROC(yTrue, yPred);

  return {
    precision,
    recall,
    f1_score: f1Score,
    auc_roc: aucRoc,
    matriz_confusion: {
      verdaderos_positivos: verdaderosPositivos,
      falsos_positivos: falsosPositivos,
      verdaderos_negativos: verdaderosNegativos,
      falsos_negativos: falsosNegativos
    }
  };
}

/**
 * Calcula AUC-ROC de forma simplificada usando el método de pares
 */
function calcularAUCROC(yTrue, yPred) {
  if (yTrue.length === 0 || yPred.length === 0) {
    return 0.5; // Valor neutral si no hay datos
  }

  // Contar clases
  const clasePositiva = 1;
  const claseNegativa = 0;
  
  const positivosReales = yTrue.filter(y => y === clasePositiva).length;
  const negativosReales = yTrue.filter(y => y === claseNegativa).length;
  
  if (positivosReales === 0 || negativosReales === 0) {
    return 0.5; // No se puede calcular si solo hay una clase
  }

  // Crear pares (real, predicho)
  const pares = yTrue.map((real, i) => ({ real, pred: yPred[i] }));
  
  // Contar pares correctamente ordenados
  let paresCorrectos = 0;
  let totalPares = 0;

  for (let i = 0; i < pares.length; i++) {
    for (let j = i + 1; j < pares.length; j++) {
      // Solo comparar pares donde las clases reales son diferentes
      if (pares[i].real !== pares[j].real) {
        totalPares++;
        // Verificar si el orden predicho es correcto
        if ((pares[i].real > pares[j].real && pares[i].pred >= pares[j].pred) ||
            (pares[i].real < pares[j].real && pares[i].pred <= pares[j].pred)) {
          paresCorrectos++;
        }
      }
    }
  }

  return totalPares > 0 ? paresCorrectos / totalPares : 0.5;
}

/**
 * Función principal: Ejecuta el análisis SATE-SR completo
 */
export async function ejecutarAnalisisSATE(db) {
  console.log('🔄 Iniciando análisis SATE-SR v2.0...');

  try {
    // ============================================
    // FASE ETL: EXTRACCIÓN Y TRANSFORMACIÓN
    // ============================================

    // 1. ASISTENCIAS
    console.log('[1/6] Procesando datos de Asistencia...');
    const colAsistencias = db.collection('asistencia');
    const docsAsistencias = await colAsistencias.find({}).sort({ _id: 1 }).toArray();
    
    if (docsAsistencias.length === 0) {
      console.log('   ⚠️ No se encontraron registros de asistencia');
    }
    
    const asistenciaMap = new Map();
    docsAsistencias.forEach(doc => {
      const dni = normalizarDNI(doc);
      const nombres = normalizarNombres(doc);
      if (!dni || String(dni).trim() === '') return;

      // Identificar columnas de días (excluir columnas fijas)
      const fixedCols = ['DNI', 'Apellidos_Nombres', 'APELLIDOS_Y_NOMBRES', 'ALUMNOS/AS', 
                         'SECCIÓN', 'GRADO', 'Seccion', 'Grado', '_id'];
      const dayCols = Object.keys(doc).filter(k => !fixedCols.includes(k) && k !== 'dni' && k !== 'Nº');
      
      // Calcular asistencias y faltas
      let asistencias = 0;
      let faltas = 0;
      
      dayCols.forEach(col => {
        const valor = doc[col];
        if (valor === 1) asistencias++;
        else if (valor === 0 || valor === 2) faltas++;
      });

      const key = `${dni}_${nombres}`;
      if (!asistenciaMap.has(key)) {
        asistenciaMap.set(key, {
          DNI: dni,
          Apellidos_Nombres: nombres,
          Seccion: doc.SECCIÓN || doc.Seccion,
          Grado: doc.GRADO || doc.Grado,
          cantidad_asistencias: 0,
          cantidad_faltas: 0
        });
      }
      
      const registro = asistenciaMap.get(key);
      registro.cantidad_asistencias += asistencias;
      registro.cantidad_faltas += faltas;
    });

    const dfAsistenciasFinal = Array.from(asistenciaMap.values()).map(reg => {
      const totalDias = reg.cantidad_asistencias + reg.cantidad_faltas;
      const porcentajeFaltas = totalDias > 0 ? (reg.cantidad_faltas / totalDias) * 100 : 0;
      const umbralFaltas = MODEL_CONFIG.umbral_faltas_critico;
      
      return {
        DNI: reg.DNI,
        Apellidos_Nombres: reg.Apellidos_Nombres,
        Seccion: reg.Seccion,
        Grado: reg.Grado,
        Analisis_Asistencia: porcentajeFaltas >= umbralFaltas ? 0 : 1
      };
    });

    console.log(`   ✓ Asistencias procesadas: ${dfAsistenciasFinal.length} registros`);

    // 2. NÓMINA (Situación Familiar)
    console.log('[2/6] Procesando datos de Nómina...');
    const colNomina = db.collection('nomina');
    const docsNomina = await colNomina.find({}).sort({ _id: 1 }).toArray();
    
    const dfNominaFinal = docsNomina.map(doc => {
      const dni = normalizarDNI(doc);
      const nombres = normalizarNombres(doc);
      if (!dni) return null;

      const analisisPadreVive = String(doc.padre_vive || '').trim().toUpperCase() === 'SI' ? 1 : -1;
      const analisisMadreVive = String(doc.madre_vive || '').trim().toUpperCase() === 'SI' ? 1 : -1;
      const analisisTrabajaEstudiante = String(doc.trabaja_estudiante || '').trim().toUpperCase() === 'SI' ? -1 : 1;
      const analisisTipoDiscapacidad = (!doc.tipo_discapacidad || String(doc.tipo_discapacidad).trim() === '') ? 1 : -2;
      
      let analisisSituacionMatricula = 0;
      const situacionMat = String(doc.situacion_matricula || '').trim().toUpperCase();
      if (situacionMat === 'P') analisisSituacionMatricula = 1;
      else if (situacionMat === 'PG') analisisSituacionMatricula = -1;

      const puntajeTotal = analisisPadreVive + analisisMadreVive + analisisTrabajaEstudiante + 
                          analisisTipoDiscapacidad + analisisSituacionMatricula;

      return {
        DNI: dni,
        Apellidos_Nombres: nombres,
        Genero: doc.sexo,
        Analisis_Situacion_Familiar: puntajeTotal >= 4 ? 1 : 0
      };
    }).filter(r => r !== null);

    console.log(`   ✓ Nómina procesada: ${dfNominaFinal.length} registros`);

    // 3, 4, 5. BIMESTRES
    async function procesarBimestre(numeroBim, nombreColeccion) {
      console.log(`[${numeroBim + 2}/6] Procesando Bimestre ${numeroBim}...`);
      const colBim = db.collection(nombreColeccion);
      const docsBim = await colBim.find({}).sort({ _id: 1 }).toArray();
      
      if (docsBim.length === 0) {
        console.log(`   ⚠️ No se encontraron registros para ${nombreColeccion}`);
      }
      
      return docsBim.map(doc => {
        const dni = normalizarDNI(doc);
        const nombres = normalizarNombres(doc);
        if (!dni || String(dni).trim() === '') return null;

        const notaNumerica = convertirCalificacion(doc.PROMEDIO_APRENDIZAJE_AUTONOMO);
        
        return {
          DNI: dni,
          Apellidos_Nombres: nombres,
          [`NotaBim${numeroBim}`]: notaNumerica || 5
        };
      }).filter(r => r !== null);
    }

    const dfBim1Final = await procesarBimestre(1, 'primer_bimestre');
    const dfBim2Final = await procesarBimestre(2, 'segundo_bimestre');
    const dfBim3Final = await procesarBimestre(3, 'tercer_bimestre');

    // 6. INCIDENTES
    console.log('[6/6] Procesando datos de Incidencias...');
    const colIncidente = db.collection('incidente');
    const docsIncidente = await colIncidente.find({}).toArray();
    
    const incidenteMap = new Map();
    docsIncidente.forEach(doc => {
      const nombre = doc['Nombre y Apellido'] || normalizarNombres(doc);
      if (!nombre) return;

      const tipoFalta = String(doc['Tipo de Falta'] || '').trim();
      const esLeve = tipoFalta.toLowerCase() === 'leve';
      
      if (!incidenteMap.has(nombre)) {
        incidenteMap.set(nombre, { Analisis_Incidencias: esLeve ? 1 : 0 });
      } else {
        // Tomar el peor caso
        const actual = incidenteMap.get(nombre);
        if (!esLeve) actual.Analisis_Incidencias = 0;
      }
    });

    const dfIncidenteGrouped = Array.from(incidenteMap.entries()).map(([nombre, datos]) => ({
      Apellidos_Nombres: nombre,
      ...datos
    }));

    console.log(`   ✓ Incidentes procesados: ${dfIncidenteGrouped.length} registros`);

    // 7. ENCUESTA (Análisis de Sentimiento)
    console.log('🔍 Analizando sentimientos de estudiantes...');
    const colEncuesta = db.collection('encuesta');
    const docsEncuesta = await colEncuesta.find({}).sort({ _id: 1 }).toArray();
    
    const encuestaMap = new Map();
    docsEncuesta.forEach(doc => {
      const dni = normalizarDNI(doc);
      if (!dni) return;

      if (!encuestaMap.has(dni)) {
        const sentimiento = analizarSentimientoEspanol(doc.sugerencia_sentimientos);
        encuestaMap.set(dni, {
          DNI: dni,
          Analisis_Sentimiento_Estudiante: sentimiento
        });
      }
    });

    const dfEncuestaFinal = Array.from(encuestaMap.values());
    console.log(`   ✓ Encuesta procesada: ${docsEncuesta.length} respuestas analizadas`);

    // ============================================
    // INTEGRACIÓN DE DATOS (Merge)
    // ============================================
    console.log('🔄 Integrando datos de todas las fuentes...');

    // Crear mapa principal por DNI
    const estudiantesMap = new Map();

    // Agregar datos de nómina (base)
    dfNominaFinal.forEach(reg => {
      estudiantesMap.set(reg.DNI, { ...reg });
    });

    // Merge con asistencias
    dfAsistenciasFinal.forEach(reg => {
      if (!reg.DNI) return; // Saltar si no hay DNI
      
      const estudiante = estudiantesMap.get(reg.DNI) || { 
        DNI: reg.DNI, 
        Apellidos_Nombres: reg.Apellidos_Nombres || '' 
      };
      estudiantesMap.set(reg.DNI, {
        ...estudiante,
        Apellidos_Nombres: reg.Apellidos_Nombres || estudiante.Apellidos_Nombres || '',
        Seccion: reg.Seccion || estudiante.Seccion || '',
        Grado: reg.Grado || estudiante.Grado || '',
        Analisis_Asistencia: reg.Analisis_Asistencia
      });
    });

    // Merge con bimestres
    [dfBim1Final, dfBim2Final, dfBim3Final].forEach((dfBim, idx) => {
      dfBim.forEach(reg => {
        if (!reg.DNI) return; // Saltar si no hay DNI
        
        const estudiante = estudiantesMap.get(reg.DNI) || { 
          DNI: reg.DNI, 
          Apellidos_Nombres: reg.Apellidos_Nombres || '' 
        };
        estudiantesMap.set(reg.DNI, {
          ...estudiante,
          Apellidos_Nombres: reg.Apellidos_Nombres || estudiante.Apellidos_Nombres || '',
          [`NotaBim${idx + 1}`]: reg[`NotaBim${idx + 1}`] || 5
        });
      });
    });

    // Merge con incidentes (por nombre)
    const nombreToDNI = new Map();
    Array.from(estudiantesMap.values()).forEach(est => {
      nombreToDNI.set(est.Apellidos_Nombres, est.DNI);
    });

    dfIncidenteGrouped.forEach(reg => {
      const dni = nombreToDNI.get(reg.Apellidos_Nombres);
      if (dni) {
        const estudiante = estudiantesMap.get(dni);
        estudiantesMap.set(dni, {
          ...estudiante,
          Analisis_Incidencias: reg.Analisis_Incidencias
        });
      }
    });

    // Merge con sentimientos
    dfEncuestaFinal.forEach(reg => {
      const estudiante = estudiantesMap.get(reg.DNI);
      if (estudiante) {
        estudiantesMap.set(reg.DNI, {
          ...estudiante,
          Analisis_Sentimiento_Estudiante: reg.Analisis_Sentimiento_Estudiante
        });
      }
    });

    // Convertir a array y aplicar valores por defecto
    let dfFinal = Array.from(estudiantesMap.values())
      .filter(est => est.DNI && String(est.DNI).trim() !== '') // Filtrar estudiantes sin DNI válido
      .map(est => ({
        DNI: String(est.DNI).trim(),
        Apellidos_Nombres: est.Apellidos_Nombres || '',
        Genero: est.Genero || '',
        Seccion: est.Seccion || '',
        Grado: est.Grado || '',
        NotaBim1: est.NotaBim1 || 5,
        NotaBim2: est.NotaBim2 || 5,
        NotaBim3: est.NotaBim3 || 5,
        Analisis_Asistencia: est.Analisis_Asistencia !== undefined ? est.Analisis_Asistencia : 1,
        Analisis_Incidencias: est.Analisis_Incidencias !== undefined ? est.Analisis_Incidencias : 1,
        Analisis_Sentimiento_Estudiante: est.Analisis_Sentimiento_Estudiante !== undefined ? est.Analisis_Sentimiento_Estudiante : 1,
        Analisis_Situacion_Familiar: est.Analisis_Situacion_Familiar !== undefined ? est.Analisis_Situacion_Familiar : 1
      }));

    // Eliminar duplicados por DNI
    const dniSet = new Set();
    dfFinal = dfFinal.filter(est => {
      if (dniSet.has(est.DNI)) return false;
      dniSet.add(est.DNI);
      return true;
    });

    console.log(`✓ Tabla integrada: ${dfFinal.length} estudiantes únicos`);

    // ============================================
    // MODELO PREDICTIVO
    // ============================================
    console.log('🔄 Ejecutando predicciones...');

    dfFinal.forEach(est => {
      est.Nota_Proyectada_B4 = proyectarNotaRobusta(est);
      est.Prediccion_Final_Binaria = clasificarResultado(est.Nota_Proyectada_B4);
      est.Estado = est.Prediccion_Final_Binaria === 1 ? '🟢 APRUEBA' : '🔴 DESAPRUEBA';
    });

    console.log('✓ Predicciones completadas');

    // ============================================
    // VALIDACIÓN DEL MODELO
    // ============================================
    console.log('🔄 Validando modelo...');

    dfFinal.forEach(est => {
      est.Realidad_Binaria = clasificarResultado(est.NotaBim3);
    });

    const yTrue = dfFinal.map(e => e.Realidad_Binaria);
    const yPred = dfFinal.map(e => e.Prediccion_Final_Binaria);

    const metricas = calcularMetricas(yTrue, yPred);

    // ============================================
    // PREPARAR RESULTADOS FINALES
    // ============================================
    
    // Ordenar por Sección y Apellidos
    dfFinal.sort((a, b) => {
      if (a.Seccion !== b.Seccion) {
        return (a.Seccion || '').localeCompare(b.Seccion || '');
      }
      return (a.Apellidos_Nombres || '').localeCompare(b.Apellidos_Nombres || '');
    });

    // Calcular métricas agregadas
    const totalEstudiantes = dfFinal.length;
    
    if (totalEstudiantes === 0) {
      throw new Error('No se encontraron estudiantes para analizar. Verifica que las colecciones tengan datos.');
    }
    
    const apruebaCount = dfFinal.filter(e => e.Prediccion_Final_Binaria === 1).length;
    const desapruebaCount = dfFinal.filter(e => e.Prediccion_Final_Binaria === 0).length;
    const promedioNotaProyectada = dfFinal.reduce((sum, e) => sum + (e.Nota_Proyectada_B4 || 0), 0) / totalEstudiantes;

    // Factores de riesgo
    const factoresRiesgo = {
      asistencia: {
        sin_riesgo: dfFinal.filter(e => e.Analisis_Asistencia === 1).length,
        con_riesgo: dfFinal.filter(e => e.Analisis_Asistencia === 0).length
      },
      incidencias: {
        sin_riesgo: dfFinal.filter(e => e.Analisis_Incidencias === 1).length,
        con_riesgo: dfFinal.filter(e => e.Analisis_Incidencias === 0).length
      },
      sentimiento: {
        sin_riesgo: dfFinal.filter(e => e.Analisis_Sentimiento_Estudiante === 1).length,
        con_riesgo: dfFinal.filter(e => e.Analisis_Sentimiento_Estudiante === 0).length
      },
      situacion_familiar: {
        sin_riesgo: dfFinal.filter(e => e.Analisis_Situacion_Familiar === 1).length,
        con_riesgo: dfFinal.filter(e => e.Analisis_Situacion_Familiar === 0).length
      }
    };

    const resultado = {
      success: true,
      version: MODEL_CONFIG.version,
      fecha_analisis: new Date().toISOString(),
      total_estudiantes: totalEstudiantes,
      metricas: {
        aprueba: apruebaCount,
        desaprueba: desapruebaCount,
        porcentaje_aprueba: (apruebaCount / totalEstudiantes) * 100,
        porcentaje_desaprueba: (desapruebaCount / totalEstudiantes) * 100,
        promedio_nota_proyectada: promedioNotaProyectada,
        precision: metricas.precision,
        recall: metricas.recall,
        f1_score: metricas.f1_score,
        auc_roc: metricas.auc_roc,
        matriz_confusion: metricas.matriz_confusion
      },
      factores_riesgo: factoresRiesgo,
      resultados: dfFinal.map(est => ({
        DNI: est.DNI,
        Apellidos_Nombres: est.Apellidos_Nombres,
        Genero: est.Genero,
        Seccion: est.Seccion,
        Grado: est.Grado,
        NotaBim1: est.NotaBim1,
        NotaBim2: est.NotaBim2,
        NotaBim3: est.NotaBim3,
        Analisis_Asistencia: est.Analisis_Asistencia,
        Analisis_Incidencias: est.Analisis_Incidencias,
        Analisis_Sentimiento_Estudiante: est.Analisis_Sentimiento_Estudiante,
        Analisis_Situacion_Familiar: est.Analisis_Situacion_Familiar,
        Nota_Proyectada_B4: Math.round(est.Nota_Proyectada_B4 * 100) / 100,
        Prediccion_Final_Binaria: est.Prediccion_Final_Binaria,
        Estado: est.Estado
      }))
    };

    console.log('✅ Análisis SATE-SR completado exitosamente');
    return resultado;

  } catch (error) {
    console.error('❌ Error ejecutando análisis SATE:', error);
    throw error;
  }
}
