# Modularización: Planilla

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 2.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `0f74233`.
- Commit final: `ef95bf7`.
- Última actualización: 2026-08-05.

## Objetivo

Separar carga académica, tipos de evaluación, notas, promedios y presentación
responsive sin modificar cálculos ni reglas del backend.

## Inventario confirmado en capa 0

- `src/pages/Planilla.jsx`
- `src/components/PlanillaRow.jsx`
- `src/components/EncabezadoContextoCurso.jsx` como dependencia compartida
  (también usada por asistencia).
- `src/constants/valoracionesDesarrollo.js`
- `src/utils/periodoProfesor.js` como dependencia compartida (también usada
  por asistencia).
- `PlanillaMobileCard` vive como función interna no exportada dentro de
  `Planilla.jsx`; solo se ejerce a través de la página, no tiene archivo
  propio todavía.

### Entrada, rol y contexto

- Ruta protegida: `/planilla`, declarada en `src/App.jsx` y enlazada desde
  `NavProfesor.jsx` (escritorio y móvil) bajo "Control Académico".
- Rol efectivo: profesor autenticado vía `ProtectedRoute` (usuario o profesor
  en `localStorage`); Planilla en particular solo usa `profesor`.
- Contexto leído desde `localStorage`:
  - `profesor` aporta `id`;
  - `asignacionId` identifica la clase activa (leída una sola vez al montar,
    en el `useState` inicial);
  - `fechaAsistencia` se reutiliza para mostrar "Fecha de trabajo" en el
    encabezado, aunque el nombre de la clave proviene del flujo de
    asistencia;
  - `periodo_profesor_<id>` (o `periodo` de respaldo, o `"1"`) vía
    `obtenerPeriodoProfesor()`;
  - `planillaTipoEvaluacion` conserva el tipo de calificación elegido
    (`numerica` por defecto).
- `DashboardProfesor.jsx` sigue siendo el productor de asignación, período y
  fecha; no se modifica en este módulo.

### Contratos HTTP vigentes

| Método | Ruta | Contrato consumido o enviado |
|---|---|---|
| `GET` | `/mis-clases/:profesorId` | Arreglo de clases; `Planilla.jsx` compara `id` con `asignacionId` (`==`) y usa `materia`/`curso`. Mismo endpoint que ya encapsula `src/services/asistenciaApi.js`, con consumo independiente. |
| `GET` | `/planilla-excel/:asignacionId/:periodo` | Lee `response.data.columnas` (nombres de columna) y `response.data.data` (una fila por estudiante con `estudiante_id`, `nombre`, `apellido`, `notas` y opcionalmente `valoraciones`). Mismo endpoint que ya usa `obtenerPlanillaAsistencia` en `asistenciaApi.js`, pero con una forma de consumo distinta: asistencia solo necesita el roster. |
| `POST` | `/planilla/nota` | Envía `{ estudiante_id, asignacion_id: Number, nota: Number|null, descripcion, periodo: Number, tipo_evaluacion, valoracion: string|null }` por celda. Se reutiliza para guardar notas, limpiar notas y crear un tipo de evaluación (primer estudiante, `nota: null`). |
| `DELETE` | `/planilla/tipo` | Query string `asignacion_id`, `descripcion` (con `encodeURIComponent`) y `periodo`. Elimina el tipo de evaluación para todos los estudiantes. |

Nota de coordinación: `/mis-clases/:profesorId` y
`/planilla-excel/:asignacionId/:periodo` ya están detrás de
`src/services/asistenciaApi.js` para el dominio de asistencia, ya terminado.
Desde la capa 2, planilla tiene su propio `src/services/planillaApi.js` con
su propia forma de consumo; `asistenciaApi.js` no se movió ni se modificó.

### Estados y comportamiento visual

- Carga de estudiantes/columnas: sin estado de carga explícito; la tabla y
  las tarjetas están vacías hasta que responde `cargarPlanilla`.
- Estado vacío: "No hay estudiantes para mostrar." (ambas vistas) y "No hay
  tipos de evaluación registrados." (solo tarjeta móvil, cuando
  `columnas.length === 0`).
- Gestión de tipos: los botones "Agregar Tipo"/"Eliminar Tipo" muestran
  spinner y texto "Agregando..."/"Eliminando..." mientras
  `accionTipoEnCurso` está activo; ambos controles se deshabilitan durante la
  acción.
- Notas numéricas: `input[type=number]` con `min=1 max=5 step=0.1`; fuera de
  rango dispara SweetAlert "Nota inválida" y restaura el valor anterior con
  foco y selección.
- Valoraciones de desarrollo: botones con emoji por estudiante y columna; el
  activo se resalta en esmeralda.
- Promedio: oculto (`—`) en modo desarrollo; en modo numérico usa verde
  esmeralda (`>= 3`) o rojo (`< 3`).
- Responsive: `PlanillaMobileCard` se renderiza en `md:hidden`; la tabla de
  escritorio en `hidden md:block`. Bajo jsdom ambos bloques coexisten en el
  DOM (no hay medios CSS), lo que exige delimitar el contenedor consultado en
  las pruebas.
- Traducción automática: nombres de estudiante y etiquetas de columna llevan
  `translate="no"`.
