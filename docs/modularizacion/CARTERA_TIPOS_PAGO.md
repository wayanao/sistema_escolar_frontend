# Modularización: Cartera y tipos de pago

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 8.
- Riesgo inicial: Muy alto.
- Flujo Git: `main` directo.
- Commit base: `aefcfc8de4a17128614c0a0e1adba7c2e49df807`.
- Commit final: `eb24e2a`.
- Última actualización: 2026-08-03.

## Objetivo

Separar cartera vencida, estados de cuenta y administración de conceptos de
pago sin modificar generación de deuda, saldos ni asignaciones por curso.

## Inventario confirmado en capa 0

### Cartera consultable

- `src/pages/CarteraVencidaAdmin.jsx` carga el resumen y el detalle de mora,
  calcula cursos, filtros y totales visibles, muestra KPIs y permite expandir el
  detalle académico y de inventario por estudiante.
- Filtros conservados: texto por nombre, apellido o curso; curso; deuda
  académica; deuda de inventario; y deuda con mora.
- Acciones conservadas: recarga completa de la página, exportación CSV,
  impresión por estudiante, impresión por curso y navegación a registro de
  pago.

### Impresión

- El estado de cuenta imprimible y sus tablas viven actualmente dentro de
  `src/pages/CarteraVencidaAdmin.jsx`.
- Usa `src/components/impresion/DocumentoImprimible.jsx` con
  `tipo="reporte_estudiante"` y las clases `di-documento--cartera` y
  `di-documento--cartera-<tipo>`.
- `DocumentoImprimible` es una dependencia compartida ya existente. No se
  modifica ni se duplica en este módulo.
- El reporte por curso contiene resumen por estudiante y totales académico,
  inventario y general. El reporte individual conserva conceptos, ventas,
  mora y cuotas vencidas.

### Configuración de conceptos

- `src/pages/TiposPagosAdmin.jsx` es el contenedor de ruta y compone
  `src/components/cartera/AdministrarTiposPago.jsx`.
- `AdministrarTiposPago.jsx` contiene actualmente consultas, comandos,
  transformaciones, estado de formularios y toda la presentación.
- Flujos conservados: crear y editar nombre/valor; filtrar activos, inactivos y
  todos; abrir detalle; configurar cobro, mora y recurrencia —incluidos mes
  inicial y mes final—; activar o
  desactivar; asignar cursos y valores; y guardar asignaciones pendientes.
- Un concepto se muestra como publicado únicamente si está activo, no es
  opcional y tiene al menos un curso asignado. En cualquier otro caso se
  muestra como borrador con sus razones.

### Entradas, roles y dependencias externas

- Rutas: `/admin/tipos-pagos` y `/admin/cartera-vencida`.
- Ambas rutas están protegidas por `AdminRoute`: requieren el objeto `usuario`
  de `localStorage` con rol `admin`; el cambio obligatorio de contraseña
  redirige a `/cambiar-password` y los demás casos a `/login`.
- El módulo no lee ni escribe almacenamiento local directamente. La única
  lectura relacionada pertenece al control de acceso global de `App.jsx`.
- El menú administrativo ofrece ambas rutas en escritorio y móvil. El
  dashboard administrativo también enlaza a cartera vencida.
- La acción `Cobrar` navega a `/admin/pagos` con
  `{ state: { estudiante_id } }`. `src/pages/PagosAdmin.jsx` es consumidor de
  ese contrato y permanece expresamente fuera del alcance.
- El endpoint general de cursos es una dependencia de datos; no autoriza a
  modificar el módulo de administración académica.

## Contratos HTTP inventariados

### Cartera

| Método | Ruta | Uso actual |
|---|---|---|
| `GET` | `/cartera/mora/resumen` | KPIs y distribución por curso. |
| `GET` | `/cartera/mora` | Detalle vencido por estudiante. |

Ambas consultas se ejecutan en paralelo. El detalle usa `response.data || []`
y un error solo se registra en consola; la carga termina igualmente.

### Tipos de pago y cursos

