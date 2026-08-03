# Modularización: Estudiantes y observador

## Control

- Estado: Terminado; commit pendiente.
- Orden: 5.
- Riesgo actual: Alto.
- Flujo Git: `main` directo.
- Commit base: `60edcb52c85c7bac5f6b05865c9ff22c7c691b98`.
- Commit final: Pendiente.
- Última actualización: 2026-08-02.

## Objetivo

Separar listado, detalle, creación, estado operativo y observador del
estudiante, conservando roles, datos parciales y experiencia responsive.

## Alcance confirmado en la capa 0

### Raíces y piezas activas

- `src/pages/EstudiantesAdmin.jsx`: listado, búsqueda, filtro por estado,
  creación, edición, cambio de estado y modal de detalle administrativo.
- `src/pages/Formulario.jsx`: listado y búsqueda de estudiantes de la
  asignación activa para diligenciar el observador.
- `src/components/estudiantesObservador/Observaciones.jsx`: consulta, edición,
  guardado parcial e impresión del observador de cada estudiante.
- `src/components/impresion/DocumentoImprimible.jsx`: dependencia compartida
  ya existente usada por la vista de impresión; queda fuera de la migración.
- `src/utils/periodoProfesor.js`: contrato compartido ya existente para leer el
  periodo activo; queda fuera de la migración.

### Piezas antiguas retiradas en la capa 5

- `src/components/CrearEstudiante.jsx`: no tenía importadores ni rutas y su
  formulario reducido estaba duplicado por el formulario administrativo activo,
  ahora protegido por hook y pruebas presentacionales. Se eliminó.
- `src/components/ReporteEstudiante.jsx`: no tenía importadores ni rutas. La
  impresión activa continúa en `Observaciones.jsx` mediante
  `DocumentoImprimible` y está protegida por la caracterización del componente.
  Se eliminó.

## Rutas, acceso y almacenamiento

| Ruta | Protección actual | Raíz |
|---|---|---|
| `/admin/estudiantes` | `AdminRoute`; además la página exige `usuario.rol === "admin"` y navega a `/login` si no se cumple | `EstudiantesAdmin.jsx` |
| `/Formulario` | `ProtectedRoute`; la navegación del profesor la enlaza como Observaciones | `Formulario.jsx` |

| Clave local | Consumidor | Uso actual |
|---|---|---|
| `usuario` | `EstudiantesAdmin.jsx` | Autorizar el perfil administrador |
| `asignacionId` | `Formulario.jsx` | Consultar la planilla y asociar observaciones |
| `profesor` | `Observaciones.jsx` y `periodoProfesor.js` | Firma impresa y periodo específico del profesor |
| `periodo_profesor_<id>` / `periodo` | `periodoProfesor.js` | Resolver el periodo del observador |

No hay sincronización con parámetros de URL ni almacenamiento de borradores en
este módulo. Los textos editados existen solo en el estado React de cada tarjeta
hasta guardarse.

## Inventario funcional y contratos actuales

### Administración de estudiantes

- El filtro remoto inicia en `activo` y admite `activo`, `retirado`, `egresado`,
  `inactivo` y `todos`.
- La carga combina `GET /estudiantes?estado=<estado>` y `GET /cursos`.
- La búsqueda local compara nombre, apellido, email y `documento` sin distinguir
  mayúsculas.
- Crear y editar comparten el formulario extenso. Antes de enviar, cada string
  vacío se convierte en `null`.
- La creación usa `POST /estudiantes`; la edición usa
  `PUT /estudiantes/:id`.
- La precarga de edición usa `GET /estudiantes/:id`, convierte valores `null`
  en strings vacíos y excluye `id`, `estado` y `anio_escolar` del formulario.
- El cambio operativo pide confirmación y usa
  `PATCH /estudiantes/:id/estado` con `{ estado }`. Después actualiza la fila y
  la selección abierta, y retira la fila si deja de pertenecer al filtro.
