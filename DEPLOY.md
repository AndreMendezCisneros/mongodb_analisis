# Guía de Despliegue en Producción

## ⚠️ Problema Común: "Unexpected token '<', "<!doctype "... is not valid JSON"

Este error ocurre cuando el servidor devuelve HTML en lugar de JSON. Esto sucede porque:

1. **El backend no está desplegado** o no es accesible
2. **Las rutas `/api/*` están siendo capturadas** por el servidor del frontend
3. **El servidor del frontend devuelve `index.html`** para todas las rutas (SPA routing)

## Configuración del Frontend para Producción

### Problema Común

En desarrollo, Vite usa un proxy que redirige `/api` a `http://localhost:3001`. En producción, este proxy **no funciona**, por lo que el frontend necesita conocer la URL completa del servidor backend.

### Solución

Configura la variable de entorno `VITE_API_URL` antes de hacer el build.

#### Opción 1: Variable de Entorno al Build

```bash
export VITE_API_URL=https://tu-servidor-backend.com:3001
npm run build
```

#### Opción 2: Archivo .env.production

Crea un archivo `.env.production` en la raíz del proyecto:

```env
VITE_API_URL=https://tu-servidor-backend.com:3001
VITE_BACKEND_PORT=3001
```

Luego haz el build:
```bash
npm run build
```

### Ejemplos de Configuración

#### Backend en el mismo dominio, puerto diferente:
```env
VITE_API_URL=https://tu-dominio.com:3001
```

#### Backend en subdominio:
```env
VITE_API_URL=https://api.tu-dominio.com
```

#### Backend en dominio completamente diferente:
```env
VITE_API_URL=https://backend.tu-otro-dominio.com:3001
```

### Verificación

Después del build, verifica que la configuración sea correcta:

1. Abre `dist/index.html` (o el archivo HTML generado)
2. Busca en el código fuente si hay referencias a la URL del API
3. O mejor, abre la consola del navegador en producción y verifica los logs:
   - En desarrollo verás: `🔧 API Base URL: /api`
   - En producción deberías ver: `🔧 API Base URL: https://tu-servidor.com:3001/api`

## Configuración del Backend

### Variables de Entorno del Servidor

El servidor backend necesita estas variables en producción:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=app-name
MONGODB_DB_NAME=nombre_base_datos
SERVER_PORT=3001
```

### CORS en Producción

Asegúrate de que el servidor backend permita las peticiones desde tu dominio de producción. En `server/index.js`, el CORS está configurado para permitir todos los orígenes, pero en producción puedes restringirlo:

```javascript
app.use(cors({
  origin: ['https://tu-dominio-frontend.com', 'https://www.tu-dominio-frontend.com'],
  credentials: true
}));
```

## Despliegue en Plataformas Comunes

### Vercel (Frontend)

#### Opción 1: Backend en servidor separado (Recomendado)

1. Despliega el backend en Railway, Render, Heroku, etc.
2. Configura la variable de entorno en Vercel:
   - `VITE_API_URL`: URL completa de tu servidor backend (ej: `https://tu-backend.railway.app`)

#### Opción 2: Usar Rewrites en Vercel

Si el backend está en otro servidor, puedes usar rewrites en `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-backend.com/api/:path*"
    }
  ]
}
```

### Netlify (Frontend)

1. Configura las variables de entorno en el panel:
   - `VITE_API_URL`: URL completa de tu servidor backend

2. O crea `netlify.toml`:
```toml
[build]
  environment = { VITE_API_URL = "https://tu-backend.com:3001" }

[[redirects]]
  from = "/api/*"
  to = "https://tu-backend.com/api/:splat"
  status = 200
  force = true
```

### Railway / Render / Heroku (Backend)

1. Configura las variables de entorno en el panel:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `SERVER_PORT`

2. Asegúrate de que el puerto sea accesible públicamente

3. Verifica que el endpoint `/api/health` responda correctamente

## Troubleshooting en Producción

### Error: "No se puede conectar al servidor"

1. Verifica que `VITE_API_URL` esté configurada correctamente
2. Verifica que el servidor backend esté accesible públicamente
3. Prueba acceder directamente a `https://tu-servidor-backend.com:3001/api/health` en tu navegador
4. Verifica que no haya problemas de CORS
5. Revisa la consola del navegador para ver la URL exacta que se está intentando usar

### Error: CORS

1. Verifica que el servidor backend tenga CORS habilitado para tu dominio
2. Si usas credenciales, asegúrate de configurar `credentials: true` en el servidor

### El frontend funciona pero no conecta a MongoDB

1. Verifica que el servidor backend tenga acceso a MongoDB
2. Verifica que las variables de entorno del servidor estén configuradas
3. Revisa los logs del servidor backend para ver errores específicos
