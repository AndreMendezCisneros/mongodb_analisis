import { useState, useEffect } from 'react';
import { ChartConfig, ChartType, CHART_TYPES, CHART_COLORS } from '@/types/chart';
import { generateTimeSeriesData, generateCategoryData, generateRadarData } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ChartEditorProps {
  chart?: ChartConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (chart: ChartConfig) => void;
}

export const ChartEditor = ({ chart, open, onClose, onSave }: ChartEditorProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChartType>('line');
  const [color, setColor] = useState(CHART_COLORS[0]);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    if (chart) {
      setTitle(chart.title);
      setType(chart.type);
      setColor(chart.color);
      setSize(chart.size || 'medium');
    } else {
      setTitle('');
      setType('line');
      setColor(CHART_COLORS[0]);
      setSize('medium');
    }
  }, [chart, open]);

  const getDataForType = (chartType: ChartType) => {
    switch (chartType) {
      case 'pie':
      case 'donut':
        return generateCategoryData();
      case 'radar':
        return generateRadarData();
      default:
        return generateTimeSeriesData();
    }
  };

  const getDataKeyForType = (chartType: ChartType) => {
    switch (chartType) {
      case 'pie':
      case 'donut':
      case 'radar':
        return 'value';
      default:
        return 'value';
    }
  };

  const handleSave = () => {
    const newChart: ChartConfig = {
      id: chart?.id || Date.now().toString(),
      title: title || 'Nuevo Gráfico',
      type,
      dataKey: getDataKeyForType(type),
      color,
      data: chart?.data || getDataForType(type),
      size,
    };
    onSave(newChart);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{chart ? 'Editar Gráfico' : 'Nuevo Gráfico'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del gráfico"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Gráfico</Label>
            <Select value={type} onValueChange={(v) => setType(v as ChartType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {CHART_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tamaño</Label>
            <Select value={size} onValueChange={(v) => setSize(v as 'small' | 'medium' | 'large')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeño</SelectItem>
                <SelectItem value="medium">Mediano</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {chart ? 'Guardar Cambios' : 'Crear Gráfico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
