import { useState } from 'react';
import { LineChart, PlusCircle, Database, Code, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartCard } from '@/components/charts/ChartCard';
import { AutoRefreshConfig } from '@/components/dashboard/AutoRefreshConfig';
import { AutoChartGenerator } from '@/components/dashboard/AutoChartGenerator';
import { ChartConfig } from '@/types/chart';
import { useMongoDB } from '@/hooks/useMongoDB';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ChartsViewProps {
  charts: ChartConfig[];
  onAddChart: () => void;
  onEditChart: (chart: ChartConfig) => void;
  onDeleteChart: (id: string) => void;
  onRefreshChart: (id: string) => void;
  onExploreCollections: () => void;
  onAggregationBuilder: () => void;
  onChartsGenerated: (charts: ChartConfig[]) => void;
  globalAutoRefresh: {
    enabled: boolean;
    interval: number;
  };
  onToggleAutoRefresh: (enabled: boolean) => void;
  onIntervalChange: (interval: number) => void;
}

export const ChartsView = ({
  charts,
  onAddChart,
  onEditChart,
  onDeleteChart,
  onRefreshChart,
  onExploreCollections,
  onAggregationBuilder,
  onChartsGenerated,
  globalAutoRefresh,
  onToggleAutoRefresh,
  onIntervalChange,
}: ChartsViewProps) => {
  const { isConnected, status } = useMongoDB();
  const [showAutoGenerator, setShowAutoGenerator] = useState(false);

  const handleManualRefresh = () => {
    charts.forEach((c) => {
      if (c.mongoSource) {
        onRefreshChart(c.id);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gráficos</h2>
          <p className="text-muted-foreground mt-1">
            Crea y gestiona gráficos con datos de MongoDB
          </p>
        </div>
        <div className="flex items-center gap-3">
          {charts.length > 0 && (
            <AutoRefreshConfig
              enabled={globalAutoRefresh.enabled}
              interval={globalAutoRefresh.interval}
              onToggle={onToggleAutoRefresh}
              onIntervalChange={onIntervalChange}
              onManualRefresh={handleManualRefresh}
            />
          )}
          {isConnected && (
            <Button onClick={() => setShowAutoGenerator(true)} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar Automáticamente
            </Button>
          )}
          <Button onClick={onAddChart} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Crear Gráfico
          </Button>
        </div>
      </div>

      {!isConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin conexión a MongoDB</AlertTitle>
          <AlertDescription>
            Necesitas estar conectado a MongoDB para crear gráficos con datos de la base de datos.
            Ve a la sección de Configuración para conectarte.
          </AlertDescription>
        </Alert>
      )}

      {isConnected && charts.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-secondary/20">
          <LineChart className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay gráficos aún</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Crea tu primer gráfico personalizado. Puedes usar datos de MongoDB, agregaciones complejas, 
            o ingresar tus propios datos manualmente.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => setShowAutoGenerator(true)} className="gap-2 bg-primary">
              <Sparkles className="h-4 w-4" />
              Generar Automáticamente
            </Button>
            <Button onClick={onExploreCollections} variant="outline" className="gap-2">
              <Database className="h-4 w-4" />
              Usar Datos de MongoDB
            </Button>
            <Button onClick={onAggregationBuilder} variant="outline" className="gap-2">
              <Code className="h-4 w-4" />
              Crear Agregación
            </Button>
            <Button onClick={onAddChart} variant="outline" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Crear Gráfico Manual
            </Button>
          </div>
        </div>
      )}

      {charts.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {charts.length} {charts.length === 1 ? 'gráfico activo' : 'gráficos activos'}
            </p>
          </div>
          <div className="chart-grid">
            {charts.map((chart) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                onEdit={onEditChart}
                onDelete={onDeleteChart}
                onRefresh={onRefreshChart}
              />
            ))}
          </div>
        </>
      )}

      {showAutoGenerator && (
        <AutoChartGenerator
          onChartsGenerated={(newCharts) => {
            onChartsGenerated(newCharts);
            setShowAutoGenerator(false);
          }}
          onClose={() => setShowAutoGenerator(false)}
        />
      )}
    </div>
  );
};
