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

- `src/config/env.js`
- `src/utils/api.js`
- servicios que necesitan resolver URLs absolutas de archivos

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

## Sesion y tenant

El frontend conserva datos minimos de sesion visual en:

- `localStorage.usuario`
- `localStorage.profesor`
- `localStorage.super_admin`

La sesion real viaja en la cookie `token` emitida por el backend. En produccion
esa cookie debe ser HttpOnly, Secure y con SameSite adecuado para el dominio
real.

El frontend ya no guarda `tenant` como clave separada ni envia un header de
tenant. La fuente de verdad del tenant es el token/cookie validado por backend.
El tenant que aparece dentro del objeto de sesion local es informativo para la
UI.

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
POST /super-admin/tenants
PATCH /super-admin/tenants/{tenant_id}/estado
GET /super-admin/tenants/{tenant_id}/estado-auditoria
```

El cambio de estado pide motivo/confirmacion. Para `suspendido` y `cancelado`
el motivo es obligatorio. La pantalla tambien permite consultar historial por
tenant.

La pantalla tambien permite crear colegios. El formulario pide datos del
colegio, admin inicial, fecha de inicio, proximo pago y dias de gracia.

## Estados operativos de estudiantes, profesores, cursos, materias e inventario

`EstudiantesAdmin.jsx` muestra estudiantes activos por defecto y permite
filtrar por:

- `activo`
- `retirado`
- `egresado`
- `inactivo`
- `todos`

El cambio de estado se hace con:

```text
PATCH /estudiantes/{estudiante_id}/estado
```

`CrearProfesor.jsx` muestra profesores activos por defecto y permite filtrar
por:

- `activo`
- `inactivo`
- `todos`

El cambio de estado se hace con:

```text
PATCH /profesores/{profesor_id}/estado
```

`CrearCurso.jsx` muestra cursos activos por defecto y permite filtrar por:

- `activo`
- `inactivo`
- `todos`

El cambio de estado se hace con:

```text
PATCH /cursos/{curso_id}/estado
```

`CrearMateria.jsx` muestra materias activas por defecto y permite filtrar por:

- `activo`
- `inactivo`
- `todos`

El cambio de estado se hace con:

```text
PATCH /materias/{materia_id}/estado
```

`InventarioAdmin.jsx` muestra productos activos por defecto y permite filtrar
por:

- `activo`
- `inactivo`
- `todos`

El cambio de estado se hace con:

```text
PATCH /inventario/{item_id}/estado
```

`VentasAdmin.jsx` solo muestra productos activos con stock para cargos nuevos.

El frontend no debe tratar estos cambios como borrado. El historial y la
seguridad final dependen del backend.

## Login con tenant bloqueado

`LoginForm.jsx` distingue:

- `401`: credenciales incorrectas o codigo de colegio invalido.
- `403`: colegio existente pero con servicio `suspendido` o `cancelado`.

Cuando backend responde `403`, el frontend muestra el mensaje especifico del
backend en lugar de "Credenciales incorrectas".

## Riesgos pendientes observados

Actualizacion 2026-06-10:

- El login recibe `debe_cambiar_password` desde backend.
- Si es `true`, redirige a `/cambiar-password`.
- El admin no puede usar rutas normales hasta cambiar la password temporal.
- El panel de super admin muestra estado efectivo y estado manual cuando son
  distintos.
- Crear colegio valida password temporal fuerte antes de llamar API.
- El frontend no envia `X-Tenant-ID`; el tenant lo define backend desde la
  cookie/token.

- El fallback a `http://localhost:8000` solo debe usarse en desarrollo local.
- En Vercel, `VITE_API_URL` debe apuntar a la URL publica del backend en Render.
- Las rutas protegidas del frontend dependen de `localStorage`.
- `dist/` y logs locales estan ignorados por `.gitignore`; no deben
  versionarse.
- La seguridad efectiva depende de que el backend valide cada endpoint.
