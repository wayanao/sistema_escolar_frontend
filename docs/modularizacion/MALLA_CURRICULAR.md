# Modularización: Malla curricular

## Control

- Estado: Terminado; commit pendiente.
- Orden: 3.
- Riesgo inicial: Medio/alto.
- Flujo Git: `main` directo.
- Commit base: `63526ed155112f641bea1a01595ecf19bb348b77`.
- Commit final: Pendiente; lo realizará el usuario.
- Última actualización: 2026-08-03.

## Objetivo

Modularizar el planeador anual por asignación, periodo y `slot`, conservando
validaciones de filas, fechas y eliminación implícita de registros vacíos.

## Inventario confirmado en la capa 0

### Entrada y navegación

- Página del módulo: `src/pages/PlaneadorAnual.jsx`.
- Ruta conservada: `/planeador-anual`, cargada de forma diferida y protegida en
  `src/App.jsx`.
- Entrada del profesor: “Malla Curricular” en `src/components/NavProfesor.jsx`,
  tanto para escritorio como para móvil.
- Rol observado: profesor autenticado con una asignación seleccionada desde el
  dashboard. La página contiene el mensaje existente para la ausencia de esa
  asignación, aunque el retorno temprano de la carga puede impedir alcanzarlo;
  se registra como riesgo previo y no se corrige en esta migración.

### Dependencias compartidas, sin cambios

- `src/utils/periodoProfesor.js` conserva la lectura y escritura del período por
  profesor, con respaldo en la clave general `periodo`.
- `src/components/impresion/DocumentoImprimible.jsx` conserva la composición de
  la vista imprimible.
- `src/utils/api.js` fue retirado de la página en la capa 2 y ahora solo lo
  conoce `src/services/mallaCurricularApi.js` dentro del módulo.
- `EncabezadoContextoCurso` no es una dependencia de la implementación actual
  de `PlaneadorAnual`.

### Contratos HTTP observados

- `GET /mis-clases/{profesorId}`: devuelve las asignaciones; la página selecciona
  aquella cuyo `id`, convertido a texto, coincide con `asignacionId`.
- `GET /planeador-anual/{asignacionId}/{periodo}`: la página consume
  `data.planeadores`, usa `slot` como posición de 1 a 8 y recorta `fecha` a
  `YYYY-MM-DD`. Si `slot` no es válido, conserva el respaldo histórico por
  índice de respuesta.
- `PUT /planeador-anual/{asignacionId}/{periodo}`: recibe un arreglo de ocho
  posiciones. Cada posición contiene `unidad_tematica`,
  `estandar_competencia`, `contenido`, `actividades_recursos` y `fecha`; los
  textos se envían sin espacios externos y una fecha vacía se envía como
  `null`. El payload no incluye `slot`: la posición del arreglo es el contrato
  actual y permite la eliminación implícita al enviar vacía una fila guardada.

### Almacenamiento local observado

- `asignacionId`: identificador de la asignación seleccionada.
- `profesor`: JSON del profesor; se usa su propiedad `id`.
- `periodo_profesor_{profesorId}`: período preferido por profesor.
- `periodo`: respaldo compartido y clave que también se actualiza al cambiar el
  selector.

### Estados visuales y responsive

- Carga inicial con spinner y texto “Cargando...”.
- Estados “Verificando”, “Cambios sin guardar”, “Guardado” y “Pendiente”, con
  sus textos y etiquetas de botón existentes.
- Botón bloqueado y spinner durante el guardado; confirmaciones actuales de
  SweetAlert para validación, éxito y error.
- Ocho tarjetas editables por debajo de `sm` y tabla de ocho filas desde `sm`.
- Vista imprimible de pantalla completa y tabla del período, con acción para
  regresar.

## Invariantes

