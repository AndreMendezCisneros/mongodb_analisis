import { Bell, Search, Database, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  isConnected: boolean;
}

export const Header = ({ isConnected }: HeaderProps) => (
  <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6">
    <div className="flex items-center gap-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className={`gap-1.5 ${isConnected ? 'bg-chart-3/20 text-chart-3 hover:bg-chart-3/30' : ''}`}
      >
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isConnected ? 'MongoDB Conectado' : 'Sin Conexión'}
      </Badge>
    </div>

    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Buscar..." 
          className="w-64 pl-9 bg-secondary/50 border-transparent focus:border-primary"
        />
      </div>
      
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
      </Button>

      <Button variant="outline" size="sm" className="gap-2">
        <Database className="h-4 w-4" />
        Conectar MongoDB
      </Button>

      <Avatar className="h-9 w-9 border-2 border-primary/50">
        <AvatarFallback className="bg-primary/20 text-primary font-medium">AD</AvatarFallback>
      </Avatar>
    </div>
  </header>
);
