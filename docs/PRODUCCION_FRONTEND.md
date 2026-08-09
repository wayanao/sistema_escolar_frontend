# Produccion Frontend

Estado actual de preparacion para produccion del frontend.

Ultima revision documental: 2026-08-08.

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

## UX movil de admin e impresos

Ajustes activos en produccion:

- `NavAdminView` en movil no despliega todos los submenus al abrir. Los grupos se
  abren bajo demanda y sus subpestanas se diferencian visualmente de los enlaces
  principales.
- `BrandingAdmin` y `PlantillasAdmin` tienen controles mas compactos en
  pantallas estrechas para administrar identidad y plantillas de impresos.
- `DocumentoImprimible` soporta clases por documento para aplicar reglas
  especificas de pantalla sin cambiar la logica de impresion.
- Boletin, certificados y reportes de cartera usan ancho A4 con scroll lateral
  en movil para evitar recortes visuales.
- El toolbar de documentos imprimibles muestra `Descargar PDF` e `Imprimir`.
  Ambos dependen del dialogo nativo del navegador.
- Los botones `Atras` de boletin y certificados estan arriba a la izquierda
  para no superponerse con el toolbar inferior de descarga/impresion.
- El observador de estudiante en `/admin/estudiantes` se presenta en tarjetas
  con chips de contexto y secciones separadas para conductual, cognitivo y
  lenguaje.

Prueba manual recomendada antes de liberar:

- En movil, entrar como admin y abrir el menu principal.
- Abrir grupos de `NavAdminView` y confirmar que los subenlaces no se confunden con
  enlaces principales.
- Generar boletin, certificado de notas, certificado de matricula y estado de
  cuenta de cartera; confirmar scroll lateral y que el boton `Atras` no tape
  `Descargar PDF`.
- Abrir detalle de estudiante en `/admin/estudiantes` y revisar que el
  observador no se vea corrido ni superpuesto.
- Repetir una revision rapida en escritorio para confirmar que la vista amplia
  se conserva.

## UX movil del perfil profesor

Ajustes activos en produccion:

- `Planilla.jsx` usa tarjetas por estudiante en movil para facilitar captura de
  notas desde celular; escritorio conserva tabla tradicional.
- Los promedios de planilla se pintan verde desde `3.0` y rojo por debajo de
  `3.0` tanto en movil como en escritorio.
- La planilla oculta columnas tecnicas como `mas_alto`, formatea etiquetas y
  marca textos sensibles con `translate="no"` para evitar traducciones
  automaticas del navegador.
- La captura numerica de planilla normaliza coma decimal de teclado movil a
  punto antes de calcular/enviar.
- `IngresoBoletinProfesor.jsx` oculta notas tecnicas y protege los tipos de
  nota con `translate="no"` para evitar nombres raros o traducidos en Android.
- `Asistencia.jsx` muestra carga/reintento del historial de inasistencias y
  avisa cuando la asistencia de la fecha ya fue tomada.
- `Observaciones.jsx` evita que el badge inicial quede indefinidamente en
  `Verificando` cuando la consulta se cuelga en movil.

Prueba manual recomendada antes de liberar:

- En Android real, entrar como profesor a `Planilla`, editar una nota y revisar
  que color/promedio se comporten correctamente tras guardar.
- En `Ingreso de Boletín Final`, confirmar que no aparezca `mas_alto` ni tipos
  de nota traducidos por el navegador.
- En `Asistencia`, confirmar que el historial muestre carga o reintento si
  tarda, y que aparezca `Asistencia del día ya tomada` cuando ya exista registro.
- En `Observaciones`, confirmar que el badge pase de `Verificando` a
  `Pendiente` o `Guardado`.
- Repetir una revision breve en PC para confirmar que tabla y layouts amplios se
  mantienen.

## Performance del dashboard profesor

`src/pages/DashboardProfesor.jsx` fue ajustado para mejorar el tiempo percibido
de carga:

- `GET /mis-clases/{profesor_id}` se ejecuta una sola vez.
- La respuesta de clases se reutiliza para el selector de salon y para el
  horario semanal.
- La pantalla principal ya no queda bloqueada por un loader global; cada tarjeta
  muestra su propio estado de carga.
- Inasistencias y rendimiento cargan como secciones independientes.
- `notas-bajas` y `notas-altas` se consultan en paralelo al seleccionar curso.

Prueba manual recomendada:

- Entrar como profesor despues de login.
- Confirmar que el layout del dashboard aparece aunque alguna tarjeta diga
  `Cargando...`.
- Revisar DevTools Network y confirmar una sola llamada a
  `/mis-clases/{profesor_id}` desde el dashboard.
- Cambiar curso/materia en el filtro de rendimiento y confirmar que se
  actualizan notas bajas y altas.

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

El layout autenticado compone:

- `src/hooks/autenticacion/useEstadoTenant.js`
- `src/components/autenticacion/TenantStatusBannerView.jsx`

La consulta usa `src/services/autenticacionApi.js`:

```text
GET /tenant/status
```

Si el backend responde `mostrar_aviso = true`, muestra un banner superior para
tenants en estado `en_mora`. La autorizacion y bloqueo real de tenants
`suspendido` o `cancelado` depende del backend.

## Super admin

La ruta `/super-admin` monta:

- `src/components/autenticacion/NavSuperAdminView.jsx`
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

`useComandoLogin`, presentado por `LoginFormView`, distingue:

- `401`: credenciales incorrectas o codigo de colegio invalido.
- `403`: colegio existente pero con servicio `suspendido` o `cancelado`.

Cuando backend responde `403`, el frontend muestra el mensaje especifico del
backend en lugar de "Credenciales incorrectas".

## Riesgos pendientes observados

Actualizacion 2026-06-13:

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
- En hosting gratuito, Render puede dormir o responder lento; las pantallas
  deben mostrar estados de carga/reintento y el backend debe cerrar conexiones
  de base de datos correctamente.
- El comportamiento de cookies en movil depende de dominio, `SameSite`,
  `Secure`, CORS con credenciales y navegador. Para produccion estable, conviene
  evitar combinaciones cross-site fragiles entre frontend/backend.
