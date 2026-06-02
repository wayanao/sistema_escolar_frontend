# API Client

Estado actual del consumo de API desde el frontend.

## Cliente Axios principal

El cliente compartido esta en:

- `src/utils/api.js`

Configuracion actual:

- `baseURL`: `import.meta.env.VITE_API_URL || "http://localhost:8000"`.
- `withCredentials: true`.
- Header por defecto: `Content-Type: application/json`.

## Token

El interceptor de request busca token en cookie `token` usando `js-cookie`.

Si encuentra una cookie legible por JavaScript, agrega:

```text
Authorization: Bearer <token>
```

En produccion la cookie debe ser HttpOnly; en ese caso JavaScript no puede leerla
y la autenticacion viaja automaticamente por `withCredentials: true`.

## Tenant

El interceptor lee:

- `localStorage.tenant`

Si existe, agrega:

```text
X-Tenant-ID: <tenant>
```

## Manejo de 401

El interceptor de response hace limpieza cuando recibe `401` y la ruta actual no es `/login`:

- Elimina cookie `token`.
- Elimina `localStorage.super_admin`.
- Elimina `localStorage.usuario`.
- Elimina `localStorage.profesor`.
- Elimina `localStorage.tenant`.
- Redirige a `/login`.

## Login

`LoginForm.jsx` consume:

```text
POST /login
```

Envia:

- `email`
- `password`
- `codigo_colegio`

## Estado SaaS del tenant

`TenantStatusBanner.jsx` consume:

```text
GET /tenant/status
```

Uso:

- `activo`: no muestra aviso.
- `en_mora`: muestra banner de pago.
- `suspendido` y `cancelado`: el bloqueo real lo aplica el backend.

## Super admin

`SuperAdminDashboard.jsx` consume:

```text
GET /super-admin/tenants
POST /super-admin/tenants
PATCH /super-admin/tenants/{tenant_id}/estado
GET /super-admin/tenants/{tenant_id}/estado-auditoria
POST /auth/cambiar-password
```

Uso:

- listar colegios/tenants registrados en `public.colegios`;
- crear colegio con admin inicial y suscripcion;
- cambiar estado SaaS entre `activo`, `en_mora`, `suspendido` y `cancelado`.
- consultar historial de cambios de estado.

## Imagenes protegidas

`ImagenProtegida.jsx` usa el cliente `api` con:

```text
responseType: "blob"
```

Esto permite cargar imagenes que requieren credenciales/autorizacion.

## Servicio de impresion

`src/services/printingService.js` usa `api` para endpoints de:

- Branding.
- Logos.
- Plantillas.
- Activacion, duplicacion, actualizacion y eliminacion de plantillas.

Endpoints observados en ese servicio:

- `GET /branding`
- `PUT /branding`
- `POST /branding/logo`
- `DELETE /branding/logo`
- `GET /plantillas`
- `GET /plantillas/activa/{tipo}`
- `POST /plantillas/{plantillaId}/activar`
- `POST /plantillas/{plantillaId}/duplicar`
- `PUT /plantillas/{plantillaId}`
- `DELETE /plantillas/{plantillaId}`
- `POST /plantillas`

## Riesgos pendientes observados

Actualizacion 2026-06-01:

- `GET /super-admin/tenants` ahora diferencia:
  - `estado`: estado efectivo por fecha de pago/gracia;
  - `estado_manual`: estado administrativo guardado.
- `POST /auth/cambiar-password` se usa en primer ingreso del admin inicial.
- El cliente redirige a `/cambiar-password` mientras
  `usuario.debe_cambiar_password` sea `true`.

- `VITE_API_URL` cae a `http://localhost:8000` si no esta configurado.
- La autorizacion final debe estar siempre en backend, no solo en la UI.
