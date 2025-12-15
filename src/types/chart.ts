export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'radar' | 'composed';

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  dataKey: string;
  color: string;
  data: ChartDataPoint[];
  size?: 'small' | 'medium' | 'large';
  // Configuración de MongoDB
  mongoSource?: {
    collection: string;
    nameField: string;
    valueField: string;
    filter?: any;
    pipeline?: any[];
  };
  // Configuración de auto-refresh
  autoRefresh?: {
    enabled: boolean;
    interval: number; // en segundos
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'line', label: 'Línea' },
  { value: 'bar', label: 'Barras' },
  { value: 'area', label: 'Área' },
  { value: 'pie', label: 'Circular' },
  { value: 'donut', label: 'Donut' },
  { value: 'radar', label: 'Radar' },
  { value: 'composed', label: 'Compuesto' },
];