- El detalle abre primero el estudiante seleccionado y consulta en paralelo,
  mediante `Promise.allSettled`, `GET /estudiantes/:id/detalles` y
  `GET /estudiantes/:id/deudas`.
- El modal tolera que falle una sola consulta. Normaliza colecciones ausentes y
  calcula `total_deuda` desde las deudas únicamente si ninguna respuesta lo
  aporta.

### Observador del profesor

- `Formulario.jsx` exige `asignacionId`; si falta, muestra la alerta vigente y
  redirige a `/`.
- `GET /planilla/:asignacionId` obtiene los estudiantes y la búsqueda local
  filtra el nombre completo.
- Cada estudiante se monta en su propia tarjeta `Observaciones`, identificada
  por `estudiante_id`.
- La consulta usa
  `GET /observaciones/:estudianteId/:asignacionId/:periodo`, señal de aborto y
  tiempo máximo de 10 segundos.
- Al cambiar estudiante, asignación o periodo se limpian las tres dimensiones y
  se descarta el resultado de la consulta anterior desmontada.
- Los estados visuales vigentes son `Verificando`, `Pendiente`,
  `Cambios sin guardar` y `Guardado`.
- El guardado permite una, dos o tres dimensiones, pero no cero. Recorta espacios
  y usa `POST /observaciones` con este contrato:

```js
{
  estudiante_id,
  asignacion_id: parseInt(asignacionId),
  periodo: periodoActivo,
  conductual,
  cognitivo,
  lenguaje,
}
```

- El éxito informa cuántas dimensiones se guardaron y conserva la asociación
  con el estudiante visible. Los errores muestran el `detail` textual del
  backend cuando existe.
- La impresión conserva estudiante, periodo, tres dimensiones y firmas de
  profesor y acudiente.

## Presentación y comportamiento responsive protegido

- El listado administrativo conserva la tabla con desplazamiento horizontal,
  chip de curso, chip de estado, selector operativo y acción Editar.
- El formulario administrativo conserva una columna en móvil y dos desde
  `md`.
- El modal conserva ancho completo acotado, alto máximo, desplazamiento interno,
  cabecera y pie fijos dentro del panel; su resumen usa una columna en móvil y
  dos desde `md`.
- Las observaciones del detalle conservan chips de periodo, materia, profesor y
  fecha, con dimensiones en una columna móvil y tres desde `sm`.
- El observador del profesor conserva una tarjeta independiente por estudiante,
  controles apilados y vista imprimible de pantalla completa.
- Se conservan literalmente textos, clases, rutas y navegación existentes.

## Invariantes

- Filtros y estados actuales del listado.
- Modal de detalle y navegación existente.
- Tolerancia a datos parciales en el detalle administrativo.
- Observador con guardado parcial y confirmación.
- Aislamiento de consultas y borradores entre estudiantes.
- Chips de periodo, materia, profesor y fecha.
- Tabla desplazable, tarjetas y composición responsive actuales.
- Permisos y acciones correspondientes al perfil activo.
- Endpoints, parámetros y payloads descritos en este documento.

## Pruebas de caracterización agregadas

`src/components/estudiantesObservador/Observaciones.test.jsx` protege:

1. la consulta por estudiante, asignación y periodo, junto con la restauración
   de las tres dimensiones;
2. el descarte de una respuesta tardía del estudiante anterior al cambiar de
   tarjeta;
3. el guardado de una sola dimensión, el recorte de espacios y la asociación
   exacta del payload con el estudiante visible.

No se cambió código de producción durante la capa 0.

## Verificación de la capa 0

- Línea base antes de cambios: `pnpm run test` correcto, 93 archivos y 330
  pruebas.
- Prueba específica: `pnpm exec vitest run
  src/components/estudiantesObservador/Observaciones.test.jsx` correcta, 1
  archivo y 3 pruebas.
- Suite después de agregar la caracterización: correcta, 94 archivos y 333
  pruebas.
