import { useState, useEffect } from 'react';
import { Database, Play, Loader2, Code, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { listCollections, executeAggregation } from '@/services/mongodb';
import { transformMongoDataToChart } from '@/utils/mongodbTransform';
import { ChartDataPoint } from '@/types/chart';
import { toast } from 'sonner';

interface AggregationBuilderProps {
  open: boolean;
  onClose: () => void;
  onSelectData: (data: ChartDataPoint[], collectionName: string, pipeline: any[]) => void;
}

const PIPELINE_EXAMPLES = {
  groupBy: `[
  {
    "$group": {
      "_id": "$category",
      "total": { "$sum": "$amount" },
      "count": { "$sum": 1 }
    }
  },
  {
    "$sort": { "total": -1 }
  }
]`,
  dateRange: `[
  {
    "$match": {
      "date": {
        "$gte": "2024-01-01",
        "$lte": "2024-12-31"
      }
    }
  }
]`,
  unwindAndGroup: `[
  {
    "$unwind": "$items"
  },
  {
    "$group": {
      "_id": "$items.name",
      "quantity": { "$sum": "$items.quantity" }
    }
  }
]`,
  projectAndSort: `[
  {
    "$project": {
      "name": 1,
      "value": 1,
      "year": { "$year": "$date" }
    }
  },
  {
    "$sort": { "value": -1 }
  },
  {
    "$limit": 10
  }
]`,
};

export const AggregationBuilder = ({ open, onClose, onSelectData }: AggregationBuilderProps) => {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [pipeline, setPipeline] = useState<string>('[]');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [nameField, setNameField] = useState<string>('_id');
  const [valueField, setValueField] = useState<string>('total');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const cols = await listCollections();
      setCollections(cols);
      if (cols.length > 0) {
        setSelectedCollection(cols[0]);
      }
    } catch (error) {
      toast.error('Error al cargar colecciones');
      console.error(error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const loadExample = (exampleKey: keyof typeof PIPELINE_EXAMPLES) => {
    setPipeline(PIPELINE_EXAMPLES[exampleKey]);
    toast.success('Ejemplo cargado');
  };

  const executePipeline = async () => {
    if (!selectedCollection) {
      toast.error('Selecciona una colección');
      return;
    }

    let parsedPipeline;
    try {
      parsedPipeline = JSON.parse(pipeline);
      if (!Array.isArray(parsedPipeline)) {
        throw new Error('El pipeline debe ser un array');
      }
    } catch (error) {
      toast.error('Error en el formato del pipeline JSON');
      return;
    }

    setExecuting(true);
    try {
      const result = await executeAggregation(selectedCollection, parsedPipeline);
      setResults(result.data);

      // Auto-detectar campos si hay resultados
      if (result.data.length > 0) {
        const firstDoc = result.data[0];
        const keys = Object.keys(firstDoc).filter((k) => k !== '_id');
        
        if (keys.includes('total')) {
          setValueField('total');
        } else if (keys.includes('count')) {
          setValueField('count');
        } else {
          const numericKey = keys.find((k) => typeof firstDoc[k] === 'number');
          if (numericKey) setValueField(numericKey);
        }

        if (firstDoc._id) {
          setNameField('_id');
        } else {
          const stringKey = keys.find((k) => typeof firstDoc[k] === 'string');
          if (stringKey) setNameField(stringKey);
        }
      }

      toast.success(`Pipeline ejecutado: ${result.count} documentos`);
    } catch (error) {
      toast.error('Error al ejecutar pipeline');
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  const handleUseData = () => {
    if (results.length === 0) {
      toast.error('Primero ejecuta el pipeline');
      return;
    }

    if (!nameField || !valueField) {
      toast.error('Configura los campos de nombre y valor');
      return;
    }

    const transformed = transformMongoDataToChart(results, nameField, valueField);
    let parsedPipeline;
    try {
      parsedPipeline = JSON.parse(pipeline);
    } catch {
      parsedPipeline = [];
    }

    onSelectData(transformed, selectedCollection, parsedPipeline);
    toast.success('Datos del pipeline listos para usar');
  };

  const copyPipeline = () => {
    navigator.clipboard.writeText(pipeline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Pipeline copiado al portapapeles');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Constructor de Agregaciones MongoDB
          </DialogTitle>
          <DialogDescription>
            Crea pipelines de agregación personalizados para transformar tus datos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selección de colección */}
          <div className="space-y-2">
            <Label>Colección</Label>
            <Select
              value={selectedCollection}
              onValueChange={setSelectedCollection}
              disabled={loadingCollections}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una colección" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="builder" className="w-full">
            <TabsList>
              <TabsTrigger value="builder">Pipeline Personalizado</TabsTrigger>
              <TabsTrigger value="examples">Ejemplos</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pipeline JSON</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPipeline}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copiar
                  </Button>
                </div>
                <Textarea
                  value={pipeline}
                  onChange={(e) => setPipeline(e.target.value)}
                  placeholder='[{"$group": {"_id": "$field", "total": {"$sum": "$amount"}}}]'
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa un array de etapas de agregación en formato JSON
                </p>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Agrupar por Campo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample('groupBy')}
                      className="w-full"
                    >
                      Cargar Ejemplo
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Filtrar por Rango de Fechas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample('dateRange')}
                      className="w-full"
                    >
                      Cargar Ejemplo
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Unwind y Agrupar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample('unwindAndGroup')}
                      className="w-full"
                    >
                      Cargar Ejemplo
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Proyectar y Ordenar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample('projectAndSort')}
                      className="w-full"
                    >
                      Cargar Ejemplo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Botón ejecutar */}
          <Button
            onClick={executePipeline}
            disabled={!selectedCollection || executing}
            className="w-full"
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ejecutar Pipeline
              </>
            )}
          </Button>

          {/* Resultados */}
          {results.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campo para Nombre</Label>
                  <Select value={nameField} onValueChange={setNameField}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(results[0] || {}).map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Campo para Valor</Label>
                  <Select value={valueField} onValueChange={setValueField}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(results[0] || {})
                        .filter((key) => typeof results[0][key] === 'number')
                        .map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Resultados ({results.length} documentos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {results.slice(0, 20).map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-secondary/50 font-mono text-xs"
                        >
                          <pre>{JSON.stringify(doc, null, 2)}</pre>
                        </div>
                      ))}
                      {results.length > 20 && (
                        <p className="text-xs text-center text-muted-foreground">
                          ... y {results.length - 20} más
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUseData}
            disabled={results.length === 0 || !nameField || !valueField}
          >
            Usar estos datos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

