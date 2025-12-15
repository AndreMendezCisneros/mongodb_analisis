import { RefreshCw, Clock, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface AutoRefreshConfigProps {
  enabled: boolean;
  interval: number; // en segundos
  onToggle: (enabled: boolean) => void;
  onIntervalChange: (interval: number) => void;
  onManualRefresh?: () => void;
}

export const AutoRefreshConfig = ({
  enabled,
  interval,
  onToggle,
  onIntervalChange,
  onManualRefresh,
}: AutoRefreshConfigProps) => {
  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {enabled ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Actualizando cada {formatInterval(interval)}</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Actualización automática</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-refresh">Actualización automática</Label>
            <Switch
              id="auto-refresh"
              checked={enabled}
              onCheckedChange={onToggle}
            />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interval">Intervalo (segundos)</Label>
                <div className="flex gap-2">
                  <Input
                    id="interval"
                    type="number"
                    min="5"
                    max="3600"
                    value={interval}
                    onChange={(e) => onIntervalChange(parseInt(e.target.value) || 30)}
                    className="flex-1"
                  />
                  <Badge variant="secondary">{formatInterval(interval)}</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 30, 60, 300].map((sec) => (
                    <Button
                      key={sec}
                      variant="outline"
                      size="sm"
                      onClick={() => onIntervalChange(sec)}
                      className="h-7 text-xs"
                    >
                      {formatInterval(sec)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {onManualRefresh && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onManualRefresh}
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar ahora
            </Button>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            {enabled ? (
              <p>Los datos se actualizarán automáticamente cada {formatInterval(interval)}</p>
            ) : (
              <p>Activa la actualización automática para mantener los datos sincronizados</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};



