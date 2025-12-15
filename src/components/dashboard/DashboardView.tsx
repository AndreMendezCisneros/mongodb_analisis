import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMongoDB } from '@/hooks/useMongoDB';
import { ejecutarAnalisisSATE, type SATEAnalysisResult } from '@/services/analytics';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PieChartComponent } from '@/components/charts/PieChartComponent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, LineChart, Line, ComposedChart
} from 'recharts';
import { ChartDataPoint } from '@/types/chart';

export const DashboardView = () => {
  const { isConnected } = useMongoDB();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SATEAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros de estudiantes
  const [selectedEstudiante1, setSelectedEstudiante1] = useState<string>('');
  const [selectedEstudiante2, setSelectedEstudiante2] = useState<string>('');

  // Handlers para manejar el valor "none" como vacío
  const handleEstudiante2Change = (value: string) => {
    setSelectedEstudiante2(value === 'none' ? '' : value);
  };

  // Ejecutar análisis automáticamente al conectar
  useEffect(() => {
    if (isConnected && !analysisResult && !loading) {
      ejecutarAnalisis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const ejecutarAnalisis = useCallback(async () => {
    if (!isConnected) {
      setError('Debes estar conectado a MongoDB para ver los gráficos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await ejecutarAnalisisSATE();
      if (!resultado || !resultado.success) {
        throw new Error('El análisis no se completó correctamente');
      }
      if (!resultado.resultados || resultado.resultados.length === 0) {
        throw new Error('No se encontraron estudiantes en el análisis');
      }
      setAnalysisResult(resultado);
    } catch (err) {
      console.error('Error ejecutando análisis:', err);
      setError(err instanceof Error ? err.message : 'Error al ejecutar el análisis');
      setAnalysisResult(null);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Datos para gráfico pastel: Total vs Aprobados
  const datosAprobados = useMemo(() => {
    if (!analysisResult?.metricas) return [];
    const aprueba = analysisResult.metricas.aprueba || 0;
    const desaprueba = analysisResult.metricas.desaprueba || 0;
    if (aprueba === 0 && desaprueba === 0) return [];
    return [
      { name: 'Aprobados', value: aprueba },
      { name: 'Desaprobados', value: desaprueba }
    ];
  }, [analysisResult]);

  // Datos para gráfico pastel: Por géneros
  const datosGeneros = useMemo(() => {
    if (!analysisResult?.resultados) return [];
    const generos = analysisResult.resultados.reduce((acc, est) => {
      // Obtener género del campo Genero (ya viene del análisis)
      const genero = est.Genero || 'No especificado';
      acc[genero] = (acc[genero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(generos).map(([name, value]) => ({ name, value }));
  }, [analysisResult]);

  // Datos para gráfico de barras: Por secciones (aprobados y desaprobados)
  const datosSecciones = useMemo(() => {
    if (!analysisResult?.resultados) return [];
    const secciones = analysisResult.resultados.reduce((acc, est) => {
      const seccion = est.Seccion || 'Sin sección';
      if (!acc[seccion]) {
        acc[seccion] = { aprobados: 0, desaprobados: 0 };
      }
      if (est.Prediccion_Final_Binaria === 1) {
        acc[seccion].aprobados++;
      } else {
        acc[seccion].desaprobados++;
      }
      return acc;
    }, {} as Record<string, { aprobados: number; desaprobados: number }>);

    return Object.entries(secciones).map(([name, valores]) => ({
      name,
      aprobados: valores.aprobados,
      desaprobados: valores.desaprobados
    }));
  }, [analysisResult]);

  // Datos para gráfico de líneas: Notas de estudiante
  const datosNotasEstudiante = useMemo(() => {
    if (!analysisResult?.resultados || !selectedEstudiante1) return [];
    
    const estudiante = analysisResult.resultados.find(
      est => est.DNI === selectedEstudiante1
    );
    
    if (!estudiante) return [];

    const datos: (ChartDataPoint & { value2?: number })[] = [
      { name: 'Bimestre 1', value: estudiante.NotaBim1 || 0 },
      { name: 'Bimestre 2', value: estudiante.NotaBim2 || 0 },
      { name: 'Bimestre 3', value: estudiante.NotaBim3 || 0 },
      { name: 'Proyección B4', value: estudiante.Nota_Proyectada_B4 || 0 }
    ];

    // Si hay segundo estudiante seleccionado, agregar sus datos
    if (selectedEstudiante2) {
      const estudiante2 = analysisResult.resultados.find(
        est => est.DNI === selectedEstudiante2
      );
      
      if (estudiante2) {
        datos.forEach((d, index) => {
          if (index === 0) d.value2 = estudiante2.NotaBim1 || 0;
          else if (index === 1) d.value2 = estudiante2.NotaBim2 || 0;
          else if (index === 2) d.value2 = estudiante2.NotaBim3 || 0;
          else if (index === 3) d.value2 = estudiante2.Nota_Proyectada_B4 || 0;
        });
      }
    }

    return datos;
  }, [analysisResult, selectedEstudiante1, selectedEstudiante2]);

  // Datos para gráfico de dispersión
  const datosDispersion = useMemo(() => {
    if (!analysisResult?.resultados) return [];
    
    return analysisResult.resultados
      .filter(est => est.NotaBim3 != null && est.Nota_Proyectada_B4 != null)
      .map(est => ({
        x: est.NotaBim3 || 0,
        y: est.Nota_Proyectada_B4 || 0,
        name: est.Apellidos_Nombres || 'Sin nombre',
        dni: est.DNI || '',
        seccion: est.Seccion || ''
      }));
  }, [analysisResult]);

  // Lista de estudiantes para los selects
  const listaEstudiantes = useMemo(() => {
    if (!analysisResult?.resultados) return [];
    return analysisResult.resultados.map(est => ({
      dni: est.DNI,
      nombre: est.Apellidos_Nombres,
      label: `${est.Apellidos_Nombres} (${est.DNI})`
    }));
  }, [analysisResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando datos del análisis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysisResult) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sin datos</AlertTitle>
        <AlertDescription>
          No hay datos de análisis disponibles. Asegúrate de estar conectado a MongoDB y ejecutar el análisis.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard - Análisis SATE-SR</h2>
          <p className="text-muted-foreground">Vista general de los resultados del análisis predictivo</p>
        </div>
        <button
          onClick={ejecutarAnalisis}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Actualizar Datos
        </button>
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico Pastel: Total vs Aprobados */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Aprobados</CardTitle>
            <CardDescription>Total de estudiantes aprobados vs desaprobados</CardDescription>
          </CardHeader>
          <CardContent>
            {datosAprobados.length > 0 ? (
              <div className="h-64">
                <PieChartComponent
                  data={datosAprobados}
                  dataKey="value"
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico Pastel: Por géneros */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Género</CardTitle>
            <CardDescription>Cantidad de estudiantes por género</CardDescription>
          </CardHeader>
          <CardContent>
            {datosGeneros.length > 0 ? (
              <div className="h-64">
                <PieChartComponent
                  data={datosGeneros}
                  dataKey="value"
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos de género disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras Agrupadas: Por secciones */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Estudiantes por Sección</CardTitle>
            <CardDescription>Aprobados y desaprobados por sección</CardDescription>
          </CardHeader>
          <CardContent>
            {datosSecciones.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={datosSecciones} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                    labelStyle={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                    itemStyle={{
                      color: '#ffffff',
                    }}
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  />
                    <Legend />
                    <Bar 
                      dataKey="aprobados" 
                      fill="#22c55e" 
                      name="Aprobados"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar 
                      dataKey="desaprobados" 
                      fill="#ef4444" 
                      name="Desaprobados"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No hay datos de secciones disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Líneas: Notas de estudiante */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evolución de Notas por Estudiante</CardTitle>
            <CardDescription>Notas de los bimestres y proyección del Bimestre 4</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estudiante1">Estudiante 1</Label>
                  <Select value={selectedEstudiante1} onValueChange={setSelectedEstudiante1}>
                    <SelectTrigger id="estudiante1">
                      <SelectValue placeholder="Seleccionar estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {listaEstudiantes.map(est => (
                        <SelectItem key={est.dni} value={est.dni}>
                          {est.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estudiante2">Estudiante 2 (Comparar)</Label>
                  <Select value={selectedEstudiante2 || 'none'} onValueChange={handleEstudiante2Change}>
                    <SelectTrigger id="estudiante2">
                      <SelectValue placeholder="Opcional: Comparar con otro estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {listaEstudiantes
                        .filter(est => est.dni !== selectedEstudiante1)
                        .map(est => (
                          <SelectItem key={est.dni} value={est.dni}>
                            {est.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {selectedEstudiante1 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosNotasEstudiante} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                      labelStyle={{
                        color: '#ffffff',
                        fontWeight: 'bold',
                      }}
                      itemStyle={{
                        color: '#ffffff',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      name={listaEstudiantes.find(e => e.dni === selectedEstudiante1)?.nombre || 'Estudiante 1'}
                      dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                    {selectedEstudiante2 && (
                      <Line
                        type="monotone"
                        dataKey="value2"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        name={listaEstudiantes.find(e => e.dni === selectedEstudiante2)?.nombre || 'Estudiante 2'}
                        dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#ef4444' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Selecciona un estudiante para ver su evolución de notas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Dispersión */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Gráfico de Dispersión: Nota Bimestre 3 vs Proyección B4</CardTitle>
            <CardDescription>Relación entre la nota del tercer bimestre y la proyección del cuarto bimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dispersion-estudiante1">Estudiante 1</Label>
                  <Select value={selectedEstudiante1} onValueChange={setSelectedEstudiante1}>
                    <SelectTrigger id="dispersion-estudiante1">
                      <SelectValue placeholder="Seleccionar estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {listaEstudiantes.map(est => (
                        <SelectItem key={est.dni} value={est.dni}>
                          {est.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dispersion-estudiante2">Estudiante 2 (Comparar)</Label>
                  <Select value={selectedEstudiante2 || 'none'} onValueChange={handleEstudiante2Change}>
                    <SelectTrigger id="dispersion-estudiante2">
                      <SelectValue placeholder="Opcional: Comparar con otro estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {listaEstudiantes
                        .filter(est => est.dni !== selectedEstudiante1)
                        .map(est => (
                          <SelectItem key={est.dni} value={est.dni}>
                            {est.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {datosDispersion.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Nota Bimestre 3"
                      label={{ value: 'Nota Bimestre 3', position: 'insideBottom', offset: -5 }}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Proyección B4"
                      label={{ value: 'Proyección B4', angle: -90, position: 'insideLeft' }}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                    labelStyle={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                    itemStyle={{
                      color: '#ffffff',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'x') return [`${value}`, 'Nota B3'];
                      if (name === 'y') return [`${value}`, 'Proyección B4'];
                      return [`${value}`, name];
                    }}
                    labelFormatter={(label, payload: any[]) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return `Estudiante: ${payload[0].payload.name || 'N/A'}`;
                      }
                      return '';
                    }}
                  />
                    <Scatter
                      name="Todos los estudiantes"
                      data={datosDispersion}
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    {selectedEstudiante1 && (
                      <Scatter
                        name="Estudiante 1"
                        data={datosDispersion.filter(d => d.dni === selectedEstudiante1)}
                        fill="#3b82f6"
                        fillOpacity={1}
                      />
                    )}
                    {selectedEstudiante2 && (
                      <Scatter
                        name="Estudiante 2"
                        data={datosDispersion.filter(d => d.dni === selectedEstudiante2)}
                        fill="#ef4444"
                        fillOpacity={1}
                      />
                    )}
                    <Legend />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No hay datos de dispersión disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

