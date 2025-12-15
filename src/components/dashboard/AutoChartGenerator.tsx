import { useState, useEffect } from 'react';
import { listCollections, getCollectionData } from '@/services/mongodb';
import { ChartSuggestion, analyzeAllCollections, generateChartFromSuggestion } from '@/utils/autoChartGenerator';
import { ChartConfig } from '@/types/chart';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMongoDB } from '@/hooks/useMongoDB';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AutoChartGeneratorProps {
  onChartsGenerated: (charts: ChartConfig[]) => void;
  onClose: () => void;
}

export const AutoChartGenerator = ({ onChartsGenerated, onClose }: AutoChartGeneratorProps) => {
  const { isConnected } = useMongoDB();
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      analyzeCollections();
    }
  }, [isConnected]);

  const analyzeCollections = async () => {
    setAnalyzing(true);
    setError(null);
    
    try {
      const collections = await listCollections();
      
      if (collections.length === 0) {
        setError('No hay colecciones disponibles para analizar');
        setAnalyzing(false);
        return;
      }

      const allSuggestions = await analyzeAllCollections(
        collections,
        async (collectionName: string) => {
          const result = await getCollectionData(collectionName, { limit: 100 });
          return result.data;
        }
      );

      setSuggestions(allSuggestions);
      
      // Seleccionar autom?ticamente las mejores sugerencias (confianza > 0.8)
      const bestSuggestions = allSuggestions
        .map((s, index) => ({ ...s, index }))
        .filter(s => s.confidence > 0.8)
        .slice(0, 5); // M?ximo 5 gr?ficos autom?ticos
      
      setSelectedSuggestions(new Set(bestSuggestions.map(s => s.index)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar colecciones');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleGenerateCharts = async () => {
    if (selectedSuggestions.size === 0) {
      setError('Selecciona al menos un gr?fico para generar');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const chartsToGenerate = Array.from(selectedSuggestions).map(index => suggestions[index]);
      const generatedCharts: ChartConfig[] = [];

      for (const suggestion of chartsToGenerate) {
        try {
          const result = await getCollectionData(suggestion.collection, { limit: 1000 });
          const chart = await generateChartFromSuggestion(suggestion, result.data);
          // Solo agregar si el gr?fico es v?lido (no null)
          if (chart) {
            generatedCharts.push(chart);
          }
        } catch (err) {
          console.error(`Error generando gr?fico para ${suggestion.title}:`, err);
        }
      }

      onChartsGenerated(generatedCharts);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar gr?ficos');
    } finally {
      setGenerating(false);
    }
  };

  const getChartTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      bar: 'Barras',
      line: 'L?nea',
      area: '?rea',
      pie: 'Circular',
      donut: 'Donut',
      radar: 'Radar',
      composed: 'Compuesto',
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-blue-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generador Autom?tico de Gr?ficos
          </DialogTitle>
          <DialogDescription>
            El sistema analizar? tus colecciones y sugerir? gr?ficos apropiados basados en los datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sin conexi?n</AlertTitle>
              <AlertDescription>
                Necesitas estar conectado a MongoDB para generar gr?ficos autom?ticamente.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analizando colecciones y generando sugerencias...</p>
            </div>
          )}

          {!analyzing && suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {suggestions.length} sugerencias encontradas
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIndices = new Set(suggestions.map((_, i) => i));
                      setSelectedSuggestions(allIndices);
                    }}
                  >
                    Seleccionar todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSuggestions(new Set())}
                  >
                    Deseleccionar todos
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedSuggestions.has(index)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleToggleSuggestion(index)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedSuggestions.has(index)}
                            onCheckedChange={() => handleToggleSuggestion(index)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <CardTitle className="text-base">{suggestion.title}</CardTitle>
                              <Badge variant="secondary" className="ml-auto">
                                {getChartTypeLabel(suggestion.chartType)}
                              </Badge>
                            </div>
                            
                            {/* Pregunta que responde el gr?fico */}
                            {suggestion.question && (
                              <div className="bg-primary/10 border-l-4 border-primary pl-3 py-2 rounded-r">
                                <p className="text-sm font-semibold text-primary mb-1">?? Pregunta que responde:</p>
                                <p className="text-sm text-foreground">{suggestion.question}</p>
                              </div>
                            )}

                            {/* Descripci?n detallada */}
                            <CardDescription className="text-sm leading-relaxed">
                              {suggestion.description}
                            </CardDescription>

                            {/* Informaci?n t?cnica */}
                            <div className="space-y-2 pt-2 border-t">
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-medium">Colecci?n:</span>
                                <span>{suggestion.collection}</span>
                                <span className="font-medium">?</span>
                                <span className="font-medium">Campos:</span>
                                <span>{suggestion.nameField} ? {suggestion.valueField}</span>
                              </div>
                              
                              {/* Ejes */}
                              {suggestion.axes && (
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium">Eje X:</span>
                                  <span>{suggestion.axes.x}</span>
                                  <span className="font-medium">?</span>
                                  <span className="font-medium">Eje Y:</span>
                                  <span>{suggestion.axes.y}</span>
                                  {suggestion.units && (
                                    <>
                                      <span className="font-medium">?</span>
                                      <span className="font-medium">Unidades:</span>
                                      <span>{suggestion.units}</span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Confianza */}
                              <div className="flex items-center gap-2 text-xs">
                                <div
                                  className={`w-2 h-2 rounded-full ${getConfidenceColor(suggestion.confidence)}`}
                                />
                                <span className="text-muted-foreground">
                                  {(suggestion.confidence * 100).toFixed(0)}% confianza
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {!analyzing && suggestions.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center p-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron sugerencias de gr?ficos.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateCharts}
            disabled={generating || selectedSuggestions.size === 0 || !isConnected}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Generar {selectedSuggestions.size} gr?fico{selectedSuggestions.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
