import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartDataPoint } from '@/types/chart';

interface RadarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  color: string;
}

export const RadarChartComponent = ({ data, dataKey, color }: RadarChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
      <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
      <PolarAngleAxis 
        dataKey="name" 
        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
      />
      <PolarRadiusAxis 
        angle={30} 
        domain={[0, 100]} 
        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        axisLine={false}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          color: 'hsl(var(--foreground))',
        }}
      />
      <Radar
        name="Valor"
        dataKey={dataKey}
        stroke={color}
        fill={color}
        fillOpacity={0.3}
        strokeWidth={2}
      />
    </RadarChart>
  </ResponsiveContainer>
);
