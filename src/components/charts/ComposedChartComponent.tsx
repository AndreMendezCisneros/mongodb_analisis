import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartDataPoint } from '@/types/chart';

interface ComposedChartProps {
  data: ChartDataPoint[];
  color: string;
}

export const ComposedChartComponent = ({ data, color }: ComposedChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
      />
      <Legend 
        wrapperStyle={{ fontSize: '12px' }}
        iconType="circle"
        iconSize={8}
      />
      <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} name="Valor" />
      <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Usuarios" />
    </ComposedChart>
  </ResponsiveContainer>
);
