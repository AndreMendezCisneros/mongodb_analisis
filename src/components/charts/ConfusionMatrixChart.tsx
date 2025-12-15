import { useMemo } from 'react';
import { Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';

interface ConfusionMatrixChartProps {
  verdaderosPositivos: number;
  falsosPositivos: number;
  verdaderosNegativos: number;
  falsosNegativos: number;
}

export const ConfusionMatrixChart = ({
  verdaderosPositivos,
  falsosPositivos,
  verdaderosNegativos,
  falsosNegativos,
}: ConfusionMatrixChartProps) => {
  // CORRECCIÓN: En clasificación binaria estándar:
  // Clase Positiva (1) = APRUEBA
  // Clase Negativa (0) = DESAPRUEBA
  //
  // Verdaderos Positivos (TP) = Predicho Aprueba (1) y Real Aprueba (1)
  // Falsos Positivos (FP) = Predicho Aprueba (1) y Real Desaprueba (0)
  // Verdaderos Negativos (TN) = Predicho Desaprueba (0) y Real Desaprueba (0)
  // Falsos Negativos (FN) = Predicho Desaprueba (0) y Real Aprueba (1)
  //
  // Para la matriz visual:
  // - Eje Y (Real): RIESGO (0) = Desaprueba, SEGURO (1) = Aprueba
  // - Eje X (Predicho): RIESGO (0) = Desaprueba, SEGURO (1) = Aprueba
  const data = useMemo(() => {
    return [
      {
        name: 'RIESGO (0)', // Real = Desaprueba
        'RIESGO (0)': verdaderosNegativos, // Predicho Desaprueba y Real Desaprueba (TN) ✓ Correcto
        'SEGURO (1)': falsosPositivos, // Predicho Aprueba pero Real Desaprueba (FP) ✗ Error
      },
      {
        name: 'SEGURO (1)', // Real = Aprueba
        'RIESGO (0)': falsosNegativos, // Predicho Desaprueba pero Real Aprueba (FN) ✗ Error
        'SEGURO (1)': verdaderosPositivos, // Predicho Aprueba y Real Aprueba (TP) ✓ Correcto
      },
    ];
  }, [verdaderosPositivos, falsosPositivos, verdaderosNegativos, falsosNegativos]);

  const maxValue = Math.max(verdaderosPositivos, falsosPositivos, verdaderosNegativos, falsosNegativos);

  // Función para obtener el color según el valor y la posición
  const getColor = (entry: any, dataKey: string) => {
    const value = entry[dataKey];
    const isCorrect = 
      (entry.name === 'RIESGO (0)' && dataKey === 'RIESGO (0)') ||
      (entry.name === 'SEGURO (1)' && dataKey === 'SEGURO (1)');
    
    if (isCorrect) {
      // Verde para predicciones correctas (más oscuro = mayor valor)
      const intensity = Math.min(0.9, 0.3 + (value / maxValue) * 0.6);
      return `rgba(34, 197, 94, ${intensity})`; // Verde
    } else {
      // Rojo/Naranja para predicciones incorrectas
      const intensity = Math.min(0.9, 0.3 + (value / maxValue) * 0.6);
      return `rgba(239, 68, 68, ${intensity})`; // Rojo
    }
  };

  // Componente personalizado para mostrar valores en las barras
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return null;
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" label={{ value: 'Cantidad', position: 'insideBottom', offset: -5 }} />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120}
            label={{ value: 'Etiqueta Real (True label)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => `Predicha: ${value}`}
          />
          <Bar 
            dataKey="RIESGO (0)" 
            name="RIESGO (0)"
            stackId="a"
            label={renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-0-${index}`}
                fill={getColor(entry, 'RIESGO (0)')}
              />
            ))}
          </Bar>
          <Bar 
            dataKey="SEGURO (1)" 
            name="SEGURO (1)"
            stackId="a"
            label={renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-1-${index}`}
                fill={getColor(entry, 'SEGURO (1)')}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Valores numéricos en la matriz */}
      <div className="mt-4 grid grid-cols-3 gap-2 max-w-md mx-auto">
        <div></div>
        <div className="text-center text-sm font-medium">Predicha: RIESGO (0)</div>
        <div className="text-center text-sm font-medium">Predicha: SEGURO (1)</div>
        
        <div className="text-sm font-medium">Real: RIESGO (0)</div>
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded text-center font-bold border-2 border-green-500">
          {verdaderosNegativos}
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-center font-bold border-2 border-red-500">
          {falsosPositivos}
        </div>
        
        <div className="text-sm font-medium">Real: SEGURO (1)</div>
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-center font-bold border-2 border-red-500">
          {falsosNegativos}
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded text-center font-bold border-2 border-green-500">
          {verdaderosPositivos}
        </div>
      </div>
    </div>
  );
};
