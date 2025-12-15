import { ChartConfig, ChartType, ChartDataPoint, CHART_COLORS } from '@/types/chart';
import { transformMongoDataToChart, detectFields, groupByField } from './mongodbTransform';

export interface ChartSuggestion {
  collection: string;
  chartType: ChartType;
  title: string;
  nameField: string;
  valueField: string;
  description: string;
  question: string; // Pregunta que responde el gráfico
  interpretation: string; // Qué puedes interpretar del gráfico
  axes: { x: string; y: string }; // Descripción de los ejes
  units?: string; // Unidades de medida
  confidence: number; // 0-1, qué tan apropiado es este gráfico
}

/**
 * Genera una descripción detallada del gráfico que responde a una pregunta específica
 */
function generateDetailedDescription(
  chartType: ChartType,
  nameField: string,
  valueField: string,
  collectionName: string,
  isCountMode: boolean = false
): { question: string; description: string; interpretation: string; axes: { x: string; y: string }; units?: string } {
  const nameLabel = nameField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
  const valueLabel = valueField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
  const collectionLabel = collectionName.replace(/_/g, ' ').toLowerCase();

  // Capitalizar primera letra
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const NameLabel = capitalize(nameLabel);
  const ValueLabel = capitalize(valueLabel);

  switch (chartType) {
    case 'bar':
      if (isCountMode) {
        return {
          question: `¿Cuántas veces aparece cada ${nameLabel} en ${collectionLabel}?`,
          description: `Este gráfico de barras compara la frecuencia de cada ${nameLabel}. El eje X muestra las diferentes categorías de ${nameLabel}, y el eje Y muestra el número de ocurrencias. Te permite identificar rápidamente qué ${nameLabel} aparece más o menos frecuentemente.`,
          interpretation: `Al observar este gráfico podrás identificar: qué ${nameLabel} tiene más registros, cuáles tienen menos, y la distribución general de frecuencias. Las barras más altas indican mayor frecuencia, mientras que las más bajas indican menor frecuencia.`,
          axes: {
            x: `${NameLabel} (categorías)`,
            y: 'Número de ocurrencias (cantidad)'
          },
          units: 'ocurrencias'
        };
      } else {
        return {
          question: `¿Cuál es el valor de ${valueLabel} para cada ${nameLabel}?`,
          description: `Este gráfico de barras compara los valores de ${valueLabel} agrupados por ${nameLabel}. El eje X muestra las diferentes categorías de ${nameLabel}, y el eje Y muestra los valores de ${valueLabel}. Te permite identificar rápidamente qué ${nameLabel} tiene el mayor o menor valor de ${valueLabel}.`,
          interpretation: `Al observar este gráfico podrás identificar: qué ${nameLabel} tiene el mayor valor de ${valueLabel}, cuáles tienen valores menores, y cómo se distribuyen los valores entre las diferentes categorías. Las barras más altas representan valores mayores, facilitando la comparación visual.`,
          axes: {
            x: `${NameLabel} (categorías)`,
            y: `${ValueLabel} (valores)`
          },
          units: valueLabel
        };
      }

    case 'pie':
    case 'donut':
      if (isCountMode) {
        return {
          question: `¿Qué proporción representa cada ${nameLabel} del total en ${collectionLabel}?`,
          description: `Este gráfico circular muestra la distribución porcentual de ${nameLabel}. Cada segmento representa una categoría y su tamaño es proporcional a la frecuencia con que aparece. Te permite ver rápidamente qué ${nameLabel} representa un mayor o menor porcentaje del total.`,
          interpretation: `Al observar este gráfico podrás identificar: qué porcentaje del total representa cada ${nameLabel}, cuáles son las categorías más y menos frecuentes, y cómo se distribuye la proporción entre todas las categorías. Los segmentos más grandes indican mayor proporción.`,
          axes: {
            x: 'No aplica (gráfico circular)',
            y: 'Porcentaje del total'
          },
          units: '%'
        };
      } else {
        return {
          question: `¿Qué proporción del total de ${valueLabel} representa cada ${nameLabel}?`,
          description: `Este gráfico circular muestra la distribución porcentual de ${valueLabel} agrupado por ${nameLabel}. Cada segmento representa una categoría y su tamaño es proporcional al valor total de ${valueLabel} que representa. Te permite ver rápidamente qué ${nameLabel} contribuye más o menos al total.`,
          interpretation: `Al observar este gráfico podrás identificar: qué porcentaje del total de ${valueLabel} representa cada ${nameLabel}, cuáles son las categorías con mayor y menor contribución, y cómo se distribuye la proporción entre todas las categorías. Los segmentos más grandes indican mayor contribución.`,
          axes: {
            x: 'No aplica (gráfico circular)',
            y: 'Porcentaje del total'
          },
          units: '%'
        };
      }

    case 'line':
      return {
        question: `¿Cómo cambia ${valueLabel} a lo largo del tiempo según ${nameLabel}?`,
        description: `Este gráfico de líneas muestra la evolución temporal de ${valueLabel}. El eje X representa el tiempo (${nameLabel}), y el eje Y muestra los valores de ${valueLabel}. Te permite identificar tendencias, patrones temporales y cambios a lo largo del tiempo.`,
        interpretation: `Al observar este gráfico podrás identificar: si hay una tendencia creciente, decreciente o estable, puntos donde ocurren cambios significativos, patrones estacionales o cíclicos, y comparar valores en diferentes momentos temporales. Las líneas ascendentes indican crecimiento, las descendentes indican disminución.`,
        axes: {
          x: `${NameLabel} (tiempo)`,
          y: `${ValueLabel} (valores)`
        },
        units: valueLabel
      };

    case 'area':
      return {
        question: `¿Cuál es el volumen acumulado de ${valueLabel} a lo largo del tiempo?`,
        description: `Este gráfico de área muestra el volumen acumulado de ${valueLabel} a lo largo del tiempo. El eje X representa el tiempo (${nameLabel}), y el eje Y muestra los valores de ${valueLabel}. El área sombreada bajo la línea te permite visualizar el volumen total y su evolución.`,
        interpretation: `Al observar este gráfico podrás identificar: el volumen total acumulado de ${valueLabel}, cómo crece o decrece el volumen a lo largo del tiempo, períodos de mayor o menor acumulación, y la magnitud total representada por el área sombreada.`,
        axes: {
          x: `${NameLabel} (tiempo)`,
          y: `${ValueLabel} (valores acumulados)`
        },
        units: valueLabel
      };

    case 'radar':
      return {
        question: `¿Cómo se comparan múltiples métricas para diferentes ${nameLabel}?`,
        description: `Este gráfico radar muestra múltiples métricas simultáneamente para cada ${nameLabel}. Cada eje representa una métrica diferente, y la forma del polígono muestra el perfil completo. Te permite comparar el rendimiento o características de diferentes ${nameLabel} en múltiples dimensiones.`,
        interpretation: `Al observar este gráfico podrás identificar: qué ${nameLabel} tiene mejores valores en cada métrica, el perfil completo de cada categoría, áreas de fortaleza y debilidad, y comparaciones visuales entre diferentes ${nameLabel}. Los polígonos más grandes indican valores mayores en general.`,
        axes: {
          x: 'Múltiples métricas (cada eje)',
          y: 'Valores de cada métrica'
        }
      };

    case 'composed':
      return {
        question: `¿Cómo se comparan múltiples métricas de ${valueLabel} agrupadas por ${nameLabel}?`,
        description: `Este gráfico compuesto combina diferentes tipos de visualización para comparar múltiples métricas. El eje X muestra las categorías de ${nameLabel}, y el eje Y muestra los valores. Te permite ver simultáneamente diferentes aspectos de los datos y sus relaciones.`,
        interpretation: `Al observar este gráfico podrás identificar: cómo se relacionan diferentes métricas entre sí, qué ${nameLabel} tiene mejores valores en cada métrica, patrones de correlación entre variables, y comparaciones visuales entre múltiples dimensiones.`,
        axes: {
          x: `${NameLabel} (categorías)`,
          y: `${ValueLabel} y otras métricas (valores)`
        }
      };

    default:
      return {
        question: `¿Qué relación existe entre ${nameLabel} y ${valueLabel}?`,
        description: `Este gráfico muestra la relación entre ${nameLabel} y ${valueLabel}. Te permite identificar patrones, tendencias y relaciones en los datos.`,
        interpretation: `Al observar este gráfico podrás identificar patrones y relaciones entre las variables mostradas.`,
        axes: {
          x: `${NameLabel}`,
          y: `${ValueLabel}`
        }
      };
  }
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Analiza estadísticamente un campo numérico
 */
interface FieldStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
  uniqueValues: number;
  distribution: 'normal' | 'skewed' | 'uniform' | 'sparse';
  hasOutliers: boolean;
  score: number; // 0-1, qué tan útil es para gráficos
}