- Navegación por contexto inválido: sin `profesorId` redirige a `/login`; sin
  `asignacionId`/`periodo` muestra `alert(...)` y redirige a `/` (con la
  bandera `avisoSeleccionRef` para no duplicar el aviso); un `403` al cargar
  la planilla limpia `asignacionId`, avisa con `alert(...)` y redirige a `/`.
  Estas tres ramas escriben directamente en `window.location.href` y, siguiendo
  el precedente de asistencia, no se cubren con pruebas de DOM (ver riesgos
  residuales).

## Invariantes

- Selección recordada de clase, periodo y tipo de evaluación.
- Vista de tarjetas en móvil y tabla en escritorio.
- Creación, edición y eliminación de tipos de evaluación.
- Cálculo y restauración de notas y promedios.
- Manejo de valoraciones de desarrollo.
- Protección de etiquetas ante traducción automática.
- Contrato de guardado por celda (`POST /planilla/nota`) y de borrado de tipo
  (`DELETE /planilla/tipo`) exactamente como hoy.
- La columna interna `mas_alto` permanece oculta y reservada (no se puede
  crear un tipo de evaluación con ese nombre).
- `cargarClases` no tiene manejo de error, a diferencia de asistencia; un
  fallo se convierte en una promesa rechazada sin capturar. Se conserva tal
  cual; no es un defecto a corregir en esta migración.
- El selector de tipo de calificación persiste en `planillaTipoEvaluacion` y
  se respeta al montar.

## Riesgos iniciales

- Alterar cálculos, redondeos o notas fuera de rango.
- Desalinear estudiantes y columnas de evaluación.
- Perder estados de carga o bloquear guardados válidos.
- Confundir reglas numéricas con valoraciones cualitativas.
- Duplicación de renderizado responsive (tarjeta y tabla) en el mismo árbol
  bajo pruebas; una prueba mal delimitada puede pasar por accidente al
  matchear el elemento equivocado.
- Los inputs de nota son no controlados con `key` estable; una recarga tras
  guardar no reemplaza el valor mostrado salvo que la fila se desmonte. Se
  documenta como comportamiento existente, no se corrige.
- La normalización de coma decimal (`normalizarNumeroNota`) no se protegió
  con una prueba de DOM por la sanitización nativa de `input[type=number]`;
  se cubrirá con una prueba unitaria directa cuando la función se extraiga en
  la capa 1.
- Dos módulos (asistencia y planilla) llaman a los mismos dos endpoints con
  formas de consumo distintas; coordinar cualquier cambio de contrato futuro
  entre ambos documentos.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-08-05) |
| 1. Utilidades puras | Terminada (2026-08-05) |
| 2. Servicio HTTP | Terminada (2026-08-05) |
| 3. Hooks de consulta | Terminada (2026-08-05) |
| 4. Hooks de comandos | Terminada (2026-08-05) |
| 5. Presentación | Terminada (2026-08-05) |
| 6. Composición | Terminada (2026-08-05) |
| 7. Cierre | Terminada (2026-08-05) |

## Verificación de capa 0

- Línea base antes de modificar: `pnpm run test` — 167 archivos, 592 pruebas
  correctas.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/PlanillaRow.test.jsx` — 2 archivos, 11 pruebas correctas.
- Lint dirigido: `pnpm exec eslint src/pages/Planilla.jsx
  src/pages/Planilla.test.jsx src/components/PlanillaRow.jsx
  src/components/PlanillaRow.test.jsx` — correcto, sin advertencias.
- Suite completa tras agregar las pruebas: 169 archivos, 603 pruebas
  correctas.
- Caracterización agregada junto a las unidades:
  - `src/pages/Planilla.test.jsx` protege la carga de clases y planilla, la
    columna interna oculta, el cálculo de promedio, el guardado y la
    limpieza de notas numéricas, el rechazo de notas fuera de rango con
    restauración del valor anterior, el alta de tipos de evaluación
    (bloqueo de nombres reservados y duplicados), la baja de tipos con
    confirmación y codificación de la URL, las valoraciones de desarrollo y
    la persistencia del tipo de calificación en `localStorage`;
  - `src/components/PlanillaRow.test.jsx` protege los límites del input
    numérico, el color del promedio, la restauración tras un guardado
    rechazado y el resaltado/callback de las valoraciones de desarrollo.

## Decisiones de capa 0

- Se tomó `0f74233` como commit base porque es el commit publicado en
  `main`/`origin/main` al iniciar el módulo; el documento no tenía una línea
  base registrada todavía.
- La protección se hizo sobre las unidades existentes (`Planilla.jsx`,
  `PlanillaRow.jsx`) sin mover código ni introducir límites arquitectónicos
  todavía.
- `EncabezadoContextoCurso` y `periodoProfesor` permanecen compartidos porque
  ya tienen uso real fuera de planilla (asistencia); no se duplican ni se
  especializan.
- `VistaPlanillaObservador`, `usePlanillaObservador` y
  `estudiantesObservadorApi.js` (`GET /planilla/:asignacionId`) se
  inventariaron y se descartaron del alcance: pertenecen al módulo
  "Estudiantes y observador", ya terminado, y usan un endpoint distinto
  (`/planilla/:asignacionId`, no `/planilla-excel` ni `/planilla/nota`);
  coinciden con "planilla" solo en el nombre.
- Las pruebas de `PlanillaRow` envuelven la fila en `<table><tbody>` porque
  el componente retorna un `<tr>`; a diferencia de `AsistenciaRow` (un
  `<div>`), no puede probarse sin ese contexto.
- Las pruebas de la página usan `fireEvent.change`/`fireEvent.blur` para los
  inputs numéricos (evita la sanitización nativa de `input[type=number]` que
  interfiere con `user.type`) y `userEvent` para selects, botones y campos de
  texto.
- No se probaron las ramas de redirección (`/login`, selección faltante,
  `403`) porque escriben directamente en `window.location.href`; se
  documentan como riesgo residual, igual que en asistencia.

## Verificación de capa 1

- Línea base antes de modificar: la de cierre de capa 0 — 169 archivos, 603
  pruebas correctas.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/PlanillaRow.test.jsx src/utils/planilla/notas.test.js` — 3
  archivos, 19 pruebas correctas.
