import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartDataPoint, CHART_COLORS } from '@/types/chart';

interface PieChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  isDonut?: boolean;
}

export const PieChartComponent = ({ data, dataKey, isDonut = false }: PieChartProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={isDonut ? 60 : 0}
        outerRadius={90}
        paddingAngle={2}
        dataKey={dataKey}
        nameKey="name"
        strokeWidth={0}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          color: '#ffffff',
        }}
        labelStyle={{
          color: '#ffffff',
          fontWeight: 'bold',
        }}
        itemStyle={{
          color: '#ffffff',
        }}
        formatter={(value: any, name: string) => {
          return [`${value}`, name];
        }}
      />
      <Legend 
        wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}
        iconType="circle"
        iconSize={8}
      />
    </PieChart>
  </ResponsiveContainer>
);