- La primera ejecución dentro del sandbox falló antes de cargar Vitest con
  `spawn EPERM`; la misma orden autorizada fuera del sandbox fue correcta. No
  fue un fallo del código ni de una prueba.

## Riesgos abiertos

- El observador depende de identificadores en `localStorage` y de la forma
  `estudiante_id` entregada por planilla, mientras administración usa `id`.
  La diferencia sigue siendo intencional y queda cubierta por pruebas; debe
  incluirse en la verificación manual.
- La búsqueda administrativa consulta `documento`, pero el formulario maneja
  `documento_identidad`. Se conservó sin reinterpretar el contrato existente.
- El detalle incorpora datos académicos, financieros e inventario que provienen
  de endpoints del estudiante. Se mantienen como respuestas consumidas por este
  módulo; los dominios externos no se movieron durante la migración.
- No quedan riesgos arquitectónicos abiertos para el commit. Los puntos
  anteriores son contratos residuales que deben vigilarse en producción.

## Decisiones de la capa 0

- Se registró como base el `HEAD` confirmado por el usuario:
  `60edcb52c85c7bac5f6b05865c9ff22c7c691b98`.
- Se caracterizó primero el aislamiento del observador, por ser el riesgo con
  mayor posibilidad de asociar datos al estudiante incorrecto.
- No se creó ninguna abstracción, servicio, hook ni utilidad en esta capa.
- Las dependencias compartidas existentes se consumen sin modificarlas.
- No se eliminaron componentes sin importadores; esa limpieza solo puede ocurrir
  al demostrar que la composición activa conserva todo su contrato.

## Implementación de la capa 1

Se creó `src/utils/estudiantesObservador/` con dos unidades puras y sus pruebas:

- `estudiantes.js` conserva estados y filtros, crea el formulario inicial,
  limpia strings vacíos del payload, adapta la respuesta de edición, filtra los
  listados administrativo y del observador, normaliza el detalle parcial y
  resuelve la etiqueta de estado.
- `observaciones.js` crea el estado inicial de guardado, normaliza las tres
  dimensiones recibidas y construye el payload parcial con su conteo de
  dimensiones diligenciadas.

Las integraciones de la capa se limitaron a:

- `EstudiantesAdmin.jsx`: consume estados, formulario inicial, filtros, limpieza
  de payload, adaptación de edición y normalización del detalle desde la unidad
  pura;
- `Formulario.jsx`: delega únicamente el filtro de nombre completo;
- `Observaciones.jsx`: delega estados iniciales, normalización de la respuesta y
  construcción del payload de guardado.

No se movieron llamadas HTTP, efectos, estado React, navegación, almacenamiento,
mensajes ni JSX. Las clases de estado y la traducción de estado de guardado a
textos y clases permanecen en presentación porque no son contratos de datos.
Las transformaciones inline reemplazadas fueron retiradas; no quedan copias
activas en las tres unidades integradas.

## Pruebas y verificación de la capa 1

- `src/utils/estudiantesObservador/estudiantes.test.js`: 8 pruebas para estados
  independientes, limpieza de payload, adaptación de edición, ambos filtros,
  normalización y totalización del detalle, y etiquetas operativas.
- `src/utils/estudiantesObservador/observaciones.test.js`: 3 pruebas para estado
  inicial, normalización de dimensiones y payload parcial.
- Verificación específica conjunta con la caracterización del componente:
  `pnpm exec vitest run src/components/estudiantesObservador/Observaciones.test.jsx
  src/utils/estudiantesObservador/estudiantes.test.js
  src/utils/estudiantesObservador/observaciones.test.js`, correcta, 3 archivos y
  14 pruebas.
- ESLint focalizado sobre las páginas, componente, utilidades y pruebas
  modificadas: correcto.
- `pnpm run build`: correcto, 227 módulos transformados.
- Suite completa: `pnpm run test`, correcta, 96 archivos y 344 pruebas.