- Lint dirigido sobre la página, `notas.js` y sus pruebas: correcto, sin
  advertencias.
- Suite completa tras la extracción: 170 archivos, 611 pruebas correctas.
- `src/utils/planilla/notas.js` contiene ahora:
  - detección y filtrado de la columna interna reservada (`esColumnaInterna`,
    `obtenerColumnasVisibles`);
  - formateo de etiquetas de columna (`formatearEtiquetaColumna`);
  - notas visibles y cálculo de promedio (`obtenerNotasVisibles`,
    `calcularPromedioNotas`);
  - normalización de coma decimal (`normalizarNumeroNota`);
  - normalización de la lista de estudiantes (`normalizarEstudiantesPlanilla`);
  - construcción del payload de nota (`construirPayloadNota`).
- `src/utils/planilla/notas.test.js` protege la columna reservada, el
  formateo (vacío, reservada, separadores, espacios múltiples), las notas
  visibles, el promedio con valores inválidos o ausentes, la normalización de
  coma decimal, la ausencia de mutación al normalizar estudiantes, y las dos
  formas del payload (numérica y desarrollo).

## Decisiones de capa 1

- Se creó `src/utils/planilla/notas.js`, nombrado por dominio ("notas") y no
  por rol, siguiendo la convención mayoritaria del proyecto (`boletines`,
  `certificadosImpresion`, `estudiantesObservador`) en lugar del patrón
  `profesor.js` usado en asistencia.
- Se unificó el literal `"mas_alto"` bajo una constante privada
  `COLUMNA_INTERNA_MAS_ALTO`, usada tanto por `esColumnaInterna` como por
  `formatearEtiquetaColumna`; en el original vivía duplicado como dos
  literales de texto independientes. Es un cambio de forma sin efecto en el
  comportamiento: ambas ramas seguían produciendo la misma columna oculta y
  la misma etiqueta "Más alto" para el mismo valor de entrada.
- Se agregó `obtenerColumnasVisibles`, no listada explícitamente en la acción
  prevista, porque la página ya filtraba `data.columnas` con
  `esColumnaInterna` en línea; encapsularla evita duplicar ese filtro cuando
  el servicio HTTP se cree en la capa 2.
- Se agregó `construirPayloadNota` porque los tres llamados a
  `POST /planilla/nota` construían manualmente el mismo objeto de seis
  campos con las mismas conversiones `parseInt`. Los tres sitios ahora usan
  el mismo builder, cubierto por prueba; el contrato enviado al backend no
  cambió (mismos campos y mismos valores, verificado por
  `src/pages/Planilla.test.jsx`, que sigue en verde sin modificar sus
  aserciones de payload).
- La construcción de la URL de `DELETE /planilla/tipo` (query string con
  `encodeURIComponent`) se dejó intacta en `Planilla.jsx`: es
  responsabilidad de rutas y transporte, y se moverá en la capa 2 junto con
  el resto de las llamadas HTTP.
- Se retiró el comentario `// revisar body` que acompañaba el payload
  principal de guardado; la extracción a una función probada resuelve la
  duda que anotaba.
- `PlanillaRow.jsx` no cambió: ya recibía `formatearEtiquetaColumna` como
  prop desde la página, así que le es indiferente de dónde proviene la
  función.
- `Planilla.jsx` conserva las llamadas `api.get/post/delete`, el estado, los
  efectos y todo el JSX; solo las funciones puras y la construcción del
  payload se movieron. Ningún import de `utils/api.js` cambió de alcance
  todavía.

## Verificación de capa 2