| Método | Ruta | Uso actual |
|---|---|---|
| `GET` | `/tipos-pagos/detallado` | Listado principal con configuración y cursos. |
| `GET` | `/tipos-pagos` | Fallback si falla el listado detallado. |
| `GET` | `/cursos` | Cursos disponibles para asignación. |
| `POST` | `/tipos-pagos` | Crear concepto. |
| `PUT` | `/tipos-pagos/:id` | Editar nombre y valor base. |
| `GET` | `/tipos-pagos/:id/detalle` | Cargar configuración y cursos de un concepto. |
| `PUT` | `/tipos-pagos/:id/configuracion` | Guardar configuración financiera y estado. |
| `PUT` | `/tipos-pagos/:id/cursos` | Reemplazar la asignación de cursos. |

Contratos de escritura protegidos por caracterización:

- Crear/editar: `{ nombre: string.trim(), valor: parseFloat(valor) || 0 }`.
- Configuración: descripción y campos opcionales se convierten a `null` cuando
  están vacíos; campos numéricos se convierten con `Number`; los booleanos se
  normalizan explícitamente.
- Para conceptos mensuales, `mes_final` se normaliza como entero de `1` a `12`
  y usa `12` si el detalle proviene de un backend anterior. El formulario
  bloquea un mes final anterior al mes inicial y el backend repite la
  validación como autoridad del contrato.
- Cursos: `{ cursos: [{ curso_id, valor: Number(valor) || 0, activo: boolean }] }`.
- Un `409` al guardar configuración conserva el aviso existente de migración
  pendiente. Un `409` al crear/editar conserva el aviso de concepto duplicado.

## Estados visuales y comportamiento responsive

- Cartera: carga con spinner; listado vacío; filtros sin coincidencias; KPIs;
  distribución por curso; fila cerrada o expandida; botones de impresión
  habilitados según selección; y tablas con desplazamiento horizontal.
- Impresión: vista separada con regreso, documento A4 compartido y clase que
  activa desplazamiento móvil en `DocumentoImprimible`.
- Conceptos: filtros activo/inactivo/todos; listas vacías; publicado/borrador;
  panel de detalle cargando; vista previa de configuración; confirmación de
  activación/desactivación; asignación limpia o con cambios pendientes; y
  botones con estado de guardado.
- Las grillas cambian de una columna a dos, tres o cuatro según los breakpoints
  existentes. No se identificó autorización ni necesidad de rediseño.

## Invariantes

- Estados de cuenta por estudiante y curso.
- Impresión A4 y desplazamiento móvil.
- Conceptos activos, inactivos y borradores.
- Asignación de conceptos a cursos.
- Previsualización de cartera y razones de configuración incompleta.
- Deudas existentes visibles aunque cambie una configuración.
- Ninguna cuota mensual se genera después del `mes_final`; diciembre (`12`)
  conserva el comportamiento de los colegios que no cambien la configuración.

## Riesgos iniciales

- Alterar generación o visibilidad de obligaciones financieras.
- Confundir configuración de conceptos con pagos registrados.
- Romper asociaciones por curso.
- Duplicar conceptos o esconder deudas ya generadas.

## Riesgos y decisiones registrados en capa 0

- La suma del reporte imprimible normaliza valores con `Number`, mientras que
  algunos totales de la tabla principal suman los campos recibidos sin una
  normalización explícita. La capa 1 fijó ambas reglas por separado con pruebas
  y las extrajo sin reinterpretar el contrato del backend.
- El fallback de `/tipos-pagos/detallado` a `/tipos-pagos` es comportamiento
  vigente y queda protegido; el servicio futuro debe conservarlo mediante la
  coordinación apropiada sin duplicar transporte.
- Los cambios de cursos son locales hasta guardar el arreglo completo. No debe
  convertirse en comandos parciales durante la migración.
- Desactivar un concepto conserva las deudas y pagos existentes y no genera
  nuevos cobros; reactivarlo no genera retroactivos automáticamente. Estos
  textos y confirmaciones son invariantes de alto riesgo para la capa de
  comandos.
- La recarga usa `window.location.reload()` y los errores iniciales solo se
  registran en consola. Se conservan por tratarse de una migración, aunque
  puedan existir alternativas de producto más amables.
- La exportación CSV y la fecha de corte dependen de APIs del navegador y de la
  fecha local. Se extraerán solo sus transformaciones puras cuando corresponda;
  los efectos del navegador permanecerán en hooks o composición.