## Decisiones de la capa 1

- Se mantuvieron dos filtros explícitos porque administración busca campos
  adicionales y el observador conserva el contrato de nombre completo; no se
  creó una función configurable anticipada.
- La normalización del detalle respeta la prioridad actual del endpoint
  financiero sobre el resumen y solo calcula el total cuando ambos lo omiten.
- El constructor del observador conserva `parseInt(asignacionId)`, el periodo ya
  resuelto y los nombres exactos del payload del backend.
- `estadoClasses` y `obtenerEstadoVisual` no se extrajeron: pertenecen a la
  presentación, no a contratos ni transformaciones de dominio.
- Los componentes no montados siguen sin cambios y no consumen las nuevas
  utilidades hasta que se decida su destino en la capa de presentación.

## Implementación de la capa 2

Se creó `src/services/estudiantesObservadorApi.js` como único límite de
transporte del módulo. Expone operaciones para:

- listar estudiantes por estado y cargar cursos;
- crear, actualizar, consultar y cambiar el estado de un estudiante;
- consultar detalle académico/observador y deudas por separado;
- cargar la planilla de una asignación;
- consultar una observación con señal de cancelación y guardarla.

Todas las operaciones devuelven `response.data` y propagan el error original.
El servicio no decide alertas, confirmaciones, estados visuales, reintentos ni
navegación.

Las integraciones se limitaron a sustituir transporte:

- `EstudiantesAdmin.jsx` conserva carga paralela, mensajes, confirmación,
  actualización local por estado y composición tolerante a fallos parciales;
- `Formulario.jsx` conserva validación de `asignacionId`, redirección, búsqueda
  y estado de estudiantes;
- `Observaciones.jsx` conserva efecto, aborto a los 10 segundos, aislamiento,
  mensajes y estado de guardado;
- `CrearEstudiante.jsx`, aunque continúa sin importadores, también quedó detrás
  del servicio para no mantener transporte antiguo duplicado.

Después de la capa 2, ninguna página ni componente inventariado importa
`utils/api.js`; solo `estudiantesObservadorApi.js` conoce el cliente Axios.

## Pruebas y verificación de la capa 2

- `src/services/estudiantesObservadorApi.test.js`: 5 pruebas para rutas,
  parámetros, payloads, datos retornados, señal de cancelación, omisión de
  opciones sin señal y propagación intacta de errores.
- Verificación específica conjunta con utilidades y caracterización:
  `pnpm exec vitest run src/services/estudiantesObservadorApi.test.js
  src/components/estudiantesObservador/Observaciones.test.jsx
  src/utils/estudiantesObservador/estudiantes.test.js
  src/utils/estudiantesObservador/observaciones.test.js`, correcta, 4 archivos y
  19 pruebas.
- ESLint focalizado sobre servicio, páginas, componentes, utilidades y pruebas
  del módulo: correcto.
- `pnpm run build`: correcto, 228 módulos transformados.
- Suite completa: `pnpm run test`, correcta, 97 archivos y 349 pruebas.

## Decisiones de la capa 2

- Se conservó un servicio propio para `GET /cursos`: el servicio académico
  existente siempre construye parámetros de estado, mientras este flujo llama
  actualmente `/cursos` sin opciones. Reutilizarlo habría cambiado el contrato
  observable del transporte.
- Los chequeos manuales de `response.status` no cruzaron el límite del servicio.
  Axios ya rechaza respuestas no 2xx; una operación resuelta continúa por la
  rama de éxito y una rechazada conserva los mismos `catch` y mensajes.
- El servicio mantiene separadas las consultas de detalle y deudas para que la
  página conserve `Promise.allSettled` y su tolerancia actual a datos parciales.
- La señal del observador es opcional en el servicio y solo agrega el objeto de
  opciones cuando existe, preservando las formas exactas de las llamadas.

## Implementación de la capa 3

Se creó `src/hooks/estudiantesObservador/` con tres hooks de consulta:

- `useListadoEstudiantesAdmin.js`: carga estudiantes y cursos en paralelo,
  conserva filtro operativo y búsqueda local, expone recarga para los comandos
  todavía ubicados en la página y descarta resultados de filtros anteriores;
- `useDetalleEstudianteAdmin.js`: administra estudiante abierto, carga parcial,
  error y cierre del modal; conserva `Promise.allSettled`, limpia el detalle al
  abrir y evita que una respuesta tardía o un modal cerrado actualicen la vista;
- `usePlanillaObservador.js`: carga la planilla, conserva la búsqueda explícita
  por nombre completo, expone carga/error y descarta respuestas de una
  asignación anterior.

Las páginas quedaron integradas así:

- `EstudiantesAdmin.jsx` conserva autorización, alertas y todos los comandos,
  pero ya no contiene efectos ni transporte para listado, cursos o detalle;
- `Formulario.jsx` conserva lectura superior de `asignacionId` y periodo,
  redirección por asignación ausente, mensaje de búsqueda vacía y composición de
  tarjetas, pero delega consulta y filtrado al hook.

`Observaciones.jsx` no se modificó en esta capa: su consulta está acoplada al
estado editable y se extraerá junto con el formulario/guardado en la capa 4 para
no dividir la misma máquina de estados entre dos hooks prematuros.

## Pruebas y verificación de la capa 3

- `useListadoEstudiantesAdmin.test.js`: 3 pruebas de carga inicial, búsqueda,
  cambio de estado con respuesta tardía y recuperación tras error.
- `useDetalleEstudianteAdmin.test.js`: 3 pruebas de respuesta financiera
  parcial, aislamiento entre estudiantes y cierre con consulta pendiente.
- `usePlanillaObservador.test.js`: 4 pruebas de carga/búsqueda, ausencia de
  estudiantes, cambio de asignación y error propagado.
- Verificación específica acumulada: 7 archivos y 29 pruebas correctas.
- ESLint focalizado sobre hooks y unidades integradas: correcto.
- `pnpm run build`: correcto, 231 módulos transformados.
- Suite completa: `pnpm run test`, correcta, 100 archivos y 359 pruebas.

## Decisiones de la capa 3

- Los hooks usan identificadores incrementales para invalidar resultados
  antiguos. No se amplió el contrato HTTP de listado y detalle con señales solo
  para anticipar una abstracción; el observador conserva su aborto real ya
  existente.
- El hook de listado expone `setEstudiantes` porque el cambio de estado aún debe
  actualizar localmente la colección en la capa de comandos. Esa salida se
  reevaluará al terminar la capa 4.
- El hook de detalle expone `setSelectedEstudiante` temporalmente para conservar
  la actualización del chip de estado del estudiante abierto.
- Alertas, redirección y mensajes de consola permanecen en las páginas cuando
  son decisiones de interfaz; los hooks exponen el error original.
- La lectura de `localStorage` permanece en las raíces de composición y no se
  trasladó a los hooks de dominio.

## Implementación de la capa 4

Se agregaron tres hooks de comandos y formularios:

- `useFormularioEstudianteAdmin.js`: administra apertura, borrador, edición,
  validación, normalización, creación, actualización, reinicio y recarga del
  listado;
- `useCambioEstadoEstudianteAdmin.js`: conserva confirmación, endpoint, estado
  retornado, actualización de lista/selección y retiro de filas que dejan el
  filtro activo;
- `useObservacionEstudiante.js`: concentra consulta con aborto, aislamiento,
  tres campos editables, marca de modificación, guardado parcial, progreso,
  hora de actualización y errores de carga/guardado.

Los hooks devuelven resultados explícitos (`validacion`, `sin_cambios`,
`cancelado`, `exito`, `vacio` o `error`). De esta forma:

- `EstudiantesAdmin.jsx` conserva literalmente alertas de validación, éxito y
  error, y sigue renderizando todo el formulario, listado y modal;