function analyzeNumericField(data: any[], fieldName: string): FieldStats | null {
  const values = data
    .map(d => {
      const val = getNestedValue(d, fieldName);
      return typeof val === 'number' ? val : Number(val);
    })
    .filter(v => !isNaN(v) && v !== null && v !== undefined);

  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const uniqueValues = new Set(values).size;

  // Detectar outliers (valores fuera de 2 desviaciones estándar)
  const hasOutliers = values.some(v => Math.abs(v - mean) > 2 * stdDev);

  // Determinar distribución
  const range = max - min;
  const cv = stdDev / mean; // Coeficiente de variación
  let distribution: 'normal' | 'skewed' | 'uniform' | 'sparse' = 'normal';
  
  if (cv < 0.1) distribution = 'uniform';
  else if (cv > 1) distribution = 'sparse';
  else if (Math.abs(mean - median) / mean > 0.3) distribution = 'skewed';

  // Calcular score de utilidad (0-1)
  let score = 0.5; // Base
  
  // Más variación = más útil
  if (uniqueValues > values.length * 0.5) score += 0.2;
  if (uniqueValues > values.length * 0.8) score += 0.1;
  
  // Valores no cero = más útil
  const nonZeroRatio = values.filter(v => v !== 0).length / values.length;
  score += nonZeroRatio * 0.2;
  
  // Rango razonable = más útil (no extremos)
  if (range > 0 && range < 1000000) score += 0.1;
  
  score = Math.min(1, score);

  return {
    mean,
    median,
    min,
    max,
    stdDev,
    variance,
    uniqueValues,
    distribution,
    hasOutliers,
    score
  };
}

