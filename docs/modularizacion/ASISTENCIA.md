# Modularización: Asistencia

## Control

- Estado: Terminado y publicado en `main`.
- Orden: 1.
- Riesgo inicial: Medio.
- Flujo Git: `main` directo.
- Commit base: `7051bbe`.
- Commit final: `c02c2e2`.
- Última actualización: 2026-07-31.

## Objetivo

Separar el flujo docente de asistencia en contratos puros, servicio HTTP,
hooks y componentes, conservando marcación, edición, historial y validaciones.

## Inventario confirmado en capa 0

- `src/pages/Asistencia.jsx`
- `src/components/asistencia/AsistenciaRow.jsx`
- `src/components/EncabezadoContextoCurso.jsx` como dependencia compartida.
- `src/utils/periodoProfesor.js` como dependencia compartida.

### Entrada, rol y contexto

- Ruta protegida: `/asistencia`, declarada en `src/App.jsx` y enlazada desde
  la navegación de profesor en escritorio y móvil.
- Rol efectivo: profesor autenticado. La página redirige a `/login` cuando no
  encuentra `profesor.id`.
- Desde el 2026-11-09 la clase, el período y la fecha se eligen **en la misma
  página** (`SelectorClaseTrabajo` + `CampoFechaAsistencia` dentro de
  `EncabezadoContextoCurso`). Ya no hay alerta que devuelva al dashboard: sin
  clase, la página muestra `AvisoSinClaseElegida` con el motivo.
- Contexto compartido desde `localStorage` (mismas claves que el panel y la
  planilla, vía `hooks/useClaseDeTrabajo.js`):
  - `profesor` aporta `id`;
  - `asignacionId` identifica la clase elegida; se escribe al cambiarla aquí;
  - `periodo_profesor_<id>` tiene prioridad sobre `periodo`, con respaldo `1`;
    se escribe al cambiarlo aquí.
- **Fecha**: arranca siempre en la de hoy (hora de Colombia,
  `fechaIsoColombia`) y no se recuerda. Si se cambia, el campo avisa «No es
  hoy» con un botón «Volver a hoy». No admite fechas futuras. Cambiar la fecha
  no vuelve a pedir datos: el historial del período ya trae todas las fechas.
- **Preescolar**: si la clase guardada es una materia de un curso de
  preescolar, la asistencia se toma con la «Asistencia diaria» del mismo curso
  (`resolverAsignacionAsistencia` en `utils/claseDeTrabajo.js`) sin cambiar la
  clase guardada; el selector solo ofrece «Asistencia diaria» en esos cursos.
  Si esa asignación no es del profesor, la página lo explica.
- Con asistencia sin guardar, cambiar clase, período o fecha pregunta antes
  («Cambiar sin guardar» / «Seguir aquí»).
- La lista de la clase se vuelve a montar (`key`) al cambiar de clase o de
  período.

### Contratos HTTP vigentes

| Método | Ruta | Contrato consumido o enviado |
|---|---|---|
| `GET` | `/planilla-excel/:asignacionId/:periodo` | Lee estudiantes desde `response.data.data`. Cada fila usa al menos `estudiante_id`, `nombre` y `apellido`. |
| `GET` | `/mis-clases/:profesorId` | Lee un arreglo de clases para el selector (una opción por `id`, con `materia`, `curso`, `curso_id` y `nivel`). Se pide una sola vez, a la vez que la lista de la clase guardada. |
| `GET` | `/asistencia/historial/:asignacionId/:periodo` | Lee un arreglo por estudiante con `estudiante_id` e `historial`; cada registro usa `fecha` y `estado`. Reintenta una vez tras 700 ms. |
| `POST` | `/asistencia` | Envía un arreglo completo con `{ estudiante_id, asignacion_id: Number, fecha, estado, periodo: Number }`. |

- Un `403` al cargar estudiantes o historial limpia `asignacionId` y la
  página explica que la clase ya no está asignada, sin salir de ella.
- Un error de la lista de clases se muestra junto al selector con
  «Reintentar»; los de estudiantes solo se registran en consola.
- El error final del historial muestra un estado recuperable con botón
  `Reintentar`; un error de guardado usa `response.data.detail` cuando es texto.

### Estados y comportamiento visual

- Historial: cargando, listo, error recuperable y lista de estudiantes vacía.
- Marcación: pendiente, presente y ausente por estudiante; acción masiva con
  confirmación cuando reemplaza ausencias.
- Guardado: bloqueado si falta fecha, hay pendientes, no hay cambios, el
  historial no está listo o existe un guardado en curso.
