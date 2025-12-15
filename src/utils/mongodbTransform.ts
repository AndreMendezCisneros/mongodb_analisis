import { ChartDataPoint } from '@/types/chart';

/**
 * Transforma datos de MongoDB al formato ChartDataPoint
 */
export function transformMongoDataToChart(
  data: any[],
  nameField: string,
  valueField: string
): ChartDataPoint[] {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((doc, index) => {
    // Obtener el nombre desde el campo especificado o usar el índice
    const name = getNestedValue(doc, nameField) || `Item ${index + 1}`;
    
    // Obtener el valor desde el campo especificado
    const value = getNestedValue(doc, valueField) || 0;

    // Incluir todos los campos numéricos adicionales
    const chartPoint: ChartDataPoint = {
      name: String(name),
      value: Number(value),
    };

    // Agregar todos los campos numéricos adicionales
    Object.keys(doc).forEach((key) => {
      if (key !== nameField && key !== valueField && key !== '_id') {
        const val = doc[key];
        if (typeof val === 'number') {
          chartPoint[key] = val;
        }
      }
    });

    return chartPoint;
  });
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 * Ejemplo: getNestedValue(obj, "user.profile.name")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Detecta si un campo numérico es un ID (no útil para gráficos)
 */
function isIdField(fieldName: string, values: any[]): boolean {
  const lowerName = fieldName.toLowerCase();
  
  // Nombres comunes de campos ID
  const idPatterns = ['id', 'dni', 'codigo', 'code', 'numero', 'number', 'num', 'nro'];
  if (idPatterns.some(pattern => lowerName.includes(pattern))) {
    return true;
  }

  // Si todos los valores son únicos y son números grandes, probablemente es un ID
  const uniqueValues = new Set(values.map(v => String(v)));
  if (uniqueValues.size === values.length && values.length > 10) {
    // Verificar si son números grandes (típicos de IDs)
    const sampleValues = values.slice(0, 10);
    const allLargeNumbers = sampleValues.every(v => {
      const num = Number(v);
      return !isNaN(num) && num > 1000;
    });
    if (allLargeNumbers) {
      return true;
    }
  }

  return false;
}

/**
 * Detecta campos disponibles en los documentos de MongoDB
 */
export function detectFields(data: any[]): {
  numericFields: string[];
  stringFields: string[];
  dateFields: string[];
  allFields: string[];
  meaningfulNumericFields: string[]; // Campos numéricos que tienen sentido para gráficos
} {
  if (!data || data.length === 0) {
    return {
      numericFields: [],
      stringFields: [],
      dateFields: [],
      allFields: [],
      meaningfulNumericFields: [],
    };
  }

  const allFields = new Set<string>();
  const numericFields = new Set<string>();
  const stringFields = new Set<string>();
  const dateFields = new Set<string>();
  const fieldValues: Record<string, any[]> = {};

  // Primera pasada: detectar tipos y recopilar valores
  data.forEach((doc) => {
    Object.keys(doc).forEach((key) => {
      if (key === '_id') return; // Ignorar _id
      
      allFields.add(key);
      const value = doc[key];

      if (!fieldValues[key]) {
        fieldValues[key] = [];
      }
      fieldValues[key].push(value);

      if (value instanceof Date) {
        dateFields.add(key);
      } else if (typeof value === 'number') {
        numericFields.add(key);
      } else if (typeof value === 'string') {
        stringFields.add(key);
        // Verificar si parece una fecha
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          dateFields.add(key);
        }
      }
    });
  });

  // Filtrar campos numéricos que son IDs o no tienen sentido
  const meaningfulNumericFields = Array.from(numericFields).filter(field => {
    const values = fieldValues[field] || [];
    
    // Excluir si es un campo ID
    if (isIdField(field, values)) {
      return false;
    }

    // Verificar que tenga valores variados (no todos iguales)
    const uniqueValues = new Set(values.map(v => String(v)));
    if (uniqueValues.size < 2) {
      return false;
    }

    // Verificar que tenga valores significativos (no todos ceros)
    const nonZeroValues = values.filter(v => Number(v) !== 0);
    if (nonZeroValues.length < data.length * 0.1) { // Al menos 10% de valores no cero
      return false;
    }

    return true;
  });

  return {
    numericFields: Array.from(numericFields),
    stringFields: Array.from(stringFields),
    dateFields: Array.from(dateFields),
    allFields: Array.from(allFields),
    meaningfulNumericFields,
  };
}

/**
 * Agrupa datos por un campo específico y suma valores numéricos o cuenta ocurrencias
 */
export function groupByField(
  data: any[],
  groupField: string,
  valueField: string
): ChartDataPoint[] {
  const grouped = new Map<string, number>();

  // Si el campo de agrupación es el mismo que el de valor, contar ocurrencias
  const isCountMode = groupField === valueField;

  data.forEach((doc) => {
    const groupKey = String(getNestedValue(doc, groupField) || 'Sin categoría');
    
    if (isCountMode) {
      // Modo conteo: simplemente contar cuántas veces aparece cada categoría
      grouped.set(groupKey, (grouped.get(groupKey) || 0) + 1);
    } else {
      // Modo suma: sumar valores numéricos del campo de valor
      const value = Number(getNestedValue(doc, valueField) || 0);
      grouped.set(groupKey, (grouped.get(groupKey) || 0) + value);
    }
  });

  return Array.from(grouped.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}