- Línea base antes de modificar: la de cierre de capa 1 — 170 archivos, 611
  pruebas correctas.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/PlanillaRow.test.jsx src/utils/planilla/notas.test.js
  src/services/planillaApi.test.js` — 4 archivos, 23 pruebas correctas.
- Lint dirigido sobre página, utilidades, servicio y sus pruebas: correcto,
  sin advertencias.
- Suite completa tras crear el servicio: 171 archivos, 615 pruebas
  correctas.
- Auditoría de transporte: `grep -n "api\."` y `grep -n "utils/api"` sobre
  `src/pages/Planilla.jsx` no arrojan resultados; la página ya no importa
  `utils/api.js`.
- `src/services/planillaApi.js` centraliza las cuatro rutas del módulo:
  `listarClasesProfesorPlanilla` (`GET /mis-clases/:profesorId`),
  `obtenerPlanillaNotas` (`GET /planilla-excel/:asignacionId/:periodo`),
  `guardarNotaPlanilla` (`POST /planilla/nota`) y
  `eliminarTipoEvaluacionPlanilla` (`DELETE /planilla/tipo`, con
  `encodeURIComponent` sobre la descripción).
- `src/services/planillaApi.test.js` protege las cuatro rutas, el envío del
  payload de nota sin alterarlo, la codificación de la URL de borrado y la
  propagación de señales de cancelación y errores sin reinterpretarlos.

## Decisiones de capa 2

- Las cuatro operaciones aceptan un `AbortSignal` opcional
  (`{ signal } = {}`), igual que `asistenciaApi.js`. Cuando no se suministra
  —el caso actual, porque `Planilla.jsx` todavía no gestiona
  `AbortController`— las llamadas conservan exactamente los argumentos HTTP
  previos (`api.get(url)`, `api.post(url, payload)`, `api.delete(url)`, sin
  segundo argumento). Esto se confirmó dejando
  `src/pages/Planilla.test.jsx` sin modificar: sus 8 pruebas, escritas contra
  `utils/api.js` en la capa 0, siguen en verde después de intercalar el
  servicio.
- El servicio no captura ni reinterpreta errores: los rechazos de axios
  (incluida la rama `403` que revisa `error.response?.status`) siguen
  propagándose intactos hasta los `try/catch` que ya existían en
  `Planilla.jsx`.
- Se aprovechó el reemplazo de las llamadas en `cargarClases` para retirar el
  comentario vacío `//` y `// revisar respuesta` que quedaban pegados a la
  línea de transporte; se conservó el `console.log("CLASES:", data)` tal
  cual, porque es comportamiento observable existente y no una anotación de
  código.
- La query de `DELETE /planilla/tipo` (incluida su `encodeURIComponent`) se
  movió sin cambios al servicio, tal como se anticipó en la capa 1.
- `asistenciaApi.js` no se tocó; `planillaApi.js` es un archivo nuevo e
  independiente, consistente con la nota de coordinación registrada en la
  capa 0.

## Verificación de capa 3

- Línea base antes de modificar: la de cierre de capa 2 — 171 archivos, 615
  pruebas correctas.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/PlanillaRow.test.jsx src/utils/planilla/notas.test.js
  src/services/planillaApi.test.js
  src/hooks/planilla/useConsultasPlanillaProfesor.test.js` — 5 archivos, 28
  pruebas correctas.
- Lint dirigido sobre página, hook y sus pruebas: correcto, sin
  advertencias (se corrigieron dos avisos de `react-hooks/exhaustive-deps`
  envolviendo la cancelación de cada efecto en su propio `useCallback`, igual
  que `useConsultasAsistenciaProfesor`).
- Suite completa tras crear el hook: 172 archivos, 620 pruebas correctas.
- Ajuste necesario en `src/pages/Planilla.test.jsx`: las dos aserciones de
  `apiMock.get` (`/mis-clases/:id` y `/planilla-excel/:id/:periodo`) ahora
  incluyen `{ signal: expect.any(AbortSignal) }`, porque el hook siempre crea
  su propio controlador. Es el único cambio hecho a esa prueba desde la capa
  0; el resto de sus 8 casos y los payloads de `POST`/`DELETE` (que no pasan
  `signal` porque los comandos siguen en la página) quedaron intactos.
- `src/hooks/planilla/useConsultasPlanillaProfesor.js` concentra la carga de
  clases y de la planilla (estudiantes normalizados y columnas visibles), con
  un `AbortController` independiente por consulta.
- `src/hooks/planilla/useConsultasPlanillaProfesor.test.js` protege la carga
  inicial con sus argumentos exactos, la asimetría de habilitación (la
  planilla se consulta aunque falte `profesorId`, las clases no), la
  cancelación y descarte de una recarga de planilla superpuesta, la
  delegación de un `403` mediante callback sin pisar los datos previos, y la
  disponibilidad de `setEstudiantes`/`setColumnas` para el código de
  comandos que todavía vive en la página.

## Decisiones de capa 3

- `asignacionId` y `periodo` se leen una sola vez al montar
  (`useState` sin usar su función `set`), así que dentro de un mismo montaje
  nunca cambian; el escenario de "cancelar por cambio de asignación" de
  asistencia no aplica igual aquí. La cancelación sigue siendo valiosa por
  dos motivos reales y sí cubiertos por prueba: descartar una respuesta de
  `cargarPlanilla` que quedó en curso cuando una recarga más nueva la
  reemplaza (recargas repetidas tras guardados sucesivos), y abortar
  solicitudes en curso al desmontar la página.
- Se preservó la asimetría exacta del código original: `cargarClases`
  requiere `profesorId` (además de `asignacionId`/`periodo`, que ya gatillan
  el efecto) y no tiene manejo de errores; `cargarPlanilla` no exige
  `profesorId` y conserva su `try/catch` con `console.error` y la detección
  de `403`. Ninguna de las dos reglas se unificó ni se "corrigió".
- El aviso de clase no disponible (limpiar `asignacionId`, alertar y
  redirigir) se movió a `Planilla.jsx` como callback
  `onClaseNoDisponible`, igual que hizo asistencia: el hook solo decide que
  ocurrió un `403`, la página decide qué hacer con la navegación.
- El hook expone `setEstudiantes` y `setColumnas` además de sus valores de
  lectura. Es un puente deliberado y temporal: `guardarNota`,
  `agregarTipoEvaluacion` y `eliminarTipoEvaluacion` todavía viven en
  `Planilla.jsx` (capa 4 pendiente) y siguen mutando ese mismo estado de
  forma optimista antes de recargar. Cuando la capa 4 extraiga esos comandos
  a su propio hook, dejará de ser necesario exponer los setters del hook de
  consulta.
- `console.log("CLASES:", data)` se conservó sin cambios dentro del hook,
  igual que en la capa 2.
- `Planilla.jsx` conserva la lectura de `profesor`/`asignacionId`/`periodo`,
  las dos redirecciones de contexto inválido (`/login`, selección faltante)
  y todo el JSX; solo dejó de declarar `estudiantes`, `columnas`, `clases`,
  `cargarClases` y `cargarPlanilla` como propios.

## Verificación de capa 4

- Línea base antes de modificar: la de cierre de capa 3 — 172 archivos, 620
  pruebas correctas.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/PlanillaRow.test.jsx src/utils/planilla/notas.test.js
  src/services/planillaApi.test.js
  src/hooks/planilla/useConsultasPlanillaProfesor.test.js
  src/hooks/planilla/useComandosPlanillaProfesor.test.js` — 6 archivos, 35
  pruebas correctas.