- `Observaciones.jsx` conserva SweetAlert, textos, estado visual, impresión y
  JSX, mientras delega la máquina de consulta/edición/guardado;
- no se extrajeron componentes presentacionales ni se cambiaron clases, rutas o
  navegación.

El botón superior del formulario conserva su diferencia histórica: al ocultar
un estudiante nuevo mantiene el borrador, pero al ocultar una edición reinicia
el formulario. El botón Cancelar interno sigue reiniciando siempre.

## Pruebas y verificación de la capa 4

- `useFormularioEstudianteAdmin.test.js`: 5 pruebas de validación, creación,
  normalización, edición, borrador y errores explícitos.
- `useCambioEstadoEstudianteAdmin.test.js`: 3 pruebas de confirmación,
  actualización/filtrado, cancelación y error sin mutación.
- `useObservacionEstudiante.test.js`: 4 pruebas de carga, guardado parcial,
  formulario vacío y detalle de error del backend.
- Verificación específica acumulada: 10 archivos y 41 pruebas correctas.
- ESLint focalizado sobre hooks y unidades integradas: correcto.
- `pnpm run build`: correcto, 234 módulos transformados. Vite informó solo una
  advertencia de tiempos de plugins, sin errores de compilación.
- Suite completa: `pnpm run test`, correcta, 103 archivos y 371 pruebas.

## Decisiones de la capa 4

- Las confirmaciones pertenecen al hook de comando, pero la función se puede
  inyectar para probar el contrato sin acoplar las pruebas al diálogo nativo.
- Alertas, SweetAlert y mensajes de consola permanecen en las unidades visuales
  mediante la interpretación de resultados; los hooks no deciden textos.
- La consulta del registro y el formulario del observador se extrajeron juntos
  porque comparten limpieza de dimensiones y una sola máquina de estados. Crear
  dos hooks habría exigido sincronización duplicada.
- `vistaImpresion` y la resolución de firmas permanecen en `Observaciones.jsx`
  por ser estado y composición exclusivamente visuales.
- `CrearEstudiante.jsx` conserva por ahora su implementación antigua no montada.
  No se conectó artificialmente al hook del formulario activo; se resolverá al
  consolidar presentación.

## Implementación de la capa 5

Se creó `src/components/estudiantesObservador/` con presentación específica del
dominio:

- `admin/EncabezadoEstudiantesAdmin.jsx`: título, descripción, búsqueda, filtro
  operativo y apertura/cierre del formulario;
- `admin/FormularioEstudianteAdmin.jsx`: formulario completo de creación y
  edición, con las mismas secciones, campos, opciones, clases y conversión
  numérica de descuentos;
- `admin/ListaEstudiantesAdmin.jsx`: tabla desplazable, iniciales, curso, chip de
  estado, selector, edición y estado vacío;
- `admin/DetalleEstudianteAdmin.jsx`: modal responsive, rendimiento, deudas,
  inventario, observaciones, chips y estados de carga/error;
- `FormularioObservacionEstudiante.jsx`: encabezado, badge, tres dimensiones y
  acciones de guardar/imprimir mediante props.

`EstudiantesAdmin.jsx` quedó reducido de 880 a una raíz de aproximadamente 150
líneas que conecta hooks, interpreta resultados y compone cuatro componentes.
`Observaciones.jsx` conserva consulta/comandos mediante hook, SweetAlert e
impresión, pero delega todo su formulario editable al componente presentacional.

Se comprobó por búsqueda de importadores antes de eliminar
`CrearEstudiante.jsx` y `ReporteEstudiante.jsx`. Ninguno estaba montado, lazy
loaded ni importado; las implementaciones activas equivalentes ya tenían pruebas.

## Pruebas y verificación de la capa 5

- `EncabezadoEstudiantesAdmin.test.jsx`: filtros y callbacks de búsqueda,
  estado y apertura.