- Registro existente: aviso de asistencia ya tomada, edición con cambios
  pendientes y restauración de lo guardado.
- Resultado: confirmación previa, progreso bloqueante, éxito y error.
- La misma estructura adapta fila, controles, resumen y barra de guardado con
  clases responsive para móvil y escritorio; la capa 0 no cambia ese marcado.

## Invariantes

- Selección de asignación, periodo y fecha.
- Marcación individual y acción `Marcar todos presentes`.
- Bloqueo cuando quedan estudiantes pendientes.
- Edición segura de una asistencia existente.
- Historial, reintento y aviso de asistencia ya tomada.
- Experiencia móvil y de escritorio actual.

## Riesgos iniciales

- Duplicar guardados o perder cambios al alternar fecha.
- Romper la correspondencia entre estudiantes y estados.
- Cambiar accidentalmente el contrato de asistencia del backend.
- Mezclar preferencias locales con el estado remoto.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada (2026-07-31) |
| 1. Utilidades puras | Terminada (2026-07-31) |
| 2. Servicio HTTP | Terminada (2026-07-31) |
| 3. Hooks de consulta | Terminada (2026-07-31) |
| 4. Hooks de comandos | Terminada (2026-07-31) |
| 5. Presentación | Terminada (2026-07-31) |
| 6. Composición | Terminada (2026-07-31) |
| 7. Cierre | Terminada (2026-07-31) |

## Verificación de capa 0

- Línea base antes de modificar: `pnpm run test` — 27 archivos, 98 pruebas
  correctas.
- Verificación específica: `pnpm run test -- src/pages/Asistencia.test.jsx
  src/components/AsistenciaRow.test.jsx` — 2 archivos, 7 pruebas correctas.
- Caracterización agregada junto a las unidades:
  - `src/pages/Asistencia.test.jsx` protege endpoints de carga, bloqueo por
    pendientes, marcación masiva, payload de guardado, edición/restauración y
    reintento automático del historial;
  - `src/components/AsistenciaRow.test.jsx` protege conteo de ausencias,
    etiquetas accesibles, callback de marcación y estado deshabilitado.

## Decisiones de capa 0

- Se tomó `7051bbe` como nueva línea base por autorización explícita, dado que
  es el commit publicado en `main` y `origin/main` al iniciar.
- La protección se hizo sobre las unidades existentes, sin mover código ni
  introducir límites arquitectónicos antes de caracterizar el comportamiento.
- `EncabezadoContextoCurso` y `periodoProfesor` permanecen compartidos porque ya
  tienen uso real fuera de asistencia; no se duplican ni se especializan.
- El dashboard, la navegación y `App.jsx` se inventariaron como límites, pero no
  se modifican dentro de este módulo.

## Verificación de capa 1

- Verificación específica: `pnpm run test --
  src/utils/asistencia/profesor.test.js src/pages/Asistencia.test.jsx
  src/components/AsistenciaRow.test.jsx` — 3 archivos, 14 pruebas correctas.
- Lint dirigido sobre la página, las utilidades y las pruebas modificadas:
  correcto.
- `src/utils/asistencia/profesor.js` contiene ahora:
  - estados de asistencia usados por las transformaciones;
  - normalización de fechas;
  - indexación del historial por estudiante;
  - selección de la marcación guardada para una fecha;
  - resumen y detección de cambios;
  - marcación masiva como presente;
  - construcción del payload masivo del backend.
- `src/utils/asistencia/profesor.test.js` protege tipos, orden, estados,
  normalización, datos inválidos y ausencia de mutación.

## Decisiones de capa 1

- Las utilidades no realizan HTTP, no importan React, no leen almacenamiento y
  no producen efectos secundarios.
- Se preservaron los `Map` con identificadores numéricos para conservar la
  correspondencia actual entre historial y estudiantes.
- La normalización conserva incluso el respaldo histórico de cortar a diez
  caracteres un valor de fecha inválido; corregir ese comportamiento queda
  fuera de esta migración.
- El payload mantiene un elemento por estudiante, el orden de la planilla y las
  conversiones numéricas de `asignacion_id` y `periodo`.
- `Asistencia.jsx` consume las utilidades y ya no conserva implementaciones
  duplicadas de las reglas extraídas. HTTP, reintento y estado remoto continúan
  en la página hasta sus capas correspondientes.

## Verificación de capa 2

- Verificación específica: `pnpm run test --
  src/services/asistenciaApi.test.js src/utils/asistencia/profesor.test.js
  src/pages/Asistencia.test.jsx src/components/AsistenciaRow.test.jsx` — 4
  archivos, 17 pruebas correctas.
