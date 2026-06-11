# Deploy gratis: Neon, Render y Vercel

Guia para desplegar primero sin rama de preproduccion. La idea es validar el
flujo completo y despues separar ambientes.

## Arquitectura inicial

```text
Frontend React/Vite -> Vercel Free
Backend API         -> Render Free
Base de datos      -> Neon Free
```

## Variables por servicio

### Frontend en Vercel

```text
VITE_API_URL=https://tu-backend.onrender.com
```

No uses `localhost` en Vercel. El frontend se ejecuta en el navegador del
usuario, por eso necesita la URL publica del backend.

### Backend en Render

Estas variables van en el servicio del backend, no en este repo frontend:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=un-secreto-largo-y-unico
CORS_ORIGIN=https://tu-frontend.vercel.app
NODE_ENV=production
```

Si el backend usa cookies cross-site, debe configurar cookies con `Secure` y
`SameSite=None`, y CORS debe permitir credenciales.

### Base de datos en Neon

Para esta primera fase se usa una sola base de datos. Copia el connection string
de Neon y pegalo en `DATABASE_URL` del backend en Render.

## Orden recomendado

1. Crear proyecto en Neon y guardar el `DATABASE_URL`.
2. Desplegar backend en Render.
3. Configurar en Render `DATABASE_URL`, secretos y CORS.
4. Ejecutar migraciones del backend contra Neon, si el backend las tiene.
5. Probar endpoint de salud o login del backend en Render.
6. Desplegar frontend en Vercel desde este repo.
7. Configurar `VITE_API_URL` en Vercel con la URL publica de Render.
8. Ejecutar un redeploy del frontend.
9. Probar login, rutas protegidas, pagos, reportes e imagenes.

## Configuracion de Vercel

Valores recomendados:

```text
Framework Preset: Vite
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install --frozen-lockfile
```

El archivo `vercel.json` ya tiene la reescritura necesaria para SPA, de modo que
rutas como `/admin/pagos` sigan funcionando al refrescar.

## Verificacion local antes de subir

```text
pnpm run check:deploy
```

Ese comando ejecuta lint y build. El build revisa que `VITE_API_URL` exista y
que en despliegues remotos no apunte a `localhost`.

## Despues de validar

Cuando el despliegue basico este funcionando:

```text
GitHub branch: pre-produccion
Neon branch: pre_produccion
Vercel deploy preview/preproduccion
Render servicio separado de preproduccion
```

En esa segunda fase cada entorno tendra sus propias variables y su propia base.