- Se decidió no abrir ni modificar `PagosAdmin.jsx`, no crear abstracciones
  compartidas y tratar `DocumentoImprimible` como dependencia estable.
- La capa 0 solo agregó caracterización y documentación; no cambió código de
  producción, rutas, textos, diseño ni payloads.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-03) |
| 1. Utilidades puras | Terminada (2026-08-03) |
| 2. Servicio HTTP | Terminada (2026-08-03) |
| 3. Hooks de consulta | Terminada (2026-08-03) |
| 4. Hooks de comandos | Terminada (2026-08-03) |
| 5. Presentación | Terminada (2026-08-03) |
| 6. Composición | Terminada (2026-08-03) |
| 7. Cierre | Terminada (2026-08-03) |

## Verificación de capa 0

- Antes de modificar: rama `main`, árbol limpio y `main == origin/main` en
  `aefcfc8de4a17128614c0a0e1adba7c2e49df807`.
- No existía un hash contradictorio en este documento: el commit base estaba
  marcado para registrarse al iniciar y quedó fijado al `HEAD` publicado.
- Prueba previa de la dependencia compartida:
  `pnpm exec vitest run src/components/impresion/DocumentoImprimible.test.jsx`
  — 1 archivo, 2 pruebas correctas.
- Verificación específica final:
  `pnpm exec vitest run src/pages/CarteraVencidaAdmin.test.jsx src/components/cartera/AdministrarTiposPago.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 3 archivos, 9 pruebas correctas.
- Caracterización nueva: 3 pruebas de cartera y 4 pruebas de tipos de pago.
  Protegen endpoints, filtros, impresión por curso, navegación a Pagos,
  publicado/borrador/inactivo, fallback de listado y payloads de creación,
  configuración y cursos.
- Vitest necesitó ejecutarse fuera del sandbox porque la creación de su
  subproceso recibió `EPERM`; no fue un fallo del código ni de las pruebas.

## Implementación de capa 1

### Unidades extraídas

- `src/utils/carteraTiposPago/formatos.js`: formato COP, formato de fecha y
  nombre completo. El formato monetario tiene dos consumidores reales dentro
  del módulo, cartera y conceptos, por lo que se conserva una sola
  implementación localizada en el dominio.
- `src/utils/carteraTiposPago/cartera.js`: totales de impresión, totales de la
  tabla, cursos únicos, filtros, máximo del indicador y contenido CSV.
- `src/utils/carteraTiposPago/tiposPago.js`: constantes y estado inicial;
  publicado/borrador; normalización del detalle; payloads de concepto,
  configuración y cursos; filtros de estado; y transformaciones de asignación
  de cursos.
- Las utilidades no realizan HTTP, no usan React ni DOM, no acceden a
  almacenamiento y no disparan efectos.

### Integración conservada

- `CarteraVencidaAdmin.jsx` conserva la carga, navegación, descarga con
  `Blob`, fecha de corte y composición visual. Solo delega cálculos y contenido
  CSV a funciones puras.
- `AdministrarTiposPago.jsx` conserva consultas, comandos, formularios,
  confirmaciones y presentación. Solo delega constantes, normalizaciones y
  transformaciones inmutables.
- Se mantuvieron deliberadamente dos totalizadores: el reporte convierte los
  valores con `Number`, mientras que la tabla visible conserva la suma directa
  que existía antes de la extracción.
- La asignación de todos los cursos sigue incluyendo todos los cursos recibidos
  por el endpoint, incluso los marcados como inactivos; cambiar esa regla sería
  una modificación funcional fuera de alcance.
- No se movieron endpoints, efectos, mensajes, rutas ni componentes y no se
  creó ninguna abstracción compartida fuera del módulo.

### Verificación de capa 1

- Pruebas unitarias nuevas: 16 pruebas para formatos, cartera y tipos de pago.
- Suite específica completa:
  `pnpm exec vitest run src/utils/carteraTiposPago/formatos.test.js src/utils/carteraTiposPago/cartera.test.js src/utils/carteraTiposPago/tiposPago.test.js src/pages/CarteraVencidaAdmin.test.jsx src/components/cartera/AdministrarTiposPago.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 6 archivos, 25 pruebas correctas.