/**
 * Analiza un campo categórico
 */
interface CategoricalFieldStats {
  uniqueValues: number;
  mostCommon: { value: string; count: number }[];
  distribution: 'balanced' | 'skewed' | 'dominant';
  score: number;
}

function analyzeCategoricalField(data: any[], fieldName: string): CategoricalFieldStats | null {
  const values = data.map(d => String(getNestedValue(d, fieldName) || '')).filter(v => v);
  if (values.length === 0) return null;

  const counts = new Map<string, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));

  const sorted = Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  const uniqueValues = counts.size;
  const mostCommon = sorted.slice(0, 5);
  const total = values.length;
  const maxCount = sorted[0]?.count || 0;
  const maxRatio = maxCount / total;

  let distribution: 'balanced' | 'skewed' | 'dominant' = 'balanced';
  if (maxRatio > 0.7) distribution = 'dominant';
  else if (maxRatio > 0.4) distribution = 'skewed';

  // Calcular score
  let score = 0.5;
  
  // Número razonable de categorías (2-20)
  if (uniqueValues >= 2 && uniqueValues <= 20) score += 0.3;
  if (uniqueValues > 20) score -= 0.2; // Demasiadas categorías
  
  // Distribución balanceada es mejor
  if (distribution === 'balanced') score += 0.2;
  else if (distribution === 'dominant') score -= 0.2;

  score = Math.max(0, Math.min(1, score));

  return {
    uniqueValues,
    mostCommon,
    distribution,
    score
  };
}

/**
 * Encuentra la mejor combinación de campos para gráficos
 */
interface FieldCombination {
  nameField: string;
  valueField: string;
  score: number;
  reason: string;
}

function findBestFieldCombinations(
  data: any[],
  categoricalFields: string[],
  numericFields: string[]
): FieldCombination[] {
  const combinations: FieldCombination[] = [];

  for (const catField of categoricalFields) {
    const catStats = analyzeCategoricalField(data, catField);
    if (!catStats || catStats.score < 0.3) continue;

    for (const numField of numericFields) {
      const numStats = analyzeNumericField(data, numField);
      if (!numStats || numStats.score < 0.3) continue;

      // Calcular score combinado
      let score = (catStats.score + numStats.score) / 2;
      
      // Bonus por nombres descriptivos
      const catLower = catField.toLowerCase();
      const numLower = numField.toLowerCase();
      
      const catBonus = catLower.includes('nombre') || catLower.includes('name') ||
                      catLower.includes('categoria') || catLower.includes('category') ||
                      catLower.includes('tipo') || catLower.includes('type') ||
                      catLower.includes('seccion') || catLower.includes('section') ||
                      catLower.includes('alumno') || catLower.includes('estudiante') ? 0.1 : 0;
      
      const numBonus = numLower.includes('total') || numLower.includes('count') ||
                      numLower.includes('cantidad') || numLower.includes('suma') ||
                      numLower.includes('precio') || numLower.includes('monto') ||
                      numLower.includes('asistencia') || numLower.includes('nota') ||
                      numLower.includes('dia') || numLower.includes('day') ||
                      numLower.includes('venta') || numLower.includes('sale') ? 0.1 : 0;

      score += catBonus + numBonus;
      score = Math.min(1, score);

      // Determinar razón
      let reason = '';
      if (catStats.distribution === 'balanced' && numStats.distribution === 'normal') {
        reason = 'Distribución balanceada y valores normales';
      } else if (catStats.uniqueValues >= 3 && catStats.uniqueValues <= 10) {
        reason = 'Número óptimo de categorías';
      } else if (numStats.uniqueValues > data.length * 0.5) {
        reason = 'Buena variación en valores numéricos';
      } else {
        reason = 'Combinación viable';
      }

      combinations.push({
        nameField: catField,
        valueField: numField,
        score,
        reason
      });
    }
  }

  // Ordenar por score descendente
  return combinations.sort((a, b) => b.score - a.score);
}

