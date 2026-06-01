# Produccion Frontend

Estado actual de preparacion para produccion del frontend.

## Variables de entorno

Archivo observado:

- `.env`

Variable usada:

```text
VITE_API_URL=http://localhost:8000
```

Esta variable es usada por:

- `src/utils/api.js`
- servicios o paginas que leen `import.meta.env.VITE_API_URL`

## Build

Comando actual:

```text
pnpm run build
```

El script ejecuta:

```text
vite build
```

La salida generada se ubica en:

```text
dist/
```

## Preview local

Comando actual:

```text
pnpm run preview
```

El script ejecuta:

```text
vite preview
```

## Desarrollo local

Comando actual:

```text
pnpm run dev
```

El script ejecuta:

```text
vite
```

## Despliegue SPA

`vercel.json` contiene una reescritura:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esto permite que rutas internas como `/admin/pagos` o `/planilla` carguen correctamente al refrescar el navegador.

## Lint

Comando actual:

```text
pnpm run lint
```

El script ejecuta:

```text
eslint .
```

## Estado SaaS del tenant

El layout autenticado monta:

- `src/components/TenantStatusBanner.jsx`

Ese componente consume:

```text
GET /tenant/status
```

Si el backend responde `mostrar_aviso = true`, muestra un banner superior para
tenants en estado `en_mora`. La autorizacion y bloqueo real de tenants
`suspendido` o `cancelado` depende del backend.

## Super admin

La ruta `/super-admin` monta:

- `src/components/NavSuperAdmin.jsx`
- `src/pages/SuperAdminDashboard.jsx`

El login usa el mismo formulario. Si el backend responde `rol = "super_admin"`,
el frontend guarda `localStorage.super_admin` y redirige a `/super-admin`.

Desde esa pantalla se consume:

```text
GET /super-admin/tenants
PATCH /super-admin/tenants/{tenant_id}/estado
GET /super-admin/tenants/{tenant_id}/estado-auditoria
```

El cambio de estado pide motivo/confirmacion. Para `suspendido` y `cancelado`
el motivo es obligatorio. La pantalla tambien permite consultar historial por
tenant.

## Login con tenant bloqueado

`LoginForm.jsx` distingue:

- `401`: credenciales incorrectas o codigo de colegio invalido.
- `403`: colegio existente pero con servicio `suspendido` o `cancelado`.

Cuando backend responde `403`, el frontend muestra el mensaje especifico del
backend en lugar de "Credenciales incorrectas".

## Riesgos pendientes observados

- El fallback de API apunta a `http://localhost:8000`.
- Las rutas protegidas del frontend dependen de `localStorage`.
- El frontend aun puede contener archivos generados en `dist/` dentro del repo.
- Existen logs locales de Vite en la raiz del proyecto.
- La seguridad efectiva depende de que el backend valide cada endpoint.