- ESLint específico sobre las dos unidades React, sus caracterizaciones y todas
  las utilidades/pruebas de `src/utils/carteraTiposPago/`: correcto.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta no
  es la última capa del módulo.

## Implementación de capa 2

### Servicio HTTP

- `src/services/carteraTiposPagoApi.js` centraliza los diez contratos
  inventariados: resumen y detalle de cartera; listado detallado y básico de
  conceptos; cursos; creación y actualización básica; detalle; configuración;
  y asignación de cursos.
- Las consultas devuelven `response.data`. Crear y actualizar el contrato
  básico devuelven `{ status, data }` porque la interfaz existente comprueba el
  rango del estado HTTP antes de mostrar éxito.
- Los comandos de configuración y cursos devuelven los datos del backend,
  aunque sus consumidores actuales no los utilicen.
- El servicio no atrapa errores, no decide mensajes, no usa React y no
  transforma payloads. Los errores de Axios se propagan intactos a la
  coordinación actual.
- El fallback de `/tipos-pagos/detallado` a `/tipos-pagos` permanece por ahora
  en `AdministrarTiposPago.jsx`: es coordinación de consulta, no transporte, y
  corresponde moverlo en la capa 3.

### Integración conservada

- `CarteraVencidaAdmin.jsx` consume en paralelo
  `obtenerResumenCarteraVencida` y `obtenerDetalleCarteraVencida` y conserva el
  mismo manejo de carga, lista vacía y error en consola.
- `AdministrarTiposPago.jsx` consume las funciones de listado, cursos, detalle
  y comandos, pero conserva el orden de recargas, confirmaciones, mensajes y
  estados de guardado.
- Ninguna página o componente del módulo importa directamente
  `src/utils/api.js` después de esta capa.
- No se añadieron parámetros, señales de cancelación ni rutas porque los
  contratos actuales no los tenían.

### Verificación de capa 2

- `src/services/carteraTiposPagoApi.test.js` agrega 5 pruebas que cubren los
  diez contratos, métodos, rutas, payloads, datos/estado devueltos y propagación
  de errores.