/**
 * Analiza una colección y sugiere gráficos apropiados de manera inteligente
 */
export async function analyzeCollection(
  collectionData: any[],
  collectionName: string
): Promise<ChartSuggestion[]> {
  if (!collectionData || collectionData.length === 0) {
    return [];
  }

  const suggestions: ChartSuggestion[] = [];
  const fields = detectFields(collectionData);
  
  // Usar solo campos numéricos significativos (no IDs)
  const meaningfulNumericFields = fields.meaningfulNumericFields.length > 0 
    ? fields.meaningfulNumericFields 
    : fields.numericFields;
  
  // Filtrar campos string que no son IDs o códigos
  const meaningfulStringFields = fields.stringFields.filter(field => {
    const lowerName = field.toLowerCase();
    // Excluir campos que parecen IDs o códigos
    const idPatterns = ['id', 'dni', 'codigo', 'code', 'numero', 'number', 'num', 'nro', 'uuid', 'key'];
    return !idPatterns.some(pattern => lowerName.includes(pattern));
  });

  // Si no hay campos numéricos significativos pero hay campos categóricos, crear gráficos de conteo
  if (meaningfulNumericFields.length === 0 && meaningfulStringFields.length > 0) {
    const nameField = meaningfulStringFields[0];
    const uniqueCategories = new Set(collectionData.map(d => String(d[nameField] || ''))).size;
    
    if (uniqueCategories >= 2 && uniqueCategories <= 20) {
      // Crear un título más descriptivo
      const fieldLabel = nameField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
      const collectionLabel = collectionName.replace(/_/g, ' ').toLowerCase();
      
      const barDetails = generateDetailedDescription('bar', nameField, nameField, collectionName, true);
      suggestions.push({
        collection: collectionName,
        chartType: 'bar',
        title: `Conteo de ${fieldLabel} en ${collectionLabel}`,
        nameField,
        valueField: nameField, // Usar el mismo campo para contar
        description: barDetails.description,
        question: barDetails.question,
        interpretation: barDetails.interpretation,
        axes: barDetails.axes,
        units: barDetails.units,
        confidence: 0.85,
      });
      
      if (uniqueCategories <= 10) {
        const pieDetails = generateDetailedDescription('pie', nameField, nameField, collectionName, true);
        suggestions.push({
          collection: collectionName,
          chartType: 'pie',
          title: `Distribución de ${fieldLabel}`,
          nameField,
          valueField: nameField,
          description: pieDetails.description,
          question: pieDetails.question,
          interpretation: pieDetails.interpretation,
          axes: pieDetails.axes,
          units: pieDetails.units,
          confidence: 0.8,
        });
      }
    }
    
    // Si hay sugerencias de conteo, retornarlas
    if (suggestions.length > 0) {
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
  }

  // Si no hay campos numéricos significativos ni campos categóricos útiles, no podemos crear gráficos
  if (meaningfulNumericFields.length === 0) {
    return [];
  }

  // 1. Gráficos de una sola serie (categórico vs numérico) - ANÁLISIS INTELIGENTE
  if (meaningfulStringFields.length > 0 && meaningfulNumericFields.length > 0) {
    // Encontrar las mejores combinaciones usando análisis estadístico
    const bestCombinations = findBestFieldCombinations(
      collectionData,
      meaningfulStringFields,
      meaningfulNumericFields
    );

    // Procesar las mejores combinaciones (máximo 3 para evitar sobrecarga)
    const topCombinations = bestCombinations.slice(0, 3);
    
    for (const combo of topCombinations) {
      const { nameField, valueField, score } = combo;
      const uniqueCategories = new Set(collectionData.map(d => String(getNestedValue(d, nameField) || ''))).size;
      
      // Analizar estadísticas de los campos
      const catStats = analyzeCategoricalField(collectionData, nameField);
      const numStats = analyzeNumericField(collectionData, valueField);
      
      if (!catStats || !numStats) continue;
    
      // Crear títulos más descriptivos
      const nameLabel = nameField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
      const valueLabel = valueField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
      
      // Decidir tipo de gráfico basado en estadísticas
      const confidence = Math.min(0.95, 0.7 + score * 0.25); // Ajustar confianza según score
      
      // Gráfico de barras - siempre útil para comparar
      const barDetails = generateDetailedDescription('bar', nameField, valueField, collectionName, false);
      suggestions.push({
        collection: collectionName,
        chartType: 'bar',
        title: `${valueLabel} por ${nameLabel}`,
        nameField,
        valueField,
        description: barDetails.description,
        question: barDetails.question,
        interpretation: barDetails.interpretation,
        axes: barDetails.axes,
        units: barDetails.units,
        confidence: confidence,
      });

      // Gráfico circular solo si:
      // - Pocas categorías (2-10)
      // - Distribución balanceada o ligeramente sesgada
      // - Score alto
      if (uniqueCategories >= 2 && uniqueCategories <= 10 && 
          catStats.distribution !== 'dominant' && score > 0.6) {
        const pieDetails = generateDetailedDescription('pie', nameField, valueField, collectionName, false);
        suggestions.push({
          collection: collectionName,
          chartType: 'pie',
          title: `Distribución de ${valueLabel}`,
          nameField,
          valueField,
          description: pieDetails.description,
          question: pieDetails.question,
          interpretation: pieDetails.interpretation,
          axes: pieDetails.axes,
          units: pieDetails.units,
          confidence: confidence - 0.05, // Ligeramente menor que barras
        });
      }
    }
  }

  // 2. Gráficos de tiempo (si hay campos de fecha) - ANÁLISIS INTELIGENTE
  if (fields.dateFields.length > 0 && meaningfulNumericFields.length > 0) {
    // Analizar todos los campos numéricos para encontrar el mejor para series temporales
    const numericStats = meaningfulNumericFields
      .map(field => ({
        field,
        stats: analyzeNumericField(collectionData, field)
      }))
      .filter(({ stats }) => stats !== null && stats.score > 0.4)
      .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));

    if (numericStats.length > 0) {
      const dateField = fields.dateFields[0];
      const bestNumeric = numericStats[0];
      const valueField = bestNumeric.field;
      const numStats = bestNumeric.stats!;
      const valueLabel = valueField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
      
      // Verificar que hay suficientes puntos temporales
      const dateValues = collectionData.map(d => getNestedValue(d, dateField)).filter(v => v);
      const uniqueDates = new Set(dateValues.map(v => String(v))).size;
      
      if (uniqueDates >= 2) { // Necesitamos al menos 2 fechas diferentes
        // Calcular confianza basada en estadísticas
        let timeConfidence = 0.85;
        if (uniqueDates >= 5) timeConfidence += 0.05; // Más fechas = mejor
        if (numStats.distribution === 'normal') timeConfidence += 0.05; // Distribución normal = mejor
        if (numStats.hasOutliers) timeConfidence -= 0.05; // Outliers reducen confianza
        timeConfidence = Math.min(0.95, Math.max(0.7, timeConfidence));

        // Gráfico de línea para series temporales - mejor para mostrar tendencias
        if (uniqueDates >= 3) { // Mínimo 3 puntos para ver tendencia
          const lineDetails = generateDetailedDescription('line', dateField, valueField, collectionName, false);
          suggestions.push({
            collection: collectionName,
            chartType: 'line',
            title: `Evolución de ${valueLabel} en el tiempo`,
            nameField: dateField,
            valueField,
            description: lineDetails.description,
            question: lineDetails.question,
            interpretation: lineDetails.interpretation,
            axes: lineDetails.axes,
            units: lineDetails.units,
            confidence: timeConfidence,
          });
        }

        // Gráfico de área - mejor cuando hay valores acumulativos o volumen
        // Solo si hay suficientes puntos y distribución adecuada
        if (uniqueDates >= 4 && numStats.min >= 0) { // Área funciona mejor con valores positivos
          const areaDetails = generateDetailedDescription('area', dateField, valueField, collectionName, false);
          suggestions.push({
            collection: collectionName,
            chartType: 'area',
            title: `${valueLabel} acumulado en el tiempo`,
            nameField: dateField,
            valueField,
            description: areaDetails.description,
            question: areaDetails.question,
            interpretation: areaDetails.interpretation,
            axes: areaDetails.axes,
            units: areaDetails.units,
            confidence: timeConfidence - 0.05,
          });
        }

        // Si hay múltiples campos numéricos significativos, gráfico de área apilada
        if (numericStats.length > 1 && uniqueDates >= 4) {
          const stackedAreaDetails = generateDetailedDescription('area', dateField, numericStats[1].field, collectionName, false);
          suggestions.push({
            collection: collectionName,
            chartType: 'area',
            title: `Análisis temporal de múltiples métricas`,
            nameField: dateField,
            valueField: numericStats[0].field,
            description: `Este gráfico de área apilada muestra múltiples métricas superpuestas a lo largo del tiempo. El eje X representa el tiempo (${dateField.replace(/_/g, ' ')}), y el eje Y muestra los valores acumulados de diferentes métricas. Te permite comparar cómo evolucionan múltiples variables simultáneamente y ver su contribución relativa al total.`,
            question: `¿Cómo evolucionan y se relacionan múltiples métricas a lo largo del tiempo?`,
            interpretation: `Al observar este gráfico podrás identificar: cómo cambian múltiples métricas simultáneamente, qué métrica tiene mayor contribución en cada momento, tendencias comparativas entre variables, y períodos donde alguna métrica domina sobre otras.`,
            axes: {
              x: `${dateField.replace(/_/g, ' ')} (tiempo)`,
              y: 'Valores acumulados de múltiples métricas'
            },
            units: 'valores acumulados',
            confidence: timeConfidence - 0.1,
          });
        }
      }
    }
  }

  // 3. Gráficos agrupados (múltiples series numéricas) - ANÁLISIS INTELIGENTE
  if (meaningfulNumericFields.length > 1 && meaningfulStringFields.length > 0) {
    // Analizar campos categóricos para encontrar el mejor
    const categoricalStats = meaningfulStringFields
      .map(field => ({
        field,
        stats: analyzeCategoricalField(collectionData, field)
      }))
      .filter(({ stats }) => stats !== null && stats.score > 0.4)
      .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));

    if (categoricalStats.length > 0) {
      const nameField = categoricalStats[0].field;
      const nameStats = categoricalStats[0].stats!;
      
      // Analizar campos numéricos y seleccionar los mejores
      const numericStats = meaningfulNumericFields
        .map(field => ({
          field,
          stats: analyzeNumericField(collectionData, field)
        }))
        .filter(({ stats }) => stats !== null && stats.score > 0.4)
        .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0))
        .slice(0, 3); // Máximo 3 campos numéricos

      if (numericStats.length >= 2) {
        const primaryValueField = numericStats[0].field;
        const secondaryValueField = numericStats[1].field;
        const nameLabel = nameField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
        const primaryLabel = primaryValueField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
        const secondaryLabel = secondaryValueField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
        
        // Calcular confianza basada en estadísticas
        const avgNumericScore = numericStats.reduce((sum, { stats }) => sum + (stats?.score || 0), 0) / numericStats.length;
        const combinedConfidence = Math.min(0.9, 0.7 + (nameStats.score + avgNumericScore) / 2 * 0.2);
        
        // Gráfico compuesto solo si hay buena distribución y suficientes categorías
        if (nameStats.uniqueValues >= 2 && nameStats.uniqueValues <= 15 && nameStats.distribution !== 'dominant') {
          const composedDetails = generateDetailedDescription('composed', nameField, primaryValueField, collectionName, false);
          suggestions.push({
            collection: collectionName,
            chartType: 'composed',
            title: `Comparación de ${primaryLabel} y ${secondaryLabel}`,
            nameField,
            valueField: primaryValueField,
            description: `Este gráfico compuesto combina diferentes tipos de visualización para comparar ${primaryLabel} y ${secondaryLabel} agrupados por ${nameLabel}. El eje X muestra las categorías de ${nameLabel}, y el eje Y muestra los valores de ambas métricas. Te permite ver simultáneamente cómo se relacionan estas dos variables y comparar sus valores para cada categoría.`,
            question: `¿Cómo se comparan ${primaryLabel} y ${secondaryLabel} para cada ${nameLabel}?`,
            interpretation: `Al observar este gráfico podrás identificar: qué ${nameLabel} tiene mayores valores en ${primaryLabel} vs ${secondaryLabel}, si existe correlación entre ambas métricas, patrones de relación entre las variables, y comparaciones directas entre categorías.`,
            axes: {
              x: `${nameLabel.replace(/_/g, ' ')} (categorías)`,
              y: `${primaryLabel} y ${secondaryLabel} (valores)`
            },
            units: 'valores',
            confidence: combinedConfidence,
          });
        }

        // Gráfico de barras agrupadas - mejor cuando hay 2-3 métricas y distribución balanceada
        if (numericStats.length >= 2 && numericStats.length <= 3 && 
            nameStats.uniqueValues >= 2 && nameStats.uniqueValues <= 10) {
          const groupedBarDetails = generateDetailedDescription('bar', nameField, primaryValueField, collectionName, false);
          suggestions.push({
            collection: collectionName,
            chartType: 'bar',
            title: `Análisis de múltiples métricas por ${nameLabel}`,
            nameField,
            valueField: primaryValueField,
            description: `Este gráfico de barras agrupadas muestra múltiples métricas simultáneamente agrupadas por ${nameLabel}. El eje X muestra las categorías de ${nameLabel}, y el eje Y muestra los valores de diferentes métricas. Cada grupo de barras representa una categoría, permitiendo comparar fácilmente múltiples métricas lado a lado.`,
            question: `¿Cómo se comparan múltiples métricas para cada ${nameLabel}?`,
            interpretation: `Al observar este gráfico podrás identificar: qué ${nameLabel} tiene mejores valores en cada métrica, cómo se relacionan las diferentes métricas entre sí, patrones de correlación, y comparaciones visuales directas entre categorías y métricas.`,
            axes: {
              x: `${nameLabel.replace(/_/g, ' ')} (categorías)`,
              y: 'Valores de múltiples métricas'
            },
            units: 'valores',
            confidence: combinedConfidence - 0.05,
          });
        }
      }
    }
  }

  // 4. Gráficos de múltiples métricas (radar) - ANÁLISIS INTELIGENTE
  if (meaningfulNumericFields.length >= 3 && meaningfulStringFields.length > 0) {
    // Analizar campos numéricos y seleccionar los mejores (3-5 campos)
    const numericStats = meaningfulNumericFields
      .map(field => ({
        field,
        stats: analyzeNumericField(collectionData, field)
      }))
      .filter(({ stats }) => stats !== null && stats.score > 0.4)
      .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0))
      .slice(0, 5); // Máximo 5 campos

    if (numericStats.length >= 3) {
      // Analizar campos categóricos
      const categoricalStats = meaningfulStringFields
        .map(field => ({
          field,
          stats: analyzeCategoricalField(collectionData, field)
        }))
        .filter(({ stats }) => stats !== null && stats.score > 0.4)
        .sort((a, b) => (b.stats?.score || 0) - (a.stats?.score || 0));

      if (categoricalStats.length > 0) {
        const radarNameField = categoricalStats[0].field;
        const nameStats = categoricalStats[0].stats!;
        const nameLabel = radarNameField.replace(/_/g, ' ').replace(/\//g, ' ').toLowerCase();
        
        // Radar solo funciona bien con pocas categorías (máximo 10)
        if (nameStats.uniqueValues >= 2 && nameStats.uniqueValues <= 10) {
          const numericFields = numericStats.map(({ field }) => field);
          const avgScore = numericStats.reduce((sum, { stats }) => sum + (stats?.score || 0), 0) / numericStats.length;
          const radarConfidence = Math.min(0.8, 0.6 + (nameStats.score + avgScore) / 2 * 0.2);
          
          const radarDetails = generateDetailedDescription('radar', radarNameField, numericFields[0], collectionName, false);
          
          suggestions.push({
            collection: collectionName,
            chartType: 'radar',
            title: `Análisis multidimensional por ${nameLabel}`,
            nameField: radarNameField,
            valueField: numericFields[0],
            description: radarDetails.description,
            question: radarDetails.question,
            interpretation: radarDetails.interpretation,
            axes: radarDetails.axes,
            confidence: radarConfidence,
          });
        }
      }
    }
  }

  // Ordenar por confianza (mayor a menor)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Valida que los datos del gráfico sean significativos
 */
