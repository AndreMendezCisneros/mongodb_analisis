import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/types/chart';

interface BarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  color: string;
}

export const BarChartComponent = ({ data, dataKey, color }: BarChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
      <XAxis 
        dataKey="name" 
        stroke="hsl(var(--muted-foreground))" 
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <YAxis 
        stroke="hsl(var(--muted-foreground))" 
        fontSize={12}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          color: 'hsl(var(--foreground))',
        }}
        cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
      />
      <Bar 
        dataKey={dataKey} 
        fill={color} 
        radius={[4, 4, 0, 0]}
        maxBarSize={50}
      />
    </BarChart>
  </ResponsiveContainer>
);