- Hasta ocho filas curriculares por asignación y periodo.
- El contenido requiere fecha y la fecha requiere contenido.
- Filas vacías no crean registros.
- Vaciar un `slot` guardado solicita su eliminación.
- Los datos deben conservar el `slot` retornado por el backend.
- Spinner y confirmación de guardado actuales.
- Ruta, textos, distribución móvil/escritorio y vista imprimible actuales.
- El `PUT` conserva las ocho posiciones: una fila vacía no se filtra del arreglo.

## Riesgos iniciales

- Reordenar contenido cuando existen espacios vacíos.
- Enviar registros incompletos o eliminar el `slot` incorrecto.
- Mezclar estado editable con respuesta remota.
- La posición, no una propiedad `slot` explícita, identifica cada fila en el
  payload de guardado.
- Los dos juegos de controles responsive editan el mismo estado; una extracción
  visual debe evitar divergencias entre tarjetas y tabla.
- La consulta de asignación y la consulta de malla tienen ciclos de carga
  distintos; al extraer hooks debe conservarse el comportamiento actual cuando
  falta `profesorId`, `asignacionId` o `periodo`.
- Si falta `asignacionId` o `periodo`, `cargarPlaneadores` retorna antes de
  desactivar `loading`; el mensaje previsto para falta de asignación puede no
  mostrarse. Es un defecto previo fuera del alcance de esta modularización.

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

## Capa 0 completada

- Se registró `63526ed155112f641bea1a01595ecf19bb348b77` como commit base después
  de confirmar `main` y un working tree limpio.
- La verificación base terminó correctamente: 126 archivos, 441 pruebas, lint y
  build.
- Se caracterizaron como lógica pura la creación de filas, el mapeo por `slot`,
  la normalización del payload y las validaciones contenido/fecha. Permanecen
  temporalmente en `PlaneadorAnual.jsx`; no se inició la separación física de
  la capa 1.
- `src/pages/PlaneadorAnual.test.jsx` protege la carga por asignación y período,
  la posición de los `slot`, el bloqueo de contenido sin fecha y el envío de las
  ocho posiciones, incluidas las vacías necesarias para eliminación implícita.
- Verificación específica: 1 archivo, 6 pruebas correctas, con el comando
  `pnpm exec vitest run src/pages/PlaneadorAnual.test.jsx`.
- Lint específico de página y prueba: correcto. `git diff --check`: correcto,
  con avisos informativos de conversión LF/CRLF en Windows.

## Capa 1 completada

- Se creó `src/utils/mallaCurricular/planeadorAnual.js` como única
  implementación de los contratos puros del módulo.
- Se extrajeron `CANTIDAD_FILAS_PLANEADOR`, `CAMPOS_CONTENIDO`, la creación de
  filas iniciales independientes, la normalización de respuesta por `slot`, la
  construcción del payload y las validaciones contenido/fecha.
- La utilidad no realiza HTTP, no importa React, no accede al DOM y no lee ni
  modifica almacenamiento.
- `PlaneadorAnual.jsx` consume los contratos extraídos y dejó de exportar lógica
  de dominio. También usa las constantes extraídas para dimensionar filas y
  referencias de los cuatro campos curriculares.
- Las pruebas puras quedaron junto a la utilidad y las pruebas de página se
  mantienen como protección de integración. Verificación específica: 2
  archivos y 9 pruebas correctas.
- Lint específico de página, utilidad y sus pruebas: correcto. La revisión con
  `git diff --check` también fue correcta, con avisos informativos de conversión
  LF/CRLF en Windows.

## Capa 2 completada

- Se creó `src/services/mallaCurricularApi.js` para centralizar las tres
  operaciones HTTP del módulo:
  `obtenerAsignacionesProfesor(profesorId)`,
  `obtenerPlaneadoresAnuales(asignacionId, periodo)` y
  `guardarPlaneadoresAnuales(asignacionId, periodo, payload)`.
- Las consultas devuelven `response.data`; el guardado conserva la respuesta
  HTTP completa porque la página comprueba el rango de `status` antes de mostrar
  la confirmación existente.
