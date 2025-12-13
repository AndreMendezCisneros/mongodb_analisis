import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '@/types/chart';

interface AreaChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  color: string;
}

export const AreaChartComponent = ({ data, dataKey, color }: AreaChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
      <defs>
        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
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
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={2}
        fill={`url(#gradient-${dataKey})`}
      />
    </AreaChart>
  </ResponsiveContainer>
);
