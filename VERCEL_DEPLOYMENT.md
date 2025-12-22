# Deployment en Vercel

## 📋 Prerrequisitos

- Cuenta en Vercel (vercel.com)
- Repositorio en GitHub: https://github.com/Aquetzalli19/fotogifty-front-prod

## 🚀 Pasos para el Deployment

### 1. Importar Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en "Add New Project"
3. Selecciona el repositorio: `Aquetzalli19/fotogifty-front-prod`
4. Click en "Import"

### 2. Configurar Variables de Entorno

En la sección "Environment Variables" de Vercel, agrega:

```
NEXT_PUBLIC_API_URL=https://fotogifty-back-bun-production-2eb3.up.railway.app/api
```

**⚠️ IMPORTANTE**: Esta URL del backend:
- ✅ Solo se usa en el servidor de Next.js (rewrites)
- ✅ NUNCA se expone al navegador del cliente
- ✅ El cliente solo ve `/api/*` que es manejado por el proxy

### 3. Framework Preset

Vercel debería detectar automáticamente que es Next.js 15. Si no:
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`

### 4. Deploy

Click en "Deploy" y espera a que termine el build.

## 🔒 Seguridad del API

### Cómo funciona el proxy

1. **Cliente** hace petición a: `/api/paquetes`
2. **Next.js** (servidor) redirige a: `https://fotogifty-back-bun-production-2eb3.up.railway.app/api/paquetes`
3. **Cliente** nunca ve la URL real del backend

### Verificación

Para verificar que el API no está expuesto:
1. Abre DevTools (F12) en tu navegador
2. Ve a la pestaña Network
3. Haz una petición a la API
4. Verás que la petición va a `/api/*` (no a Railway)

## 📝 Variables de Entorno por Ambiente

### Development (Local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Production (Vercel)
```env
NEXT_PUBLIC_API_URL=https://fotogifty-back-bun-production-2eb3.up.railway.app/api
```

## ⚙️ Configuración del Proxy

El proxy está configurado en `next.config.ts`:

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
        : 'http://localhost:3001/api/:path*',
    },
  ];
}
```

## 🔧 Troubleshooting

### Error: API no responde

1. Verifica que Railway está funcionando
2. Verifica que la variable `NEXT_PUBLIC_API_URL` esté correcta en Vercel
3. Revisa los logs en Vercel Dashboard

### Error: CORS

Si ves errores de CORS:
1. Verifica que estés usando `/api/*` en el código (no la URL completa)
2. El proxy de Next.js elimina los problemas de CORS

### Redeploy después de cambios

1. Haz commit y push a GitHub
2. Vercel auto-deployará automáticamente
3. O manualmente: Vercel Dashboard → Deployments → Redeploy

## 📚 Recursos

- [Next.js Rewrites](https://nextjs.org/docs/app/api-reference/next-config-js/rewrites)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
