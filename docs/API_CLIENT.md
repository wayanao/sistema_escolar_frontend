# API Client

Estado actual del consumo de API desde el frontend.

Ultima revision documental: 2026-10-07.

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

`services/autenticacionApi.js` encapsula:

```text
POST /login
```

`useComandoLogin`, compuesto por `pages/Login.jsx`, construye y envia:

- `email`
- `password`
- `codigo_colegio`

## Estado SaaS del tenant

`services/autenticacionApi.js` encapsula:

```text
GET /tenant/status
```

`useEstadoTenant` coordina la consulta y `TenantStatusBannerView` presenta:

- `activo`: no muestra aviso.
- `en_mora`: muestra banner de pago.
- `suspendido` y `cancelado`: el bloqueo real lo aplica el backend.

## Años lectivos

`services/aniosLectivosApi.js` encapsula:

```text
GET /anios-lectivos
POST /anios-lectivos
POST /anios-lectivos/{anio_lectivo_id}/copiar-configuracion
GET /anios-lectivos/{anio_lectivo_id}/matriculas/candidatos?curso_origen_id={curso_id}
POST /anios-lectivos/{anio_lectivo_id}/matriculas/promocion
POST /anios-lectivos/{anio_lectivo_id}/estudiantes
GET /anios-lectivos/{anio_lectivo_id}/resumen
PUT /anios-lectivos/{anio_lectivo_id}/matriculas/salida
GET /anios-lectivos/{anio_lectivo_id}/activacion/vista-previa
POST /anios-lectivos/{anio_lectivo_id}/activar
```

- Responde `[{ id, anio, estado }]`, el más reciente primero. El admin recibe
  todos los años; el profesor, solo el activo.
- `AnioLectivoProvider`, que envuelve solo el layout del admin, la pide una
  vez cada vez que se abre o recarga la aplicación (no al cambiar de
  pantalla). Desde el paso 5.7 también puede volver a pedirla después de crear
  el siguiente año y dejarlo seleccionado. El profesor no la hace. Si la
  carga inicial falla, todo sigue como antes.
- `POST /anios-lectivos` no recibe cuerpo: el servidor calcula exactamente
  `N+1`. La copia recibe las tres decisiones explícitas
  (`copiar_precios`, `copiar_carga_academica`, `copiar_directores`); cursos y
  conceptos de pago se copian siempre por regla del backend.
- Desde el paso 5.8, candidatos recibe el curso del año activo. Promoción
  recibe `curso_origen_id`, `curso_destino_id` y la lista exacta
  `estudiante_ids` que dejó marcada el admin. Los ya matriculados llegan
  identificados por el backend y quedan bloqueados en la pantalla.
- La respuesta de promoción incluye los valores especiales copiados. El
  frontend los muestra con la marca `Revisar`; no calcula valores ni decide
  qué se cobra. Si después falla la recarga del resumen, conserva el éxito de
  la promoción para no sugerir que debe repetirse.
- Desde el paso 6.6, cada candidato trae `estado_salida` y la pantalla de
  promoción guarda o quita la marca con
  `PUT /anios-lectivos/{id}/matriculas/salida` y
  `{ estudiante_ids: [id], estado_salida }`, donde `estado_salida` es
  `"retirado"`, `"egresado"` o `null`. Quien ya está matriculado en el año
  siguiente o marcado no se ofrece para matricular; el backend rechaza los dos
  casos de todos modos, y su mensaje se muestra tal cual.
- Desde el paso 6.7, la página de años lectivos pide la vista previa de
  activación del año en preparación y la vuelve a pedir después de marcar o
  matricular. Muestra los conteos y la lista `sin_decidir` agrupada por
  curso. El botón de activar depende de `puede_activar`, que decide el
  backend, y del año escrito; `POST .../activar` envía
  `{ confirmar_anio: <año escrito> }`. Si responde `409` con
  `detail.codigo === "activacion_con_pendientes"`, se muestran su `mensaje`
  y su `sin_decidir`; los demás errores llegan como texto. Después de activar,
  recarga los años dejando elegido el nuevo activo
  (`recargarAnios({ seleccionarId })`).
- El alta directa usa `POST /anios-lectivos/{id}/estudiantes` solo mirando un
  año en preparación. El resumen presenta literalmente los conteos y el total
  que devuelve el backend y no activa el año.
- En el paso 5.7, `POST /cursos` y `POST /tipos-pagos` suman
  `anio_lectivo_id` solo al crear mirando un año en `preparacion`. En el año
  activo conservan exactamente su cuerpo anterior, y las actualizaciones por
  id nunca reciben ese campo.