- Lint dirigido sobre servicio, utilidades, página, fila y sus pruebas:
  correcto.
- Auditoría de rutas: `/planilla-excel`, `/mis-clases`,
  `/asistencia/historial` y `POST /asistencia` existen únicamente en
  `src/services/asistenciaApi.js` dentro del módulo.
- Auditoría de transporte: `Asistencia.jsx`, `AsistenciaRow.jsx` y las utilidades
  ya no importan ni usan directamente `src/utils/api.js`.

## Decisiones de capa 2

- `src/services/asistenciaApi.js` es el único propietario del transporte HTTP
  del módulo y expone operaciones para planilla, clases, historial y guardado.
- El servicio devuelve el cuerpo `data` de Axios sin decidir estados React,
  reintentos, redirecciones, almacenamiento ni mensajes visuales.
- Los errores se propagan sin reinterpretarlos para conservar las ramas `403`,
  el detalle de guardado y los mensajes actuales en la página.
- Las operaciones aceptan `AbortSignal` opcional. Cuando no se suministra, las
  llamadas conservan exactamente los argumentos HTTP previos.
- El reintento fijo del historial permanece temporalmente en la página; moverlo
  ahora habría iniciado la capa de hooks de consulta.

## Verificación de capa 3

- Verificación específica: `pnpm run test --
  src/hooks/asistencia/useConsultasAsistenciaProfesor.test.js
  src/services/asistenciaApi.test.js src/utils/asistencia/profesor.test.js
  src/pages/Asistencia.test.jsx src/components/AsistenciaRow.test.jsx` — 5
  archivos, 22 pruebas correctas.
- Lint dirigido sobre hook, servicio, utilidades, página, fila y sus pruebas:
  correcto, sin advertencias.
- Auditoría de responsabilidades: `Asistencia.jsx` ya no declara estados ni
  funciones de carga para estudiantes, clases o historial, y tampoco contiene
  el temporizador de reintento.
- Las pruebas del hook protegen carga correcta, reintento único, error
  recuperable, delegación de `403`, cancelación y descarte de respuestas
  obsoletas al cambiar de clase.

## Decisiones de capa 3

- `src/hooks/asistencia/useConsultasAsistenciaProfesor.js` concentra las tres
  consultas remotas y expone datos, estados del historial y su recarga.
- Cada consulta mantiene un `AbortController` independiente. Una recarga o un
  cambio de contexto cancela la solicitud anterior y una respuesta obsoleta no
  puede reemplazar el estado más reciente.
- Se conserva exactamente un segundo intento del historial después de 700 ms;
  la espera también se cancela al cambiar de contexto o desmontar la pantalla.
- El hook propaga el caso de clase no disponible mediante callback. La página
  conserva el texto del aviso, la limpieza de `asignacionId` y la navegación
  porque son decisiones del límite superior.
- La identidad del callback visual no dispara recargas: el hook conserva la
  versión más reciente en una referencia.
- `Asistencia.jsx` conserva el `POST`, el estado editable, las confirmaciones y
  la recarga posterior al guardado para no anticipar la capa 4.

## Verificación de capa 4

- Verificación específica: `pnpm run test --
  src/hooks/asistencia/useComandosAsistenciaProfesor.test.js
  src/hooks/asistencia/useConsultasAsistenciaProfesor.test.js
  src/services/asistenciaApi.test.js src/utils/asistencia/profesor.test.js
  src/pages/Asistencia.test.jsx src/components/AsistenciaRow.test.jsx` — 6
  archivos, 28 pruebas correctas.
- Lint dirigido sobre hooks, servicio, utilidades, página, fila y sus pruebas:
  correcto, sin advertencias.
- Auditoría de responsabilidades: `Asistencia.jsx` ya no importa SweetAlert, el
  servicio HTTP ni constructores de payload, y no declara estado editable o de
  guardado.
- Las pruebas del hook protegen hidratación, edición/restauración, marcación
  masiva, pendientes, payload, éxito, detalle de error y bloqueo de envíos
  simultáneos.

## Decisiones de capa 4

- `src/hooks/asistencia/useComandosAsistenciaProfesor.js` concentra la
  marcación editable, sus valores derivados y el ciclo completo de guardado.
- El hook reutiliza las utilidades puras para historial, resumen, cambios,
  marcación masiva y payload; no duplica reglas de contrato.
- Las confirmaciones, progreso y mensajes de resultado permanecen idénticos y
  se coordinan desde el hook como parte del comando.