- Suite específica completa:
  `pnpm exec vitest run src/services/carteraTiposPagoApi.test.js src/utils/carteraTiposPago/formatos.test.js src/utils/carteraTiposPago/cartera.test.js src/utils/carteraTiposPago/tiposPago.test.js src/pages/CarteraVencidaAdmin.test.jsx src/components/cartera/AdministrarTiposPago.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 7 archivos, 30 pruebas correctas.
- ESLint específico sobre servicio/prueba, unidades React/caracterización y
  utilidades/pruebas: correcto.
- La búsqueda específica confirmó que no quedan importaciones ni llamadas
  directas a `utils/api.js` en las dos unidades React del módulo.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta no
  es la última capa del módulo.

## Implementación de capa 3

### Hook de cartera vencida

- `src/hooks/carteraTiposPago/useCarteraVencida.js` es propietario de resumen,
  detalle, carga, búsqueda, curso y tipo de deuda.
- Ejecuta en paralelo las dos consultas iniciales y conserva el mismo mensaje
  de consola cuando alguna falla. La carga siempre termina y no se añadió un
  estado visual de error que antes no existía.
- Calcula cursos únicos, elementos filtrados, totales visibles, deuda máxima y
  curso seleccionado mediante las utilidades puras de la capa 1.
- `CarteraVencidaAdmin.jsx` conserva expansión de filas, reporte, fecha de
  corte, descarga con `Blob`, navegación y composición visual.
- La acción `Actualizar` continúa usando `window.location.reload()`; sustituirla
  por una recarga silenciosa habría cambiado el comportamiento existente.

### Hook de consultas de tipos de pago

- `src/hooks/carteraTiposPago/useConsultasTiposPago.js` es propietario del
  listado, cursos, filtro activo/inactivo/todos, concepto seleccionado, detalle
  y carga de detalle.
- Mantiene la consulta inicial independiente de conceptos y cursos, además del
  fallback exacto desde `/tipos-pagos/detallado` hacia `/tipos-pagos`.
- La selección precarga los datos de la lista, combina el detalle remoto y
  propaga el error para que `AdministrarTiposPago.jsx` conserve el mismo aviso
  de SweetAlert.
- Expone la recarga de conceptos para los comandos actuales, el cierre del
  detalle y una actualización local del detalle después de guardar
  configuración.
- `AdministrarTiposPago.jsx` conserva todavía formularios, configuración
  editable, cursos asignados, confirmaciones, estados de guardado y todos los
  comandos HTTP. Esas responsabilidades pertenecen a la capa 4.

### Decisiones de compatibilidad

- No se añadieron cancelación, descarte de respuestas antiguas, debounce,
  paginación, URL ni almacenamiento porque los flujos existentes no los usan.
- No se introdujeron mensajes nuevos ni se cambiaron los textos de consola.
- Los hooks solo importan servicios y utilidades del módulo; no conocen Axios
  ni endpoints.

### Verificación de capa 3

- `useCarteraVencida.test.js` agrega 3 pruebas para carga paralela, derivados,
  filtros y error actual.
- `useConsultasTiposPago.test.js` agrega 4 pruebas para carga inicial, filtro,
  fallback, detalle seleccionado, actualización local, cierre y propagación de
  error.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/carteraTiposPago/useCarteraVencida.test.js src/hooks/carteraTiposPago/useConsultasTiposPago.test.js src/services/carteraTiposPagoApi.test.js src/utils/carteraTiposPago/formatos.test.js src/utils/carteraTiposPago/cartera.test.js src/utils/carteraTiposPago/tiposPago.test.js src/pages/CarteraVencidaAdmin.test.jsx src/components/cartera/AdministrarTiposPago.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 9 archivos, 37 pruebas correctas.
- ESLint específico sobre hooks/pruebas, servicio/prueba, unidades
  React/caracterización y utilidades/pruebas: correcto.
- La búsqueda específica confirmó que la página ya no contiene carga ni
  derivados de consulta y que el componente no contiene listados, fallback,
  carga de cursos ni estado remoto de detalle.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta no
  es la última capa del módulo.

## Implementación de capa 4

### Formulario básico de conceptos

- `src/hooks/carteraTiposPago/useFormularioTipoPago.js` es propietario de
  nombre, valor, modo edición y envío del formulario.
- Conserva los payloads puros, la bifurcación crear/actualizar, la comprobación
  del estado HTTP, los textos de éxito/error y el tratamiento especial de
  conflictos `409`.
- La recarga del listado después de crear o editar continúa disparándose sin
  esperarla, igual que en la implementación original.

### Configuración financiera

- `src/hooks/carteraTiposPago/useConfiguracionTipoPago.js` es propietario de la
  configuración editable y de `guardandoConfig`.
- Conserva las confirmaciones de desactivación/reactivación, incluido que las
  deudas y pagos existentes permanecen y que no se generan retroactivos al
  reactivar.
- Mantiene la actualización local del detalle, el orden del mensaje de éxito y
  la recarga esperada del listado.
- El conflicto `409` conserva el aviso y el comando de migración existente; los
  demás errores conservan su mensaje actual.

### Asignación de cursos

- `src/hooks/carteraTiposPago/useAsignacionCursosTipoPago.js` es propietario de
  cursos asignados, selectores de adición, cambios pendientes y
  `guardandoCursos`.
- Coordina agregar uno/todos, cambiar valores, activar/desactivar, quitar y
  reemplazar el arreglo completo mediante el servicio.
- Un guardado correcto limpia el estado pendiente y espera la recarga del
  listado. Un fallo conserva los cambios locales pendientes para reintento.
- Los indicadores de cursos disponibles, activos y pendientes se calculan en
  el hook mediante utilidades puras.

### Integración y límites

- `AdministrarTiposPago.jsx` conecta el hook de consultas con los tres hooks de
  comandos y solo conserva la coordinación de seleccionar un detalle, mostrar
  su error y componer la interfaz.
- El componente ya no contiene `useState`, constructores de payload ni llamadas
  al servicio HTTP.
- Cartera vencida no tiene comandos remotos; exportación, impresión y
  navegación siguen siendo acciones de interfaz y no justifican un hook de
  comandos artificial.
- SweetAlert permanece en los hooks de comandos porque confirma operaciones y
  comunica su resultado; no se movieron textos ni se introdujo un sistema de
  notificaciones nuevo.

### Verificación de capa 4

- `useFormularioTipoPago.test.js`: 3 pruebas para creación, actualización y
  conflicto duplicado.
- `useConfiguracionTipoPago.test.js`: 3 pruebas para normalización/guardado,
  cancelación de desactivación y conflicto de migración.
- `useAsignacionCursosTipoPago.test.js`: 3 pruebas para edición local,
  reemplazo completo exitoso y conservación de cambios ante error.
- Suite específica completa:
  `pnpm exec vitest run src/hooks/carteraTiposPago/useFormularioTipoPago.test.js src/hooks/carteraTiposPago/useConfiguracionTipoPago.test.js src/hooks/carteraTiposPago/useAsignacionCursosTipoPago.test.js src/hooks/carteraTiposPago/useCarteraVencida.test.js src/hooks/carteraTiposPago/useConsultasTiposPago.test.js src/services/carteraTiposPagoApi.test.js src/utils/carteraTiposPago/formatos.test.js src/utils/carteraTiposPago/cartera.test.js src/utils/carteraTiposPago/tiposPago.test.js src/pages/CarteraVencidaAdmin.test.jsx src/components/cartera/AdministrarTiposPago.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 12 archivos, 46 pruebas correctas.
