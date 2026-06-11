# API Client

Estado actual del consumo de API desde el frontend.

## Cliente Axios principal

El cliente compartido esta en:

- `src/utils/api.js`

Configuracion actual:

- `baseURL`: `API_BASE_URL` desde `src/config/env.js`.
- En desarrollo, si falta `VITE_API_URL`, usa `http://localhost:8000`.
- En produccion, `VITE_API_URL` debe estar configurado.
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

El frontend no envia un header de tenant propio.

La fuente de verdad del tenant es la cookie/token emitida por el backend. El
tenant puede conservarse dentro del objeto visual de sesion (`usuario`,
`profesor` o `super_admin`) solo como dato informativo para la UI, pero no se
usa para autorizar ni para seleccionar el schema desde el cliente.

## Manejo de 401

El interceptor de response hace limpieza cuando recibe `401` y la ruta actual no es `/login`:

- Elimina cookie `token`.
- Elimina `localStorage.super_admin`.
- Elimina `localStorage.usuario`.
- Elimina `localStorage.profesor`.
- Elimina `localStorage.tenant` solo como limpieza legacy si existia de
  sesiones anteriores.
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

## Estados de estudiantes, profesores, cursos, materias e inventario

`EstudiantesAdmin.jsx` consume:

```text
GET /estudiantes?estado=activo|retirado|egresado|inactivo|todos
PATCH /estudiantes/{estudiante_id}/estado
```

Uso:

- Por defecto muestra estudiantes `activo`.
- Permite filtrar `retirado`, `egresado`, `inactivo` o `todos`.
- El cambio de estado no borra el estudiante ni su historial.

`CrearProfesor.jsx` consume:

```text
GET /profesores?estado=activo|inactivo|todos
PATCH /profesores/{profesor_id}/estado
```

Uso:

- Por defecto muestra profesores `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra el profesor ni su historial.
- El backend bloquea login y nuevas asignaciones para profesores `inactivo`.

`CrearCurso.jsx` consume:

```text
GET /cursos?estado=activo|inactivo|todos
PATCH /cursos/{curso_id}/estado
```

Uso:

- Por defecto muestra cursos `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra el curso ni su historial.
- El backend bloquea nuevas asignaciones para cursos `inactivo`.

`CrearMateria.jsx` consume:

```text
GET /materias?estado=activo|inactivo|todos
PATCH /materias/{materia_id}/estado
```

Uso:

- Por defecto muestra materias `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra la materia ni su historial.
- El backend bloquea nuevas asignaciones para materias `inactivo`.

`InventarioAdmin.jsx` consume:

```text
GET /inventario?estado=activo|inactivo|todos
PATCH /inventario/{item_id}/estado
```

Uso:

- Por defecto muestra productos `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra el producto ni su historial de ventas.
- El backend bloquea ventas nuevas para productos `inactivo`.

`VentasAdmin.jsx` consume productos activos con:

```text
GET /inventario?estado=activo
```

## Tipos de pago

`AdministrarTiposPago.jsx` consume:

```text
GET /tipos-pagos/detallado
GET /tipos-pagos
POST /tipos-pagos
PUT /tipos-pagos/{tipo_pago_id}
GET /tipos-pagos/{tipo_pago_id}/detalle
PUT /tipos-pagos/{tipo_pago_id}/configuracion
PUT /tipos-pagos/{tipo_pago_id}/cursos
```

Uso:

- La pantalla permite crear y editar conceptos de cobro.
- Por defecto muestra solo conceptos activos.
- Permite filtrar conceptos `activos`, `inactivos` o `todos`.
- La accion de eliminar concepto no se muestra en el listado.
- Para retirar un concepto de la operacion diaria se usa el estado
  `activo/inactivo` desde su configuracion.
- Los conceptos se conservan para proteger trazabilidad de cartera, pagos e
  historiales financieros.
- La asignacion de cursos se administra aparte; quitar un curso de un concepto
  no elimina el concepto completo.
- Al desactivar un concepto, los cobros/deudas ya generados se conservan.
- Al reactivar un concepto, vuelve a usarse con su configuracion anterior y no
  se generan cobros retroactivos automaticamente.

`PagosAdmin.jsx` tambien consulta:

```text
GET /tipos-pagos
```

Uso:

- Solo conserva en memoria conceptos activos para nuevos pagos.
- Las deudas pendientes ya generadas siguen visibles desde el detalle del
  estudiante aunque el concepto original este inactivo.

## Reportes

`ReportesAdmin.jsx` consume:

```text
GET /reportes/general
GET /reportes/ingresos-mes/{mes}
GET /reportes/ingresos-rango?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
GET /reportes/egresos-rango?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
```

Uso:

- El panel muestra cards de ingresos, egresos y balance.
- El card de egresos consulta el detalle por rango desde
  `/reportes/egresos-rango`.
- La comparacion mensual usa `ingresos_mensuales` y `egresos_mensuales` de
  `/reportes/general`.
- El panel de detalle alterna entre tabla de ingresos y tabla de egresos.

## Certificados

`CertificadosAdmin.jsx` consume:

```text
GET /cursos
GET /estudiantes
GET /boletines/admin/generar/{estudiante_id}/{periodo}
```

Uso:

- La pantalla permite filtrar estudiantes por curso, estado, busqueda y periodo.
- El usuario puede generar un certificado por periodo individual o por todos los
  periodos academicos.
- El certificado de notas reutiliza el consolidado academico del boletin admin.
- Si la materia no trae definitiva directa, o recibe `0`, la pantalla intenta
  calcularla con las notas numericas mayores que `0` recibidas en `detalles`.
- La impresion usa `DocumentoImprimible` con la plantilla de
  `reporte_estudiante`, manteniendo branding, encabezado, firmas y pie de
  pagina del sistema de impresos existente.

## Egresos

`EgresosAdmin.jsx` consume:

```text
GET /api/egresos/?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD
POST /api/egresos/
PUT /api/egresos/{egreso_id}
```

Uso:

- La pantalla inicia filtrando el dia actual.
- El usuario puede buscar egresos por rango de fechas.
- Al crear egreso se envia concepto y categoria normalizados, monto numerico
  mayor que 0 y fecha del formulario o del dia actual.
- Al editar egreso se usa el mismo formulario y se envia el mismo payload por
  `PUT`.
- Antes de crear o actualizar, la pantalla pide confirmacion con el resumen del
  egreso.
- La accion `Editar` solo aparece para egresos con `origen = manual` y
  `editable = true`.
- Los egresos automaticos, como nomina, se muestran sin accion de edicion.
- La opcion de eliminar egreso no se muestra; el backend tambien bloquea el
  borrado fisico.

## Prestamos

`PrestamosAdmin.jsx` consume:

```text
GET /api/prestamos/
GET /api/prestamos/?profesor_id={profesor_id}
POST /api/prestamos/
PUT /api/prestamos/{prestamo_id}/estado
```

Uso:

- La pantalla permite filtrar el historial por profesor.
- Al crear prestamo se valida profesor y monto mayor que 0 antes de enviar.
- Antes de crear, la pantalla pide confirmacion e informa que el prestamo no se
  puede eliminar; solo saldar.
- La accion `Eliminar` no se muestra.
- La unica accion operativa sobre un prestamo pendiente es `Saldar`, que envia
  estado `Pagado`.

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

- Produccion depende de que `VITE_API_URL` este configurado en Vercel con la URL
  publica del backend.
- La autorizacion final debe estar siempre en backend, no solo en la UI.
