import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartDataPoint } from '@/types/chart';
import { toast } from 'sonner';

interface DataEditorProps {
  data: ChartDataPoint[];
  onChange: (data: ChartDataPoint[]) => void;
}

export const DataEditor = ({ data, onChange }: DataEditorProps) => {
  const [editedData, setEditedData] = useState<ChartDataPoint[]>(data || []);
  const [jsonInput, setJsonInput] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);

  useEffect(() => {
    const safeData = data || [];
    setEditedData(safeData);
    try {
      setJsonInput(JSON.stringify(safeData, null, 2));
    } catch (error) {
      setJsonInput('[]');
    }
  }, [data]);

  const handleAddRow = () => {
    const newRow: ChartDataPoint = {
      name: `Item ${editedData.length + 1}`,
      value: 0,
    };
    const updated = [...editedData, newRow];
    setEditedData(updated);
    onChange(updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = editedData.filter((_, i) => i !== index);
    setEditedData(updated);
    onChange(updated);
  };

  const handleFieldChange = (index: number, field: string, value: string | number) => {
    if (index < 0 || index >= editedData.length) return;
    const updated = [...editedData];
    updated[index] = {
      ...updated[index],
      [field]: field === 'value' || typeof value === 'number' ? Number(value) || 0 : value,
    };
    setEditedData(updated);
    onChange(updated);
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setIsValidJson(true);
        setEditedData(parsed);
        onChange(parsed);
      } else {
        setIsValidJson(false);
      }
    } catch {
      setIsValidJson(false);
    }
  };

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        setEditedData(parsed);
        onChange(parsed);
        toast.success('Datos cargados correctamente');
      } else {
        toast.error('El JSON debe ser un array');
      }
    } catch (error) {
      toast.error('JSON inválido');
    }
  };

  const handleGenerateSample = () => {
    const sample: ChartDataPoint[] = [
      { name: 'Enero', value: 100 },
      { name: 'Febrero', value: 150 },
      { name: 'Marzo', value: 120 },
      { name: 'Abril', value: 180 },
    ];
    setEditedData(sample);
    setJsonInput(JSON.stringify(sample, null, 2));
    onChange(sample);
    toast.success('Datos de ejemplo generados');
  };

  // Obtener campos adicionales únicos de todos los datos
  const additionalFields = new Set<string>();
  editedData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'name' && key !== 'value') {
        additionalFields.add(key);
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Editor de Datos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Tabla</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Datos del Gráfico ({editedData.length} puntos)</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSample}
                  className="h-8"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Ejemplo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            <div className="border rounded-lg max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary sticky top-0">
                  <tr>
                    <th className="p-2 text-left border-b">Nombre</th>
                    <th className="p-2 text-left border-b">Valor</th>
                    {Array.from(additionalFields).map((field) => (
                      <th key={field} className="p-2 text-left border-b">
                        {field}
                      </th>
                    ))}
                    <th className="p-2 text-left border-b w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.map((row, index) => {
                    if (!row) return null;
                    return (
                      <tr key={index} className="border-b hover:bg-secondary/50">
                        <td className="p-2">
                          <Input
                            value={String(row.name || '')}
                            onChange={(e) =>
                              handleFieldChange(index, 'name', e.target.value)
                            }
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.value || 0}
                            onChange={(e) =>
                              handleFieldChange(index, 'value', e.target.value)
                            }
                            className="h-8"
                          />
                        </td>
                        {Array.from(additionalFields).map((field) => (
                          <td key={field} className="p-2">
                            <Input
                              type="number"
                              value={row[field] || ''}
                              onChange={(e) =>
                                handleFieldChange(index, field, e.target.value)
                              }
                              className="h-8"
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRow(index)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {editedData.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No hay datos. Agrega puntos de datos para comenzar.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Punto
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Datos en formato JSON</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadJson}
                  disabled={!isValidJson}
                  className="h-8"
                >
                  <Loader2 className="h-3 w-3 mr-1" />
                  Cargar JSON
                </Button>
              </div>
              <Textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
                placeholder='[{"name": "Enero", "value": 100}, {"name": "Febrero", "value": 150}]'
              />
              {!isValidJson && (
                <p className="text-xs text-destructive">
                  JSON inválido. Por favor corrige el formato.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Ingresa un array de objetos con las propiedades "name" (string) y "value" (number)
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