- Las lecturas que aceptan `?anio_lectivo_id=` lo reciben solo cuando el
  admin mira un año que no es el activo (`parametrosAnio` y
  `opcionesConAnio` en `utils/anioLectivo.js`); mirando el activo, cada
  petición queda idéntica a la de antes. Cada paso de la fase 4 conecta sus
  pantallas. Contrato completo del backend y plan en
  `docs/funcionalidades/ANIO_LECTIVO.md`.
- Desde el paso 4.2 (2026-10-03) lo mandan, mirando otro año:
  `GET /cursos` (Cursos y Orden boletín, con su `estado` en Cursos),
  `GET /cursos` y `GET /asignaciones/lista` de Asignaciones,
  `GET /profesores/{id}/disponibilidad` (junto a `dia` y
  `excluir_asignacion_id`) y `GET /hora/horarios-admin`. Profesores y
  materias no tienen año. El orden de un curso
  (`GET /cursos/{id}/orden-boletin`) parte de su id y no lo lleva.
- Desde el paso 4.3 (2026-10-03), también: `GET /tipos-pagos/detallado`,
  `GET /tipos-pagos` (la lista de respaldo) y `GET /cursos` de Tipos de pago,
  y `GET /cartera/mora/resumen` y `GET /cartera/mora` de Cartera vencida. El
  detalle de un concepto y lo que se guarda parten de su id y no lo llevan.
  El resumen de cartera del inicio del admin sigue siempre con el año activo.
- Desde el paso 4.4 (2026-10-05), también Estudiantes: `GET /estudiantes`
  (junto a su `estado`), `GET /cursos`, `GET /estudiantes/{id}/detalles`,
  `GET /estudiantes/{id}/deudas` y `GET /observador/{id}` de la ficha (junto
  al `periodo`). El observador del profesor no lo manda nunca. Pagos usa su
  propia consulta de deudas; desde el paso 5.9 tiene su selector local.
- Desde el paso 4.5 (2026-10-05), también Boletines y Certificados:
  `GET /cursos`, `GET /estudiantes`,
  `GET /boletines/admin/generar/{estudiante}/{periodo}` y
  `GET /boletines/admin/reporte-parcial/{estudiante}/{periodo}`. Las materias
  (`GET /materias`) y el historial de asistencia (parte de una clase) van sin
  año, como el ingreso de boletines del profesor.
- Desde el paso 4.6 (2026-10-05), también Listas de seguimiento
  (`GET /cursos` y la escritura
  `POST /listas-seguimiento/columnas-en-todos-los-cursos`, que sin año crea
  en los cursos del año activo) y la bandeja de planes del admin
  (`GET /admin/plan-de-clases`, junto a sus filtros, en la bandeja y en sus
  dos contadores). La lista de un curso, sus columnas y marcas, y el detalle,
  la revisión y las evidencias de un plan parten de un id y no lo llevan.

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
POST /anios-lectivos/{anio_lectivo_id}/estudiantes
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
- Año lectivo (paso 4.4, 2026-10-05): mirando un año que no es el activo, la
  lista son los matriculados de ese año con su curso de ese año, y la ficha
  (resumen, deudas y observador) es la de ese año (`?anio_lectivo_id=`). La
  pantalla queda en solo consulta salvo el alta descrita a continuación,
  porque los datos personales y el estado global de un estudiante no son de
  un año.
- Año lectivo (paso 5.8, 2026-10-07): mirando un año en `preparacion`, se
  puede crear un estudiante nuevo y matricularlo directamente allí. Usa el
  endpoint específico del año y sus cursos. Editar y cambiar estado siguen
  prohibidos. Mirando el activo conserva el `POST /estudiantes` anterior.

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
- Al renombrar, la primera petición conserva el cuerpo normal. Si el backend
  responde `409` con `detail.codigo = "materia_usada_en_otro_anio"`, la UI
  muestra `detail.mensaje` y deja elegir entre crear otra materia o reenviar el
  mismo `PUT` con `confirmar_cambio_nombre: true`. El frontend no deduce en qué
  años se usa la materia.

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
- La configuracion avanzada de un concepto mensual incluye `mes_inicial`,
  `mes_final` y `frecuencia_meses`. `mes_final` acepta enteros de `1` a `12`,
  usa diciembre (`12`) como valor compatible y no puede ser anterior a
  `mes_inicial` cuando ambos estan definidos.
