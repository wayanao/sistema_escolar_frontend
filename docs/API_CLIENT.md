# API Client

Estado actual del consumo de API desde el frontend.

Ultima revision documental: 2026-10-21.

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

Desde el 2026-10-30 la respuesta trae también `usa_entrevista_admision`
(si el colegio usa la entrevista de admisión). Lo lee
`hooks/admisiones/useUsoEntrevistaAdmision.js` (con
`leerUsoEntrevista`: sin el dato, `true`; si la consulta falla, también
`true`), y solo donde hace falta: Años lectivos y Admisiones con un año en
preparación, y Estudiantes mirando un año en preparación. Es una petición
más en esas pantallas; las demás no cambian.

- Con entrevista: todo como antes (tarjeta "Admisiones", aviso "Ir a
  admisiones" en Estudiantes).
- Sin entrevista: no se ve "Admisiones" ni se piden sus conteos; vuelve
  "Crear estudiante en {año}" (Años lectivos lleva a Estudiantes con ese año
  elegido, y allí "Nuevo Estudiante" guarda por
  `POST /anios-lectivos/{id}/estudiantes` con `crearEstudianteEnPreparacion`);
  la página de Admisiones muestra "Este colegio no usa la entrevista de
  admisión".
- Quien lo hace cumplir es el backend: registrar, editar, poner el resultado
  y matricular una admisión responden `403` en un colegio sin entrevista, y
  el alta directa sigue cerrada en uno con entrevista.

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
POST /anios-lectivos/{anio_lectivo_id}/reabrir
POST /anios-lectivos/{anio_lectivo_id}/cerrar
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
- Desde el 2026-10-30, junto con la vista previa pide `GET
  /estudiantes?estado=todos&anio_lectivo_id=<año en preparación>`
  (`listarEstudiantes` de `estudiantesObservadorApi.js`, que ahora acepta
  `signal`): los matriculados de ese año, cada uno con su curso de ese año.
  Se muestran agrupados por curso; de `sin_decidir` queda solo cuántos faltan
  en cada curso. Si cualquiera de las dos lecturas falla, se avisa como antes
  ("No se pudo cargar la vista previa de la activación.").
- Desde el paso 6.8, la sección "Años pasados" lista los años `cerrado` y
  `reabierto` de `GET /anios-lectivos`. Reabrir y volver a cerrar envían
  `{ confirmar_anio: <año escrito> }`; el backend compara el año y permite un
  solo año reabierto a la vez, y su mensaje se muestra tal cual. Después
  recarga los años conservando la selección (`recargarAnios()`).
- Desde el 2026-10-12, "Editar datos" en la sección de matricular usa las
  mismas llamadas que Estudiantes, por `services/estudiantesObservadorApi.js`:
  `GET /estudiantes/{id}` para cargar la ficha y `PUT /estudiantes/{id}` con
  la ficha completa, incluido su `curso_id` del año activo (el backend
  reemplaza todos los campos y rechaza con `409` un curso de otro año). Al
  guardar, vuelve a pedir los candidatos del curso y la vista previa de
  activación. No hay rutas nuevas.
- Desde el 2026-10-12, "Valores de pago" en la sección de matricular (solo
  para estudiantes ya matriculados en el año en preparación) lee
  `GET /estudiantes/{id}/valores-pago?anio_lectivo_id=` con
  `pagosApi.obtenerValoresPagoEstudiante`: cada concepto que se le cobra con
  `precio_curso`, `valor_personalizado`, `motivo` y `valor_a_pagar`, calculados
  por el backend. Guardar y quitar usan las mismas llamadas y el mismo cuerpo
  de Pagos (`PUT` con `{ valor, motivo, activo: true }` y `DELETE` de
  `/estudiantes/{id}/valores-pago-personalizados/{tipo_pago_id}`). Después de
  cada cambio vuelve a pedir esa lista y el resumen del año. El frontend no
  calcula precios.
- Hasta el 2026-10-13, Estudiantes usaba el alta directa
  (`POST /anios-lectivos/{id}/estudiantes`) mirando un año en preparación.
  Desde el paso E5 de la entrevista de admisión **ninguna pantalla la usa**:
  un estudiante nuevo del año en preparación entra por
  `POST /admisiones/{id}/matricular` (ver "Admisiones"). La función
  `crearEstudianteEnPreparacion` sigue en `aniosLectivosApi.js`, sin uso; la
  ruta del backend responde `409` desde el paso E7 (2026-10-14). El resumen presenta
  literalmente los conteos y el total que devuelve el backend y no activa el
  año.
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

## Admisiones

`services/admisionesApi.js` (2026-10-13, entrevista de admisión, paso E4)
encapsula:

```text
GET /anios-lectivos/{anio_lectivo_id}/admisiones
POST /anios-lectivos/{anio_lectivo_id}/admisiones
GET /admisiones/cuestionario
GET /admisiones/{admision_id}
PUT /admisiones/{admision_id}
PUT /admisiones/{admision_id}/resultado
DELETE /admisiones/{admision_id}
POST /admisiones/{admision_id}/matricular
```

- Paso E11a (2026-10-14): `GET /admisiones/cuestionario` trae la lista de las
  preguntas del anexo. La página de admisiones la pide **una vez** al abrirse
  (`cargarCuestionario`); la tarjeta de Años lectivos no la pide. En
  `PUT /admisiones/{admision_id}`, `cuestionario` viaja **solo si se tocó
  alguna respuesta**: si no, el cuerpo es el de siempre y el backend deja las
  respuestas como estaban. Tampoco viaja si la lista no llegó, para no
  mandar un bloque vacío que las borraría. El bloque lo arma
  `utils/admisiones/cuestionario.js`.

- Todas son solo del admin. Contrato completo (cuerpos, respuestas, errores,
  `editable` y `aviso_documento`) en
  `sistema_escolar_api/docs/API_ENDPOINTS.md`, sección "Admisiones".
- La lista se pide **sin** `?resultado=`: el filtro por resultado se aplica en
  el navegador sobre la lista que ya llegó, así que cambiar de filtro no hace
  otra petición. Los conteos que trae son de todo el año.
- La tarjeta de Años lectivos usa la misma lista solo por sus conteos: una
  petición, y solo si hay un año en preparación. La página de admisiones pide
  además los cursos activos del año (`GET /cursos?estado=activo&anio_lectivo_id=`,
  con `cursosApi.listarCursos`).
- Los cuerpos los arma `utils/admisiones/formularios.js`: textos recortados y
  los vacíos como `null` (un documento vacío contaría como repetido en el
  backend). Registrar manda solo el aspirante; editar, el aspirante y la
  entrevista; el resultado va por su propia ruta.
- Los mensajes son los del backend tal cual (`mensajeDeErrorAdmision`); un 422
  de FastAPI se muestra uniendo sus mensajes.
- Paso E6: la ficha del estudiante en Estudiantes pide
  `GET /estudiantes/{id}` solo si el admin pulsa "Ver datos de admisión"
  (estudios anteriores y ocupación de los padres). Abrir la ficha no suma
  peticiones.
- Paso E11b (2026-10-15): al pulsar "Ver datos de admisión" se pide además,
  a la vez, `GET /estudiantes/{id}/admision` (las respuestas del anexo, con
  `estudiantesObservadorApi.obtenerAdmisionDeEstudiante`). Solo si tiene
  respuestas se pide `GET /admisiones/cuestionario` para ponerlas en texto, y
  una sola vez mientras la página esté abierta. Si las respuestas fallan, los
  datos de arriba se ven igual. El texto lo arma `utils/cuestionarioAdmision.js`.
- `POST /admisiones/{admision_id}/matricular` (paso E5) recibe la ficha del
  estudiante con el mismo cuerpo de `POST /estudiantes`: la arma el mismo
  formulario y hook de Estudiantes (`useFormularioEstudianteAdmin`, con
  `crearEstudianteFn` apuntando a matricular). La ficha se abre con los datos
  del aspirante (`datosParaMatricular`); si la admisión trae
  `aviso_documento` (un exalumno), primero se pide
  `GET /estudiantes/{aviso_documento.estudiante_id}` y la ficha parte de lo
  que ya tiene, porque el backend la reemplaza como un `PUT`. La respuesta
  trae la admisión ya matriculada, que la pantalla muestra de solo consulta.

## Super admin

`SuperAdminDashboard.jsx` consume:

```text
GET /super-admin/tenants
POST /super-admin/tenants
PATCH /super-admin/tenants/{tenant_id}/estado
GET /super-admin/tenants/{tenant_id}/estado-auditoria
POST /super-admin/tenants/{tenant_id}/pagos
POST /auth/cambiar-password
```

Uso:

- listar colegios/tenants registrados en `public.colegios`;
- crear colegio con admin inicial y suscripcion;
- cambiar estado SaaS entre `activo`, `en_mora`, `suspendido` y `cancelado`.
- consultar historial de cambios de estado.
- registrar el pago de un colegio (desde el 2026-10-26): envia
  `{ fecha_proximo_pago, nota }` y recibe el tenant con su estado recalculado.
  Es lo que reactiva a un colegio que pago, porque el estado efectivo sale de
  esa fecha. La fecha debe ser posterior a hoy; el backend aplica la misma
  regla.

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
GET /estudiantes/{estudiante_id}/admision
GET /admisiones/cuestionario
PATCH /estudiantes/{estudiante_id}/estado
```

Las dos de la entrevista de admisión (paso E11b) solo se piden al pulsar "Ver
datos de admisión"; ver la sección "Admisiones".

Notas por periodo (2026-10-31, `docs/funcionalidades/NOTAS_RESUMEN_ESTUDIANTE.md`):
`GET /estudiantes/{estudiante_id}/detalles` trae además `notas_por_periodo`
(por materia, los cuatro periodos y el año, con la carita en preescolar) e
`inasistencias_por_periodo`. `normalizarDetalleEstudiante` los deja en `null`
si no llegan, y entonces la ficha se ve como antes. La tarjeta "Rendimiento"
escoge el periodo sin pedir nada más.

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
GET /estudiantes/{estudiante_id}/valores-pago
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
- Desde el 2026-11-03, al abrir "Valores personalizados" pide
  `GET /estudiantes/{estudiante_id}/valores-pago` (con `anio_lectivo_id` solo
  si el año del pago no es el activo) y lo muestra con el mismo recuadro de
  matricular: solo los conceptos que se le cobran, con `precio_curso`. Guardar
  y quitar siguen con el mismo `PUT` y `DELETE`; después vuelve a pedir esa
  lista, las deudas y los meses vencidos. Al elegir el estudiante sigue
  pidiendo `valores-pago-personalizados`, que da el conteo de la barra.
- Las ventas pendientes pueden asociarse al registrar pagos.
- Pagar lo que debe (antes el modo `Pago pendiente`) conserva `POST /pagos` y
  su validacion contra la deuda actual.
- Para conceptos mensuales, `GET /pagos/vencidos/opciones/{estudiante_id}`
  devuelve los saldos por mes. El cliente preselecciona el mas antiguo y puede
  enviar una o varias `aplicaciones` dentro de `POST /pagos`.
- Si se elige `Abono libre`, el cliente omite `aplicaciones` y conserva el
  comportamiento anterior.
- `GET /pagos/adelanto/opciones/{estudiante_id}` devuelve conceptos mensuales,
  valor unitario y meses futuros disponibles del año lectivo actual. Desde el
  2026-11-04 Pagos la pide al elegir el estudiante, al cambiar de año y
  después de registrar, anular o cambiar un valor personalizado, porque «Lo
  que debe» muestra los conceptos mensuales al día con su «Adelantar». Antes
  se pedía al abrir el formulario (2026-11-03) y, antes de eso, solo al tocar
  «Meses adelantados».
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
GET /planilla-excel/{asignacion_id}/{periodo}?con_subnotas=true&con_porcentajes=true
POST /planilla/nota
DELETE /planilla/tipo?asignacion_id={id}&descripcion={tipo}&periodo={periodo}
POST /planilla/subnotas
PUT /planilla/subnotas/{subnota_id}
DELETE /planilla/subnotas/{subnota_id}?asignacion_id={id}
POST /planilla/subnotas/valores
PUT /planilla/tipos/porcentaje
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
- **Subnotas** (desde el 2026-10-21, paso A3 de
  `docs/funcionalidades/SUBNOTAS_PLANILLA.md`). La planilla se pide con
  `con_subnotas=true` (en `params` de axios; la ruta no cambia): llegan las
  subnotas por tipo y, en cada estudiante, sus calificaciones.
  `services/planillaApi.js` tiene `crearSubnotaPlanilla`,
  `renombrarSubnotaPlanilla`, `eliminarSubnotaPlanilla` y
  `guardarCalificacionesSubnotas`; los cuerpos los arma
  `utils/planilla/subnotas.js` y viajan sin cambios.
- Al guardar calificaciones solo viajan las subnotas que cambiaron (el
  servidor conserva las demás), con dos decimales ya redondeados mitad hacia
  arriba. La celda que queda es la que devuelve el servidor: el frontend solo
  muestra una vista previa con la misma fórmula.
- Un `409` de `POST /planilla/nota` con el mensaje "Esta nota se calcula con
  sus subnotas..." (una pestaña vieja escribiendo a mano en una celda
  calculada) se avisa con ese mensaje y recarga la planilla, sin dejar la nota
  pendiente. Cualquier otro `409`, como el de un año cerrado, sigue como
  antes.
- **Porcentajes por tipo de nota** (desde el 2026-10-22, paso B4a de
  `docs/funcionalidades/SUBNOTAS_PLANILLA.md`, parte B). La planilla se pide
  también con `con_porcentajes=true`: llegan `porcentajes` (`{ "<tipo>": 40 }`)
  y `porcentajes_activos`. La pantalla no usa ese `porcentajes_activos`: lo
  decide con `utils/planilla/porcentajes.js` sobre las columnas que se ven, así
  el promedio se actualiza sin recargar al borrar un tipo o cambiar un
  porcentaje.
- `guardarPorcentajeTipo` (`PUT /planilla/tipos/porcentaje`) guarda, cambia o
  quita (`porcentaje: null`) el porcentaje de un tipo; el cuerpo lo arma
  `construirPayloadPorcentaje`. Antes de enviar se valida el entero de 1 a 100
  y la suma de hasta 100, con los mismos mensajes del backend; el backend lo
  vuelve a comprobar. Al crear un tipo con porcentaje, primero se crea el tipo
  (`POST /planilla/nota`, como siempre) y después se envía el porcentaje; si
  eso falla, el tipo queda creado sin porcentaje y se avisa.
- Con porcentajes **activos** el promedio de la planilla es el ponderado
  (gemela de `app/core/nota_periodo.py`, en centésimas enteras, mitad hacia
  arriba). Sin porcentajes activos, el promedio de siempre.

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

### Observador unificado: firma del acudiente (2026-10-27)

`services/observadorApi.js` (ver `docs/funcionalidades/FIRMA_OBSERVADOR.md`):

```text
POST /observador/anotaciones/{anotacion_id}/firma
POST /observador/{estudiante_id}/firmas
GET /observador/{estudiante_id}/firmantes-sugeridos
```

- `firmarAnotacionesDelPeriodo(estudianteId, payload)`: una sola firma para
  todas las anotaciones pendientes de un periodo. El cuerpo lleva los mismos
  datos de quien firma y la `imagen`, mas `anotaciones: [{ id, version }]`, la
  lista exacta que se mostro (nunca el numero del periodo). Todo o nada: si
  una falla, el servidor no firma ninguna (`403`/`409`) y la pantalla recarga
  la bitacora.

- `firmarAnotacion(anotacionId, payload)`: el cuerpo lleva `firmante_nombre`,
  `firmante_tipo_documento`, `firmante_documento`, `firmante_parentesco`,
  `imagen` (PNG en `data:`) y `version` (la que trajo la bitacora). **No lleva
  quien toma la firma ni la hora**: el servidor las saca del token y de su
  reloj. `409` si la anotacion ya estaba firmada o cambio desde que se mostro;
  la pantalla vuelve a pedir la bitacora.
- `obtenerFirmantesSugeridos(estudianteId, { signal })`: el padre y la madre de
  la ficha. Si responde `403` o falla, la ventana se llena a mano.
- `GET /observador/{estudiante_id}` trae ahora, por anotacion, `version`,
  `puede_firmar` (decide si se pinta el boton) y `firma` (el sello, con el
  documento enmascarado). Sigue siendo una sola peticion.
- `PUT /observador/{anotacion_id}` responde `409` si la anotacion esta firmada;
  la pantalla ya no ofrece `[Editar]` en esas.
- No hay contrato para editar ni borrar una firma.

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

Usar un plan del año pasado (año lectivo, fase 7, paso 7.4):

```text
GET /plan-de-clases/{asignacion_id}/anio-anterior
GET /plan-de-clases/{asignacion_id}/anio-anterior/{plan_id}
```

- La lista se pide solo al crear un plan (la fecha elegida no tiene uno), una
  vez por clase en cada visita. Si llega vacía, el navegador lo anota
  (`plan_clases_sin_anio_anterior_{profesor}_{clase}`) y no vuelve a preguntar
  por esa clase: una clase sin origen no lo gana después (decisión del
  usuario del 2026-10-10). Con la lista vacía o editando un plan existente, no
  aparece nada.
- Al elegir un plan se pide su texto y se llenan solo los ocho campos de
  texto; el periodo, la fecha y las evidencias quedan los del plan nuevo. Con
  cambios sin guardar, se confirma antes de reemplazarlos. El plan se guarda
  con el `POST /plan-de-clases` de siempre, con `version_esperada` `0`.
- Si el backend rechaza el texto (`403` o `409`), se muestra su `detail` en el
  mensaje del formulario y no se toca nada.

Nombres de los cuadros (2026-10-31, `docs/funcionalidades/NOMBRES_CUADROS_PLAN.md`):

```text
GET /plan-de-clases/cuadros
PUT /admin/plan-de-clases/cuadros
```

- `obtenerCuadrosPlan` y `guardarCuadrosPlan` en `services/planeacionesApi.js`.
  Solo viajan los cuadros que el colegio renombró, como
  `{"cuadros": [{"clave", "nombre", "ayuda"}]}`; los nombres originales viven
  en `utils/planeaciones/cuadros.js`.
- La lectura la hace `useCuadrosPlan`, **una vez al abrir la página**: en el
  plan del profesor y en Planeaciones del admin (la bandeja y el detalle la
  comparten). No se repite al cambiar de fecha, de clase ni de plan. Si
  falla, se usan los originales y el profesor sigue planeando.
- Guardar (solo admin) manda la lista **completa** de cuadros distintos del
  original y reemplaza la del colegio; una lista vacía vuelve a los
  originales. La ventana no guarda si no pudo leer los nombres actuales. Un
  `422` del backend se muestra con su `detail`.

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

Traer el planeador del año pasado (año lectivo, fase 7, paso 7.3):

```text
GET  /planeador-anual/{asignacion_id}/anio-anterior
POST /planeador-anual/{asignacion_id}/anio-anterior
```

- El `GET` se pide solo cuando el periodo cargado llega sin filas, y una vez
  por visita: con alguna fila el planeador ya no esta vacio. Responde
  `hay_origen`, `planeador_vacio` y `puede_traer`; el boton depende solo de
  `puede_traer`, que decide el backend (incluye la guardia del año). Con
  filas en el periodo, la pantalla no hace ninguna peticion nueva.
- El boton se esconde si hay cambios sin guardar: traer recarga el periodo y
  borraria lo que se esta escribiendo.
- El `POST` va sin cuerpo. Al responder, se recarga el periodo y se muestra el
  `message` del backend; las filas traidas llegan con `fecha: null`, y el
  guardado normal vuelve a pedir la fecha de cada fila con contenido.
- Si el backend rechaza (`409` ya tiene contenido, `404` nada que traer, `403`
  o `409` del año), se muestra su `detail` y no se recarga nada. Sin respuesta
  del servidor, el boton sigue para reintentar.

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
- **Porcentajes por tipo de nota** (desde el 2026-10-22, paso B4a de
  `docs/funcionalidades/SUBNOTAS_PLANILLA.md`, PB5): con los porcentajes de la
  clase activos, `GET /boletines/referencia/...` trae `definitiva` en cada
  estudiante con notas, y la pantalla muestra esa (en preescolar, su carita).
  Si no viene, la definitiva se sigue calculando como siempre. Con porcentajes
  activos, `POST /boletines/guardar` guarda la del servidor aunque la pantalla
  envíe otra.
- **Aviso de porcentajes incompletos** (paso B4c, PB11): al cargar una clase
  y un periodo, además pide `GET /planilla-excel/{asignacion_id}/{periodo}?con_porcentajes=true`
  (`obtenerEstadoPorcentajesBoletin`, a la vez que la referencia). Si hay
  porcentajes pero no están activos, antes de guardar pregunta "¿Guardar
  igual?" una vez por clase y periodo. Si esa lectura falla, no avisa y el
  boletín funciona igual.
- **"Ver cómo queda"** (2026-11-06): la vista previa usa `GET /branding` y
  `GET /plantillas/activa/boletin` (en caché, `usePrintConfig`) y, al abrirla,
  un `GET /boletines/referencia/{asignacion_id}/{periodo}` por cada otra
  materia del profesor en el mismo curso (`curso_id` de `/mis-clases`), una
  vez por clase y periodo. No guarda nada. Sin rutas nuevas.

## Certificados

`CertificadosAdmin.jsx` consume:

```text
GET /cursos
GET /estudiantes?estado=todos
GET /materias
GET /boletines/admin/generar/{estudiante_id}/{periodo}
GET /boletines/admin/reporte-parcial/{estudiante_id}/{periodo}
GET /asistencia/historial/{asignacion_id}/{periodo}
GET /estudiantes/{estudiante_id}
GET /estudiantes/{estudiante_id}/deudas
GET /api/ventas/pendientes/{estudiante_id}
GET /estudiantes/{estudiante_id}/valores-pago
```

Uso:

- Paz y salvo (desde el 2026-11-05): `obtenerDeudasCertificado` y
  `listarVentasPendientesCertificado`, las mismas consultas de Pagos. Se
  piden juntas con la ficha. Las deudas van primero **sin año** (el activo,
  que trae también `deuda_anios_anteriores`), aunque se mire un año pasado;
  si responde 404 (no está matriculado en el activo, como un egresado) y se
  mira otro año, se piden con `anio_lectivo_id`. Las ventas no son de ningún
  año. El backend hace la cuenta (solo lo vencido a la fecha, con mora); la
  pantalla solo suma `deudas[].deuda`, `deuda_anios_anteriores[].total_deuda`
  y `ventas[].total`. Con algo mayor que 0, no expide el certificado y
  muestra lo que debe. No se usa `GET /cartera/mora`: en el año activo solo
  trae estudiantes activos, y un retirado saldría a paz y salvo debiendo.
- Costos educativos (desde el 2026-11-05): `obtenerValoresPagoCertificado`,
  la misma consulta de matricular en Año lectivo, con `anio_lectivo_id` si se
  mira otro año. Usa `conceptos[].nombre` y `conceptos[].valor_a_pagar` para
  llenar la lista, que se edita sobre la hoja solo para esa impresión (no se
  envía nada al backend).

- `GET /estudiantes/{estudiante_id}` (desde el 2026-11-05,
  `obtenerFichaEstudianteCertificado`): la ficha completa, solo por el
  `tipo_documento` ("Registro Civil" → "R.C.", "Tarjeta de Identidad" →
  "T.I."), que la lista no trae. Una consulta al generar matrícula, conducta
  o aprobado, sin año (la ficha no depende del año). Es la misma consulta de
  la ficha en Estudiantes. Si falla, la pantalla avisa y no abre el
  certificado. Ver `docs/funcionalidades/CERTIFICADOS_NUEVOS.md`.
- La pantalla permite filtrar estudiantes por curso, estado, busqueda y periodo.
- Desde el paso 6.10 del año lectivo (decisión del 2026-10-08), pide los
  estudiantes de todos los estados (`estado=todos`, más `anio_lectivo_id` si
  se mira otro año) con su propia función,
  `listarEstudiantesCertificados`. El filtro de la pantalla sigue empezando
  en "Activos", así que al abrir se ve lo mismo de antes; cambiando el filtro
  se puede certificar a retirados y egresados. Boletines conserva su propia
  consulta, `GET /estudiantes`, solo de activos.
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