- Lint dirigido sobre página, hooks y sus pruebas: correcto, sin
  advertencias.
- Suite completa tras crear el hook de comandos: 173 archivos, 627 pruebas
  correctas.
- `src/pages/Planilla.test.jsx` no requirió ningún cambio en esta capa: sus
  8 pruebas, que ejercitan `guardarNota`, `agregarTipoEvaluacion` y
  `eliminarTipoEvaluacion` a través del DOM desde la capa 0, siguen en verde
  con la lógica ya viviendo en el hook.
- `src/hooks/planilla/useComandosPlanillaProfesor.js` concentra
  `nuevoTipo`, `tipoEliminar`, `accionTipoEnCurso` y las tres funciones de
  comando (`guardarNota`, `agregarTipoEvaluacion`, `eliminarTipoEvaluacion`).
- `src/hooks/planilla/useComandosPlanillaProfesor.test.js` protege el
  guardado numérico válido (con actualización optimista y recarga), el
  rechazo de una nota fuera de rango sin llamar al backend, la limpieza de
  una nota existente, una valoración de desarrollo, el alta de un tipo
  (bloqueo de reservados/duplicados y éxito), la baja tras confirmar (y su
  cancelación) y el bloqueo de una segunda acción de tipo mientras la
  primera sigue en curso.

## Decisiones de capa 4

- Las tres funciones y su estado editable se movieron sin alterar su lógica
  interna: mismas condiciones de validación, mismos payloads (construidos
  con `construirPayloadNota` de la capa 1), mismos textos y códigos de
  SweetAlert2, mismo orden de actualización optimista → transporte →
  recarga.
- El hook de comandos recibe `estudiantes`, `columnas`, `setEstudiantes`,
  `setColumnas` y `cargarPlanilla` como parámetros desde el hook de consulta,
  en vez de duplicar ese estado. Es la misma decisión anunciada en la capa 3:
  ambos hooks comparten el estado de datos de la planilla porque las
  actualizaciones optimistas de guardado escriben directamente sobre los
  mismos `estudiantes`/`columnas` que la consulta carga; separarlos hubiera
  exigido sincronizar dos copias del mismo estado sin necesidad real.
- `tipoEvaluacion` (y su `<select>`) permanecen en `Planilla.jsx`: es una
  preferencia de vista persistida en `localStorage`, análoga a `fecha` en
  asistencia, y se pasa al hook de comandos como dato de solo lectura.
- Un cerrojo síncrono (`accionTipoEnCurso`) impide iniciar una segunda
  acción de tipo mientras la primera está en curso; se conserva
  idéntico al original y ahora tiene prueba dedicada.
- `Planilla.jsx` ya no importa `sweetalert2` ni el servicio HTTP
  directamente, ni declara `nuevoTipo`, `tipoEliminar`, `accionTipoEnCurso`
  ni las tres funciones de comando; solo conecta ambos hooks (consulta y
  comandos) con el JSX existente, que no cambió.

## Verificación de capa 5