- El servicio no decide mensajes visuales ni transforma errores. Las fallas se
  propagan para que el consumidor mantenga el manejo actual.
- `PlaneadorAnual.jsx` y su prueba dejaron de importar o simular directamente
  `utils/api.js`. Las pruebas de página usan el servicio como límite y las
  pruebas del servicio protegen rutas, argumentos, arreglo posicional y
  propagación de errores.
- Verificación específica acumulada: 3 archivos y 13 pruebas correctas. Lint
  específico de página, utilidad, servicio y sus pruebas: correcto. La revisión
  con `git diff --check` también fue correcta, con avisos informativos LF/CRLF
  de Windows.

## Capa 3 completada

- Se creó
  `src/hooks/mallaCurricular/useConsultasMallaCurricular.js` para administrar el
  período activo, su persistencia mediante `periodoProfesor`, la carga de la
  asignación y la consulta de filas por asignación y período.
- El hook ejecuta los efectos de consulta, normaliza las filas mediante la
  utilidad del módulo y expone `cargarPlaneadores` como recarga explícita para
  el comando de guardado de la siguiente capa.
- La integración conserva los estados visuales actuales mediante callbacks de
  inicio, éxito y error. La página mantiene todavía las filas editables,
  `estadoGuardado`, validaciones, SweetAlert y el `PUT`; esos elementos no se
  adelantaron desde la capa 4.
- Las solicitudes de filas usan un identificador secuencial: una respuesta de
  un período anterior se descarta si comenzó una consulta más reciente, y el
  desmontaje invalida cualquier respuesta pendiente.
- Se conservaron los retornos tempranos actuales cuando faltan `profesorId`,
  `asignacionId` o `periodo`, incluido el riesgo documentado de carga indefinida
  cuando no existe asignación.
- Verificación específica acumulada: 4 archivos y 18 pruebas correctas. Las 5
  pruebas del hook cubren carga inicial, `slot`, persistencia de período,
  recarga, errores y descarte de respuestas antiguas. Lint específico y
  `git diff --check`: correctos, con avisos informativos LF/CRLF de Windows.

## Capa 4 completada

- Se creó `src/hooks/mallaCurricular/useComandosMallaCurricular.js` para
  administrar las ocho filas editables, `estadoGuardado`, cambios de campo,
  progreso y ejecución del guardado.
- El hook construye y valida el payload mediante la utilidad pura, conserva los
  avisos separados para contenido sin fecha y fecha sin contenido, llama al
  servicio HTTP, recarga la consulta tras un `2xx` y mantiene las confirmaciones
  de éxito y error existentes.
- Los callbacks de inicio, éxito y error de consulta ahora pertenecen al hook de
  comandos. De esta forma, `useConsultasMallaCurricular` entrega datos remotos
  sin apropiarse del estado editable.
- `PlaneadorAnual.jsx` dejó de importar SweetAlert, el comando del servicio y
  las funciones de construcción o validación del payload. Tampoco mantiene
  copias locales de `planeadores`, `guardando` o `estadoGuardado`.
- La página conserva únicamente la conexión entre hooks, el ajuste DOM de
  textareas, la vista de impresión y los bloques visuales, que corresponden a
  las capas 5 y 6.
- Verificación específica acumulada: 5 archivos y 24 pruebas correctas. Las 6
  pruebas del hook de comandos cubren recepción de consultas, edición
  inmutable, ambas validaciones, progreso, payload de ocho posiciones, recarga,
  éxito y detalle de error del backend. Lint específico y `git diff --check`:
  correctos, con avisos informativos LF/CRLF de Windows.

## Capa 5 completada

- Se creó `src/components/mallaCurricular/` con componentes presentacionales
  para estados iniciales, encabezado y contexto, selector de período, editor
  responsive, acciones y vista imprimible.