- ESLint específico sobre hooks/pruebas, servicio/prueba, unidades
  React/caracterización y utilidades/pruebas: correcto.
- La búsqueda específica confirmó que `AdministrarTiposPago.jsx` no conserva
  estado editable local, payloads ni comandos del servicio.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta no
  es la última capa del módulo.

## Implementación de capa 5

### Vista de cartera vencida e impresión

- `src/components/carteraTiposPago/VistaCarteraVencida.jsx` contiene la
  presentación de carga, encabezado, KPIs, distribución, filtros, totales,
  estados vacíos, tabla expandible y vista imprimible.
- Conserva dentro de la vista sus unidades presentacionales de reporte por
  curso/estudiante, conceptos, ventas, tarjetas y badges.
- Recibe resumen, filtros, derivados, selección, reporte y callbacks mediante
  props. No importa hooks, servicios, rutas ni APIs del navegador.
- `CarteraVencidaAdmin.jsx` conserva como controlador de página el hook, estado
  de expansión/reporte, fecha de corte, `Blob`, recarga, navegación y conexión
  de callbacks.

### Vista de administración de conceptos

- `src/components/carteraTiposPago/VistaAdministrarTiposPago.jsx` contiene el
  formulario básico, filtros/listado, badges, configuración financiera,
  recurrencia, vista previa de cartera y asignación responsive de cursos.
- Recibe datos, estados visuales y callbacks mediante props. No importa hooks,
  servicios, Axios ni SweetAlert.
- `src/components/cartera/AdministrarTiposPago.jsx` quedó como controlador
  temporal que conecta cinco hooks, coordina la selección del detalle y pasa
  sus contratos a la vista.
- Ese controlador se conserva únicamente hasta la capa 6, cuando su composición
  se trasladará a la raíz `TiposPagosAdmin.jsx`; no se duplicó lógica visual.

### Compatibilidad visual

- Se movió el JSX existente manteniendo clases Tailwind, textos, emojis,
  estructura de tablas, breakpoints, desplazamiento horizontal y estados
  `disabled`.
- La impresión continúa usando `DocumentoImprimible`,
  `tipo="reporte_estudiante"`, `di-documento--cartera` y la clase específica de
  curso/estudiante para el desplazamiento móvil.
- Las vistas no administran estado de dominio: todos los cambios se comunican
  a los controladores mediante callbacks.

### Verificación de capa 5

- `VistaCarteraVencida.test.jsx`: 2 pruebas directas para carga, contenido,
  filtros y acciones.
- `VistaAdministrarTiposPago.test.jsx`: 1 prueba directa para formulario,
  listado, publicado y callbacks de filtro/configuración/edición.
- Las caracterizaciones de los controladores se conservaron y pasaron después
  del movimiento de JSX.
