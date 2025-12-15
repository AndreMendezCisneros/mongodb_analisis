import { useState, useEffect, useCallback } from 'react';
import { ChartConfig, ChartDataPoint } from '@/types/chart';
import { initialCharts, statsData, generateTimeSeriesData, generateCategoryData, generateRadarData } from '@/data/mockData';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartEditor } from '@/components/dashboard/ChartEditor';
import { CollectionExplorer } from '@/components/dashboard/CollectionExplorer';
import { AggregationBuilder } from '@/components/dashboard/AggregationBuilder';
import { AutoRefreshConfig } from '@/components/dashboard/AutoRefreshConfig';
import { CollectionsView } from '@/components/dashboard/CollectionsView';
import { DataExplorerView } from '@/components/dashboard/DataExplorerView';
import { SettingsView } from '@/components/dashboard/SettingsView';
import { ChartsView } from '@/components/dashboard/ChartsView';
import { AnalyticsView } from '@/components/dashboard/AnalyticsView';
import { Footer } from '@/components/dashboard/Footer';
import { getCollectionData, executeAggregation } from '@/services/mongodb';
import { transformMongoDataToChart } from '@/utils/mongodbTransform';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Category } from '@/components/dashboard/Sidebar';

const Index = () => {
  const [charts, setCharts] = useState<ChartConfig[]>(() => {
    try {
      return initialCharts || [];
    } catch (error) {
      console.error('Error inicializando charts:', error);
      return [];
    }
  });
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCollectionExplorerOpen, setIsCollectionExplorerOpen] = useState(false);
  const [isAggregationBuilderOpen, setIsAggregationBuilderOpen] = useState(false);
  const [pendingData, setPendingData] = useState<{
    data: ChartDataPoint[];
    collectionName: string;
    nameField: string;
    valueField: string;
    filter?: any;
    pipeline?: any[];
  } | null>(null);
  const [globalAutoRefresh, setGlobalAutoRefresh] = useState({ enabled: false, interval: 30 });
  const [activeCategory, setActiveCategory] = useState<Category>('Dashboard');

  const handleAddChart = () => {
    setEditingChart(null);
    setIsEditorOpen(true);
  };

  const handleEditChart = (chart: ChartConfig) => {
    setEditingChart(chart);
    setIsEditorOpen(true);
  };

  const handleDeleteChart = (id: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
    toast.success('Gráfico eliminado correctamente');
  };

  const loadChartDataFromMongo = useCallback(async (chart: ChartConfig): Promise<ChartDataPoint[]> => {
    if (!chart.mongoSource) {
      return chart.data;
    }

    try {
      const { collection, nameField, valueField, filter, pipeline } = chart.mongoSource;

      let mongoData: any[];
      
      if (pipeline && pipeline.length > 0) {
        // Usar agregación
        const result = await executeAggregation(collection, pipeline);
        mongoData = result.data;
      } else {
        // Usar query simple
        const result = await getCollectionData(collection, {
          limit: 1000,
          filter,
        });
        mongoData = result.data;
      }

      return transformMongoDataToChart(mongoData, nameField, valueField);
    } catch (error) {
      console.error('Error al cargar datos de MongoDB:', error);
      toast.error('Error al actualizar datos de MongoDB');
      return chart.data; // Devolver datos anteriores si falla
    }
  }, []);

  const handleRefreshChart = async (id: string) => {
    const chart = charts.find((c) => c.id === id);
    if (!chart) return;

    let newData: ChartDataPoint[];

    if (chart.mongoSource) {
      // Cargar desde MongoDB
      newData = await loadChartDataFromMongo(chart);
    } else {
      // Datos mock
      switch (chart.type) {
        case 'pie':
        case 'donut':
          newData = generateCategoryData();
          break;
        case 'radar':
          newData = generateRadarData();
          break;
        default:
          newData = generateTimeSeriesData();
      }
    }

    setCharts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, data: newData } : c))
    );
    toast.success('Datos actualizados');
  };

  const handleSaveChart = (chart: ChartConfig) => {
    // Si hay datos pendientes de MongoDB, configurar la fuente
    let finalChart = chart;
    if (pendingData) {
      finalChart = {
        ...chart,
        data: pendingData.data,
        dataKey: pendingData.valueField,
        mongoSource: {
          collection: pendingData.collectionName,
          nameField: pendingData.nameField,
          valueField: pendingData.valueField,
          filter: pendingData.filter,
          pipeline: pendingData.pipeline,
        },
        // Configurar auto-refresh por defecto si viene de MongoDB
        autoRefresh: chart.autoRefresh || (pendingData ? { enabled: false, interval: 30 } : undefined),
      };
      setPendingData(null);
    }

    setCharts((prev) => {
      const exists = prev.find((c) => c.id === finalChart.id);
      if (exists) {
        return prev.map((c) => (c.id === finalChart.id ? finalChart : c));
      }
      return [...prev, finalChart];
    });
    toast.success(editingChart ? 'Gráfico actualizado' : 'Gráfico creado');
  };

  const handleChartsGenerated = (newCharts: ChartConfig[]) => {
    setCharts((prev) => [...prev, ...newCharts]);
    toast.success(`${newCharts.length} gráfico${newCharts.length !== 1 ? 's' : ''} generado${newCharts.length !== 1 ? 's' : ''} automáticamente`);
  };

  // Auto-refresh para gráficos con MongoDB
  useEffect(() => {
    if (!globalAutoRefresh.enabled) return;

    const interval = setInterval(async () => {
      setCharts((prev) => {
        const chartsToUpdate = prev.filter(
          (chart) => chart.mongoSource && (chart.autoRefresh?.enabled || globalAutoRefresh.enabled)
        );

        if (chartsToUpdate.length === 0) return prev;

        // Actualizar cada gráfico que necesita actualización
        Promise.all(
          chartsToUpdate.map(async (chart) => {
            const newData = await loadChartDataFromMongo(chart);
            return { id: chart.id, data: newData };
          })
        ).then((updates) => {
          setCharts((current) =>
            current.map((chart) => {
              const update = updates.find((u) => u.id === chart.id);
              return update ? { ...chart, data: update.data } : chart;
            })
          );
        });
        
        return prev; // Retornar estado anterior mientras se cargan los nuevos datos
      });
    }, globalAutoRefresh.interval * 1000);

    return () => clearInterval(interval);
  }, [globalAutoRefresh.enabled, globalAutoRefresh.interval, loadChartDataFromMongo]);

  const handleExploreCollections = () => {
    setIsCollectionExplorerOpen(true);
  };

  const handleAggregationBuilder = () => {
    setIsAggregationBuilderOpen(true);
  };

  const handleSelectMongoData = (
    data: ChartDataPoint[],
    collectionName: string,
    nameField: string,
    valueField: string,
    filter?: any
  ) => {
    setPendingData({ data, collectionName, nameField, valueField, filter });
    setIsCollectionExplorerOpen(false);
    // Abrir el editor de gráficos con los datos
    setEditingChart(null);
    setIsEditorOpen(true);
    toast.success(`Datos de ${collectionName} preparados. Configura el gráfico.`);
  };

  const handleSelectAggregationData = (
    data: ChartDataPoint[],
    collectionName: string,
    pipeline: any[]
  ) => {
    // Para agregaciones, usar _id como nameField y el primer campo numérico como valueField
    const nameField = data[0]?.name ? '_id' : Object.keys(data[0] || {})[0] || '_id';
    const valueField = Object.keys(data[0] || {}).find(k => typeof data[0]?.[k] === 'number') || 'total';
    
    setPendingData({ data, collectionName, nameField, valueField, pipeline });
    setIsAggregationBuilderOpen(false);
    setEditingChart(null);
    setIsEditorOpen(true);
    toast.success(`Datos de agregación de ${collectionName} preparados. Configura el gráfico.`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar 
        onAddChart={handleAddChart}
        onExploreCollections={handleExploreCollections}
        onAggregationBuilder={handleAggregationBuilder}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      
      <main className="ml-64 flex-1 flex flex-col">
        <Header />
        
        <div className="p-6 flex-1">
          {activeCategory === 'Analytics' ? (
            <AnalyticsView />
          ) : activeCategory === 'Colecciones' ? (
            <CollectionsView />
          ) : activeCategory === 'Datos' ? (
            <DataExplorerView />
          ) : activeCategory === 'Gráficos' ? (
            <ChartsView
              charts={charts}
              onAddChart={handleAddChart}
              onEditChart={handleEditChart}
              onDeleteChart={handleDeleteChart}
              onRefreshChart={handleRefreshChart}
              onExploreCollections={handleExploreCollections}
              onAggregationBuilder={handleAggregationBuilder}
              onChartsGenerated={handleChartsGenerated}
              globalAutoRefresh={globalAutoRefresh}
              onToggleAutoRefresh={(enabled) => setGlobalAutoRefresh({ ...globalAutoRefresh, enabled })}
              onIntervalChange={(interval) => setGlobalAutoRefresh({ ...globalAutoRefresh, interval })}
            />
          ) : activeCategory === 'Configuración' ? (
            <SettingsView />
          ) : (
            <>
              {/* Stats Grid */}
              <section className="mb-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {statsData.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} delay={i * 100} />
                  ))}
                </div>
              </section>

              {/* Charts Grid */}
              <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gráficos</h2>
              <div className="flex items-center gap-4">
                {charts.length > 0 && (
                  <AutoRefreshConfig
                    enabled={globalAutoRefresh.enabled}
                    interval={globalAutoRefresh.interval}
                    onToggle={(enabled) => setGlobalAutoRefresh({ ...globalAutoRefresh, enabled })}
                    onIntervalChange={(interval) => setGlobalAutoRefresh({ ...globalAutoRefresh, interval })}
                    onManualRefresh={() => {
                      charts.forEach((c) => {
                        if (c.mongoSource) {
                          handleRefreshChart(c.id);
                        }
                      });
                    }}
                  />
                )}
                <p className="text-sm text-muted-foreground">{charts.length} gráficos activos</p>
              </div>
            </div>
            
            {charts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-secondary/20">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay gráficos aún</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Crea tu primer gráfico personalizado. Puedes usar datos de MongoDB, agregaciones complejas, o ingresar tus propios datos manualmente.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleAggregationBuilder} variant="outline">
                    Crear Agregación
                  </Button>
                  <Button onClick={handleAddChart}>
                    Crear Gráfico Manual
                  </Button>
                </div>
              </div>
            ) : (
              <div className="chart-grid">
                {charts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    onEdit={handleEditChart}
                    onDelete={handleDeleteChart}
                    onRefresh={handleRefreshChart}
                  />
                ))}
              </div>
            )}
          </section>
          
          <Button onClick={handleExploreCollections} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Explorar MongoDB
          </Button>
            </>
          )}
        </div>
        
        {/* Footer */}
        <Footer />
      </main>

      <ChartEditor
        chart={editingChart}
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setPendingData(null);
        }}
        onSave={handleSaveChart}
        initialData={pendingData?.data}
      />

      <CollectionExplorer
        open={isCollectionExplorerOpen}
        onClose={() => setIsCollectionExplorerOpen(false)}
        onSelectData={handleSelectMongoData}
      />

      <AggregationBuilder
        open={isAggregationBuilderOpen}
        onClose={() => setIsAggregationBuilderOpen(false)}
        onSelectData={handleSelectAggregationData}
      />
    </div>
  );
};

export default Index;
