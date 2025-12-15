import { LayoutDashboard, BarChart3, Settings, Database, PlusCircle, Layers, FolderOpen, Code, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type Category = 'Dashboard' | 'Analytics' | 'Datos' | 'Colecciones' | 'Gráficos' | 'Configuración';

interface SidebarProps {
  onAddChart: () => void;
  onExploreCollections?: () => void;
  onAggregationBuilder?: () => void;
  activeCategory?: Category;
  onCategoryChange?: (category: Category) => void;
}

export const Sidebar = ({ 
  onAddChart, 
  onExploreCollections, 
  onAggregationBuilder,
  activeCategory = 'Dashboard',
  onCategoryChange
}: SidebarProps) => {
  const navItems: Array<{ icon: any; label: Category; active: boolean }> = [
    { icon: LayoutDashboard, label: 'Dashboard', active: activeCategory === 'Dashboard' },
    { icon: BarChart3, label: 'Analytics', active: activeCategory === 'Analytics' },
    { icon: Database, label: 'Datos', active: activeCategory === 'Datos' },
    { icon: Layers, label: 'Colecciones', active: activeCategory === 'Colecciones' },
    { icon: LineChart, label: 'Gráficos', active: activeCategory === 'Gráficos' },
    { icon: Settings, label: 'Configuración', active: activeCategory === 'Configuración' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
            <img 
              src="/icono1.png" 
              alt="DataViz Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold gradient-text">DataViz</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onCategoryChange?.(item.label)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          {onExploreCollections && (
            <Button 
              onClick={onExploreCollections}
              variant="outline"
              className="w-full gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Explorar MongoDB
            </Button>
          )}
          {onAggregationBuilder && (
            <Button 
              onClick={onAggregationBuilder}
              variant="outline"
              className="w-full gap-2"
            >
              <Code className="h-4 w-4" />
              Agregaciones
            </Button>
          )}
          <Button 
            onClick={onAddChart}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir Gráfico
          </Button>
        </div>
      </div>
    </aside>
  );
};
