import { useState, useEffect, useCallback } from 'react';
import { listCollections, getCollectionData } from '@/services/mongodb';
import { Database, RefreshCw, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMongoDB } from '@/hooks/useMongoDB';

export const CollectionsView = () => {
  const { isConnected, status } = useMongoDB();
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectionDetails, setCollectionDetails] = useState<Record<string, { count: number; loading: boolean }>>({});

  const loadCollections = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    setLoading(true);
    
    try {
      const cols = await listCollections();
      setCollections(cols);
      
      // Cargar detalles de cada colección
      const details: Record<string, { count: number; loading: boolean }> = {};
      cols.forEach(col => {
        details[col] = { count: 0, loading: true };
      });
      setCollectionDetails(details);

      // Cargar conteos en paralelo
      cols.forEach(async (col) => {
        try {
          const data = await getCollectionData(col, { limit: 1 });
          setCollectionDetails(prev => ({
            ...prev,
            [col]: { count: data.total, loading: false }
          }));
        } catch (error) {
          setCollectionDetails(prev => ({
            ...prev,
            [col]: { count: 0, loading: false }
          }));
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al cargar colecciones:', error);
      toast.error(`Error al cargar colecciones: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      loadCollections();
    }
  }, [isConnected, loadCollections]);

  const checkConnectionAndLoad = async () => {
    if (!isConnected) {
      toast.error('No hay conexión a MongoDB. Por favor, conéctate primero desde el header.');
      return;
    }
    await loadCollections();
  };

  const refreshCollectionCount = async (collectionName: string) => {
    setCollectionDetails(prev => ({
      ...prev,
      [collectionName]: { ...prev[collectionName], loading: true }
    }));

    try {
      const data = await getCollectionData(collectionName, { limit: 1 });
      setCollectionDetails(prev => ({
        ...prev,
        [collectionName]: { count: data.total, loading: false }
      }));
      toast.success(`Conteo de ${collectionName} actualizado`);
    } catch (error) {
      setCollectionDetails(prev => ({
        ...prev,
        [collectionName]: { count: 0, loading: false }
      }));
      toast.error(`Error al actualizar ${collectionName}`);
    }
  };

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Cargando colecciones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Colecciones de MongoDB</h2>
          <p className="text-muted-foreground mt-1">
            Explora todas las colecciones disponibles en tu base de datos
          </p>
        </div>
        <Button onClick={checkConnectionAndLoad} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {!isConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription>
            {status.error || 'No hay conexión a MongoDB'}
            <br />
            <span className="text-sm mt-2 block">
              Asegúrate de que:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>El servidor esté corriendo en el puerto 3001</li>
                <li>Las variables de entorno estén configuradas correctamente</li>
                <li>Hayas hecho clic en "Conectar MongoDB" en el header</li>
              </ul>
            </span>
          </AlertDescription>
        </Alert>
      )}

      {isConnected && collections.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay colecciones</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No se encontraron colecciones en la base de datos. Esto puede significar que la base de datos está vacía o que necesitas crear algunas colecciones.
            </p>
          </CardContent>
        </Card>
      ) : isConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => {
            const details = collectionDetails[collection] || { count: 0, loading: false };
            
            return (
              <Card key={collection} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{collection}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshCollectionCount(collection)}
                      disabled={details.loading}
                    >
                      <RefreshCw className={`h-3 w-3 ${details.loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <CardDescription>Documentos en la colección</CardDescription>
                    {details.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Badge variant="secondary" className="text-sm">
                        {details.count.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
