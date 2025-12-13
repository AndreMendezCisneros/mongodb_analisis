import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/types/chart';

interface LineChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  color: string;
}

export const LineChartComponent = ({ data, dataKey, color }: LineChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={2.5}
        dot={{ fill: color, strokeWidth: 0, r: 4 }}
        activeDot={{ r: 6, fill: color }}
      />
    </LineChart>
  </ResponsiveContainer>
);
