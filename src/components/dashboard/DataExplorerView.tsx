import { useState, useEffect, useCallback } from 'react';
import { listCollections, getCollectionData } from '@/services/mongodb';
import { Database, RefreshCw, FileText, Loader2, AlertCircle, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMongoDB } from '@/hooks/useMongoDB';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export const DataExplorerView = () => {
  const { isConnected, status } = useMongoDB();
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCollections = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    setLoading(true);
    
    try {
      const cols = await listCollections();
      setCollections(cols);
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

  const loadCollectionData = async (collectionName: string, page: number = 1) => {
    if (!isConnected) {
      return;
    }

    setLoadingData(true);
    try {
      const skip = (page - 1) * pageSize;
      const data = await getCollectionData(collectionName, { 
        limit: pageSize, 
        skip 
      });
      
      setCollectionData(data.data);
      setTotalDocuments(data.total);
      setCurrentPage(page);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al cargar datos: ${errorMessage}`);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCollectionClick = (collectionName: string) => {
    setSelectedCollection(collectionName);
    setCurrentPage(1);
    loadCollectionData(collectionName, 1);
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setCollectionData([]);
    setCurrentPage(1);
    setTotalDocuments(0);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const filteredCollections = collections.filter(col => 
    col.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalDocuments / pageSize);

  if (loading && collections.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Cargando colecciones...</span>
      </div>
    );
  }

  // Vista de documentos de una colección
  if (selectedCollection) {
    const allKeys = collectionData.length > 0 
      ? Object.keys(collectionData[0] || {})
      : [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBackToCollections}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver a colecciones
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{selectedCollection}</h2>
              <p className="text-muted-foreground mt-1">
                {totalDocuments.toLocaleString()} documentos totales
              </p>
            </div>
          </div>
          <Button onClick={() => loadCollectionData(selectedCollection, currentPage)} variant="outline" disabled={loadingData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Cargando documentos...</span>
          </div>
        ) : collectionData.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Esta colección no contiene documentos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {allKeys.map((key) => (
                          <TableHead key={key} className="font-semibold">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collectionData.map((doc, index) => (
                        <TableRow key={index}>
                          {allKeys.map((key) => (
                            <TableCell key={key} className="max-w-xs">
                              <div className="truncate" title={formatValue(doc[key])}>
                                {formatValue(doc[key])}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalDocuments)} de {totalDocuments} documentos
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadCollectionData(selectedCollection, currentPage - 1)}
                    disabled={currentPage === 1 || loadingData}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadCollectionData(selectedCollection, currentPage + 1)}
                    disabled={currentPage === totalPages || loadingData}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Vista de lista de colecciones
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Explorador de Datos</h2>
          <p className="text-muted-foreground mt-1">
            Explora el contenido de tus colecciones de MongoDB
          </p>
        </div>
        <Button onClick={loadCollections} variant="outline" disabled={loading}>
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

      {isConnected && (
        <>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar colección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredCollections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No se encontraron colecciones' : 'No hay colecciones'}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchTerm 
                    ? 'Intenta con otro término de búsqueda.'
                    : 'No se encontraron colecciones en la base de datos.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollections.map((collection) => (
                <Card 
                  key={collection} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCollectionClick(collection)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{collection}</CardTitle>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <CardDescription>Haz clic para explorar</CardDescription>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
