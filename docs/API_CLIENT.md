# API Client

Estado actual del consumo de API desde el frontend.

Ultima revision documental: 2026-07-16.

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
GET /estudiantes
GET /estudiantes?estado=activo|retirado|egresado|inactivo|todos
POST /estudiantes
GET /estudiantes/{estudiante_id}
PUT /estudiantes/{estudiante_id}
GET /estudiantes/{estudiante_id}/detalles
GET /estudiantes/{estudiante_id}/deudas
PATCH /estudiantes/{estudiante_id}/estado
```

Uso:

- Por defecto muestra estudiantes `activo`.
- Permite filtrar `retirado`, `egresado`, `inactivo` o `todos`.
- El cambio de estado no borra el estudiante ni su historial.
- El resumen del estudiante combina el detalle amplio con
  `/estudiantes/{estudiante_id}/deudas` para que el estado financiero no
  dependa de notas, observaciones o inventario.

`CrearProfesor.jsx` consume:

```text
GET /profesores
GET /profesores?estado=activo|inactivo|todos
POST /profesores
PUT /profesores/{profesor_id}
PATCH /profesores/{profesor_id}/estado
```

Uso:

- Por defecto muestra profesores `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra el profesor ni su historial.
- El backend bloquea login y nuevas asignaciones para profesores `inactivo`.

`CrearCurso.jsx` consume:

```text
GET /cursos
GET /cursos?estado=activo|inactivo|todos
POST /cursos
PUT /cursos/{curso_id}
PATCH /cursos/{curso_id}/estado
```

Uso:

- Por defecto muestra cursos `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra el curso ni su historial.
- El backend bloquea nuevas asignaciones para cursos `inactivo`.

`CrearMateria.jsx` consume:

```text
GET /materias
GET /materias?estado=activo|inactivo|todos
POST /materia
PUT /materias/{materia_id}
PATCH /materias/{materia_id}/estado
```

Uso:

- Por defecto muestra materias `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra la materia ni su historial.
- El backend bloquea nuevas asignaciones para materias `inactivo`.

`OrdenBoletin.jsx` consume:

```text
GET /cursos
GET /cursos/{curso_id}/orden-boletin
PUT /cursos/{curso_id}/orden-boletin
```

Payload de guardado:

```json
{
  "materias": [
    { "materia_id": 10 },
    { "materia_id": 12 }
  ]
}
```

Uso:

- Permite ordenar las materias del boletin por curso desde Administracion.
- El orden de la lista define la posicion de impresion.
- El backend aplica la misma posicion a todos los horarios activos de esa
  materia en el curso para no partir el historial academico.

`InventarioAdmin.jsx` consume:

```text
GET /inventario?estado=activo|inactivo|todos
POST /inventario
PUT /inventario/{item_id}
PATCH /inventario/{item_id}/estado
```

Uso:

- Por defecto muestra productos `activo`.
- Permite filtrar `inactivo` o `todos`.
- El cambio de estado no borra el producto ni su historial de ventas.
- El backend bloquea ventas nuevas para productos `inactivo`.

`VentasAdmin.jsx` consume:

```text
GET /api/ventas/
GET /inventario?estado=activo
GET /estudiantes
POST /api/ventas/
POST /api/ventas/{venta_id}/anular
```

Uso:

