import { useState, useEffect } from 'react';
import { useMongoDB } from '@/hooks/useMongoDB';
import { ejecutarAnalisisSATE, type SATEAnalysisResult } from '@/services/analytics';
import { Loader2, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfusionMatrixChart } from '@/components/charts/ConfusionMatrixChart';
import { ROCCurveChart } from '@/components/charts/ROCCurveChart';

export const AnalyticsView = () => {
  const { isConnected } = useMongoDB();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SATEAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ejecutarAnalisis = async () => {
    if (!isConnected) {
      setError('Debes estar conectado a MongoDB para ejecutar el análisis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await ejecutarAnalisisSATE();
      setAnalysisResult(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar el análisis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && !analysisResult) {
      // Ejecutar análisis automáticamente al cargar si hay conexión
      ejecutarAnalisis();
    }
  }, [isConnected]);

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
        </div>
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
              <BarChart3 className="h-4 w-4" />
              Ejecutar Análisis
            </>
          )}
        </Button>
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
              <CardTitle>Resultados por Estudiante</CardTitle>
              <CardDescription>
                Predicciones y análisis detallado para cada estudiante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="todos" className="w-full">
                <TabsList>
                  <TabsTrigger value="todos">Todos ({analysisResult.total_estudiantes})</TabsTrigger>
                  <TabsTrigger value="aprueba">
                    🟢 Aprueba ({analysisResult.metricas.aprueba})
                  </TabsTrigger>
                  <TabsTrigger value="desaprueba">
                    🔴 Desaprueba ({analysisResult.metricas.desaprueba})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="todos" className="mt-4">
                  <ResultadosTable resultados={analysisResult.resultados} />
                </TabsContent>

                <TabsContent value="aprueba" className="mt-4">
                  <ResultadosTable 
                    resultados={analysisResult.resultados.filter(r => r.Prediccion_Final_Binaria === 1)} 
                  />
                </TabsContent>

                <TabsContent value="desaprueba" className="mt-4">
                  <ResultadosTable 
                    resultados={analysisResult.resultados.filter(r => r.Prediccion_Final_Binaria === 0)} 
                  />
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
}

const ResultadosTable = ({ resultados }: ResultadosTableProps) => {
  return (
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
          {resultados.map((estudiante, idx) => (
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
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
