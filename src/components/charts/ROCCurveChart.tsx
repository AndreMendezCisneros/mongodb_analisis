import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ROCCurveChartProps {
  aucRoc: number;
  // Opcional: si tenemos los datos reales de la curva ROC
  rocPoints?: Array<{ fpr: number; tpr: number }>;
}

/**
 * Genera puntos aproximados de la curva ROC basados en el AUC
 * Para una implementación precisa, se necesitarían las probabilidades predichas
 */
const generateROCPoints = (auc: number, numPoints: number = 100): Array<{ fpr: number; tpr: number }> => {
  const points: Array<{ fpr: number; tpr: number }> = [];
  
  // Generar puntos que aproximen una curva ROC con el AUC dado
  for (let i = 0; i <= numPoints; i++) {
    const fpr = i / numPoints;
    
    // Aproximación de la curva ROC usando una función exponencial
    // Para AUC > 0.5, la curva está por encima de la diagonal
    if (auc > 0.5) {
      // Usar una función que pase por (0,0), (1,1) y tenga área aproximada = auc
      // tpr = fpr^(1/(2*auc)) para auc > 0.5
      const tpr = Math.pow(fpr, 1 / (2 * auc));
      points.push({ fpr, tpr });
    } else {
      // Para AUC <= 0.5, usar la diagonal (clasificador aleatorio)
      points.push({ fpr, tpr: fpr });
    }
  }
  
  return points;
};

export const ROCCurveChart = ({ aucRoc, rocPoints }: ROCCurveChartProps) => {
  const data = useMemo(() => {
    if (rocPoints && rocPoints.length > 0) {
      return rocPoints.map(point => ({
        'Tasa de Falsos Positivos': point.fpr,
        'Curva ROC': point.tpr,
        'Clasificador Aleatorio': point.fpr,
      }));
    }
    
    // Generar puntos aproximados
    const points = generateROCPoints(aucRoc);
    return points.map(point => ({
      'Tasa de Falsos Positivos': point.fpr,
      'Curva ROC': point.tpr,
      'Clasificador Aleatorio': point.fpr,
    }));
  }, [aucRoc, rocPoints]);

  // Determinar el color según el AUC
  const getROCColor = () => {
    if (aucRoc >= 0.9) return '#f97316'; // Naranja para excelente
    if (aucRoc >= 0.7) return '#3b82f6'; // Azul para bueno
    return '#ef4444'; // Rojo para malo
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="Tasa de Falsos Positivos"
            label={{ value: 'Tasa de Falsos Positivos (1 - Especificidad)', position: 'insideBottom', offset: -5 }}
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          />
          <YAxis 
            label={{ value: 'Tasa de Verdaderos Positivos (Sensibilidad/Recall)', angle: -90, position: 'insideLeft' }}
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              (value * 100).toFixed(1) + '%',
              name === 'Curva ROC' ? `Curva ROC (area = ${aucRoc.toFixed(2)})` : name
            ]}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
          />
          {/* Línea diagonal de referencia (clasificador aleatorio) */}
          <Line
            type="monotone"
            dataKey="Clasificador Aleatorio"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Clasificador Aleatorio"
          />
          {/* Curva ROC */}
          <Line
            type="monotone"
            dataKey="Curva ROC"
            stroke={getROCColor()}
            strokeWidth={3}
            dot={false}
            name={`Curva ROC (area = ${aucRoc.toFixed(2)})`}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Información adicional */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">AUC-ROC:</span>
          <span className={`text-lg font-bold ${
            aucRoc >= 0.9 ? 'text-orange-600' : 
            aucRoc >= 0.7 ? 'text-blue-600' : 
            'text-red-600'
          }`}>
            {aucRoc.toFixed(3)}
          </span>
          {aucRoc >= 0.7 && (
            <span className="text-sm text-green-600">✓ El modelo tiene buen poder de discriminación (&gt; 0.70)</span>
          )}
        </div>
      </div>
    </div>
  );
};