function validateChartData(chartData: ChartDataPoint[]): boolean {
  if (!chartData || chartData.length === 0) {
    return false;
  }

  // Verificar que haya al menos algunos valores no cero
  const nonZeroValues = chartData.filter(d => Number(d.value) !== 0);
  if (nonZeroValues.length < Math.max(1, chartData.length * 0.1)) {
    return false;
  }

  // Verificar que haya variación en los valores
  const values = chartData.map(d => Number(d.value));
  const uniqueValues = new Set(values);
  if (uniqueValues.size < 2) {
    return false;
  }

  return true;
}

/**
 * Genera un gráfico a partir de una sugerencia
 */
export async function generateChartFromSuggestion(
  suggestion: ChartSuggestion,
  collectionData: any[]
): Promise<ChartConfig | null> {
  let chartData: ChartDataPoint[];

  // Si es un gráfico de tiempo, agrupar por fecha y ordenar
  if (suggestion.chartType === 'line' || suggestion.chartType === 'area') {
    chartData = groupByField(collectionData, suggestion.nameField, suggestion.valueField);
    // Ordenar por fecha si es posible
    chartData.sort((a, b) => {
      const dateA = new Date(a.name).getTime();
      const dateB = new Date(b.name).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      // Si no es fecha, ordenar alfabéticamente
      return String(a.name).localeCompare(String(b.name));
    });
  } else if (suggestion.chartType === 'composed') {
    // Para gráficos compuestos, incluir múltiples campos numéricos significativos
    const fields = detectFields(collectionData);
    const numericFields = fields.meaningfulNumericFields.length > 0
      ? fields.meaningfulNumericFields.slice(0, 3)
      : fields.numericFields.slice(0, 3);
    
    // Agrupar por el campo de nombre y sumar todos los campos numéricos
    const grouped = new Map<string, Record<string, number>>();
    
    collectionData.forEach((doc) => {
      const groupKey = String(getNestedValue(doc, suggestion.nameField) || 'Sin categoría');
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {});
      }
      const group = grouped.get(groupKey)!;
      
      numericFields.forEach(field => {
        const value = Number(getNestedValue(doc, field) || 0);
        group[field] = (group[field] || 0) + value;
      });
    });

    chartData = Array.from(grouped.entries()).map(([name, values]) => ({
      name,
      value: values[suggestion.valueField] || 0,
      ...values,
    }));
  } else {
    // Para otros tipos, agrupar por el campo de nombre
    // Si el campo de valor es el mismo que el de nombre, contar ocurrencias
    if (suggestion.nameField === suggestion.valueField) {
      // Contar ocurrencias de cada categoría
      const counts = new Map<string, number>();
      collectionData.forEach((doc) => {
        const key = String(getNestedValue(doc, suggestion.nameField) || 'Sin categoría');
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      chartData = Array.from(counts.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    } else {
      chartData = groupByField(collectionData, suggestion.nameField, suggestion.valueField);
    }
    
    // Ordenar por valor descendente para mejor visualización
    chartData.sort((a, b) => b.value - a.value);
  }

  // Si es un gráfico circular/donut, limitar a los top N valores
  if (suggestion.chartType === 'pie' || suggestion.chartType === 'donut') {
    chartData = chartData.slice(0, 10); // Top 10
  }

  // Validar que los datos sean significativos
  if (!validateChartData(chartData)) {
    return null; // Retornar null si los datos no son válidos
  }

  // Limitar el número de puntos de datos para mejor rendimiento
  if (chartData.length > 50) {
    chartData = chartData.slice(0, 50);
  }

  const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Para gráficos de conteo, el valueField debe ser diferente en mongoSource
  // porque necesitamos contar, no sumar un campo numérico
  const mongoSourceValueField = suggestion.nameField === suggestion.valueField
    ? suggestion.nameField // Para conteo, usamos el mismo campo
    : suggestion.valueField;

  return {
    id: chartId,
    title: suggestion.title,
    type: suggestion.chartType,
    dataKey: 'value', // Siempre usar 'value' como dataKey para consistencia
    color: CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)],
    data: chartData,
    size: 'medium',
    mongoSource: {
      collection: suggestion.collection,
      nameField: suggestion.nameField,
      valueField: mongoSourceValueField,
    },
    autoRefresh: {
      enabled: false,
      interval: 30,
    },
  };
}

/**
 * Analiza todas las colecciones y genera sugerencias de gráficos
 */
export async function analyzeAllCollections(
  collections: string[],
  getCollectionData: (collection: string) => Promise<any[]>
): Promise<ChartSuggestion[]> {
  const allSuggestions: ChartSuggestion[] = [];

  for (const collection of collections) {
    try {
      const data = await getCollectionData(collection);
      if (data && data.length > 0) {
        const suggestions = await analyzeCollection(data, collection);
        allSuggestions.push(...suggestions);
      }
    } catch (error) {
      console.error(`Error analizando colección ${collection}:`, error);
    }
  }

  // Ordenar por confianza y devolver los mejores
  return allSuggestions.sort((a, b) => b.confidence - a.confidence);
}