- `FormularioEstudianteAdmin.test.jsx`: 2 pruebas de creación, secciones,
  campos controlados, curso, envío, cancelación y edición.
- `ListaEstudiantesAdmin.test.jsx`: 2 pruebas de fila/acciones aisladas y estado
  vacío.
- `DetalleEstudianteAdmin.test.jsx`: 2 pruebas de resumen parcial, chips,
  dimensiones, cierre, carga y fallo total.
- `FormularioObservacionEstudiante.test.jsx`: estado, edición y callbacks de
  guardado e impresión.
- Verificación específica acumulada: 15 archivos y 49 pruebas correctas.
- ESLint focalizado sobre componentes y unidades integradas: correcto.
- `pnpm run build`: correcto, 239 módulos transformados.
- Suite completa: `pnpm run test`, correcta, 108 archivos y 379 pruebas.

## Decisiones de la capa 5

- Los componentes reciben datos y callbacks; no importan servicios ni hooks de
  dominio.
- Las constantes/clases visuales del estado operativo viven con la tabla. No se
  crearon estilos compartidos porque no hay un segundo dominio consumidor.
- El formulario usa helpers locales `Campo` y `Seccion` solo para eliminar
  repetición interna; no se promovieron como abstracciones globales.
- El modal mantiene juntas las secciones de rendimiento, finanzas, inventario y
  observador porque forman una sola experiencia de detalle y comparten cierre y
  desplazamiento responsive.
- La eliminación de los dos componentes antiguos no cambia rutas ni UI: ambos
  carecían de consumidores. Evita dejar implementaciones duplicadas para el
  cierre del módulo.

## Implementación de la capa 6

Se agregó `VistaPlanillaObservador.jsx` como presentación de título, búsqueda y
contenedores de tarjetas. Recibe valor, callbacks y tarjetas mediante
`children`; no conoce almacenamiento, periodo, servicios ni hooks.

`Formulario.jsx` quedó dedicado a:

- leer `asignacionId` y periodo;
- conectar `usePlanillaObservador`;
- conservar redirección, alerta de búsqueda sin datos y reporte de error;
- crear una instancia de `Observaciones` por estudiante;
- componer `VistaPlanillaObservador`.

`EstudiantesAdmin.jsx` se auditó sin cambios adicionales: ya lee el usuario,
conecta cuatro hooks, interpreta resultados visuales y compone encabezado,
formulario, tabla y modal. No contiene HTTP, transformaciones de dominio ni
bloques visuales extensos.

## Pruebas y verificación de la capa 6

- `src/pages/Formulario.test.jsx`: caracteriza asignación, periodo, conexión del
  hook, búsqueda y asociación de props por estudiante. Se agregó y ejecutó sobre
  la implementación previa antes de extraer la vista.
- `VistaPlanillaObservador.test.jsx`: protege título, búsqueda, callbacks y
  contenedores de tarjetas.
- Verificación específica acumulada: 17 archivos y 51 pruebas correctas.
- ESLint focalizado sobre páginas y módulo: correcto.
- `pnpm run build`: correcto, 240 módulos transformados.
- Suite completa: `pnpm run test`, correcta, 110 archivos y 381 pruebas.

## Decisiones de la capa 6

- La página sigue creando las tarjetas `Observaciones` porque asociar contexto
  de asignación/periodo con cada estudiante es composición, no presentación.
- La vista recibe las tarjetas como `children` y aplica únicamente el borde y
  espaciado vigentes; no usa un render prop ni conoce el contrato del estudiante.
- Los efectos de redirección y reporte de error permanecen en la raíz porque
  dependen del contexto superior y de decisiones de navegación/interfaz.
- No se adelantó ninguna tarea de cierre: la documentación global y
  `check:deploy` quedan reservados para la capa 7.

## Implementación y cierre de la capa 7

- Se actualizaron `ARQUITECTURA_FRONTEND.md`, `COMPONENTES.md`,
  `CAMBIOS_FRONTEND.md` y el orden global de modularización para reflejar la
  estructura activa y retirar referencias a componentes legacy.