- `EditorMallaCurricular` conserva ocho tarjetas por debajo de `sm` y la tabla
  de ocho filas desde `sm`, entrega cambios por `index`, campo y valor, mantiene
  `required`/`aria-required` según contenido y asumió el autoajuste DOM de los
  textareas.
- `AccionesMallaCurricular` conserva textos, bloqueo, spinner y callbacks de
  guardar e imprimir. `VistaImprimibleMallaCurricular` conserva título,
  subtítulo contextual, columnas, ocho posiciones y acción para regresar.
- Los estilos existentes se trasladaron sin rediseño a
  `src/components/mallaCurricular/mallaCurricular.css`, incluidas las reglas
  móvil y de impresión.
- `PlaneadorAnual.jsx` ya no contiene tablas, tarjetas, campos, botones, CSS,
  referencias DOM ni acceso directo a `DocumentoImprimible`; solo conserva el
  contenedor raíz y la coordinación de los componentes.
- Se añadieron 5 pruebas en 4 archivos de componentes para estructura
  responsive, campos obligatorios, callbacks, progreso y vista imprimible.
  Verificación específica acumulada: 9 archivos y 29 pruebas correctas. Lint
  específico y `git diff --check`: correctos, con avisos informativos LF/CRLF
  de Windows.

## Capa 6 completada

- Se creó
  `src/components/mallaCurricular/estadoVisualMallaCurricular.js` para derivar
  los contratos visuales “Verificando”, “Cambios sin guardar”, “Guardado” y
  “Pendiente”, incluidas prioridades, textos, clases y etiqueta del botón.
- Cuatro pruebas puras protegen cada estado y la conservación de la hora de
  actualización. La implementación anterior fue retirada por completo de la
  página.
- `PlaneadorAnual.jsx` quedó en 94 líneas dedicadas a leer el contexto superior
  de `localStorage`, conectar los hooks, entregar props, alternar impresión y
  componer estados y componentes.
- La auditoría de la raíz confirmó que no contiene endpoints, acceso a Axios,
  SweetAlert, transformaciones de colecciones, construcción de payloads,
  validaciones de dominio ni bloques visuales extensos.
- La prueba de página ahora también protege el recorrido desde el editor hacia
  la vista imprimible y el regreso al mismo período.
- Verificación específica acumulada: 10 archivos y 34 pruebas correctas. Lint
  específico y `git diff --check`: correctos, con avisos informativos LF/CRLF
  de Windows.

## Capa 7 completada

- La suite específica final terminó correctamente: 10 archivos y 34 pruebas
  con `pnpm exec vitest run` sobre la página, utilidades, servicio, hooks y
  componentes de MALLA_CURRICULAR.
- `pnpm run check:deploy` terminó correctamente: 136 archivos y 475 pruebas,
  ESLint sin errores y build de Vite correcto con 263 módulos transformados.
- `git diff --check` terminó correctamente; únicamente informó los avisos de
  conversión LF/CRLF esperados en Windows.
- La auditoría del diff confirmó que los cambios pertenecen exclusivamente a
  MALLA_CURRICULAR y a su documentación específica y global.
- La auditoría de duplicados confirmó que el transporte HTTP está únicamente en
  el servicio, los contratos puros únicamente en la utilidad, la coordinación
  en los hooks, la presentación en los componentes y la página como raíz de
  composición. No permanece la implementación monolítica anterior.
- Se actualizaron `docs/ARQUITECTURA_FRONTEND.md`, `docs/COMPONENTES.md`,
  `docs/CAMBIOS_FRONTEND.md` y `docs/modularizacion/README.md` para registrar la
  arquitectura final y el cierre del módulo.

## Decisiones de continuidad

- `src/utils/mallaCurricular/planeadorAnual.js` conserva toda la lógica pura del
  dominio; no quedan implementaciones equivalentes duplicadas en la página.
- `src/services/mallaCurricularApi.js` es el único punto de transporte HTTP del
  módulo; no quedan llamadas directas en la página ni en su prueba.
