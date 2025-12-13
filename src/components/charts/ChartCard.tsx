import { useState } from 'react';
import { MoreVertical, Edit, Trash2, RefreshCw } from 'lucide-react';
import { ChartConfig } from '@/types/chart';
import { LineChartComponent } from './LineChartComponent';
import { BarChartComponent } from './BarChartComponent';
import { AreaChartComponent } from './AreaChartComponent';
import { PieChartComponent } from './PieChartComponent';
import { RadarChartComponent } from './RadarChartComponent';
import { ComposedChartComponent } from './ComposedChartComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChartCardProps {
  chart: ChartConfig;
  onEdit: (chart: ChartConfig) => void;
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
}

export const ChartCard = ({ chart, onEdit, onDelete, onRefresh }: ChartCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const renderChart = () => {
    const { type, data, dataKey, color } = chart;
    
    switch (type) {
      case 'line':
        return <LineChartComponent data={data} dataKey={dataKey} color={color} />;
      case 'bar':
        return <BarChartComponent data={data} dataKey={dataKey} color={color} />;
      case 'area':
        return <AreaChartComponent data={data} dataKey={dataKey} color={color} />;
      case 'pie':
        return <PieChartComponent data={data} dataKey={dataKey} />;
      case 'donut':
        return <PieChartComponent data={data} dataKey={dataKey} isDonut />;
      case 'radar':
        return <RadarChartComponent data={data} dataKey={dataKey} color={color} />;
      case 'composed':
        return <ComposedChartComponent data={data} color={color} />;
      default:
        return <LineChartComponent data={data} dataKey={dataKey} color={color} />;
    }
  };

  const getSizeClass = () => {
    switch (chart.size) {
      case 'large':
        return 'col-span-2';
      case 'small':
        return 'col-span-1';
      default:
        return 'col-span-1';
    }
  };

  return (
    <Card 
      className={`glass-card animate-scale-in transition-all duration-300 hover:border-primary/30 ${getSizeClass()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium text-foreground/90">{chart.title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(chart)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRefresh(chart.id)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(chart.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="h-[280px] pt-0">
        {renderChart()}
      </CardContent>
    </Card>
  );
};