- El cliente conserva la estructura completa del `PUT`:

  ```json
  {
    "descripcion": "Pensión ordinaria",
    "tipo_cobro": "mensual",
    "fecha_limite": null,
    "dia_limite_mes": 5,
    "dias_gracia": 0,
    "mora_tipo": "porcentaje",
    "mora_valor": 0,
    "mes_inicial": 2,
    "mes_final": 11,
    "frecuencia_meses": 1,
    "generacion_automatica": false,
    "activo": true
  }
  ```

  Agregar `mes_final` no renombra ni elimina ningun parametro anterior.
- `GET /tipos-pagos/detallado` y `GET /tipos-pagos/{tipo_pago_id}/detalle`
  devuelven `mes_final`; `PUT /tipos-pagos/{tipo_pago_id}/configuracion` lo
  envia junto con el resto de la configuracion financiera. Un backend anterior
  que no exponga el campo se representa en el cliente como diciembre.
- El campo define el ultimo periodo cobrable, no una fecha de vencimiento. Para
  un calendario febrero-noviembre se guardan `mes_inicial: 2`, `mes_final: 11`
  y `frecuencia_meses: 1`.
- Año lectivo (paso 4.3, 2026-10-03): mirando un año que no es el activo, los
  conceptos y los cursos para los precios son los de ese año
  (`?anio_lectivo_id=`). Desde el paso 5.7 se puede crear un concepto en
  preparación enviando ese `anio_lectivo_id`; también se editan los
  existentes. En un año cerrado queda solo consulta. Lo garantiza el backend
  con su `409`.

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
  muestra cuantos meses quedan completos, el saldo pendiente final y cualquier
  monto que no pueda asignarse dentro del año.
- Tanto las cuotas vencidas como las opciones futuras terminan en el
  `mes_final` configurado para el concepto. Para compatibilidad visual, el
  cliente normaliza a diciembre un `mes_final` omitido o invalido; los periodos
  cobrables siguen siendo exclusivamente los que calcula y valida el backend.
- Los adelantos no se mezclan con cargos de inventario ni conceptos unicos.
- La anulacion de pagos pide motivo y depende del endpoint auditado del backend.
- Año lectivo (paso 5.9, 2026-10-07): Pagos inicia en el año activo y solo al
  elegir otro añade `?anio_lectivo_id=` a tipos de pago, deudas, cuotas
  vencidas, adelantos y valores personalizados. `POST /pagos` y
  `POST /pagos/adelanto` agregan `anio_lectivo_id` al cuerpo en ese mismo caso.
  Historial y ventas conservan sus peticiones anteriores; las ventas no se
  ofrecen en el formulario de otro año. La deuda anterior viene en
  `deuda_anios_anteriores` y se muestra aparte, sin recalcularla ni sumarla a
  la deuda consultada.

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
- Año lectivo (paso 4.3, 2026-10-03): `CarteraVencidaAdmin.jsx` pide la
  cartera del año que mira el admin (`?anio_lectivo_id=` solo mirando otro
  año). Mirando otro año, el backend trae también a los retirados que deben y
  no trae ventas; "Actualizar" vuelve a pedir las dos lecturas en vez de
  recargar la página. Desde el paso 5.9, `deuda_anios_anteriores` y
  `total_anios_anteriores` se muestran separados del total del año consultado,
  y "Cobrar" abre Pagos conservando ese año. El dashboard pide siempre el año
  activo.

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

## Listas de seguimiento

`ListasSeguimientoAdmin.jsx` consume, a traves de
`src/services/listasSeguimientoApi.js`:

```text
GET    /cursos
GET    /listas-seguimiento/{cursoId}
POST   /listas-seguimiento/{cursoId}/columnas
DELETE /listas-seguimiento/{cursoId}/columnas/{columnaId}
POST   /listas-seguimiento/{cursoId}/marcas
POST   /listas-seguimiento/columnas-en-todos-los-cursos
```

Uso:

- El modulo pide su propio `GET /cursos` y arma su propio selector, como ya
  hacen Boletin y Tipos de Pago.
- `GET /listas-seguimiento/{cursoId}` trae columnas, alumnos y marcas en **una
  sola respuesta**, para pintar la pantalla con una peticion. Una celda sin
  fila no viaja: el default (`marcado: false`, `nota: ""`) lo pone
  `obtenerMarcaCelda` en el cliente, igual que ya se hace con las notas
  ausentes de la planilla.