- La consulta compartida `/mis-clases/{profesorId}` se mantiene encapsulada en
  el servicio del dominio para no acoplar MALLA_CURRICULAR al servicio interno
  de planeaciones ni iniciar una extracción transversal fuera de alcance.
- `useConsultasMallaCurricular` es el único coordinador de lecturas remotas,
  efectos de consulta y persistencia del período; la página ya no importa las
  consultas del servicio ni `periodoProfesor`.
- `useComandosMallaCurricular` es el único propietario del estado editable y de
  los comandos. Se conecta al hook de consultas mediante callbacks y recibe la
  recarga explícita al guardar, sin crear una dependencia circular entre hooks.
- La página mantiene un manejador de guardado mínimo que entrega `periodo` y
  `cargarPlaneadores` al hook de comandos; no contiene reglas de negocio.
- Los componentes reciben datos y callbacks mediante props; ninguno conoce
  endpoints, almacenamiento, SweetAlert ni estado remoto del dominio.
- `estadoVisualMallaCurricular.js` es la única implementación de la derivación
  visual; la página consume su resultado para encabezado y acciones sin
  duplicar textos o prioridades.
- La raíz de composición quedó consolidada y el cierre no requirió nuevas
  extracciones ni cambios funcionales.
- El servicio no incorporó cancelación con `AbortSignal` porque el contrato
  existente no la usaba. El hook descarta respuestas antiguas, que protege la
  pantalla sin alterar rutas ni payloads.
- No se creó ninguna abstracción compartida ni se modificaron
  `periodoProfesor`, impresión, navegación u otros módulos.
- La ausencia o invalidez de `slot` seguirá usando el índice de respuesta como
  respaldo porque ese es el comportamiento observado, aunque pueda causar
  colisiones. No se corregirá dentro de la modularización.
- La semántica de eliminación depende del arreglo completo de ocho posiciones;
  ninguna capa posterior debe filtrar filas vacías antes del `PUT`.

## Verificación manual en producción

1. Iniciar sesión como profesor y seleccionar desde el dashboard una clase de
   prueba con datos conocidos.
2. Abrir `/planeador-anual`, confirmar curso, materia y período, y comprobar que
   los huecos entre `slot` no desplazan el contenido a otra fila.
3. Verificar las ocho tarjetas en móvil y las ocho filas de la tabla en
   escritorio, conservando textos, campos y distribución.
4. Confirmar que contenido sin fecha y fecha sin contenido muestran sus avisos
   respectivos y no ejecutan el guardado.
5. Editar una fila válida, guardar y comprobar bloqueo, spinner, confirmación de
   éxito y recarga de los datos persistidos.
6. En datos controlados, vaciar un `slot` guardado, guardar y recargar para
   confirmar su eliminación sin desplazar los demás; restaurarlo después si
   corresponde.
7. Cambiar de período y volver al anterior para comprobar aislamiento y
   persistencia de la selección.
8. Abrir la vista imprimible, confirmar contexto, período y ocho posiciones, y
   regresar al editor.

## Entrega final

- Última capa terminada: 7. Cierre. No quedan capas pendientes.
- Verificación final: 34 pruebas específicas correctas en 10 archivos; suite
  completa con 475 pruebas correctas en 136 archivos; lint y build correctos.
- Archivos pendientes: ninguno de implementación o documentación. El working
  tree queda intencionalmente sin commit para la revisión del usuario.
- Riesgos conservados: identidad posicional del payload, respaldo por índice
  para `slot` inválido y el defecto previo de carga cuando falta asignación o
  período. No se alteraron porque corregirlos cambiaría el comportamiento fuera
  del alcance de la migración.
- Siguiente acción exacta: revisar el diff, crear el único commit del módulo,
  hacer push a `origin/main`, revisar el deploy y ejecutar la verificación
  manual anterior.
- Mensaje sugerido para el único commit:
  `refactor(malla-curricular): modularizar el flujo completo`.
