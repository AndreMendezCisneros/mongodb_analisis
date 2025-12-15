import { useState, useEffect } from 'react';
import { ChartConfig, ChartType, CHART_TYPES, CHART_COLORS } from '@/types/chart';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataEditor } from './DataEditor';
import { ChartDataPoint } from '@/types/chart';
import { Database, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChartEditorProps {
  chart?: ChartConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (chart: ChartConfig) => void;
  initialData?: ChartDataPoint[];
}

export const ChartEditor = ({ chart, open, onClose, onSave, initialData }: ChartEditorProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChartType>('line');
  const [color, setColor] = useState(CHART_COLORS[0]);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [dataKey, setDataKey] = useState('value');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (chart) {
      setTitle(chart.title);
      setType(chart.type);
      setColor(chart.color);
      setSize(chart.size || 'medium');
      setDataKey(chart.dataKey);
      setChartData(chart.data);
    } else if (initialData && initialData.length > 0) {
      // Si hay datos iniciales de MongoDB, usarlos
      setChartData(initialData);
      // Detectar dataKey automáticamente
      if (initialData[0]) {
        const numericKeys = Object.keys(initialData[0]).filter(
          (key) => typeof initialData[0][key] === 'number' && key !== 'value'
        );
        setDataKey(numericKeys.length > 0 ? numericKeys[0] : 'value');
      }
    } else {
      // Inicio limpio sin datos
      setTitle('');
      setType('line');
      setColor(CHART_COLORS[0]);
      setSize('medium');
      setDataKey('value');
      setChartData([]);
    }
  }, [chart, open, initialData]);

  const handleDataChange = (newData: ChartDataPoint[]) => {
    setChartData(newData);
    // Auto-detectar dataKey si hay datos
    if (newData.length > 0 && newData[0]) {
      const keys = Object.keys(newData[0]).filter(
        (key) => typeof newData[0][key] === 'number'
      );
      if (keys.length > 0 && !keys.includes(dataKey)) {
        setDataKey(keys[0]);
      }
    }
  };

  const handleSave = () => {
    if (chartData.length === 0) {
      toast.error('Agrega al menos un punto de datos');
      return;
    }

    if (!title.trim()) {
      toast.error('Ingresa un título para el gráfico');
      return;
    }
    
    const newChart: ChartConfig = {
      id: chart?.id || Date.now().toString(),
      title: title.trim(),
      type,
      dataKey,
      color,
      data: chartData,
      size,
      // Preservar configuración de MongoDB si existe
      mongoSource: chart?.mongoSource,
      autoRefresh: chart?.autoRefresh,
    };
    onSave(newChart);
    onClose();
  };

  // Obtener campos numéricos disponibles de los datos
  const availableDataKeys = chartData.length > 0 && chartData[0]
    ? Object.keys(chartData[0]).filter(
        (key) => typeof chartData[0][key] === 'number'
      )
    : ['value'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {chart ? 'Editar Gráfico' : 'Crear Nuevo Gráfico'}
          </DialogTitle>
          <DialogDescription>
            Configura todos los aspectos de tu gráfico personalizado
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="style">
              <Settings2 className="h-4 w-4 mr-2" />
              Estilo
            </TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 mt-4">
            <DataEditor data={chartData || []} onChange={handleDataChange} />
            
            {availableDataKeys.length > 1 && (
              <div className="space-y-2">
                <Label>Campo a Visualizar (Data Key)</Label>
                <Select value={dataKey} onValueChange={setDataKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona qué campo numérico quieres visualizar en el gráfico
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Gráfico</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Ventas Mensuales 2024"
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
              <Label>Color Principal</Label>
              <div className="flex gap-2 flex-wrap">
                {CHART_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setColor(c)}
                    className={`h-10 w-10 rounded-full transition-transform hover:scale-110 ${
                      color === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    title={`Color ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tamaño del Gráfico</Label>
              <Select value={size} onValueChange={(v) => setSize(v as 'small' | 'medium' | 'large')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeño (1 columna)</SelectItem>
                  <SelectItem value="medium">Mediano (1 columna)</SelectItem>
                  <SelectItem value="large">Grande (2 columnas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg bg-secondary/50">
              <h4 className="text-sm font-medium mb-2">Información del Gráfico</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Puntos de datos:</span>
                  <span className="font-medium">{chartData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campo principal:</span>
                  <span className="font-medium">{dataKey}</span>
                </div>
                {chart?.mongoSource && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuente:</span>
                    <span className="font-medium text-primary">MongoDB - {chart.mongoSource.collection}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={chartData.length === 0 || !title.trim()}>
            {chart ? 'Guardar Cambios' : 'Crear Gráfico'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
