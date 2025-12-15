import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMongoDB } from '@/hooks/useMongoDB';
import { ejecutarAnalisisSATE, type SATEAnalysisResult } from '@/services/analytics';
import { Loader2, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Users, BarChart3, RefreshCw, Download, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ConfusionMatrixChart } from '@/components/charts/ConfusionMatrixChart';
import { ROCCurveChart } from '@/components/charts/ROCCurveChart';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export const AnalyticsView = () => {
  const { isConnected } = useMongoDB();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SATEAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasRunInitialAnalysis = useRef(false);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeccion, setFilterSeccion] = useState<string>('todas');
  const [filterGrado, setFilterGrado] = useState<string>('todos');
  const [filterEstadoTab, setFilterEstadoTab] = useState<string>('todos');
  const [filterFactores, setFilterFactores] = useState<{
    asistencia: boolean;
    incidencias: boolean;
    sentimiento: boolean;
    situacion_familiar: boolean;
  }>({
    asistencia: false,
    incidencias: false,
    sentimiento: false,
    situacion_familiar: false,
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const ejecutarAnalisis = useCallback(async () => {
    if (!isConnected) {
      setError('Debes estar conectado a MongoDB para ejecutar el análisis');
      return;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      const resultado = await ejecutarAnalisisSATE(abortController.signal);
      setAnalysisResult(resultado);
      setLastAnalysisTime(new Date());
      hasRunInitialAnalysis.current = true;
    } catch (err) {
      // No mostrar error si fue cancelado
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al ejecutar el análisis');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [isConnected]);

  // Ejecutar análisis automáticamente solo la primera vez que se conecta
  useEffect(() => {
    if (isConnected && !hasRunInitialAnalysis.current && !analysisResult) {
      ejecutarAnalisis();
    }
  }, [isConnected, ejecutarAnalisis, analysisResult]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Obtener secciones y grados únicos para filtros
  const seccionesUnicas = useMemo(() => {
    if (!analysisResult) return [];
    const secciones = new Set(analysisResult.resultados.map(r => r.Seccion).filter(Boolean));
    return Array.from(secciones).sort();
  }, [analysisResult]);

  const gradosUnicos = useMemo(() => {
    if (!analysisResult) return [];
    const grados = new Set(analysisResult.resultados.map(r => r.Grado).filter(Boolean));
    return Array.from(grados).sort();
  }, [analysisResult]);

  // Filtrar y buscar resultados
  const resultadosFiltrados = useMemo(() => {
    if (!analysisResult) return [];

    let filtrados = analysisResult.resultados;

    // Búsqueda por nombre o DNI
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(r =>
        r.Apellidos_Nombres.toLowerCase().includes(term) ||
        r.DNI.toLowerCase().includes(term)
      );
    }

    // Filtro por sección
    if (filterSeccion !== 'todas') {
      filtrados = filtrados.filter(r => r.Seccion === filterSeccion);
    }

    // Filtro por grado
    if (filterGrado !== 'todos') {
      filtrados = filtrados.filter(r => r.Grado === filterGrado);
    }

    // Filtro por estado (se aplica desde los tabs, no desde aquí)
    // Este filtro se maneja en los tabs individuales

    // Filtro por factores de riesgo
    if (filterFactores.asistencia) {
      filtrados = filtrados.filter(r => r.Analisis_Asistencia === 0);
    }
    if (filterFactores.incidencias) {
      filtrados = filtrados.filter(r => r.Analisis_Incidencias === 0);
    }
    if (filterFactores.sentimiento) {
      filtrados = filtrados.filter(r => r.Analisis_Sentimiento_Estudiante === 0);
    }
    if (filterFactores.situacion_familiar) {
      filtrados = filtrados.filter(r => r.Analisis_Situacion_Familiar === 0);
    }

    return filtrados;
  }, [analysisResult, searchTerm, filterSeccion, filterGrado, filterFactores]);

  // La paginación se maneja dentro de cada tab individualmente

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSeccion, filterGrado, filterEstadoTab, filterFactores]);

  // Función para exportar a CSV
  const exportarCSV = useCallback(() => {
    if (!analysisResult) return;

    const headers = [
      'DNI',
      'Apellidos_Nombres',
      'Genero',
      'Seccion',
      'Grado',
      'NotaBim1',
      'NotaBim2',
      'NotaBim3',
      'Nota_Proyectada_B4',
      'Estado',
      'Analisis_Asistencia',
      'Analisis_Incidencias',
      'Analisis_Sentimiento_Estudiante',
      'Analisis_Situacion_Familiar',
    ];

    const rows = resultadosFiltrados.map(r => [
      r.DNI,
      r.Apellidos_Nombres,
      r.Genero,
      r.Seccion,
      r.Grado,
      r.NotaBim1.toString(),
      r.NotaBim2.toString(),
      r.NotaBim3.toString(),
      r.Nota_Proyectada_B4.toFixed(2),
      r.Estado,
      r.Analisis_Asistencia === 1 ? 'Sin Riesgo' : 'Con Riesgo',
      r.Analisis_Incidencias === 1 ? 'Sin Riesgo' : 'Con Riesgo',
      r.Analisis_Sentimiento_Estudiante === 1 ? 'Positivo' : 'Negativo',
      r.Analisis_Situacion_Familiar === 1 ? 'Estable' : 'Inestable',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analisis_sate_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [analysisResult, resultadosFiltrados]);

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin conexión</AlertTitle>
          <AlertDescription>
            Necesitas estar conectado a MongoDB para ejecutar el análisis predictivo SATE-SR.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics - SATE-SR</h1>
          <p className="text-muted-foreground mt-1">
            Sistema de Alerta Temprana Educativa San Ramón v2.0
          </p>
          {lastAnalysisTime && (
            <p className="text-xs text-muted-foreground mt-1">
              Última actualización: {lastAnalysisTime.toLocaleString('es-ES')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {analysisResult && (
            <Button
              onClick={exportarCSV}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          )}
          <Button
            onClick={ejecutarAnalisis}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {analysisResult ? 'Actualizar Análisis' : 'Ejecutar Análisis'}
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !analysisResult && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Ejecutando análisis predictivo...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Esto puede tomar unos segundos mientras procesamos los datos
          </p>
        </div>
      )}

      {analysisResult && (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysisResult.total_estudiantes}</div>
                <p className="text-xs text-muted-foreground">
                  Analizados con modelo predictivo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado Seguro</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analysisResult.metricas.aprueba}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysisResult.metricas.porcentaje_aprueba.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Riesgo Alto</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analysisResult.metricas.desaprueba}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysisResult.metricas.porcentaje_desaprueba.toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nota Promedio Proyectada</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysisResult.metricas.promedio_nota_proyectada.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Proyección para Bimestre 4
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de validación */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Validación del Modelo</CardTitle>
              <CardDescription>
                Evaluación estadística del poder predictivo del modelo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Precisión</p>
                  <p className="text-2xl font-bold">
                    {(analysisResult.metricas.precision * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recall</p>
                  <p className="text-2xl font-bold">
                    {(analysisResult.metricas.recall * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">F1-Score</p>
                  <p className="text-2xl font-bold">
                    {(analysisResult.metricas.f1_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AUC-ROC</p>
                  <p className="text-2xl font-bold">
                    {analysisResult.metricas.auc_roc.toFixed(3)}
                  </p>
                  {analysisResult.metricas.auc_roc > 0.7 ? (
                    <Badge variant="default" className="mt-1">✅ Buen modelo</Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">⚠️ Requiere ajustes</Badge>
                  )}
                </div>
              </div>

              {/* Matriz de confusión visual */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Matriz de Confusión: Predicción vs Realidad</h3>
                <ConfusionMatrixChart
                  verdaderosPositivos={analysisResult.metricas.matriz_confusion.verdaderos_positivos}
                  falsosPositivos={analysisResult.metricas.matriz_confusion.falsos_positivos}
                  verdaderosNegativos={analysisResult.metricas.matriz_confusion.verdaderos_negativos}
                  falsosNegativos={analysisResult.metricas.matriz_confusion.falsos_negativos}
                />
              </div>
            </CardContent>
          </Card>

          {/* Curva ROC */}
          <Card>
            <CardHeader>
              <CardTitle>Curva ROC - Capacidad de Discriminación</CardTitle>
              <CardDescription>
                Evaluación del poder de discriminación del modelo mediante la curva ROC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ROCCurveChart aucRoc={analysisResult.metricas.auc_roc} />
            </CardContent>
          </Card>

          {/* Factores de riesgo */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Factores de Riesgo</CardTitle>
              <CardDescription>
                Distribución de factores que influyen en el rendimiento académico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(analysisResult.factores_riesgo).map(([factor, datos]) => {
                  const total = datos.sin_riesgo + datos.con_riesgo;
                  const porcentajeSinRiesgo = total > 0 ? (datos.sin_riesgo / total * 100) : 0;
                  const porcentajeConRiesgo = total > 0 ? (datos.con_riesgo / total * 100) : 0;

                  const nombres: Record<string, string> = {
                    asistencia: 'Asistencia Regular',
                    incidencias: 'Conducta Adecuada',
                    sentimiento: 'Sentimiento Positivo',
                    situacion_familiar: 'Situación Familiar Estable'
                  };

                  return (
                    <div key={factor} className="space-y-2">
                      <h4 className="text-sm font-semibold">{nombres[factor] || factor}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">✓ Sin Riesgo</span>
                          <span>{datos.sin_riesgo} ({porcentajeSinRiesgo.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-red-600">✗ Con Riesgo</span>
                          <span>{datos.con_riesgo} ({porcentajeConRiesgo.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de resultados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resultados por Estudiante</CardTitle>
                  <CardDescription>
                    Predicciones y análisis detallado para cada estudiante
                    {resultadosFiltrados.length !== analysisResult.total_estudiantes && (
                      <span className="ml-2 text-muted-foreground">
                        ({resultadosFiltrados.length} de {analysisResult.total_estudiantes} mostrados)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros y búsqueda */}
              <div className="mb-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Búsqueda */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtro por sección */}
                  <Select value={filterSeccion} onValueChange={setFilterSeccion}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todas las secciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las secciones</SelectItem>
                      {seccionesUnicas.map(seccion => (
                        <SelectItem key={seccion} value={seccion}>{seccion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro por grado */}
                  <Select value={filterGrado} onValueChange={setFilterGrado}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos los grados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los grados</SelectItem>
                      {gradosUnicos.map(grado => (
                        <SelectItem key={grado} value={grado}>{grado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                </div>

                {/* Filtros por factores de riesgo */}
                <div className="flex flex-wrap gap-4 items-center">
                  <Label className="text-sm font-medium">Factores de riesgo:</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-asistencia"
                      checked={filterFactores.asistencia}
                      onCheckedChange={(checked) =>
                        setFilterFactores({ ...filterFactores, asistencia: checked === true })
                      }
                    />
                    <Label htmlFor="filter-asistencia" className="text-sm cursor-pointer">
                      Asistencia
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-incidencias"
                      checked={filterFactores.incidencias}
                      onCheckedChange={(checked) =>
                        setFilterFactores({ ...filterFactores, incidencias: checked === true })
                      }
                    />
                    <Label htmlFor="filter-incidencias" className="text-sm cursor-pointer">
                      Incidencias
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-sentimiento"
                      checked={filterFactores.sentimiento}
                      onCheckedChange={(checked) =>
                        setFilterFactores({ ...filterFactores, sentimiento: checked === true })
                      }
                    />
                    <Label htmlFor="filter-sentimiento" className="text-sm cursor-pointer">
                      Sentimiento
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="filter-familia"
                      checked={filterFactores.situacion_familiar}
                      onCheckedChange={(checked) =>
                        setFilterFactores({ ...filterFactores, situacion_familiar: checked === true })
                      }
                    />
                    <Label htmlFor="filter-familia" className="text-sm cursor-pointer">
                      Situación Familiar
                    </Label>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="todos" className="w-full" onValueChange={(value) => { setFilterEstadoTab(value); setCurrentPage(1); }}>
                <TabsList>
                  <TabsTrigger value="todos">
                    Todos ({resultadosFiltrados.length})
                  </TabsTrigger>
                  <TabsTrigger value="aprueba">
                    🟢 Aprueba ({resultadosFiltrados.filter(r => r.Prediccion_Final_Binaria === 1).length})
                  </TabsTrigger>
                  <TabsTrigger value="desaprueba">
                    🔴 Desaprueba ({resultadosFiltrados.filter(r => r.Prediccion_Final_Binaria === 0).length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="todos" className="mt-4">
                  {(() => {
                    const todos = resultadosFiltrados;
                    const totalTodos = todos.length;
                    const paginasTodos = Math.ceil(totalTodos / itemsPerPage);
                    const todosPaginados = todos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    return (
                      <ResultadosTable 
                        resultados={todosPaginados}
                        total={totalTodos}
                        currentPage={currentPage}
                        totalPages={paginasTodos}
                        onPageChange={setCurrentPage}
                      />
                    );
                  })()}
                </TabsContent>

                <TabsContent value="aprueba" className="mt-4">
                  {(() => {
                    const aprobados = resultadosFiltrados.filter(r => r.Prediccion_Final_Binaria === 1);
                    const totalAprobados = aprobados.length;
                    const paginasAprobados = Math.ceil(totalAprobados / itemsPerPage);
                    const aprobadosPaginados = aprobados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    return (
                      <ResultadosTable 
                        resultados={aprobadosPaginados}
                        total={totalAprobados}
                        currentPage={currentPage}
                        totalPages={paginasAprobados}
                        onPageChange={setCurrentPage}
                      />
                    );
                  })()}
                </TabsContent>

                <TabsContent value="desaprueba" className="mt-4">
                  {(() => {
                    const desaprobados = resultadosFiltrados.filter(r => r.Prediccion_Final_Binaria === 0);
                    const totalDesaprobados = desaprobados.length;
                    const paginasDesaprobados = Math.ceil(totalDesaprobados / itemsPerPage);
                    const desaprobadosPaginados = desaprobados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                    return (
                      <ResultadosTable 
                        resultados={desaprobadosPaginados}
                        total={totalDesaprobados}
                        currentPage={currentPage}
                        totalPages={paginasDesaprobados}
                        onPageChange={setCurrentPage}
                      />
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

interface ResultadosTableProps {
  resultados: SATEAnalysisResult['resultados'];
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ResultadosTable = ({ resultados, total, currentPage, totalPages, onPageChange }: ResultadosTableProps) => {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DNI</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Grado</TableHead>
              <TableHead>Bim1</TableHead>
              <TableHead>Bim2</TableHead>
              <TableHead>Bim3</TableHead>
              <TableHead>Proyección B4</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Factores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No se encontraron resultados con los filtros aplicados
                </TableCell>
              </TableRow>
            ) : (
              resultados.map((estudiante, idx) => (
                <TableRow key={`${estudiante.DNI}-${idx}`}>
                  <TableCell className="font-mono text-xs">{estudiante.DNI}</TableCell>
                  <TableCell className="font-medium">{estudiante.Apellidos_Nombres}</TableCell>
                  <TableCell>{estudiante.Seccion}</TableCell>
                  <TableCell>{estudiante.Grado}</TableCell>
                  <TableCell>{estudiante.NotaBim1}</TableCell>
                  <TableCell>{estudiante.NotaBim2}</TableCell>
                  <TableCell>{estudiante.NotaBim3}</TableCell>
                  <TableCell className="font-semibold">
                    {estudiante.Nota_Proyectada_B4.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={estudiante.Prediccion_Final_Binaria === 1 ? "default" : "destructive"}
                      className={estudiante.Prediccion_Final_Binaria === 1 ? "bg-green-500 hover:bg-green-600 text-white border-green-600" : ""}
                    >
                      {estudiante.Estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {estudiante.Analisis_Asistencia === 1 ? (
                        <Badge variant="outline" className="text-xs">✓A</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">✗A</Badge>
                      )}
                      {estudiante.Analisis_Incidencias === 1 ? (
                        <Badge variant="outline" className="text-xs">✓I</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">✗I</Badge>
                      )}
                      {estudiante.Analisis_Sentimiento_Estudiante === 1 ? (
                        <Badge variant="outline" className="text-xs">✓S</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">✗S</Badge>
                      )}
                      {estudiante.Analisis_Situacion_Familiar === 1 ? (
                        <Badge variant="outline" className="text-xs">✓F</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">✗F</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, total)} de {total} resultados
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
