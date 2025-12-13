import { LayoutDashboard, BarChart3, Settings, Database, PlusCircle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onAddChart: () => void;
}

export const Sidebar = ({ onAddChart }: SidebarProps) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Database, label: 'Datos', active: false },
    { icon: Layers, label: 'Colecciones', active: false },
    { icon: Settings, label: 'Configuración', active: false },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold gradient-text">DataViz</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.label}
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

        {/* Add Chart Button */}
        <div className="border-t border-sidebar-border p-4">
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