- La recarga posterior al `POST` se recibe como callback del hook de consultas,
  manteniendo separados consulta y comando.
- Un cerrojo síncrono con referencia impide iniciar un segundo comando mientras
  validación, confirmación o guardado están en curso. El estado visual
  `guardando` conserva el mismo momento de activación: después de confirmar.
- La hidratación mantiene la regla previa de no reemplazar una marcación local
  que ya tenga valores.
- Todo el JSX permanece en `Asistencia.jsx`; moverlo ahora habría iniciado la
  capa presentacional.

## Verificación de capa 5

- Verificación específica: `pnpm run test --
  src/components/asistencia/AvisoRegistroAsistencia.test.jsx
  src/components/asistencia/PanelAsistenciaProfesor.test.jsx
  src/components/asistencia/BarraGuardadoAsistencia.test.jsx
  src/components/asistencia/AsistenciaRow.test.jsx
  src/hooks/asistencia/useComandosAsistenciaProfesor.test.js
  src/hooks/asistencia/useConsultasAsistenciaProfesor.test.js
  src/services/asistenciaApi.test.js src/utils/asistencia/profesor.test.js
  src/pages/Asistencia.test.jsx` — 9 archivos, 35 pruebas correctas.
- Lint dirigido sobre componentes, hooks, servicio, utilidades y página con sus
  pruebas: correcto, sin advertencias.
- Auditoría de límites: los componentes de `src/components/asistencia/` no
  importan hooks, servicios HTTP, `utils/api.js` ni SweetAlert.
- Auditoría de duplicados: se eliminaron `src/components/AsistenciaRow.jsx` y su
  prueba en la ubicación antigua; la fila existe únicamente dentro del módulo.
- Auditoría de página: los bloques extensos de aviso, lista, marcación, resumen,
  vacío y barra fija ya no existen en `Asistencia.jsx`.

## Decisiones de capa 5

- `AvisoRegistroAsistencia` presenta los estados guardado y edición pendiente.
- `PanelAsistenciaProfesor` presenta carga/error del historial, reintento,
  marcación rápida, resumen, filas y estado vacío mediante props y callbacks.
- `BarraGuardadoAsistencia` presenta el resumen inferior y el estado del botón
  de guardado.
- `AsistenciaRow` se movió a `src/components/asistencia/` conservando marcado,
  clases responsive, textos, accesibilidad y contrato de callback.
- Las clases CSS y el orden de los bloques se trasladaron sin rediseño.
- `EncabezadoContextoCurso` permanece como dependencia compartida existente; no
  se duplicó ni se especializó para asistencia.
- `Asistencia.jsx` conecta datos y acciones de ambos hooks con componentes
  presentacionales; ninguna regla de dominio se trasladó a los componentes.

## Verificación de capa 6

- Verificación específica: `pnpm run test --
  src/components/asistencia/AvisoRegistroAsistencia.test.jsx
  src/components/asistencia/PanelAsistenciaProfesor.test.jsx
  src/components/asistencia/BarraGuardadoAsistencia.test.jsx
  src/components/asistencia/AsistenciaRow.test.jsx
  src/hooks/asistencia/useComandosAsistenciaProfesor.test.js
  src/hooks/asistencia/useConsultasAsistenciaProfesor.test.js
  src/services/asistenciaApi.test.js src/utils/asistencia/profesor.test.js
  src/pages/Asistencia.test.jsx` — 9 archivos, 35 pruebas correctas.
- Lint dirigido sobre todos los archivos del módulo y sus pruebas: correcto,
  sin advertencias.
- Auditoría de raíz: `Asistencia.jsx` no contiene transporte, comandos,
  transformaciones de dominio ni elementos visuales internos como botones o
  encabezados de sección.
- La página queda en 136 líneas y compone encabezado compartido, aviso, panel y
  barra mediante datos y callbacks de los dos hooks.

## Decisiones de capa 6

- No se creó otra abstracción: la página ya cumplía el límite arquitectónico
  después de la capa 5 y solo requería consolidación y orden interno.
- `Asistencia.jsx` conserva la lectura de profesor, asignación, período y fecha,
  además de alertas y navegación por contexto inválido, porque son
  responsabilidades permitidas de la raíz superior.
- La comparación de la clase seleccionada conserva igualdad flexible para
  admitir el ID numérico del backend y el ID textual de `localStorage`.
- La raíz conecta `useConsultasAsistenciaProfesor` con
  `useComandosAsistenciaProfesor`, incluida la recarga del historial después de
  guardar, y distribuye resultados a componentes presentacionales.