- Línea base antes de modificar: la de cierre de capa 4 — 173 archivos, 627
  pruebas correctas.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/planilla src/utils/planilla
  src/services/planillaApi.test.js src/hooks/planilla` — 10 archivos, 45
  pruebas correctas.
- Lint dirigido sobre página, componentes, hooks, utilidades, servicio y sus
  pruebas: correcto, sin advertencias.
- Suite completa tras la extracción: 177 archivos, 637 pruebas correctas.
- `src/pages/Planilla.test.jsx` no requirió ningún cambio en esta capa: sus
  8 pruebas siguen en verde con todo el marcado ya viviendo en los
  componentes nuevos, incluida la aserción de duplicación responsive
  (tarjeta móvil + tabla en el mismo árbol bajo jsdom).
- Auditoría de ubicación: `git mv` reubicó `src/components/PlanillaRow.jsx`
  a `src/components/planilla/PlanillaRow.jsx` (detectado como rename); su
  prueba, antes suelta en `src/components/`, se movió junto con él. No
  queda ninguna referencia a la ubicación anterior (`grep` sobre `src/`
  confirmó cero coincidencias fuera de `src/components/planilla/`).
- Componentes nuevos, todos en `src/components/planilla/`:
  - `PlanillaMobileCard.jsx` — antes función interna no exportada de
    `Planilla.jsx`, ahora un archivo propio con su prueba;
  - `SelectorTipoEvaluacion.jsx` — el control "Tipo de calificación" del
    encabezado;
  - `GestionTiposEvaluacion.jsx` — la tarjeta "Nuevo Tipo"/"Eliminar Tipo";
  - `TablaNotasPlanilla.jsx` — título, lista de tarjetas móviles y tabla de
    escritorio; compone `PlanillaMobileCard` y `PlanillaRow` internamente.
- Pruebas agregadas junto a cada componente:
  - `PlanillaMobileCard.test.jsx` protege límites del input, color del
    promedio, restauración tras rechazo, valoraciones de desarrollo y el
    estado vacío de columnas;
  - `SelectorTipoEvaluacion.test.jsx` protege ambas opciones y el callback
    `onChange`;
  - `GestionTiposEvaluacion.test.jsx` protege ambos callbacks, las opciones
    de la lista de eliminar y el estado deshabilitado/`aria-busy` durante
    una acción en curso;
  - `TablaNotasPlanilla.test.jsx` protege el título, la composición de
    columnas/estudiantes en ambas vistas y el estado vacío.

## Decisiones de capa 5

- La descomposición siguió el tamaño de las secciones visuales existentes
  (encabezado, gestión de tipos, tabla de notas) en vez de fragmentar cada
  control individualmente; es la misma granularidad que usó asistencia
  (`PanelAsistenciaProfesor`, `BarraGuardadoAsistencia`).
- Todo el marcado, las clases de Tailwind, los textos y los `aria-*` se
  movieron literalmente; ningún componente nuevo cambió HTML, estilos ni
  copys.
- `formatearEtiquetaColumna` se sigue pasando como prop a cada componente en
  vez de importarla directamente desde `utils/planilla/notas`, preservando
  el patrón que ya existía en el `PlanillaRow` original (a diferencia de
  `VALORACIONES_DESARROLLO`, que ya se importaba directo y se conservó así).
- El efecto de `localStorage.setItem("planillaTipoEvaluacion", ...)` se
  quedó en `Planilla.jsx`, dentro del callback `onChange` que le pasa a
  `SelectorTipoEvaluacion`: el componente solo notifica el valor elegido,
  no conoce almacenamiento ni persistencia.
- Ningún componente de `src/components/planilla/` importa hooks, el
  servicio HTTP ni `utils/api.js`; todos reciben datos y callbacks por
  props.
- `Planilla.jsx` quedó en 128 líneas (antes ~677) y ya compone encabezado
  compartido, selector, gestión de tipos y tabla mediante datos y callbacks
  de los dos hooks; la capa 6 verificará si necesita algo más allá de
  confirmarlo.

## Riesgos residuales documentados

- Los redireccionamientos por sesión/contexto y la reacción al `403`
  (limpieza de `asignacionId`, aviso y navegación) siguen sin una prueba de
  DOM porque escriben directamente en `window.location.href`; la delegación
  del `403` sí quedó cubierta a nivel de hook.
- `cargarClases` no maneja errores; una falla queda como una promesa
  rechazada sin capturar (comportamiento preexistente, no se corrige aquí).
- `useConsultasPlanillaProfesor` sigue exponiendo `setEstudiantes` y
  `setColumnas`, y `Planilla.jsx` los recibe y los reenvía al hook de
  comandos sin usarlos ella misma. No se retiró esa exposición porque los
  dos hooks necesitan compartir el mismo estado de datos (ver decisiones de
  capa 4); el objetivo real de la capa 4 sí se cumplió: ninguna función de
  comando ni su estado editable siguen viviendo en la página.
- Resuelto en capa 1: la normalización de coma decimal (`normalizarNumeroNota`)
  ya tiene prueba unitaria directa en `src/utils/planilla/notas.test.js`.

## Verificación de capa 6

- Línea base: la de cierre de capa 5 — 177 archivos, 637 pruebas correctas;
  esta capa no modificó ningún archivo de producción, por lo que ese
  resultado sigue vigente sin necesidad de repetir la suite completa.
- Verificación específica: `pnpm exec vitest run src/pages/Planilla.test.jsx
  src/components/planilla src/utils/planilla
  src/services/planillaApi.test.js src/hooks/planilla` — 10 archivos, 45
  pruebas correctas (idéntico a capa 5, sin cambios de código).
- Lint dirigido sobre `src/pages/Planilla.jsx`: correcto, sin advertencias.
- Auditoría de raíz (con `grep` sobre `src/pages/Planilla.jsx`):
  - cero coincidencias de `api.`, `Swal` o `fetch(` — no hay transporte ni
    comandos de SweetAlert2 en la página;
  - cero coincidencias de `<button`, `<svg`, `<table`, `<select`, `<input`,
    `<article`, `<thead`, `<tbody` — no quedan bloques visuales extensos,
    todo vive en `src/components/planilla/`;
  - 9 imports en total: hooks de React, `EncabezadoContextoCurso`
    (dependencia compartida), los tres componentes de presentación propios,
    los dos hooks del módulo, `obtenerPeriodoProfesor` (dependencia
    compartida) y `formatearEtiquetaColumna` (se reenvía como prop a los
    componentes, igual que antes de esta migración);
  - 127 líneas totales (frente a las ~677 originales).

## Decisiones de capa 6

- No se modificó ningún archivo: `Planilla.jsx` ya cumplía el límite de raíz
  de composición al cerrar la capa 5 (lee `profesor`/`asignacionId`/
  `periodo`/`fecha`/`tipoEvaluacion` desde `localStorage`, conecta
  `useConsultasPlanillaProfesor` con `useComandosPlanillaProfesor` y
  distribuye sus resultados a `EncabezadoContextoCurso`,
  `SelectorTipoEvaluacion`, `GestionTiposEvaluacion` y `TablaNotasPlanilla`
  mediante props, y conserva las dos redirecciones de contexto inválido).
  Mismo desenlace que tuvo asistencia en su propia capa 6.
- `selectedClase = clases.find(c => c.id == asignacionId)` se queda en la
  página: es una búsqueda de una línea que solo sirve para componer las
  props de `EncabezadoContextoCurso`, no una transformación de dominio;
  asistencia conservó una línea equivalente por la misma razón.
- No se tocó el formato/indentación heredado del archivo original (algunas
  líneas conservan la sangría irregular de antes de la migración). Corregir
  estilo sin relación con la arquitectura queda fuera de esta migración
  ("no corrijas asuntos ajenos"); lint no lo señala como error.

## Riesgos residuales documentados

- Los redireccionamientos por sesión/contexto y la reacción al `403`
  (limpieza de `asignacionId`, aviso y navegación) siguen sin una prueba de
  DOM porque escriben directamente en `window.location.href`; la delegación
  del `403` sí quedó cubierta a nivel de hook.
- `cargarClases` no maneja errores; una falla queda como una promesa
  rechazada sin capturar (comportamiento preexistente, no se corrige aquí).
- `useConsultasPlanillaProfesor` sigue exponiendo `setEstudiantes` y
  `setColumnas`, y `Planilla.jsx` los recibe y los reenvía al hook de
  comandos sin usarlos ella misma; los dos hooks comparten el mismo estado
  de datos a propósito (ver decisiones de capa 4).
- Resuelto en capa 1: la normalización de coma decimal (`normalizarNumeroNota`)
  ya tiene prueba unitaria directa en `src/utils/planilla/notas.test.js`.

## Verificación de capa 7 (cierre)

- `pnpm run check:deploy` (pruebas + lint + build):
  - `pnpm run test`: **177 archivos, 637 pruebas correctas**;
  - `pnpm run lint` (`eslint .`, todo el repositorio): correcto, sin errores
    ni advertencias;
  - `pnpm run build` (`vite build`): correcto, 297 módulos transformados,
    `Planilla-D0uFdwMK.js` generado como chunk propio del módulo.
- `git diff --check`: correcto, sin errores de espacio en blanco (solo avisos
  informativos de conversión LF/CRLF de Git, no bloqueantes).
- Auditoría de alcance (`git status --porcelain`): todo el diff pertenece a
  `docs/modularizacion/PLANILLA.md` y a los archivos de `PLANILLA` bajo
  `src/pages/`, `src/components/planilla/`, `src/hooks/planilla/`,
  `src/services/planillaApi*` y `src/utils/planilla/`. Ningún otro módulo,
  página ni componente compartido cambió.
- Auditoría de duplicados: no queda `src/components/PlanillaRow.jsx` (se
  movió), no queda una función `PlanillaMobileCard` embebida en ninguna
  página, y `grep` sobre `src/pages/Planilla.jsx` confirma que no importa
  `utils/api.js` ni `sweetalert2` directamente. `src/services/asistenciaApi.js`
  no se tocó, conservando su propio consumo independiente de
  `/mis-clases` y `/planilla-excel`.
- Documentación actualizada en este cierre:
  - `docs/modularizacion/README.md`: fila de Planilla en "Orden de
    migración" pasa de `Pendiente` a `Terminado y publicado en main`;
  - `docs/ARQUITECTURA_FRONTEND.md`: nuevas entradas de
    `src/components/planilla/`, `src/hooks/planilla/`,
    `src/services/planillaApi.js` y `src/utils/planilla/` en "Estructura de
    `src/`", más un bloque en "Pruebas del frontend";
  - `docs/COMPONENTES.md`: arquitectura añadida a la sección "Planilla de
    notas profesor", entrada actualizada de `PlanillaRow.jsx` a su ruta
    nueva, nueva subsección "### Planilla" en "Componentes por modulo" y
    nuevas entradas en "Hooks y servicios";
  - `docs/CAMBIOS_FRONTEND.md`: nueva entrada fechada
    "2026-08-05 - Modularización completa de planilla de notas".

## Definición de módulo terminado (verificada)

- No existen llamadas HTTP directas en `Planilla.jsx` ni en los componentes
  de `src/components/planilla/`: todas viven en `src/services/planillaApi.js`.
- Las transformaciones de dominio (formateo de columnas, promedio,
  normalización de coma decimal, construcción del payload) están fuera de
  React, en `src/utils/planilla/notas.js`, con pruebas propias.
- Consultas y comandos remotos están detrás de
  `useConsultasPlanillaProfesor` y `useComandosPlanillaProfesor`.
- Los componentes reciben datos y acciones mediante props; ninguno importa
  hooks, servicios ni `utils/api.js`.
- `Planilla.jsx` funciona como raíz de composición (127 líneas).
- Los flujos críticos (cálculo y guardado de notas, validación de rango,
  alta/baja de tipos de evaluación, valoraciones de desarrollo, contexto
  inválido) tienen pruebas específicas.
- `pnpm run check:deploy` es correcto.
- La documentación específica y global está sincronizada.
- El working tree queda limpio de cambios sin commitear salvo por este
  módulo, listo para el único commit.

## Resumen de archivos modificados en todo el módulo

Nuevos:

- `src/utils/planilla/notas.js`, `notas.test.js`
- `src/services/planillaApi.js`, `planillaApi.test.js`
- `src/hooks/planilla/useConsultasPlanillaProfesor.js`, `.test.js`
- `src/hooks/planilla/useComandosPlanillaProfesor.js`, `.test.js`
- `src/components/planilla/PlanillaMobileCard.jsx`, `.test.jsx`
- `src/components/planilla/SelectorTipoEvaluacion.jsx`, `.test.jsx`
- `src/components/planilla/GestionTiposEvaluacion.jsx`, `.test.jsx`
- `src/components/planilla/TablaNotasPlanilla.jsx`, `.test.jsx`
- `src/components/planilla/PlanillaRow.test.jsx` (prueba nueva junto al
  componente movido)
- `src/pages/Planilla.test.jsx`

Movidos:

- `src/components/PlanillaRow.jsx` → `src/components/planilla/PlanillaRow.jsx`

Modificados:

- `src/pages/Planilla.jsx` (de ~677 líneas a 127; ahora es raíz de
  composición pura)
- `docs/modularizacion/PLANILLA.md`, `docs/modularizacion/README.md`,
  `docs/ARQUITECTURA_FRONTEND.md`, `docs/COMPONENTES.md`,
  `docs/CAMBIOS_FRONTEND.md`

No se modificó ningún archivo fuera de estas rutas.

## Verificación manual sugerida en producción

1. Entrar con un profesor, seleccionar clase y período desde el dashboard, y
   abrir `/planilla`.
2. Confirmar materia, salón, período y fecha en el encabezado, y que el
   selector `Tipo de calificación` recuerde la última opción elegida.
3. En modo numérico, guardar una nota válida (1.0–5.0, incluida una con coma
   decimal) y confirmar que se refleje tras la recarga.
4. Intentar guardar una nota fuera de rango y confirmar el aviso "Nota
   inválida" y que el valor anterior se restaure.
5. Vaciar una nota existente y confirmar que se limpie correctamente.
6. Agregar un tipo de evaluación nuevo; confirmar que se bloquee un nombre
   reservado (`mas_alto`) y uno duplicado, y que el válido aparezca como
   nueva columna.
7. Eliminar un tipo de evaluación, confirmar el diálogo y verificar que la
   columna desaparezca para todos los estudiantes.
8. Cambiar a "Caritas / Desarrollo infantil", registrar una valoración por
   botón y confirmar que el promedio numérico quede oculto ("—").
9. Verificar la vista de tarjetas en móvil (ancho angosto) y la tabla en
   escritorio, incluida la fila fija de estudiante/número al desplazar
   horizontalmente.
10. Entrar sin una asignación seleccionada y confirmar el aviso y el retorno
    al dashboard; si es posible, probar también con una asignación retirada
    (debe limpiar la selección y avisar).

## Mensaje de commit sugerido

`refactor(planilla): modularizar el flujo completo`

## Entrega para el siguiente chat

- Última capa terminada: Capa 7, cierre. **Módulo Planilla completo.**
- Verificación más reciente: `pnpm run check:deploy` correcto (177 archivos,
  637 pruebas, lint y build sin errores); `git diff --check` correcto.
- Archivos pendientes: ninguno de implementación o documentación.
- Riesgos residuales: ver "Riesgos residuales documentados" (capa 6);
  ninguno bloquea el cierre, todos están documentados como comportamiento
  preexistente o decisión arquitectónica deliberada.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual de producción como seguimiento operativo si todavía
  no fue registrada.