- El cuerpo de `POST .../marcas` es una lista pelada, el mismo formato que
  `POST /asistencia`. Lo arma `construirPayloadMarcas`.

Tres cosas del contrato que conviene no perder de vista:

- **El lote no puede llevar la misma celda dos veces.** El backend lo rechaza
  entero con 422, porque escribe todo en una sentencia y PostgreSQL la aborta.
  Por eso los cambios pendientes se guardan indexados por celda
  (`claveCelda`), no en un array: asi mandar un duplicado es imposible, no
  solo improbable.
- **El 409 de nombre repetido hay que tratarlo siempre**, aunque el chequeo
  local diga que el nombre esta libre: entre una cosa y otra otra pestaña
  puede haberlo creado. `normalizarNombreColumna` replica la regla del indice
  unico del backend -recorta, colapsa espacios interiores y sube a
  mayusculas-, pero la verdad la tiene el servidor.
- El limite de la nota son **240 caracteres** y el del nombre de columna
  **100**. Los dos estan tambien en el backend; en el cliente se usan como
  `maxLength`, para avisar antes de gastar una peticion.

`POST /listas-seguimiento/columnas-en-todos-los-cursos` es el alta masiva, sin
`cursoId` porque no actua sobre un curso. Lo llama
`crearColumnaEnTodosLosCursos(nombre)` y devuelve `{creadas, omitidas, total}`.
Lo que hay que saber para consumirlo:

- **Con este endpoint el chequeo local de duplicado no aplica.** El hook valida
  contra una lista vacia a proposito: escribir un nombre que el curso actual ya
  tiene significa "creala en los demas". Las otras dos reglas -ni vacio ni
  demasiado largo- se siguen aplicando.
- **Responde 200 aunque no cree ninguna.** Pasa siempre que todos los cursos ya
  la tenian, y es el resultado normal de volver a pulsar. `mensajeAltaMasiva`
  tiene un texto propio para ese caso, porque un "0 columnas creadas"
  pareceria un error.
- **Despues hay que recargar la lista**, no agregar a la grilla a mano como en
  el alta suelta: la respuesta son conteos, no la columna de este curso.
- Su `409` no es "ya existe esa columna" sino la carrera entre dos peticiones
  simultaneas; el mensaje del backend invita a reintentar, y reintentar
  funciona. Desde el año lectivo, también puede ser el `409` de un año
  cerrado.
- **Año lectivo (paso 4.6, 2026-10-05):** sin `?anio_lectivo_id=`, el backend
  crea en los cursos del año activo. Mirando otro año, el cliente lo manda
  (`crearColumnaEnTodosLosCursos(nombre, { parametrosAnio })`); mirando el
  activo, la llamada es la de siempre. En un año cerrado la pantalla es de
  solo consulta y no ofrece crear.

Al abrir la vista previa de impresion, la pantalla consume ademas
`GET /branding` y la plantilla activa del tipo `reporte_estudiante`, a traves
de `DocumentoImprimible`. No son peticiones propias de este modulo: las hace
la capa de impresion compartida, con su propia cache, y son las mismas que ya
usan boletin, certificados y cartera.

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
GET /boletines/admin/reporte-parcial/{estudiante_id}/{periodo}
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
- El reporte academico parcial usa su endpoint propio para leer en tiempo real
  `notas_detalle`, incluyendo el nombre de cada evaluacion, su nota o
  valoracion y el promedio vigente. No espera el envio del boletin al admin.
- El reporte consulta además asistencia por `asignacion_id` para mostrar
  inasistencias del periodo en las materias incluidas.
- No cierra periodo ni reemplaza boletin/certificado final; es una foto
  informativa con los datos registrados hasta el momento.
- La impresion usa `DocumentoImprimible` con la plantilla de
  `reporte_estudiante`, manteniendo branding, encabezado, firmas y pie de
  pagina del sistema de impresos existente.
- Año lectivo (paso 4.5, 2026-10-05): mirando un año que no es el activo,
  cursos, estudiantes, certificado de notas y reporte parcial son de ese año
  (`?anio_lectivo_id=`); las materias y la asistencia van sin año.
- Ojo, hallazgo del 2026-10-05: `GET /estudiantes` va sin `estado`, y el
  backend responde entonces solo activos. El filtro de estado de la pantalla,
  salvo "Activos", sale siempre vacío, y no se puede generar el certificado de
  un retirado. Pregunta abierta en `docs/funcionalidades/ANIO_LECTIVO.md`.

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