- Las cinco pruebas de caracterización de la página siguen protegiendo el flujo
  integrado; no fue necesaria otra prueba duplicada de composición.

## Verificación de capa 7

- Verificación específica final: 9 archivos y 35 pruebas correctas.
- `pnpm run check:deploy`: correcto.
  - suite global: 36 archivos y 133 pruebas correctas;
  - lint global: correcto, sin errores;
  - build de producción: correcto con Vite 8 y 179 módulos transformados.
- `git diff --check`: correcto.
- Auditoría de alcance: el código modificado pertenece únicamente a asistencia;
  los demás cambios corresponden a su documentación específica, maestra y
  global.
- Auditoría HTTP: todas las rutas de asistencia y el único import de
  `utils/api.js` del módulo viven en `src/services/asistenciaApi.js`.
- Auditoría de duplicados:
  - se eliminó `src/components/AsistenciaRow.jsx`;
  - `AsistenciaRow` existe únicamente en `src/components/asistencia/`;
  - página, hooks, servicio y normalización de fechas tienen una sola
    implementación vigente.
- La primera ejecución global descubrió una carrera en una expectativa de
  prueba: el historial ya estaba listo, pero la hidratación editable todavía no
  había terminado. La prueba ahora espera el estado estable visible; la segunda
  ejecución completa fue correcta.

## Riesgos residuales documentados

- Los redireccionamientos por sesión/contexto y las ramas `403` siguen sin una
  prueba de DOM porque escriben directamente en `window.location.href`; deben
  conservarse sin reinterpretar en el cierre.
- El reintento conserva una espera fija de 700 ms, pero ya es cancelable. Cambiar
  su política queda fuera de esta migración.
- La inicialización del hook solo aplica el historial guardado si el estado
  editable sigue vacío; este orden sensible a recargas se conserva y queda
  protegido por pruebas.

## Verificación manual de producción

1. Entrar con un profesor y seleccionar asignación, período y fecha desde el
   dashboard.
2. Abrir `/asistencia` y confirmar materia, salón, período, fecha, estudiantes
   y conteo histórico en escritorio y móvil.
3. Verificar que el guardado permanezca deshabilitado mientras existan
   pendientes.
4. Usar `Marcar todos presentes`, cambiar al menos un estudiante a ausente y
   confirmar que el resumen se actualice sin alterar nombres ni orden.
5. Guardar y comprobar confirmación, ausencia de doble envío y actualización
   del historial.
6. Volver a la misma fecha y confirmar `Asistencia del día ya tomada`, edición,
   `Restaurar guardado` y `Guardar cambios`.
7. Recargar la página y confirmar que la asistencia persistida se hidrate sin
   perder la correspondencia entre estudiante y estado.
8. Entrar sin asignación seleccionada y confirmar el aviso y retorno al
   dashboard; validar también una asignación retirada si existe un caso seguro.

## Commit sugerido

`refactor(asistencia): modularizar el flujo completo`

## Entrega para el siguiente chat

- Última capa terminada: Capa 7, cierre.
- Verificación más reciente: 35 pruebas específicas; `check:deploy` con 133
  pruebas globales, lint y build correctos; `git diff --check` correcto.
- Archivos pendientes: ninguno de implementación o documentación.
- Riesgos residuales: redirecciones directas, reintento fijo y orden de
  hidratación documentados y conservados.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual de producción como seguimiento operativo si todavía
  no fue registrada.

## 2026-11-07 - Guardar enseguida, con una sola espera

Pedido del usuario: que guardar la asistencia sea "enseguida" y sin "muchos
pasos" de ventanas. Antes eran tres: confirmar con el resumen, "Guardando
asistencia" (con otro aspecto) y el éxito, que además esperaba la recarga
del historial.

- Se quitó la ventana de confirmar (el usuario: «lo que recomiendas»). El
  éxito ya dice cuántos presentes y ausentes quedaron, y la asistencia se
  puede corregir y volver a guardar. Siguen los avisos de fecha faltante y de
  estudiantes sin marcar.
- Al oprimir sale la tarjeta «Guardando asistencia…» (o «Actualizando…»), que
  pasa a éxito sin cerrarse apenas el servidor responde (`mostrarEspera` de
  `src/hooks/ventanaExito.js`). El historial se recarga después; si esa
  recarga falla, ya no sale "No se pudo guardar", porque sí se guardó.
- `BarraGuardadoAsistencia` ya no recibe `guardando` ni dice "Guardando...":
  el botón queda bloqueado por `puedeGuardar`, que ya incluía `!guardando`.