- Lista ventas recientes y permite registrar cargos de inventario.
- Solo muestra productos activos para nuevas ventas.
- La anulacion conserva trazabilidad y el backend revierte stock/pagos cuando
  aplica.

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
GET /estudiantes
GET /pagos/{estudiante_id}
GET /estudiantes/{estudiante_id}/deudas
GET /api/ventas/pendientes/{estudiante_id}
GET /estudiantes/{estudiante_id}/valores-pago-personalizados
PUT /estudiantes/{estudiante_id}/valores-pago-personalizados/{tipo_pago_id}
DELETE /estudiantes/{estudiante_id}/valores-pago-personalizados/{tipo_pago_id}
GET /tipos-pagos
POST /pagos
GET /pagos/vencidos/opciones/{estudiante_id}
GET /pagos/adelanto/opciones/{estudiante_id}
POST /pagos/adelanto
POST /pagos/{pago_id}/anular
```

Uso:

- Carga deudas academicas pendientes del estudiante desde un endpoint dedicado
  para registrar pagos, sin depender del resumen amplio
  `/estudiantes/{estudiante_id}/detalles`.
- Solo conserva en memoria conceptos activos para nuevos pagos.
- Las deudas pendientes ya generadas siguen visibles desde el detalle del
  estudiante aunque el concepto original este inactivo.
- Permite ajustar un valor personalizado por estudiante y concepto sin cambiar
  el valor base del curso ni del tipo de pago.
- Las ventas pendientes pueden asociarse al registrar pagos.
- El modo `Pago pendiente` conserva `POST /pagos` y su validacion contra la
  deuda actual.
- Para conceptos mensuales, `GET /pagos/vencidos/opciones/{estudiante_id}`
  devuelve los saldos por mes. El cliente preselecciona el mas antiguo y puede
  enviar una o varias `aplicaciones` dentro de `POST /pagos`.
- Si se elige `Abono libre`, el cliente omite `aplicaciones` y conserva el
  comportamiento anterior.
- `GET /pagos/adelanto/opciones/{estudiante_id}` devuelve conceptos mensuales,
  valor unitario y meses futuros disponibles del año lectivo actual.
- `POST /pagos/adelanto` recibe `tipo_pago_id`, `cantidad_meses`, `fecha` y los
  metodos de pago. El total se calcula y valida nuevamente en backend.
- Como alternativa a `cantidad_meses`, envia `monto_distribuir` para subsidios
  o valores no divisibles exactamente por la mensualidad.
- La respuesta de opciones incluye el saldo futuro por periodo. La interfaz
  muestra cuantos meses quedan completos, el abono parcial final y cualquier
  monto que no pueda asignarse dentro del año.
- Los adelantos no se mezclan con cargos de inventario ni conceptos unicos.
- La anulacion de pagos pide motivo y depende del endpoint auditado del backend.

## Cartera vencida

`AdminDashboard.jsx` y `CarteraVencidaAdmin.jsx` consumen:

```text
GET /cartera/mora/resumen
GET /cartera/mora
```

Uso:

- El dashboard admin muestra una tarjeta resumida de cartera vencida.
- La pantalla de cartera vencida carga KPIs, filtros y reportes imprimibles por
  estudiante o curso.
- La informacion respeta la regla central de cobros del backend, incluyendo
  valores personalizados por estudiante cuando existan.

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
- El detalle de ingresos permite filtrar por efectivo, transferencia, tarjeta
  o subsidio. Las referencias libres de subsidios se conservan en la etiqueta
  visible y tambien se reconocen en pagos mixtos.

## Modulos del perfil profesor

### Dashboard profesor

`DashboardProfesor.jsx` consume:

```text
GET /mis-clases/{profesor_id}
GET /dashboard/inasistencias/{profesor_id}
GET /dashboard/cumpleanos/profesor/{profesor_id}?dias=7
GET /dashboard/notas-bajas/{profesor_id}?curso_id={curso_id}&asignacion_id={asignacion_id}
GET /dashboard/notas-altas/{profesor_id}?curso_id={curso_id}&asignacion_id={asignacion_id}
```

Uso:

- `GET /mis-clases/{profesor_id}` se consulta una sola vez y alimenta selector
  de clases y horario.
- Cada clase incluye `jornada`, tomada del curso. El dashboard la usa para
  separar el horario en mañana y tarde y para diferenciar cursos homonimos.
- Inasistencias y rendimiento cargan como secciones independientes para no
  bloquear el layout inicial.
- Cumpleanos carga estudiantes activos de los cursos asignados al profesor.
- Notas bajas y altas se consultan en paralelo cuando hay curso seleccionado.
- `asignacion_id` se envia solo si el filtro de materia no esta en `todas`.

### Planilla de notas

`Planilla.jsx` consume:

```text
GET /mis-clases/{profesor_id}
GET /planilla-excel/{asignacion_id}/{periodo}
POST /planilla/nota
DELETE /planilla/tipo?asignacion_id={id}&descripcion={tipo}&periodo={periodo}
```

Uso:

- Carga estudiantes, columnas, notas y promedio desde
  `/planilla-excel/{asignacion_id}/{periodo}`.
- Oculta columnas tecnicas como `mas_alto`.
- Formatea etiquetas tecnicas para que no aparezcan con guiones bajos.
- Marca textos de nombres, tipos de nota e inputs con `translate="no"` para
  evitar traducciones automaticas del navegador.
- En movil renderiza tarjetas por estudiante; en escritorio conserva tabla.
- Las notas numericas se validan entre `1` y `5`; la captura movil normaliza
  coma decimal a punto antes de enviar.
- El promedio se pinta verde desde `3.0` y rojo por debajo de `3.0`.

### Asistencia

`Asistencia.jsx` consume:

```text
GET /mis-clases/{profesor_id}
GET /planilla-excel/{asignacion_id}/{periodo}
GET /asistencia/historial/{asignacion_id}/{periodo}
POST /asistencia
```

Uso:

- Carga estudiantes usando la misma referencia de planilla.
- Carga historial de asistencia por asignacion y periodo.
- Muestra estado visual mientras carga historial de inasistencias.
- Si existe asistencia guardada para la fecha seleccionada, precarga estados y
  muestra aviso `Asistencia del día ya tomada`.
- La fecha no se modifica en esta pagina: se conserva desde el dashboard en
  `localStorage.fechaAsistencia`.
- El mismo `POST /asistencia` crea o actualiza el registro completo de los
  estudiantes activos; la UI permite marcar todos presentes, corregir ausentes
  y editar una asistencia previamente guardada.
- El guardado solo se habilita cuando todos tienen estado y existen cambios.
- Antes del `POST`, un modal confirma el total de presentes y ausentes; durante
  la peticion evita cierres accidentales y luego informa exito o error.
- Si el historial falla, muestra mensaje y permite `Reintentar`.

### Observador del estudiante

`Formulario.jsx` y `Observaciones.jsx` consumen:

```text
GET /planilla/{asignacion_id}
GET /observaciones/{estudiante_id}/{asignacion_id}/{periodo}
POST /observaciones
```

Uso:

- `Formulario.jsx` lista estudiantes de la asignacion seleccionada.
- `Observaciones.jsx` carga/guarda dimensiones conductual, cognitiva y lenguaje.
- `POST /observaciones` permite una o varias dimensiones; exige que al menos
  una tenga contenido y envia las restantes como texto vacio.
- La verificacion inicial del estado tiene cancelacion con tiempo limite para
  no dejar el badge en `Verificando` indefinidamente en movil.
- El estado visible puede ser `Verificando`, `Pendiente`, `Guardado` o
  `Cambios sin guardar`.
- Durante el guardado, el boton muestra spinner y el resultado se confirma con
  un modal de SweetAlert2.

### Plan de clases

`PlanDeClases.jsx` consume:

```text
GET /plan-de-clases/{asignacion_id}?fecha=YYYY-MM-DD
GET /plan-de-clases/{asignacion_id}?limit=4&offset=N
POST /plan-de-clases
```

Uso:

- La consulta con `fecha` carga únicamente el plan abierto en la guía.
- El historial solicita cuatro elementos ordenados por fecha, muestra tres y
  usa el cuarto para habilitar la navegación hacia planes más antiguos.
- `offset` avanza en bloques de tres; cambiar solo la fecha del formulario no
  repite la consulta del historial.
- `POST /plan-de-clases` envía `version_esperada` dentro del multipart: `0`
  para crear el plan de la fecha o el valor de `version_revision` recibido al
  abrir un plan existente.
- Si la versión cambió en otra pestaña o dispositivo, recibe `409` con
  `detail.mensaje` y `detail.version_actual`. La interfaz no reemplaza los
  cambios locales hasta que el profesor confirma que desea cargar la versión
  reciente.

### Malla Curricular

`PlaneadorAnual.jsx` consume:

```text
GET /planeador-anual/{asignacion_id}/{periodo}
PUT /planeador-anual/{asignacion_id}/{periodo}
```

Uso:

- Cada fila puede contener uno o varios de los campos `unidad_tematica`,
  `estandar_competencia`, `contenido` y `actividades_recursos`.
- Toda fila con contenido exige `fecha` como fecha limite; una fecha aislada
  sin contenido tampoco se envia.
- Las filas vacias se normalizan con textos vacios y `fecha: null`.
- Los registros recibidos se ubican mediante `slot`, manteniendo su posicion
  cuando existen filas intermedias vacias.
- Al guardar se recarga lo persistido, el boton muestra spinner y SweetAlert2
  informa validaciones, exito o error.

### Ingreso de boletin final

`IngresoBoletinProfesor.jsx` consume:

```text
GET /mis-clases/{profesor_id}
GET /boletines/referencia/{asignacion_id}/{periodo}
POST /boletines/guardar
```

Uso:

- Carga notas de referencia de la planilla para que el profesor escriba
  observaciones del boletin.
- Oculta notas tecnicas como `mas_alto`.
- Muestra tipos de nota con etiquetas humanas y `translate="no"` para evitar
  traduccion automatica en Android/Chrome.
- Guarda resumen del boletin por estudiante.

## Certificados

`CertificadosAdmin.jsx` consume:

```text
GET /cursos
GET /estudiantes
GET /materias
GET /boletines/admin/generar/{estudiante_id}/{periodo}
GET /asistencia/historial/{asignacion_id}/{periodo}
```

Uso:

- La pantalla permite filtrar estudiantes por curso, estado, busqueda y periodo.
- El usuario puede generar un certificado por periodo individual o por todos los
  periodos academicos.
- Tambien permite generar un reporte academico parcial informativo por curso o
  por estudiante, filtrado por periodo y por una materia especifica o todas las
  materias.
- El certificado de notas reutiliza el consolidado academico del boletin admin.
- Si la materia no trae definitiva directa, o recibe `0`, la pantalla intenta
  calcularla con las notas numericas mayores que `0` recibidas en `detalles`.
- El reporte academico parcial reutiliza el consolidado de boletin admin para
  notas actuales y consulta asistencia por `asignacion_id` para mostrar
  inasistencias del periodo en las materias incluidas.
- No cierra periodo ni reemplaza boletin/certificado final; es una foto
  informativa con los datos registrados hasta el momento.
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

Notas frontend sin cambio de API:

- `DocumentoImprimible` consume la configuracion de branding/plantilla y
  despues aplica comportamiento visual segun clase de documento.
- `codigo_dane` se guarda desde Diseño de impresos > Identidad institucional y
  se muestra en el encabezado comun de los impresos cuando existe.
- Boletin, certificados y cartera no requieren endpoints nuevos para el ajuste
  movil; solo agregan scroll lateral en pantalla cuando el documento conserva
  ancho A4.
- `Descargar PDF` e `Imprimir` usan `window.print()`. La generacion/guardado
  del PDF depende del navegador del usuario.

## Riesgos pendientes observados

Actualizacion 2026-06-13:

- `GET /super-admin/tenants` ahora diferencia:
  - `estado`: estado efectivo por fecha de pago/gracia;
  - `estado_manual`: estado administrativo guardado.
- `POST /auth/cambiar-password` se usa en primer ingreso del admin inicial.
- El cliente redirige a `/cambiar-password` mientras
  `usuario.debe_cambiar_password` sea `true`.

- Produccion depende de que `VITE_API_URL` este configurado en Vercel con la URL
  publica del backend.
- La autorizacion final debe estar siempre en backend, no solo en la UI.
- Los modulos del profesor dependen de `asignacionId`, `periodo` y
  `fechaAsistencia` guardados como seleccion de trabajo en `localStorage`.
- Si el backend responde lento en hosting gratuito, las pantallas deben mostrar
  estados de carga o reintento para no parecer vacias.
