import { useState } from 'react';
import { Settings, Database, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMongoDB } from '@/hooks/useMongoDB';
import { Badge } from '@/components/ui/badge';

export const SettingsView = () => {
  const { isConnected, isConnecting, status, connect, disconnect } = useMongoDB();
  const [mongodbUri, setMongodbUri] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    if (!mongodbUri.trim()) {
      setError('Por favor, ingresa una URI de MongoDB');
      return;
    }

    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await connect(mongodbUri.trim(), databaseName.trim() || undefined);
      setSuccess(true);
      // Limpiar el formulario después de conectar exitosamente
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setSuccess(false);
    await disconnect();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-muted-foreground mt-1">
          Configura tu conexión a MongoDB
        </p>
      </div>

      {/* Estado actual de conexión */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Estado de Conexión</CardTitle>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : (
                'Desconectado'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Base de datos: <span className="font-semibold text-foreground">{status.database || 'N/A'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Colecciones disponibles: <span className="font-semibold text-foreground">{status.collections?.length || 0}</span>
              </p>
              <Button onClick={handleDisconnect} variant="destructive" className="mt-4">
                Desconectar MongoDB
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay conexión activa. Configura una conexión a continuación.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Formulario de configuración */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Configuración de MongoDB</CardTitle>
          </div>
          <CardDescription>
            Ingresa la URI de conexión de tu base de datos MongoDB. Si no proporcionas un nombre de base de datos, se usará el predeterminado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mongodb-uri">
              URI de MongoDB <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mongodb-uri"
              type="text"
              placeholder="mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority"
              value={mongodbUri}
              onChange={(e) => setMongodbUri(e.target.value)}
              disabled={isConnecting || saving}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Ejemplo: mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database-name">
              Nombre de la Base de Datos (Opcional)
            </Label>
            <Input
              id="database-name"
              type="text"
              placeholder="escuela_db"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              disabled={isConnecting || saving}
            />
            <p className="text-xs text-muted-foreground">
              Si no se especifica, se usará el nombre predeterminado o el de la URI.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>
                Conectado exitosamente a MongoDB
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleConnect} 
            disabled={isConnecting || saving || !mongodbUri.trim()}
            className="w-full"
          >
            {isConnecting || saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Conectar a MongoDB
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Nota:</strong> La URI de conexión se usa solo para esta sesión. 
            Para una configuración permanente, edita el archivo <code className="bg-secondary px-1 py-0.5 rounded">.env</code>.
          </p>
          <p>
            Si ya tienes una conexión activa usando la configuración del archivo <code className="bg-secondary px-1 py-0.5 rounded">.env</code>, 
            puedes usar este formulario para conectarte a una base de datos diferente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
