import { useState } from 'react';
import { ChartConfig } from '@/types/chart';
import { initialCharts, statsData, generateTimeSeriesData, generateCategoryData, generateRadarData } from '@/data/mockData';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { ChartEditor } from '@/components/dashboard/ChartEditor';
import { toast } from 'sonner';

const Index = () => {
  const [charts, setCharts] = useState<ChartConfig[]>(initialCharts);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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

  const handleRefreshChart = (id: string) => {
    setCharts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        
        let newData;
        switch (c.type) {
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
        
        return { ...c, data: newData };
      })
    );
    toast.success('Datos actualizados');
  };

  const handleSaveChart = (chart: ChartConfig) => {
    setCharts((prev) => {
      const exists = prev.find((c) => c.id === chart.id);
      if (exists) {
        return prev.map((c) => (c.id === chart.id ? chart : c));
      }
      return [...prev, chart];
    });
    toast.success(editingChart ? 'Gráfico actualizado' : 'Gráfico creado');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onAddChart={handleAddChart} />
      
      <main className="ml-64">
        <Header isConnected={false} />
        
        <div className="p-6">
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
              <p className="text-sm text-muted-foreground">{charts.length} gráficos activos</p>
            </div>
            
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
          </section>
        </div>
      </main>

      <ChartEditor
        chart={editingChart}
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveChart}
      />
    </div>
  );
};

export default Index;
