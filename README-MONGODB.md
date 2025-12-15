# Configuración de MongoDB Atlas

Este proyecto ahora incluye un servidor backend para conectarse a MongoDB Atlas.

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
MONGODB_URI=mongodb+srv://andreguillermomendezcisneros_db_user:3hytWWcrAR8SYScn@escuela-cluster.4uhkgwn.mongodb.net/?appName=escuela-cluster
MONGODB_DB_NAME=escuela_db
SERVER_PORT=3001
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará tanto las dependencias del frontend como del backend (Express, MongoDB, etc.).

### 3. Ejecutar el Proyecto

#### Opción 1: Ejecutar Frontend y Backend por separado

Terminal 1 - Backend:
```bash
npm run dev:server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

#### Opción 2: Ejecutar ambos simultáneamente (requiere concurrently)

```bash
npm run dev:all
```

## Endpoints de la API

### Conexión
- `POST /api/mongodb/connect` - Conectar a MongoDB
- `GET /api/mongodb/status` - Verificar estado de conexión
- `POST /api/mongodb/disconnect` - Desconectar de MongoDB

### Colecciones
- `GET /api/mongodb/collections` - Listar todas las colecciones
- `GET /api/mongodb/collection/:collectionName` - Obtener datos de una colección
  - Query params: `limit` (default: 100), `skip` (default: 0)

### Agregaciones
- `POST /api/mongodb/aggregate/:collectionName` - Ejecutar pipeline de agregación
  - Body: `{ "pipeline": [...] }`

### Salud
- `GET /api/health` - Verificar que el servidor está funcionando

## Uso en el Frontend

El componente `Header` ahora tiene funcionalidad completa de conexión. Al hacer clic en "Conectar MongoDB", se establecerá la conexión con la base de datos configurada en `.env`.

El hook `useMongoDB` está disponible para usar en cualquier componente:

```typescript
import { useMongoDB } from '@/hooks/useMongoDB';

const { isConnected, connect, disconnect, status } = useMongoDB();
```

## Seguridad

⚠️ **Importante**: El archivo `.env` contiene credenciales sensibles. Asegúrate de:
- No commitear el archivo `.env` al repositorio
- Mantener las credenciales seguras
- En producción, usar variables de entorno del servidor

## Solución de Problemas

### Error de conexión
1. Verifica que la URI de MongoDB sea correcta
2. Asegúrate de que la IP está permitida en MongoDB Atlas (Network Access)
3. Verifica las credenciales de usuario

### Puerto en uso
Si el puerto 3001 está en uso, cambia `SERVER_PORT` en `.env`

### CORS
El servidor tiene CORS habilitado para permitir peticiones desde el frontend (puerto 8080)

