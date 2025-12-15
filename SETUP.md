# Guía de Configuración Rápida

## Paso 1: Crear archivo .env

Crea un archivo `.env` en la raíz del proyecto (`mongodb-insights-hub/.env`) con el siguiente contenido:

```env
MONGODB_URI=mongodb+srv://andreguillermomendezcisneros_db_user:3hytWWcrAR8SYScn@escuela-cluster.4uhkgwn.mongodb.net/?appName=escuela-cluster
MONGODB_DB_NAME=escuela_db
SERVER_PORT=3001
```

## Paso 2: Instalar dependencias

```bash
cd mongodb-insights-hub
npm install
```

## Paso 3: Ejecutar el proyecto

### Opción A: Ejecutar todo junto (recomendado si tienes `concurrently`)
```bash
npm run dev:all
```

### Opción B: Ejecutar por separado

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Paso 4: Usar la aplicación

1. Abre tu navegador en `http://localhost:8080`
2. Haz clic en el botón "Conectar MongoDB" en el header
3. Verás el estado de conexión actualizarse a "MongoDB Conectado"

## Verificación

- Backend: `http://localhost:3001/api/health` debería responder `{"status":"ok"}`
- Frontend: `http://localhost:8080` debería mostrar el dashboard

## Solución de Problemas

### Si el puerto 3001 está en uso:
Cambia `SERVER_PORT` en el archivo `.env`

### Si hay errores de conexión a MongoDB:
1. Verifica que la URI esté correcta
2. Asegúrate de que tu IP esté permitida en MongoDB Atlas (Network Access)
3. Verifica las credenciales