- Suite específica completa:
  `pnpm exec vitest run src/components/carteraTiposPago/VistaCarteraVencida.test.jsx src/components/carteraTiposPago/VistaAdministrarTiposPago.test.jsx src/hooks/carteraTiposPago/useFormularioTipoPago.test.js src/hooks/carteraTiposPago/useConfiguracionTipoPago.test.js src/hooks/carteraTiposPago/useAsignacionCursosTipoPago.test.js src/hooks/carteraTiposPago/useCarteraVencida.test.js src/hooks/carteraTiposPago/useConsultasTiposPago.test.js src/services/carteraTiposPagoApi.test.js src/utils/carteraTiposPago/formatos.test.js src/utils/carteraTiposPago/cartera.test.js src/utils/carteraTiposPago/tiposPago.test.js src/pages/CarteraVencidaAdmin.test.jsx src/components/cartera/AdministrarTiposPago.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 14 archivos, 49 pruebas correctas.
- ESLint específico sobre vistas/pruebas, controladores/caracterización,
  hooks/pruebas, servicio/prueba y utilidades/pruebas: correcto.
- La búsqueda específica confirmó que las vistas no importan hooks ni
  servicios.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque esta no
  es la última capa del módulo.

## Implementación de capa 6

### Raíz de cartera vencida

- `src/pages/CarteraVencidaAdmin.jsx` permanece como raíz de composición de 68
  líneas.
- Conecta `useCarteraVencida` con `VistaCarteraVencida` y conserva únicamente
  estado superior de expansión/reporte, fecha de corte, exportación del CSV,
  recarga y navegación a Pagos.
- No contiene endpoints, tablas, KPIs ni bloques imprimibles.

### Raíz de tipos de pago

- `src/pages/TiposPagosAdmin.jsx` pasó a ser la raíz de composición de 56
  líneas.
- Conecta el hook de consultas, formulario básico, configuración y asignación
  de cursos con `VistaAdministrarTiposPago`.
- Conserva el encabezado de ruta y la coordinación del detalle seleccionado,
  incluida la alerta visual cuando falla su consulta.
- `src/components/cartera/AdministrarTiposPago.jsx` fue retirado. No queda un
  controlador intermedio ni una implementación visual duplicada.
- Su caracterización se trasladó a
  `src/pages/TiposPagosAdmin.test.jsx` antes de la extracción y pasó tanto antes
  como después del cambio.

### Límites finales de composición

- Las páginas leen estado superior, conectan hooks con vistas y conservan
  navegación/efectos del navegador.
- Las vistas solo presentan props y callbacks.
- Los hooks coordinan consultas, formularios y comandos.
- El servicio es el único punto del módulo que conoce endpoints y Axios.
- Las utilidades concentran contratos y transformaciones puras.

### Verificación de capa 6

- Caracterización trasladada antes de extraer:
  `pnpm exec vitest run src/pages/TiposPagosAdmin.test.jsx`
  — 1 archivo, 4 pruebas correctas.
- Suite específica completa después de retirar el controlador:
  `pnpm exec vitest run src/pages/TiposPagosAdmin.test.jsx src/components/carteraTiposPago/VistaCarteraVencida.test.jsx src/components/carteraTiposPago/VistaAdministrarTiposPago.test.jsx src/hooks/carteraTiposPago/useFormularioTipoPago.test.js src/hooks/carteraTiposPago/useConfiguracionTipoPago.test.js src/hooks/carteraTiposPago/useAsignacionCursosTipoPago.test.js src/hooks/carteraTiposPago/useCarteraVencida.test.js src/hooks/carteraTiposPago/useConsultasTiposPago.test.js src/services/carteraTiposPagoApi.test.js src/utils/carteraTiposPago/formatos.test.js src/utils/carteraTiposPago/cartera.test.js src/utils/carteraTiposPago/tiposPago.test.js src/pages/CarteraVencidaAdmin.test.jsx src/components/impresion/DocumentoImprimible.test.jsx`
  — 14 archivos, 49 pruebas correctas.
- ESLint específico sobre páginas/pruebas, vistas/pruebas, hooks/pruebas,
  servicio/prueba y utilidades/pruebas: correcto.
- La búsqueda específica confirmó que no quedan importaciones a
  `components/cartera/AdministrarTiposPago`.
- No se ejecutaron `pnpm run check:deploy` ni `git diff --check` porque la capa
  final de cierre todavía está pendiente.

## Capa 7: cierre final

### Documentación sincronizada

- `docs/modularizacion/README.md` marca el módulo como terminado con commit
  pendiente.
- `docs/ARQUITECTURA_FRONTEND.md` registra carpetas, responsabilidades, rutas y
  límites finales del dominio.
- `docs/COMPONENTES.md` registra vistas, páginas, hooks, servicio y utilidades.
- `docs/CAMBIOS_FRONTEND.md` contiene la entrada consolidada del módulo.

### Verificación final

- Suite específica: 14 archivos y 49 pruebas correctas.
- `pnpm run check:deploy`: correcto.
  - Vitest: 149 archivos y 522 pruebas correctas.
  - ESLint global: correcto.
  - Build de producción: correcto; 273 módulos transformados.
- `git diff --check`: correcto.
- El diff pertenece únicamente a cartera/tipos de pago, sus pruebas y la
  documentación específica/global exigida para el cierre.
- Las rutas `/admin/cartera-vencida` y `/admin/tipos-pagos` conservan
  `AdminRoute`; `/admin/pagos` permanece fuera del módulo y solo recibe la
  navegación existente con `estudiante_id`.
- `carteraTiposPagoApi.js` es el único archivo del módulo que importa
  `utils/api.js` y contiene sus diez contratos HTTP.
- No quedan referencias fuente a
  `components/cartera/AdministrarTiposPago.jsx`, llamadas HTTP directas en
  páginas/vistas ni implementaciones visuales antiguas paralelas.

### Verificación manual posterior al deploy

1. Iniciar sesión como administrador y abrir `Admin > Cartera > Cartera
   Vencida`; confirmar KPIs, distribución, filtros y tabla responsive.
2. Expandir un estudiante y comprobar conceptos académicos, ventas pendientes,
   mora, totales y la navegación `Cobrar` hacia `/admin/pagos` con el estudiante
   seleccionado, sin registrar un pago de prueba.
3. Seleccionar un curso, abrir `Imprimir curso` y abrir también el estado de
   cuenta individual; confirmar formato A4, toolbar y desplazamiento horizontal
   en móvil. Cancelar el diálogo sin imprimir si no es necesario.
4. Exportar el CSV y comprobar nombre con fecha, encabezados y valores de los
   estudiantes filtrados.
5. Abrir `Admin > Cartera > Tipos de Pago`; confirmar filtro inicial `Activos`,
   pestañas `Inactivos/Todos`, badges `Publicado/Borrador` y razones visibles.
6. Abrir `Configurar` sobre un concepto existente y comprobar parámetros,
   recurrencia, vista previa y cursos sin guardar cambios de prueba.
7. En ancho móvil, comprobar que formularios se apilan y que las tablas de
   cartera y cursos conservan desplazamiento horizontal.

### Cambio funcional posterior: mes final del calendario mensual

Desde 2026-09-10, la configuración recurrente admite `mes_final`. Es una
capacidad por concepto, no una modificación automática del calendario de los
colegios: el valor compatible es diciembre y cada institución decide si lo
reduce. La pantalla muestra el rango y valida que el final no sea anterior al
inicio.

Para `tenant_2005`, después de desplegar primero la migración y el backend, la
operación pendiente es abrir el concepto de mensualidad en `Tipos de Pago` y
guardar noviembre (`11`) como mes final, conservando el mes inicial y la
frecuencia que realmente use el colegio. Este repositorio no aplica ese dato ni
ejecuta migraciones.

### Commit sugerido

`refactor(cartera): modularizar cartera y tipos de pago`

## Entrega final

- Última capa terminada: Capa 7, cierre.
- Archivos de producción modificados: `CarteraVencidaAdmin.jsx`,
  `TiposPagosAdmin.jsx`, dos vistas presentacionales, cinco hooks,
  `carteraTiposPagoApi.js` y tres utilidades del dominio. El controlador antiguo
  fue eliminado.
- Riesgos abiertos: los errores de carga inicial continúan visibles solo en
  consola, como antes de la migración; la mejora visual queda fuera de alcance.
- Siguiente capa pendiente: Ninguna.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual como seguimiento operativo si todavía no fue
  registrada.
