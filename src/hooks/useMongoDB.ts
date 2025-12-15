import { useState, useEffect, useCallback } from 'react';
import { 
  connectToMongoDB, 
  checkMongoDBStatus, 
  disconnectFromMongoDB,
  MongoDBStatus 
} from '@/services/mongodb';
import { toast } from 'sonner';

export function useMongoDB() {
  const [status, setStatus] = useState<MongoDBStatus>({ connected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Verificar estado inicial
  useEffect(() => {
    checkStatus();
    
    // Verificar estado cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const currentStatus = await checkMongoDBStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error al verificar estado:', error);
    }
  }, []);

  const connect = useCallback(async (uri?: string, database?: string) => {
    setIsConnecting(true);
    try {
      const result = await connectToMongoDB(uri, database);
      if (result.success) {
        toast.success(result.message || 'Conectado a MongoDB exitosamente');
        await checkStatus();
      } else {
        toast.error('Error al conectar a MongoDB');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error de conexión: ${message}`);
      console.error('Error al conectar:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [checkStatus]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      const result = await disconnectFromMongoDB();
      if (result.success) {
        toast.success(result.message || 'Desconectado de MongoDB');
        setStatus({ connected: false });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al desconectar: ${message}`);
      console.error('Error al desconectar:', error);
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  return {
    status,
    isConnected: status.connected,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    checkStatus,
  };
}