- Se auditó que `estudiantesObservadorApi.js` sea la única frontera HTTP del
  módulo y que páginas, hooks y componentes respeten sus responsabilidades.
- Se comprobó que `CrearEstudiante.jsx` y `ReporteEstudiante.jsx` ya no existen
  y que no quedan imports, rutas ni implementaciones antiguas equivalentes.
- Como corrección del cierre, `Observaciones.jsx` y su prueba se ubicaron dentro
  de `components/estudiantesObservador/`; no queda un contenedor específico del
  dominio en la raíz general de componentes.
- Se corrigió la recuperación del observador al volver a una clase. La planilla
  conserva todas las tarjetas, pero `useCargaObservacionVisible` activa cada
  consulta al acercarse al viewport; filtrar un estudiante lo vuelve visible y
  dispara su carga sin consultar simultáneamente todo el curso.
- `useObservacionEstudiante` distingue ausencia, error y tiempo de espera,
  expone reintento y conserva el aislamiento al desmontar o cambiar de clave.
  Mientras existe un error, el formulario bloquea edición, guardado e impresión
  para no sobrescribir un registro que no pudo recuperarse.
- El diff final se limita a estudiantes y observador, sus pruebas y la
  documentación específica/global exigida para cerrar el último nivel.

## Pruebas y verificación final de la capa 7

- Pruebas específicas acumuladas: 18 archivos y 57 pruebas correctas. Incluyen
  activación por visibilidad, error sin falso `Pendiente`, reintento y ciclo de
  guardar, desmontar y recuperar la observación.
- `pnpm run check:deploy`: correcto; 111 archivos y 387 pruebas, ESLint sin
  errores y build de producción correcto con 241 módulos transformados.
- `git diff --check`: correcto.
- Auditoría de estado, alcance, imports, endpoints y duplicaciones: correcta.

## Decisiones de la capa 7

- La documentación global solo registra la arquitectura ya implementada; no se
  adelantó trabajo de otro módulo.
- La ruta `/Formulario` conserva su capitalización vigente y el módulo mantiene
  los identificadores exactos entregados por cada contrato del backend.
- La corrección se resolvió dentro de los límites existentes: el hook controla
  visibilidad, consulta y reintento; presentación comunica y bloquea el estado
  inseguro; servicio, endpoints y payloads permanecen intactos.
- Si el navegador no ofrece `IntersectionObserver`, el hook habilita la carga
  inmediata como fallback para conservar funcionalidad.
- El módulo queda listo para un único commit del usuario. No se hizo commit,
  push ni deploy.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada el 2026-08-02 |
| 1. Utilidades puras | Terminada el 2026-08-02 |
| 2. Servicio HTTP | Terminada el 2026-08-02 |
| 3. Hooks de consulta | Terminada el 2026-08-02 |
| 4. Hooks de comandos | Terminada el 2026-08-02 |
| 5. Presentación | Terminada el 2026-08-02 |
| 6. Composición | Terminada el 2026-08-02 |
| 7. Cierre | Terminada el 2026-08-02 |

## Entrega final

- Última capa terminada: Capa 7, cierre del módulo.
- Verificación final: 57 pruebas específicas; `check:deploy` con 387 pruebas,
  lint y build correctos; `git diff --check` y auditoría final correctos.
- Archivos pendientes: ninguno dentro de la migración.
- Riesgos residuales: diferencia contractual intencional entre `id` y
  `estudiante_id`, y búsqueda por `documento` frente al campo de formulario
  `documento_identidad`; no deben reinterpretarse sin cambiar el backend.
- Siguiente capa: ninguna; el módulo está terminado.
- Siguiente acción exacta: verificar manualmente en producción, crear el único
  commit del módulo, hacer push a `origin/main` y revisar el deploy. Estas
  acciones quedan a cargo del usuario.
