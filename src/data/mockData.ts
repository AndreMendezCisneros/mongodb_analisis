import { ChartConfig, ChartDataPoint } from '@/types/chart';

export const generateTimeSeriesData = (points: number = 12): ChartDataPoint[] => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months.slice(0, points).map((name, i) => ({
    name,
    value: Math.floor(Math.random() * 8000) + 2000,
    users: Math.floor(Math.random() * 500) + 100,
    sessions: Math.floor(Math.random() * 3000) + 500,
  }));
};

export const generateCategoryData = (): ChartDataPoint[] => [
  { name: 'Electrónica', value: 4500 },
  { name: 'Ropa', value: 3200 },
  { name: 'Hogar', value: 2800 },
  { name: 'Deportes', value: 2100 },
  { name: 'Libros', value: 1800 },
  { name: 'Otros', value: 1200 },
];

export const generateRadarData = (): ChartDataPoint[] => [
  { name: 'Velocidad', value: 85 },
  { name: 'Fiabilidad', value: 92 },
  { name: 'Usabilidad', value: 78 },
  { name: 'Seguridad', value: 88 },
  { name: 'Escalabilidad', value: 72 },
  { name: 'Rendimiento', value: 95 },
];

// Array vacío - sin gráficos predefinidos. El usuario creará sus propios gráficos
export const initialCharts: ChartConfig[] = [];

export const statsData = [
  { label: 'Total Usuarios', value: '24,589', change: '+12.5%', positive: true },
  { label: 'Ingresos', value: '$128,430', change: '+8.2%', positive: true },
  { label: 'Pedidos', value: '1,847', change: '-3.1%', positive: false },
  { label: 'Tasa Conversión', value: '3.24%', change: '+0.8%', positive: true },
];
