import { useState, useEffect } from 'react';
import { Database, Loader2, Table, Eye, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listCollections, getCollectionData } from '@/services/mongodb';
import { detectFields, transformMongoDataToChart } from '@/utils/mongodbTransform';
import { ChartDataPoint } from '@/types/chart';
import { toast } from 'sonner';

interface CollectionExplorerProps {
  open: boolean;
  onClose: () => void;
  onSelectData: (data: ChartDataPoint[], collectionName: string, nameField: string, valueField: string, filter?: any) => void;
}

export const CollectionExplorer = ({ open, onClose, onSelectData }: CollectionExplorerProps) => {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [fields, setFields] = useState<{
    numericFields: string[];
    stringFields: string[];
    dateFields: string[];
    allFields: string[];
  }>({ numericFields: [], stringFields: [], dateFields: [], allFields: [] });
  const [nameField, setNameField] = useState<string>('');
  const [valueField, setValueField] = useState<string>('');
  const [limit, setLimit] = useState<string>('100');
  const [previewData, setPreviewData] = useState<ChartDataPoint[]>([]);
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCollection) {
      loadCollectionData();
    }
  }, [selectedCollection, limit]);

  useEffect(() => {
    if (collectionData.length > 0 && nameField && valueField) {
      const transformed = transformMongoDataToChart(collectionData, nameField, valueField);
      setPreviewData(transformed);
    }
  }, [collectionData, nameField, valueField]);

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

  const buildFilterQuery = () => {
    if (filters.length === 0) return undefined;

    const query: any = {};
    filters.forEach((filter) => {
      if (!filter.field || !filter.operator || filter.value === '') return;

      let value: any = filter.value;
      
      // Intentar convertir a número si es posible
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }

      switch (filter.operator) {
        case 'equals':
          query[filter.field] = value;
          break;
        case 'notEquals':
          query[filter.field] = { $ne: value };
          break;
        case 'greaterThan':
          query[filter.field] = { $gt: value };
          break;
        case 'lessThan':
          query[filter.field] = { $lt: value };
          break;
        case 'greaterOrEqual':
          query[filter.field] = { $gte: value };
          break;
        case 'lessOrEqual':
          query[filter.field] = { $lte: value };
          break;
        case 'contains':
          query[filter.field] = { $regex: value, $options: 'i' };
          break;
        case 'exists':
          query[filter.field] = { $exists: true };
          break;
        default:
          query[filter.field] = value;
      }
    });

    return Object.keys(query).length > 0 ? query : undefined;
  };

  const loadCollectionData = async () => {
    if (!selectedCollection) return;
    
    setLoadingData(true);
    try {
      const filterQuery = buildFilterQuery();
      
      const result = await getCollectionData(selectedCollection, {
        limit: parseInt(limit) || 100,
        skip: 0,
        filter: filterQuery,
      });
      
      setCollectionData(result.data);
      
      // Detectar campos disponibles
      const detectedFields = detectFields(result.data);
      setFields(detectedFields);
      
      // Auto-seleccionar campos sugeridos
      if (detectedFields.stringFields.length > 0 && !nameField) {
        setNameField(detectedFields.stringFields[0]);
      }
      if (detectedFields.numericFields.length > 0 && !valueField) {
        setValueField(detectedFields.numericFields[0]);
      }
      
      toast.success(`${result.total} documentos encontrados`);
    } catch (error) {
      toast.error('Error al cargar datos de la colección');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'equals', value: '' }]);
    setShowFilters(true);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<typeof filters[0]>) => {
    setFilters(filters.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleUseData = () => {
    if (!selectedCollection || !nameField || !valueField) {
      toast.error('Selecciona una colección y los campos necesarios');
      return;
    }

    if (previewData.length === 0) {
      toast.error('No hay datos para usar');
      return;
    }

    const filterQuery = buildFilterQuery();
    onSelectData(previewData, selectedCollection, nameField, valueField, filterQuery);
    toast.success(`Datos de ${selectedCollection} listos para usar`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Explorar Colecciones de MongoDB
          </DialogTitle>
          <DialogDescription>
            Selecciona una colección y configura los campos para extraer datos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selección de colección */}
          <div className="space-y-2">
            <Label>Colección</Label>
            <div className="flex gap-2">
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
                disabled={loadingCollections}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una colección" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCollections ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                      Cargando...
                    </SelectItem>
                  ) : (
                    collections.map((col) => (
                      <SelectItem key={col} value={col}>
                        <Table className="h-4 w-4 mr-2 inline" />
                        {col}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Límite"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-24"
              />
              <Button onClick={loadCollectionData} disabled={!selectedCollection || loadingData}>
                {loadingData ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Filtros avanzados */}
          {selectedCollection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filtros Avanzados</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFilter}
                  className="h-8"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Agregar Filtro
                </Button>
              </div>
              
              {filters.length > 0 && (
                <div className="space-y-2 p-3 border rounded-lg bg-secondary/50">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs">Campo</Label>
                        <Select
                          value={filter.field}
                          onValueChange={(value) => updateFilter(index, { field: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.allFields.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-32">
                        <Label className="text-xs">Operador</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, { operator: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Igual a</SelectItem>
                            <SelectItem value="notEquals">No igual a</SelectItem>
                            <SelectItem value="greaterThan">Mayor que</SelectItem>
                            <SelectItem value="lessThan">Menor que</SelectItem>
                            <SelectItem value="greaterOrEqual">Mayor o igual</SelectItem>
                            <SelectItem value="lessOrEqual">Menor o igual</SelectItem>
                            <SelectItem value="contains">Contiene</SelectItem>
                            <SelectItem value="exists">Existe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1">
                        <Label className="text-xs">Valor</Label>
                        <Input
                          value={filter.value}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                          placeholder="Valor"
                          className="h-9"
                          disabled={filter.operator === 'exists'}
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(index)}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configuración de campos */}
          {collectionData.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campo para nombre (X-axis)</Label>
                  <Select value={nameField} onValueChange={setNameField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.stringFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                      {fields.numericFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field} (numérico)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {fields.stringFields.length} campos de texto disponibles
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Campo para valor (Y-axis)</Label>
                  <Select value={valueField} onValueChange={setValueField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.numericFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {fields.numericFields.length} campos numéricos disponibles
                  </p>
                </div>
              </div>

              {/* Vista previa */}
              {previewData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Vista Previa de Datos</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {previewData.length} puntos de datos
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {previewData.slice(0, 10).map((point, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded bg-secondary/50"
                          >
                            <span className="text-sm font-medium">{point.name}</span>
                            <Badge variant="outline">{point.value}</Badge>
                          </div>
                        ))}
                        {previewData.length > 10 && (
                          <p className="text-xs text-center text-muted-foreground pt-2">
                            ... y {previewData.length - 10} más
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Información de campos detectados */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {fields.numericFields.length} numéricos
                </Badge>
                <Badge variant="secondary">
                  {fields.stringFields.length} texto
                </Badge>
                <Badge variant="secondary">
                  {fields.dateFields.length} fechas
                </Badge>
                <Badge variant="secondary">
                  {collectionData.length} documentos
                </Badge>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUseData}
            disabled={!selectedCollection || !nameField || !valueField || previewData.length === 0}
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Usar estos datos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

