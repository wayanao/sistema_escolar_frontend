# Modularización: Administración académica y horarios

## Control

- Estado: Terminado y publicado en `main`; capas 0-7 completadas en el alcance
  del módulo.
- Orden: 13.
- Riesgo inicial: Alto.
- Flujo Git: `main` directo.
- Commit base: `c02c2e2e768bd16942195876f339ffc8d8d4c653`.
- Commit final: `6f2094b`.
- Última actualización: 2026-08-01.

## Objetivo

Separar gestión de profesores, cursos, materias, asignaciones y horarios sin
modificar relaciones académicas ni estados operativos.

## Alcance confirmado

### Raíces, rutas y navegación

- `src/pages/Admin.jsx`: raíz activa de `/admin`; pestañas Profesores,
  Cursos, Materias y Asignaciones.
- `src/pages/HorariosAdmin.jsx`: raíz activa de `/admin/horarios`; compone
  horarios por profesor y por curso.
- Ambas rutas están protegidas por `AdminRoute` y requieren
  `usuario.rol === "admin"`.
- `NavAdmin` conserva el enlace directo Administración y Horarios Asignados
  dentro de Gestión Académica, tanto en escritorio como en móvil.
- `AdminDashboard` enlaza la tarjeta Gestión Académica con `/admin`.
- `src/pages/GestionAcademica.jsx` no estaba enrutada ni importada. Se retiró
  durante el cierre tras comprobar que duplicaba las cuatro entidades de
  `/admin` sin consumidores activos.
- La pestaña Orden boletín comparte `Admin.jsx`, pero pertenece al dominio de
  boletines. Queda expresamente fuera de esta modularización.

### Componentes del dominio

- `src/components/administracionAcademica/profesores/CrearProfesor.jsx`
- `src/components/administracionAcademica/cursos/CrearCurso.jsx`
- `src/components/administracionAcademica/materias/CrearMateria.jsx`
- `src/components/administracionAcademica/asignaciones/AsignarClase.jsx`
- `src/components/administracionAcademica/horarios/HorariosPorCurso.jsx`
- `src/components/administracionAcademica/horarios/HorariosProfesores.jsx`

### Almacenamiento y comportamiento visual

- `HorariosAdmin.jsx` lee `localStorage.usuario` para el saludo. La ruta y el
  layout general también dependen de ese valor para autorización.
- No hay escritura de almacenamiento local dentro de los componentes del
  dominio.
- Se deben conservar pestañas horizontales, tablas con desbordamiento,
  formularios adaptables, calendarios de cinco días que colapsan a una
  columna y horarios separados por jornada.

## Mapa de contratos por entidad

### Profesores

- `GET /profesores?estado=activo|inactivo|todos`: listado y recarga.
- `POST /profesores` y `PUT /profesores/:id`: payload con `nombre` y
  `apellido` normalizados a mayúsculas, `documento_identidad`, email en
  minúsculas, `telefono`, `password`, `sueldo` numérico y `estado`.
- `PATCH /profesores/:id/estado`: `{ estado }`.
- La respuesta de profesor se consume con `id`, `nombre`, `apellido`,
  `documento`, `email`, `telefono`, `sueldo` y `estado`.
- Estados de interfaz: `activo`, `inactivo` y filtro `todos`.

### Cursos

- `GET /cursos?estado=activo|inactivo|todos`: listado y recarga.
- `POST /cursos` y `PUT /cursos/:id`: `{ nombre, jornada, estado }`, con
  nombre normalizado a mayúsculas.
- `PATCH /cursos/:id/estado`: `{ estado }`.
- Jornadas conservadas: `Mañana` y `Tarde`; el valor por defecto es `Mañana`.
- Estados de interfaz: `activo`, `inactivo` y filtro `todos`.

### Materias

- `GET /materias?estado=activo|inactivo|todos`: listado y recarga.
- La creación usa el contrato singular `POST /materia`; la actualización usa
  `PUT /materias/:id`. Payload: `{ nombre, estado }`, con nombre normalizado a
  mayúsculas.
- `PATCH /materias/:id/estado`: `{ estado }`.
- Estados de interfaz: `activo`, `inactivo` y filtro `todos`.

### Asignaciones

- Carga conjunta: `GET /profesores`, `GET /cursos`, `GET /materias` y
  `GET /asignaciones/lista`.
- Disponibilidad: `GET /profesores/:id/disponibilidad?dia=...`; al editar se
  agrega `excluir_asignacion_id`.
- `POST /asignaciones` y `PUT /asignaciones/:id`: payload numérico
  `profesor_id`, `curso_id`, `materia_id`, más `dia`, `hora_inicio` y
  `hora_fin`.
- `DELETE /asignaciones/:id` representa desactivación, no borrado histórico.
- La lista se consume con ids de las tres entidades, nombres presentables,
  día y rango horario.
- Reglas actuales: lunes a viernes; rangos institucionales `06:30-12:30` y
  `12:30-18:30`; coherencia con jornada del curso; inicio anterior al fin; una
  materia de un curso no puede quedar asignada a otro profesor.

### Horarios

- `GET /hora/horarios-admin` alimenta por separado
  `HorariosProfesores.jsx` y `HorariosPorCurso.jsx`.
- Cada registro se consume con `profesor`, `curso`, `materia`, `dia`,
  `hora_inicio` y `hora_fin`.
- La vista por curso ordena cursos y clases por hora; ambas vistas conservan
  estados de carga, vacío y día libre.

## Dependencias actuales

- React: estado, efectos, memorización y carga diferida.
- `src/utils/api.js`: cliente HTTP base consumido por los servicios dedicados;
  los componentes académicos migrados ya no acceden directamente al transporte.
- `src/services/asignacionesApi.js`: rutas y transporte HTTP de catálogos,
  lista, disponibilidad, creación, actualización y desactivación; acepta
  señales opcionales para las consultas.
- `src/services/profesoresApi.js`: listado por estado, creación, actualización
  y cambio de estado de profesores; acepta señal opcional en el listado.
- `src/services/cursosApi.js`: listado por estado, creación, actualización y
  cambio de estado de cursos; acepta señal opcional en el listado.
- `src/services/materiasApi.js`: listado plural por estado, creación singular,
  actualización y cambio de estado plurales; acepta señal opcional al listar.
- `src/services/horariosApi.js`: listado de horarios administrativos mediante
  el endpoint compartido por las dos vistas, sin reinterpretar su respuesta y
  con señal opcional para cancelación.
- `src/utils/administracionAcademica/asignaciones.js`: contratos y
  transformaciones puras de la entidad piloto, sin React, HTTP, DOM ni
  almacenamiento.
- `src/utils/administracionAcademica/profesores.js`: constantes, payload,
  errores, búsqueda y actualización pura de listas de profesores.
- `src/utils/administracionAcademica/cursos.js`: estados, filtros, jornadas,
  payload, errores y actualización pura de listas de cursos.
- `src/utils/administracionAcademica/materias.js`: estados, filtros, payload,
  errores y actualización pura de listas de materias.
- `src/utils/administracionAcademica/horarios.js`: días laborales, formato de
  hora, valores únicos, búsqueda, selección y ordenamientos puros de horarios.
- `src/hooks/administracionAcademica/useDatosAsignaciones.js`: carga inicial,
  recarga, estado de carga y descarte de catálogos/lista obsoletos.
- `src/hooks/administracionAcademica/useDisponibilidadAsignacion.js`: consulta
  reactiva y cancelable de disponibilidad por profesor, día y edición.
- `src/hooks/administracionAcademica/useComandosAsignaciones.js`: estado del
  formulario, selección, edición, validación, comandos, mensajes y coordinación
  de recarga.
- `src/hooks/administracionAcademica/useProfesores.js`: listado, filtro de
  estado, carga, recarga y descarte/cancelación de consultas de profesores.
- `src/hooks/administracionAcademica/useComandosProfesores.js`: estado del
  formulario, edición, validación, comandos, mensajes del navegador y
  coordinación con la lista de profesores.
- `src/hooks/administracionAcademica/useCursos.js`: listado, filtro de estado,
  carga, recarga y descarte/cancelación de consultas de cursos.
- `src/hooks/administracionAcademica/useComandosCursos.js`: estado del
  formulario, edición, validación, comandos, mensajes del navegador y
  coordinación con la lista de cursos.
- `src/hooks/administracionAcademica/useMaterias.js`: listado, filtro de estado,
  carga, recarga y descarte/cancelación de consultas de materias.
- `src/hooks/administracionAcademica/useComandosMaterias.js`: estado del
  formulario, edición, validación, comandos y coordinación con la lista.
- `src/hooks/administracionAcademica/useHorariosProfesores.js`: carga
  cancelable, estado, selección y horarios derivados por profesor.
- `src/hooks/administracionAcademica/useHorariosPorCurso.js`: carga cancelable,
  búsqueda, selección, opciones filtradas y horarios derivados por curso.
- `src/components/administracionAcademica/asignaciones/`: selector/contexto de
  curso, formulario, disponibilidad y horario semanal presentacionales.
- `src/components/administracionAcademica/profesores/`: formulario y listado
  presentacionales, con búsqueda local y delegación de acciones mediante props.
- `src/components/administracionAcademica/cursos/`: formulario y listado
  presentacionales con jornadas, filtro y acciones delegadas mediante props.
- `src/components/administracionAcademica/materias/`: formulario y listado
  presentacionales con filtro, estados y acciones delegadas mediante props.
- `src/components/administracionAcademica/horarios/`: calendarios por profesor
  y curso con estados de carga/vacío, controles y eventos delegados por props.
- `App.jsx`, `NavAdmin.jsx` y `AdminDashboard.jsx`: rutas, autorización y
  entradas de navegación compartidas que deben conservar sus contratos.
- No se identificó una abstracción compartida nueva que ya tenga uso real en
  dos dominios.

## Invariantes

- Creación y actualización de entidades académicas.
- Estados activo, inactivo y todos.
- Prevención y mensajes de duplicados.
- Asignaciones válidas entre profesor, materia y curso.
- Horarios separados por jornada.
- Navegación y pestañas administrativas actuales.
- Rutas, textos, diseño responsive, confirmaciones, payloads y endpoints
  descritos en este documento.

## Protección inicial

- Entidad piloto elegida: asignaciones.
- `src/components/administracionAcademica/asignaciones/AsignarClase.test.jsx`
  caracteriza los cuatro catálogos de
  carga, consulta de disponibilidad, creación y payload, edición con exclusión
  de la asignación actual, y confirmación/contrato de desactivación.
- Verificación base antes de cambios: `pnpm run check:deploy` correcto con 36
  archivos y 133 pruebas, lint y build correctos.
- Verificación específica de capa 0:
  `pnpm exec vitest run
  src/components/administracionAcademica/asignaciones/AsignarClase.test.jsx`,
  1 archivo y 4 pruebas correctas.
- En el entorno restringido Vite produce `spawn EPERM`; las verificaciones
  correctas se ejecutaron fuera del sandbox con autorización.
- `src/components/administracionAcademica/profesores/CrearProfesor.test.jsx`
  caracteriza carga con filtro activo, payload de creación,
  confirmación/desactivación y detalles de error antes y después de migrar
  profesores.
- `src/components/administracionAcademica/cursos/CrearCurso.test.jsx`
  caracteriza carga con filtro activo, payload de creación,
  edición/cancelación, confirmación/desactivación y detalles de error antes y
  después de migrar cursos.
- `src/components/administracionAcademica/materias/CrearMateria.test.jsx`
  caracteriza carga con filtro activo,
  creación por la ruta singular, edición/cancelación,
  confirmación/desactivación y detalles de error antes de migrar materias.
- `src/components/administracionAcademica/horarios/HorariosProfesores.test.jsx`
  y `src/components/administracionAcademica/horarios/HorariosPorCurso.test.jsx`
  caracterizan endpoint, carga,
  vacío, selección, búsqueda, orden, formato y días libres antes y después de
  extraer las transformaciones puras de horarios.

## Capa 1: utilidades puras de asignaciones

- Se extrajeron los días de la semana y límites de las jornadas Mañana y
  Tarde.
- `formatearHora12` conserva el formato mostrado y los valores que ya llegan
  con AM/PM.
- `obtenerAsignacionesCurso` conserva la comparación flexible de ids y el
  orden por día y hora sin modificar el arreglo recibido.
- `construirParametrosDisponibilidad` conserva `dia` y agrega
  `excluir_asignacion_id` sólo durante una edición.
- `construirPayloadAsignacion` conserva ids numéricos y los nombres exactos
  del contrato del backend.
- `validarAsignacion` conserva el orden de las validaciones, los rangos,
  jornadas, conflicto de profesor y todos los mensajes actuales.
- `AsignarClase.jsx` consume estas utilidades, pero conserva en el componente
  el estado, los efectos, las consultas, los comandos y toda la presentación.
- `asignaciones.test.js` protege formato, límites, orden, inmutabilidad,
  parámetros, payload, validaciones, mensajes y exclusión de la edición.
- Verificación específica: 2 archivos y 16 pruebas correctas al ejecutar
  conjuntamente utilidades y caracterización del componente. ESLint correcto
  en los cuatro archivos implicados.

## Capa 2: servicio HTTP de asignaciones

- `asignacionesApi.js` centraliza `GET /profesores`, `GET /cursos`,
  `GET /materias`, `GET /asignaciones/lista` y la disponibilidad por profesor.
- Centraliza también `POST /asignaciones`, `PUT /asignaciones/:id` y
  `DELETE /asignaciones/:id` sin modificar los payloads ni reinterpretar la
  desactivación.
- Cada función devuelve `response.data` y propaga el error original; las
  decisiones de mensajes y recuperación permanecen en el consumidor.
- `AsignarClase.jsx` dejó de importar `src/utils/api.js` y no conserva rutas
  del backend. Mantiene temporalmente la concurrencia de consultas y los
  efectos hasta la capa 3, y los comandos hasta la capa 4.
- `asignacionesApi.test.js` protege rutas, parámetros por referencia, payloads
  por referencia, datos devueltos, DELETE de desactivación y propagación de
  errores.
- Verificación específica: 3 archivos y 20 pruebas correctas al ejecutar
  servicio, utilidades y caracterización del componente. ESLint correcto en
  los seis archivos implicados.

## Capa 3: hooks de consulta de asignaciones

- `useDatosAsignaciones` ejecuta concurrentemente los cuatro catálogos,
  conserva el estado de carga inicial y expone `recargar` para sincronizar la
  lista después de un comando.
- Cada carga cancela la solicitud anterior y verifica que el controlador siga
  vigente antes de escribir estado, evitando que una respuesta tardía
  reemplace datos recientes.
- `useDisponibilidadAsignacion` reacciona a profesor, día y asignación en
  edición; limpia cuando faltan selecciones y cancela al cambiar dependencias o
  desmontar.
- El servicio acepta `AbortSignal` en las cinco consultas y conserva la forma
  previa de la llamada cuando no recibe señal.
- `AsignarClase.jsx` dejó de contener estado, efectos, llamadas o manejo de
  errores de consultas. Conserva formulario y comandos para la capa 4.
- Las pruebas de hooks cubren carga concurrente, recarga silenciosa, error,
  señal compartida, cancelación, respuesta tardía, parámetros de edición y
  limpieza de disponibilidad.
- Verificación específica: 5 archivos y 28 pruebas correctas al ejecutar
  hooks, servicio, utilidades y caracterización del componente. ESLint correcto
  en los diez archivos implicados.

## Capa 4: hook de comandos y formulario de asignaciones

- `useComandosAsignaciones` posee curso, profesor, materia, día, horas,
  asignación en edición, estado de guardado y mensaje operativo.
- Expone selección de curso, actualización de campos, inicio/cancelación de
  edición y los derivados `cursoSeleccionado` y `asignacionesCurso`.
- La creación y actualización validan y construyen el payload mediante las
  utilidades puras antes de delegar el transporte al servicio.
- La desactivación conserva el texto de confirmación, el contrato DELETE, el
  contexto del curso y la limpieza de una edición coincidente.
- Los tres comandos conservan detalles del backend, mensajes alternativos,
  estado `guardando` y recarga silenciosa al completarse correctamente.
- El mensaje exitoso continúa limpiándose a los 3500 ms y la edición conserva
  el desplazamiento suave al inicio.
- `AsignarClase.jsx` dejó de contener estado React propio, validaciones,
  payloads, llamadas de comandos, confirmaciones, temporizadores o coordinación
  de recarga. Mantiene por ahora los bloques JSX para la capa 5.
- Las pruebas del hook cubren formulario, orden derivado, edición, cancelación,
  validación, payloads, crear, actualizar, desactivar, confirmación, errores,
  limpieza, mensaje temporal y recarga.
- Verificación específica: 6 archivos y 35 pruebas correctas al ejecutar
  hooks, servicio, utilidades y caracterización del componente. ESLint correcto
  en los doce archivos implicados.

## Capa 5: presentación de asignaciones

- `SelectorCursoAsignacion.jsx` presenta el curso de trabajo, opciones,
  jornada y contexto seleccionado; delega la selección mediante una prop.
- `DisponibilidadProfesorAsignacion.jsx` conserva los estados previo, carga,
  error, jornadas sin rangos y rangos disponibles con el mismo formato horario.
- `FormularioAsignacion.jsx` presenta campos, estados habilitados, modo
  crear/editar, disponibilidad, progreso, mensaje y callbacks sin conocer
  hooks, servicios ni endpoints.
- `HorarioCursoAsignacion.jsx` conserva el estado sin curso, los cinco días,
  días libres, tarjetas, resaltado de edición y callbacks de editar/desactivar.
- `AsignarClase.jsx` quedó dedicado a invocar los tres hooks, conservar el
  estado de carga inicial y conectar valores/callbacks mediante props.
- No se modificaron clases CSS, textos, estructura responsive, botones,
  mensajes ni reglas de habilitación.
- Cada unidad presentacional tiene pruebas junto a su archivo para proteger
  contenido, estados y delegación de eventos.
- Verificación específica: 10 archivos y 40 pruebas correctas al ejecutar
  componentes, hooks, servicio, utilidades y caracterización integrada. ESLint
  específico correcto en todo el flujo de asignaciones.

## Capa 6: composición de asignaciones

- El contenedor y su prueba se consolidaron en
  `src/components/administracionAcademica/asignaciones/`, junto a las unidades
  presentacionales que conecta.
- `AsignarClase.jsx` contiene únicamente invocación de hooks, estado de carga
  inicial y mapeo explícito de datos/callbacks a componentes.
- `Admin.jsx` conserva su rol de página raíz, las cinco pestañas, la selección
  inicial Profesores y la carga diferida de la pestaña Asignaciones.
- `GestionAcademica.jsx` sólo actualizó el import para mantener el archivo
  resoluble; no se reactivó, eliminó ni modificó su comportamiento.
- `Admin.test.jsx` protege título, navegación, `aria-current`, contenido inicial
  y cambio a la pestaña Asignaciones sin cargar otros dominios.
- Se eliminó la ubicación antigua `src/components/AsignarClase.jsx`; no queda
  wrapper ni segunda implementación.
- Verificación específica: 11 archivos y 41 pruebas correctas al ejecutar
  composición, componentes, hooks, servicio y utilidades. ESLint específico
  correcto en el flujo y las raíces relacionadas.

## Profesores - capa 1: utilidades puras

- `profesores.js` centraliza estados `activo`/`inactivo`, filtro `todos`,
  etiquetas y clases visuales que antes estaban declaradas en el componente.
- `normalizarTextoMayusculas` conserva recorte, compactación de espacios y
  mayúsculas regionales `es-CO` para nombre y apellido.
- `construirPayloadProfesor` conserva `documento_identidad`, email en
  minúsculas, campos sin reinterpretar y sueldo mediante `parseFloat` con
  fallback `0`.
- `obtenerMensajeErrorApi` conserva detalles de arreglo unidos por salto de
  línea, detalle simple y mensaje alternativo.
- `filtrarProfesores` conserva búsqueda por nombre, apellido o `documento`, sin
  distinguir mayúsculas.
- `aplicarEstadoProfesor` actualiza sin mutar y conserva la retirada inmediata
  del profesor cuando deja de pertenecer al filtro activo/inactivo.
- `CrearProfesor.jsx` consume estas utilidades pero conserva HTTP, estado,
  efectos, comandos y JSX para las capas posteriores.
- Verificación específica: 2 archivos y 10 pruebas correctas entre utilidad y
  caracterización del componente. ESLint correcto en los cuatro archivos
  implicados.

## Profesores - capa 2: servicio HTTP

- `profesoresApi.js` centraliza `GET /profesores` con su filtro `estado`,
  `POST /profesores`, `PUT /profesores/:id` y
  `PATCH /profesores/:id/estado`.
- El listado conserva exactamente `params: { estado }`; crear y actualizar
  transportan el mismo objeto de payload, y el cambio de estado conserva
  `{ estado }`.
- Cada operación devuelve `response.data` y propaga el error original para que
  el consumidor mantenga los mensajes y decisiones existentes.
- El listado acepta una señal opcional sin modificar la llamada actual; su uso
  corresponderá a la capa de consultas.
- `CrearProfesor.jsx` dejó de importar `src/utils/api.js` y ya no contiene
  rutas ni verbos HTTP. Conserva estado, efectos, comandos y JSX para las capas
  posteriores.
- `profesoresApi.test.js` protege rutas, filtro, señal opcional, payloads por
  referencia, datos devueltos, PATCH de estado y propagación de errores.
- Verificación específica: 3 archivos y 14 pruebas correctas entre servicio,
  utilidades y caracterización del componente. ESLint específico correcto en
  los seis archivos implicados.

## Profesores - capa 3: hook de consultas

- `useProfesores.js` posee la lista de profesores y el filtro de estado, cuyo
  valor inicial continúa siendo `activo`.
- La carga inicial y cada cambio de filtro consultan mediante
  `listarProfesores`, conservando el parámetro `estado` y agregando una señal
  de cancelación al transporte.
- `recargar` permite sincronizar el filtro vigente después de un comando sin
  duplicar la consulta en el componente.
- Cada nueva carga cancela la anterior y comprueba que la solicitud siga
  vigente antes de actualizar la lista; el desmontaje también cancela la
  petición pendiente.
- Los errores vigentes continúan registrándose en consola y no introducen
  mensajes, estados visuales ni recuperaciones nuevas.
- `CrearProfesor.jsx` dejó de contener estado de lista/filtro, efectos,
  callbacks de consulta y acceso al método de listado. Conserva formulario,
  creación, actualización, confirmación/cambio de estado y todo el JSX.
- `useProfesores.test.js` protege carga activa inicial, señal, cambio de
  filtro, cancelación, descarte de respuesta tardía, recarga, error y
  desmontaje.
- Verificación específica: 4 archivos y 18 pruebas correctas entre hook,
  servicio, utilidades y caracterización del componente. ESLint específico
  correcto en los ocho archivos implicados.

## Profesores - capa 4: hook de formulario y comandos

- `useComandosProfesores.js` posee el estado completo del formulario y el id
  de edición, y expone actualización de campos, inicio/cancelación de edición,
  guardado y cambio de estado.
- La validación conserva todos los campos obligatorios y permite contraseña
  vacía únicamente al actualizar un profesor existente.
- Creación y actualización siguen construyendo el payload mediante la utilidad
  pura y delegan el transporte al servicio sin modificar nombres ni valores.
- El guardado conserva alertas de éxito, detalles del backend, registro del
  error, limpieza del formulario y recarga del filtro vigente.
- El cambio de estado conserva la omisión cuando no cambia el valor, el texto
  de confirmación, el PATCH, el fallback al estado solicitado, el mensaje de
  error y la actualización inmediata de lista/formulario.
- `CrearProfesor.jsx` dejó de contener estado del formulario, validaciones,
  payloads, llamadas de comandos, confirmaciones, alertas o coordinación de
  recarga. Conserva búsqueda local, invocación de hooks y todo el JSX.
- `useComandosProfesores.test.js` protege edición, cancelación, validación,
  payloads de crear/actualizar, contraseña opcional al editar, errores,
  confirmación, actualización según filtro y sincronización de la edición.
- Verificación específica: 5 archivos y 25 pruebas correctas entre hooks,
  servicio, utilidades y caracterización del componente. ESLint específico
  correcto en los diez archivos implicados.

## Profesores - capa 5: presentación

- `FormularioProfesor.jsx` conserva título crear/editar, los ocho controles,
  textos de contraseña, clases responsive y botones; recibe valores y delega
  campos, guardado y cancelación mediante props.
- `ListaProfesores.jsx` conserva título, búsqueda, filtro operativo, tabla con
  desbordamiento, columnas, insignias, selectores de estado y botón Editar.
- La búsqueda permanece como estado visual local del listado y continúa usando
  la utilidad pura para filtrar por nombre, apellido o documento.
- Los componentes presentacionales no importan hooks, servicios ni transporte;
  solo consumen props y constantes/transformaciones puras del dominio.
- `CrearProfesor.jsx` quedó dedicado a invocar los dos hooks y mapear sus datos
  y callbacks a formulario y listado dentro del contenedor visual existente.
- No se modificaron rutas, textos, clases CSS, campos, opciones, estructura
  responsive ni comportamiento de los eventos.
- Las pruebas colocadas junto a cada componente protegen modos crear/editar,
  controles, guardado, cancelación, tabla, insignias, búsqueda, filtro y
  delegación de editar/cambiar estado.
- Verificación específica: 7 archivos y 29 pruebas correctas entre
  presentación, hooks, servicio, utilidades y caracterización integrada.
  ESLint específico correcto en los catorce archivos implicados.

## Profesores - capa 6: composición

- El contenedor y su prueba integrada se consolidaron en
  `src/components/administracionAcademica/profesores/`, junto al formulario y
  listado que conecta.
- `CrearProfesor.jsx` contiene únicamente invocación de los hooks de consulta y
  comandos, y mapeo explícito de valores/callbacks a componentes.
- `Admin.jsx` conserva Profesores como pestaña inicial y actualiza solamente la
  ruta de su import diferido al contenedor consolidado.
- `Admin.test.jsx` conserva la protección de pestañas, selección inicial,
  `aria-current` y cambio a Asignaciones, con el mock en la nueva ubicación.
- `GestionAcademica.jsx` solo actualizó el import para permanecer resoluble; no
  se reactivó ni se modificó su comportamiento.
- Se eliminaron `src/components/CrearProfesor.jsx` y su prueba en la ubicación
  antigua; no queda wrapper, segundo punto de entrada ni implementación
  duplicada.
- Verificación específica: 8 archivos y 30 pruebas correctas entre composición,
  presentación, hooks, servicio y utilidades. ESLint específico correcto en
  todo el flujo de profesores y las raíces consumidoras.

## Cursos - capa 1: utilidades puras

- `cursos.js` centraliza estados `activo`/`inactivo`, filtro `todos`, etiquetas,
  clases visuales y jornadas Mañana/Tarde con sus textos actuales.
- `JORNADA_CURSO_INICIAL` conserva `Mañana` como valor inicial, de limpieza y
  fallback de respuestas sin jornada.
- `normalizarNombreCurso` conserva recorte, compactación de espacios y
  mayúsculas regionales `es-CO`.
- `construirPayloadCurso` conserva exactamente `{ nombre, jornada, estado }`
  sin reinterpretar jornada ni estado.
- `obtenerMensajeErrorCurso` conserva detalles de arreglo unidos por salto de
  línea, detalle simple y mensaje alternativo.
- `aplicarEstadoCurso` actualiza sin mutar y retira inmediatamente el curso
  cuando deja de pertenecer al filtro activo/inactivo; con `todos` lo conserva.
- `CrearCurso.jsx` consume estas utilidades pero mantiene HTTP, estado, efectos,
  comandos, confirmaciones, alertas y JSX para las capas posteriores.
- Verificación específica: 2 archivos y 10 pruebas correctas entre utilidades y
  caracterización del componente. ESLint correcto en los cuatro archivos
  implicados.

## Cursos - capa 2: servicio HTTP

- `cursosApi.js` centraliza `GET /cursos` con su filtro `estado`,
  `POST /cursos`, `PUT /cursos/:id` y `PATCH /cursos/:id/estado`.
- El listado conserva exactamente `params: { estado }`; crear y actualizar
  transportan el mismo objeto de payload, y el cambio de estado conserva
  `{ estado }`.
- Cada operación devuelve `response.data` y propaga el error original para que
  el consumidor mantenga mensajes y decisiones existentes.
- El listado acepta una señal opcional sin modificar la llamada actual; su uso
  corresponderá a la capa de consultas.
- `CrearCurso.jsx` dejó de importar `src/utils/api.js` y ya no contiene rutas ni
  verbos HTTP. Conserva estado, efectos, comandos y JSX para capas posteriores.
- `cursosApi.test.js` protege rutas, filtro, señal opcional, payloads por
  referencia, datos devueltos, PATCH de estado y propagación de errores.
- Verificación específica: 3 archivos y 14 pruebas correctas entre servicio,
  utilidades y caracterización del componente. ESLint específico correcto en
  los seis archivos implicados.

## Cursos - capa 3: hook de consultas

- `useCursos.js` posee la lista de cursos y el filtro de estado, cuyo valor
  inicial continúa siendo `activo`.
- La carga inicial y cada cambio de filtro consultan mediante `listarCursos`,
  conservando el parámetro `estado` y agregando una señal de cancelación.
- `recargar` permite sincronizar el filtro vigente después de un comando sin
  duplicar la consulta en el componente.
- Cada nueva carga cancela la anterior y comprueba que la solicitud siga
  vigente antes de actualizar la lista; el desmontaje también cancela la
  petición pendiente.
- Los errores continúan registrándose en consola y no introducen mensajes,
  estados visuales ni recuperaciones nuevas.
- `CrearCurso.jsx` dejó de contener estado de lista/filtro, efectos, callbacks
  de consulta y acceso al método de listado. Conserva formulario, creación,
  actualización, confirmación/cambio de estado y todo el JSX.
- `useCursos.test.js` protege carga activa inicial, señal, cambio de filtro,
  cancelación, descarte de respuesta tardía, recarga, error y desmontaje.
- Verificación específica: 4 archivos y 18 pruebas correctas entre hook,
  servicio, utilidades y caracterización del componente. ESLint específico
  correcto en los ocho archivos implicados.

## Cursos - capa 4: hook de formulario y comandos

- `useComandosCursos.js` posee nombre, jornada, estado e id de edición, y expone
  actualización de campos, inicio/cancelación de edición, guardado y cambio de
  estado.
- La validación conserva el mensaje exacto `Falta nombre` y no introduce reglas
  nuevas para jornada o estado.
- Creación y actualización construyen el payload mediante la utilidad pura y
  delegan el transporte al servicio sin modificar el contrato.
- El guardado conserva alertas de éxito, detalles del backend, registro del
  error, limpieza a jornada Mañana y recarga del filtro vigente.
- El cambio de estado conserva la omisión cuando no cambia el valor, texto de
  confirmación, PATCH, fallback al estado solicitado, mensaje de error y
  actualización inmediata de lista/formulario.
- `CrearCurso.jsx` dejó de contener estado del formulario, validación, payload,
  llamadas de comandos, confirmaciones, alertas o coordinación de recarga.
  Conserva invocación de hooks y todo el JSX.
- `useComandosCursos.test.js` protege edición, cancelación, validación, payloads
  de crear/actualizar, errores, confirmación, actualización según filtro y
  sincronización de la edición.
- Verificación específica: 5 archivos y 25 pruebas correctas entre hooks,
  servicio, utilidades y caracterización del componente. ESLint específico
  correcto en los diez archivos implicados.

## Cursos - capa 5: presentación

- `FormularioCurso.jsx` conserva título crear/editar, nombre, jornada, estado,
  opciones, clases responsive y botones; recibe valores y delega campos,
  guardado y cancelación mediante props.
- `ListaCursos.jsx` conserva título, filtro operativo, tabla con
  desbordamiento, columnas, insignias de jornada/estado, selectores y Editar.
- Los componentes presentacionales no importan hooks, servicios ni transporte;
  solo consumen props y constantes/transformaciones puras del dominio.
- `CrearCurso.jsx` quedó dedicado a invocar los dos hooks y mapear sus datos y
  callbacks a formulario y listado dentro del contenedor visual existente.
- No se modificaron rutas, textos, clases CSS, jornadas, opciones, estructura
  responsive ni comportamiento de los eventos.
- Las pruebas colocadas junto a cada componente protegen modos crear/editar,
  controles, guardado, cancelación, tabla, jornadas, insignias, filtro y
  delegación de editar/cambiar estado.
- Verificación específica: 7 archivos y 29 pruebas correctas entre
  presentación, hooks, servicio, utilidades y caracterización integrada.
  ESLint específico correcto en los catorce archivos implicados.

## Cursos - capa 6: composición

- El contenedor y su prueba integrada se consolidaron en
  `src/components/administracionAcademica/cursos/`, junto al formulario y
  listado que conecta.
- `CrearCurso.jsx` contiene únicamente invocación de hooks de consulta y
  comandos, y mapeo explícito de valores/callbacks a componentes.
- `Admin.jsx` conserva Cursos como segunda pestaña y actualiza solamente la ruta
  de su import diferido al contenedor consolidado.
- `Admin.test.jsx` protege ahora explícitamente la carga diferida de Cursos,
  selección mediante `aria-current` y posterior navegación a Asignaciones.
- `GestionAcademica.jsx` solo actualizó el import para permanecer resoluble; no
  se reactivó ni modificó su comportamiento.
- Se eliminaron `src/components/CrearCurso.jsx` y su prueba en la ubicación
  antigua; no queda wrapper, segundo punto de entrada ni implementación
  duplicada.
- Verificación específica: 8 archivos y 30 pruebas correctas entre composición,
  presentación, hooks, servicio y utilidades. ESLint específico correcto en
  todo el flujo de cursos y las raíces consumidoras.

## Materias - capa 1: utilidades puras

- `materias.js` centraliza estados `activo`/`inactivo`, filtro `todos`,
  etiquetas y clases visuales vigentes.
- `normalizarNombreMateria` conserva recorte, compactación de espacios y
  mayúsculas regionales `es-CO`.
- `construirPayloadMateria` conserva exactamente `{ nombre, estado }` y no
  incorpora diferencias de transporte como la ruta singular de creación.
- `obtenerMensajeErrorMateria` conserva detalles de arreglo unidos por salto de
  línea, detalle simple y mensaje alternativo.
- `aplicarEstadoMateria` actualiza sin mutar y retira inmediatamente la materia
  cuando deja de pertenecer al filtro activo/inactivo; con `todos` la conserva.
- `CrearMateria.jsx` consume estas utilidades pero mantiene HTTP, estado,
  efectos, comandos, confirmaciones, alertas y JSX para capas posteriores.
- La caracterización protege expresamente `POST /materia`, mientras listado,
  actualización y estado continúan usando rutas plurales `/materias`.
- Verificación específica: 2 archivos y 10 pruebas correctas entre utilidades y
  caracterización del componente. ESLint correcto en los cuatro archivos
  implicados.

## Materias - capa 2: servicio HTTP

- `materiasApi.js` centraliza `GET /materias` con filtro `estado`, la creación
  singular `POST /materia`, `PUT /materias/:id` y
  `PATCH /materias/:id/estado`.
- El listado conserva exactamente `params: { estado }`; crear y actualizar
  transportan el mismo objeto de payload y el cambio de estado conserva
  `{ estado }`.
- Cada operación devuelve `response.data` y propaga el error original para que
  el consumidor mantenga mensajes y decisiones existentes.
- El listado acepta señal opcional sin modificar la llamada actual; su uso
  corresponderá a la capa de consultas.
- `CrearMateria.jsx` dejó de importar `src/utils/api.js` y ya no contiene rutas
  ni verbos HTTP. Conserva estado, efectos, comandos y JSX.
- `materiasApi.test.js` protege rutas singular/plurales, filtro, señal opcional,
  payloads por referencia, datos devueltos, PATCH y propagación de errores.
- Verificación específica: 3 archivos y 14 pruebas correctas entre servicio,
  utilidades y caracterización del componente. ESLint específico correcto en
  los seis archivos implicados.

## Materias - capa 3: hook de consultas

- `useMaterias.js` posee la lista de materias y el filtro de estado, cuyo valor
  inicial continúa siendo `activo`.
- La carga inicial y cada cambio de filtro consultan mediante `listarMaterias`,
  conservando el parámetro `estado` y agregando una señal de cancelación.
- `recargar` permite sincronizar el filtro vigente después de un comando sin
  duplicar la consulta en el componente.
- Cada nueva carga cancela la anterior y comprueba que la solicitud siga
  vigente antes de actualizar la lista; el desmontaje también cancela la
  petición pendiente.
- Los errores continúan registrándose en consola y no introducen mensajes,
  estados visuales ni recuperaciones nuevas.
- `CrearMateria.jsx` dejó de contener estado de lista/filtro, efectos, callbacks
  de consulta y acceso al listado. Conserva formulario, creación, actualización,
  confirmación/cambio de estado y todo el JSX.
- `useMaterias.test.js` protege carga activa inicial, señal, cambio de filtro,
  cancelación, descarte de respuesta tardía, recarga, error y desmontaje.
- Verificación específica: 4 archivos y 18 pruebas correctas entre hook,
  servicio, utilidades y caracterización del componente. ESLint específico
  correcto en los ocho archivos implicados.

## Materias - capa 4: hook de formulario y comandos

- `useComandosMaterias.js` posee nombre, estado e id de edición, y expone
  actualización de campos, inicio/cancelación, guardado y cambio de estado.
- La validación conserva el mensaje exacto `Falta nombre` sin reglas nuevas.
- Creación y actualización construyen el payload mediante la utilidad pura y
  delegan al servicio, que conserva la creación singular.
- El guardado conserva alertas, detalles del backend, registro de error,
  limpieza del formulario y recarga del filtro vigente.
- El cambio de estado conserva omisión sin cambio, confirmación, PATCH, fallback,
  mensaje de error y actualización inmediata de lista/formulario.
- `CrearMateria.jsx` dejó de contener estado del formulario, validación, payload,
  servicios, confirmaciones, alertas o coordinación de recarga. Conserva hooks
  y todo el JSX.
- `useComandosMaterias.test.js` protege edición, cancelación, validación,
  payloads, crear/actualizar, errores, confirmación, filtro y sincronización.
- Verificación específica: 5 archivos y 25 pruebas correctas entre hooks,
  servicio, utilidades y caracterización. ESLint correcto en los diez archivos.

## Materias - capa 5: presentación

- `FormularioMateria.jsx` conserva título crear/editar, nombre, estado,
  opciones, clases responsive y botones; recibe valores y delega campos,
  guardado y cancelación mediante props.
- `ListaMaterias.jsx` conserva título, filtro remoto, tabla con desbordamiento,
  columnas, insignias de estado, selectores y acción Editar.
- Los componentes presentacionales no importan hooks, servicios ni transporte;
  solo consumen props y constantes/transformaciones puras de Materias.
- `CrearMateria.jsx` quedó dedicado a invocar los hooks de consultas y comandos
  y mapear sus datos y callbacks dentro del contenedor visual existente.
- No se modificaron rutas, textos, clases CSS, opciones, estructura responsive
  ni comportamiento observable de los eventos.
- Las pruebas colocadas junto a cada componente protegen modos crear/editar,
  campos, guardado, cancelación, tabla, insignias, filtro y delegación de editar
  y cambiar estado.
- Verificación específica: 7 archivos y 29 pruebas correctas entre
  presentación, hooks, servicio, utilidades y caracterización integrada.
  ESLint específico correcto en los catorce archivos implicados.

## Materias - capa 6: composición

- El contenedor y su prueba integrada se consolidaron en
  `src/components/administracionAcademica/materias/`, junto al formulario y
  listado que conectan.
- `CrearMateria.jsx` contiene únicamente invocación de hooks de consultas y
  comandos, y mapeo explícito de valores/callbacks a componentes.
- `Admin.jsx` conserva Materias como tercera pestaña y actualiza solamente la
  ruta de su import diferido al contenedor consolidado.
- `Admin.test.jsx` protege explícitamente la carga diferida de Materias,
  selección mediante `aria-current` y navegación posterior a Asignaciones.
- `GestionAcademica.jsx` solo actualizó el import para permanecer resoluble; no
  se reactivó ni se modificó su comportamiento.
- Se eliminaron `src/components/CrearMateria.jsx` y su prueba de la ubicación
  antigua; no queda wrapper, segundo punto de entrada ni implementación
  duplicada.
- Verificación específica: 8 archivos y 30 pruebas correctas entre composición,
  presentación, hooks, servicio y utilidades. ESLint específico correcto en
  los diecisiete archivos del flujo y sus raíces consumidoras.

## Horarios - capa 1: utilidades puras

- `horarios.js` centraliza los cinco días laborales y `formatearHora12`, que
  conserva vacío, valores con AM/PM y conversión desde formato de 24 horas.
- Las funciones de valores únicos conservan el primer orden recibido; Cursos
  solicita orden alfabético únicamente para sus opciones visibles.
- La búsqueda de cursos conserva recorte, comparación sin distinguir
  mayúsculas y la misma lista cuando no existe consulta.
- Los filtros por profesor/curso y por día conservan comparación estricta y el
  orden de entrada; la vista por curso solicita expresamente orden por hora.
- `HorariosProfesores.jsx` y `HorariosPorCurso.jsx` consumen las utilidades sin
  mover transporte, estado, efectos, errores, selección ni JSX.
- La selección inicial por curso sigue tomando el primer curso de la respuesta,
  aunque las opciones visibles se ordenen alfabéticamente después.
- Las pruebas de caracterización protegen endpoint, carga, vacío, selección,
  búsqueda, calendario, formato, días libres y orden de clases/opciones.
- `horarios.test.js` protege días, formato, unicidad, inmutabilidad, búsqueda,
  filtros y orden opcional.
- Verificación específica: 3 archivos y 11 pruebas correctas entre utilidades y
  ambas vistas. ESLint específico correcto en los seis archivos implicados.

## Horarios - capa 2: servicio HTTP

- `horariosApi.js` encapsula exclusivamente `GET /hora/horarios-admin` y
  devuelve `response.data` por referencia.
- El servicio propaga el error original sin normalizarlo, registrar mensajes ni
  introducir decisiones visuales.
- `HorariosProfesores.jsx` y `HorariosPorCurso.jsx` dejaron de importar
  `src/utils/api.js` y ya no contienen rutas ni verbos HTTP.
- Cada vista conserva su invocación independiente al servicio, estado de carga,
  efecto, selección inicial, texto de error y todo el JSX.
- No se agregaron parámetros, señales, validaciones de estado HTTP ni fallbacks
  ausentes en el contrato anterior.
- `horariosApi.test.js` protege ruta exacta, referencia de los datos devueltos y
  propagación del error original.
- Verificación específica: 4 archivos y 13 pruebas correctas entre servicio,
  utilidades y ambas vistas. ESLint específico correcto en los ocho archivos
  implicados.

## Horarios - capa 3: hooks de consulta

- `useHorariosProfesores.js` posee lista, carga y profesor seleccionado; deriva
  profesores únicos y horarios de la selección mediante utilidades puras.
- `useHorariosPorCurso.js` posee lista, carga, curso seleccionado y búsqueda;
  conserva opciones ordenadas, filtro local y selección de la primera
  coincidencia cuando corresponde.
- Cada hook ejecuta su propia consulta, preservando las dos cargas independientes
  y los mensajes exactos de error de cada vista.
- Las solicitudes reciben `AbortSignal`, descartan respuestas después del
  desmontaje y se cancelan al liberar cada hook.
- `horariosApi.js` acepta la señal opcional sin alterar la llamada histórica sin
  opciones ni la referencia de los datos devueltos.
- `HorariosProfesores.jsx` y `HorariosPorCurso.jsx` dejaron de contener estado,
  efectos, acceso al servicio, coordinación de carga y mensajes de error.
  Conservan carga/vacío visibles, controles, calendario y todo el JSX.
- Las pruebas de hooks protegen carga, señal, selección inicial/manual, datos
  derivados, búsqueda, ausencia de coincidencias, errores y desmontaje.
- Verificación específica: 6 archivos y 20 pruebas correctas entre hooks,
  servicio, utilidades y ambas vistas. ESLint específico correcto en los doce
  archivos implicados.

## Horarios - capa 4: auditoría de comandos

- El mapa de contratos, el servicio, los hooks y las vistas confirman que
  Horarios es un flujo exclusivamente de lectura mediante
  `GET /hora/horarios-admin`.
- No existen `POST`, `PUT`, `PATCH`, `DELETE`, payloads, formularios de envío,
  botones de acción, confirmaciones, alertas ni mutaciones de dominio.
- Los cambios de profesor, curso y búsqueda son estado local de consulta y ya
  pertenecen a los hooks específicos de la capa 3; no son comandos del backend.
- No se creó `useComandosHorarios` ni otra abstracción vacía porque no tendría
  responsabilidad ni uso real.
- `horariosApi.test.js` protege el único GET, sus datos, errores y señal; las
  pruebas de hooks y vistas protegen que las interacciones solo seleccionan o
  filtran datos cargados.
- Verificación específica sin cambios de implementación: 6 archivos y 20
  pruebas correctas entre hooks, servicio, utilidades y ambas vistas. ESLint
  específico correcto en los doce archivos implicados.

## Horarios - capa 5: presentación

- `CalendarioProfesores.jsx` conserva carga, vacío, selector de profesor,
  calendario de cinco días, formato horario, materias, cursos y días libres.
- `CalendarioPorCurso.jsx` conserva carga, vacío, búsqueda, selector con estado
  sin coincidencias, orden por hora, profesores y calendario responsive.
- Ambos componentes reciben datos y callbacks exclusivamente mediante props;
  no importan hooks, servicios, transporte ni APIs del navegador.
- La presentación solo importa días y transformaciones puras específicas de
  Horarios para construir los bloques visibles.
- `HorariosProfesores.jsx` y `HorariosPorCurso.jsx` quedaron dedicados a invocar
  sus hooks y mapear explícitamente valores/callbacks a los calendarios.
- No se modificaron textos, clases CSS, colores, formato, orden, estados visibles
  ni comportamiento de los controles.
- Las pruebas colocadas junto a cada calendario protegen carga, vacío, contenido,
  días libres, orden y delegación de búsqueda/selecciones.
- Verificación específica: 8 archivos y 24 pruebas correctas entre presentación,
  contenedores, hooks, servicio y utilidades. ESLint específico correcto en los
  dieciséis archivos implicados.

## Horarios - capa 6: composición

- `HorariosAdmin.test.jsx` protege título, saludo con nombre/fallback y presencia
  simultánea de las vistas por profesor y curso antes y después del movimiento.
- Los dos contenedores y sus pruebas integradas se consolidaron en
  `src/components/administracionAcademica/horarios/`, junto a los calendarios
  que conectan.
- `HorariosAdmin.jsx` conserva la raíz de `/admin/horarios` y actualiza solamente
  los imports de ambos contenedores a sus ubicaciones definitivas.
- `App.jsx`, la ruta protegida, navegación, lectura de `localStorage`, textos y
  composición visible no se modificaron.
- Se eliminaron las ubicaciones antiguas bajo `src/components/`; no quedan
  wrappers, imports anteriores ni implementaciones duplicadas.
- Verificación específica: 9 archivos y 26 pruebas correctas entre composición,
  presentación, hooks, servicio y utilidades. ESLint específico correcto en los
  dieciocho archivos del flujo y su página raíz.

## Decisiones de capa 0

- Migrar primero asignaciones por concentrar el mayor riesgo relacional y de
  horario. No modificar profesores, cursos y materias simultáneamente.
- Mantener el contrato singular `POST /materia`; no homologarlo por apariencia.
- Tratar `DELETE /asignaciones/:id` como comando de desactivación.
- Mantener horarios por profesor y por curso como consumidores distintos hasta
  que una capa posterior demuestre una coordinación reutilizable real.
- No tocar Orden boletín ni extraer código compartido con ese dominio.

## Decisiones de capa 1

- Limitar la extracción a asignaciones, según la entidad piloto definida en la
  capa 0; profesores, cursos, materias y vistas de horarios no se modificaron.
- Mantener como utilidades privadas del archivo las búsquedas auxiliares que no
  constituyen un contrato externo.
- Preservar la comparación de identificadores mediante `String` para aceptar
  las formas numéricas y textuales que ya consume la interfaz.
- No normalizar respuestas inexistentes ni cambiar el orden de errores por
  apariencia; la capa reproduce el comportamiento observado.

## Decisiones de capa 2

- Crear un servicio dedicado `asignacionesApi.js` en vez de anticipar un
  servicio monolítico para todas las entidades académicas.
- Mantener funciones HTTP pequeñas y conservar `Promise.all` en el componente;
  trasladar carga, recarga y disponibilidad antes de la capa 3 mezclaría
  transporte con coordinación de consultas.
- Recibir parámetros y payloads ya construidos por las utilidades puras, y
  transportarlos sin clonarlos ni reinterpretarlos.
- No agregar señales de cancelación que el flujo actual todavía no utiliza; la
  capa de consultas evaluará cancelación manteniendo el contrato observable.

## Decisiones de capa 3

- Separar catálogos/lista y disponibilidad en dos hooks para evitar que un
  cambio frecuente de profesor o día reinicie la carga principal.
- Mantener una señal común para el `Promise.all` de catálogos y lista, de modo
  que la carga se acepte o descarte como una sola unidad coherente.
- Conservar el manejo visual actual ante errores: registrar en consola y
  finalizar la carga sin introducir textos nuevos ni rediseñar estados.
- Exponer una recarga silenciosa desde el hook de consultas para que los
  comandos actuales puedan sincronizar datos sin mostrar la pantalla de carga.
- No mover el temporizador del mensaje, el formulario ni los comandos; esas
  responsabilidades corresponden a la capa 4.

## Decisiones de capa 4

- Mantener formulario y comandos en un mismo hook porque comparten estado de
  edición, mensajes, validación y limpieza; dividirlos exigiría sincronización
  artificial sin otro consumidor real.
- Recibir `cursos`, `listaAsignaciones` y `recargar` desde el hook de consultas,
  sin hacer que el hook de comandos vuelva a consultar datos por su cuenta.
- Conservar la confirmación de desactivación dentro del comando para impedir
  que un consumidor invoque accidentalmente el DELETE sin esa protección.
- Exponer callbacks y valores planos al JSX actual, preparando la capa
  presentacional sin extraer componentes anticipadamente.
- No agregar bloqueos de concurrencia, mensajes ni recuperaciones nuevas; se
  conserva el comportamiento protegido.

## Decisiones de capa 5

- Separar cuatro unidades por responsabilidad visual real, evitando un
  componente genérico de panel o formulario sin un segundo uso demostrado.
- Hacer que el formulario componga la disponibilidad porque comparten la misma
  sección visual, pero mantenerla en un archivo independiente por sus cuatro
  estados presentacionales propios.
- Permitir imports de constantes y formateadores puros desde componentes, sin
  introducir estado ni conocimiento del transporte.
- Mantener `AsignarClase.jsx` como contenedor de la pestaña durante esta capa;
  mover o consolidar la raíz pertenece a la capa 6.
- Registrar, pero no corregir silenciosamente, la falta actual de asociación
  `htmlFor` de etiquetas para no mezclar accesibilidad funcional con la
  migración estructural solicitada.

## Decisiones de capa 6

- Mantener `Admin.jsx` como página raíz porque la asignación es una pestaña y
  no una ruta independiente; crear otra página alteraría la jerarquía actual.
- Mover el contenedor al dominio sin conservar un archivo puente en la ruta
  antigua, evitando dos puntos de entrada para la misma implementación.
- Actualizar el import de la raíz antigua sin decidir todavía su eliminación;
  esa decisión requiere revisar todo el módulo al consolidar sus entidades.
- Probar la composición de `Admin` mediante dobles de sus pestañas para no
  introducir dependencias ni cambios en boletines u otros dominios.
- No iniciar la capa 7: asignaciones está consolidada, pero el módulo completo
  todavía requiere profesores, cursos, materias y horarios.

## Decisiones de profesores - capa 1

- Mantener las utilidades específicas de profesores; el manejo parecido de
  errores en cursos y materias todavía no se comparte hasta migrar y comprobar
  un contrato realmente común.
- Preservar la asimetría del backend: el payload envía
  `documento_identidad`, mientras la respuesta usada al editar y buscar expone
  `documento`.
- Conservar documento, teléfono y contraseña tal como los introduce el usuario;
  no agregar normalizaciones funcionales fuera de nombre, apellido y email.
- Mantener la comparación estricta de ids en el cambio de estado porque es el
  comportamiento actual protegido.
- No mover peticiones ni estado React durante esta capa.

## Decisiones de profesores - capa 2

- Crear un servicio específico de profesores en vez de ampliar el servicio de
  asignaciones o anticipar un servicio académico monolítico.
- Conservar la construcción del payload en utilidades y limitar el servicio a
  transportar contratos ya formados, sin clonar ni normalizar valores.
- Mantener en `CrearProfesor.jsx` la carga, recarga, confirmación, mensajes y
  actualización de listas; mover esas responsabilidades corresponde a hooks.
- Preservar los mensajes y detalles del backend en el componente al propagar
  sin reinterpretación los errores del transporte.
- No iniciar la capa 3 ni modificar cursos, materias o horarios.

## Decisiones de profesores - capa 3

- Mantener lista y filtro juntos porque cada cambio del filtro determina la
  consulta que produce esa lista.
- Exponer temporalmente `setProfesores` para que el comando de cambio de estado
  conserve su actualización inmediata; la coordinación definitiva pasará al
  hook de comandos en la capa 4.
- Cancelar tanto por cambio de filtro como por recarga o desmontaje y, además,
  comparar el controlador vigente para ignorar clientes que resuelvan después
  de abortar.
- No agregar un indicador de carga porque la interfaz anterior no lo mostraba;
  hacerlo cambiaría el comportamiento visual.
- Mantener validación, payloads, alertas, confirmación y edición en el
  componente hasta la capa de comandos.
- No iniciar la capa 4 ni modificar cursos, materias o horarios.

## Decisiones de profesores - capa 4

- Mantener formulario y comandos en un mismo hook porque creación,
  actualización y cambio de estado coordinan el mismo modo de edición.
- Representar los campos en un único objeto interno y exponer valores planos
  para que el JSX conserve controles y textos sin introducir un formulario
  genérico.
- Recibir `estadoFiltro`, `setProfesores` y `recargar` desde el hook de
  consultas, evitando una segunda fuente de verdad o nuevas peticiones dentro
  del hook de comandos.
- Conservar `documentoIdentidad` como nombre del campo interno y transformar a
  `documento_identidad` únicamente mediante la utilidad de contrato.
- Mantener la búsqueda local en el contenedor porque no participa en comandos
  ni transporte y se moverá con la presentación si corresponde.
- No introducir estados de guardado, bloqueos ni mensajes nuevos que la
  interfaz anterior no tenía.
- No iniciar la capa 5 ni modificar cursos, materias o horarios.

## Decisiones de profesores - capa 5

- Separar formulario y listado porque tienen responsabilidades visuales y
  eventos distintos, sin crear controles genéricos carentes de segundo uso.
- Mantener la búsqueda dentro del listado como estado exclusivamente visual;
  el filtro de estado sigue en el hook de consulta porque dispara transporte.
- Permitir que presentación importe constantes y filtros puros del dominio,
  sin exponer rutas, efectos ni comandos HTTP.
- Mantener el borde exterior y la conexión de hooks en `CrearProfesor.jsx`
  durante esta capa; su ubicación definitiva corresponde a composición.
- Conservar las etiquetas sin asociación `htmlFor` para no mezclar una mejora
  de accesibilidad no solicitada con la migración arquitectónica.
- No iniciar la capa 6 ni modificar cursos, materias o horarios.

## Decisiones de profesores - capa 6

- Mantener `Admin.jsx` como página raíz porque Profesores continúa siendo una
  pestaña y no una ruta independiente.
- Mover el contenedor sin archivo puente para asegurar un único punto de entrada
  y evitar mantener dos rutas internas para la misma implementación.
- Actualizar la raíz histórica `GestionAcademica.jsx` sin decidir todavía su
  eliminación; esa decisión permanece aplazada hasta la consolidación global.
- Reutilizar la prueba existente de `Admin` porque ya protege que Profesores es
  el contenido inicial y que la navegación entre pestañas se conserva.
- No iniciar Cursos, Materias, Horarios ni el cierre global en esta capa.

## Decisiones de cursos - capa 1

- Mantener utilidades específicas de Cursos en vez de acoplarlas al archivo de
  Profesores; una eventual utilidad común requiere migrar más entidades y
  comprobar que sus contratos de error y normalización coinciden realmente.
- Extraer las jornadas como datos del dominio conservando valores y emojis, sin
  introducir jornadas nuevas ni modificar el valor inicial.
- Preservar la comparación estricta de ids al actualizar el estado y la retirada
  inmediata según el filtro operativo.
- Mantener el filtro remoto `estadoFiltro` en el componente; mover consultas y
  efectos corresponde a la capa 3, después del servicio HTTP.
- No mover peticiones, estado React, comandos ni JSX durante esta capa.
- No iniciar la capa 2 ni modificar Materias u Horarios.

## Decisiones de cursos - capa 2

- Crear un servicio específico de Cursos en vez de ampliar los servicios de
  Profesores o Asignaciones o anticipar un servicio académico monolítico.
- Conservar la construcción del payload en utilidades y limitar el servicio a
  transportar contratos ya formados, sin clonar ni normalizar valores.
- Mantener en `CrearCurso.jsx` carga, recarga, confirmación, mensajes y
  actualización de listas; mover esas responsabilidades corresponde a hooks.
- Propagar sin reinterpretación los errores del transporte para conservar los
  detalles del backend y fallbacks ya protegidos.
- No iniciar la capa 3 ni modificar Materias u Horarios.

## Decisiones de cursos - capa 3

- Mantener lista y filtro juntos porque cada cambio del filtro determina la
  consulta que produce esa lista.
- Exponer temporalmente `setCursos` para que el comando de cambio de estado
  conserve su actualización inmediata; la coordinación definitiva pasará al
  hook de comandos en la capa 4.
- Cancelar por cambio de filtro, recarga y desmontaje y comparar además el
  controlador vigente para ignorar clientes que resuelvan después de abortar.
- No agregar indicador de carga porque la interfaz anterior no lo mostraba.
- Mantener validación, payload, alertas, confirmación y edición en el componente
  hasta la capa de comandos.
- No iniciar la capa 4 ni modificar Materias u Horarios.

## Decisiones de cursos - capa 4

- Mantener formulario y comandos en un mismo hook porque creación,
  actualización y cambio de estado coordinan el mismo modo de edición.
- Representar los tres campos en un objeto interno y exponer valores planos para
  conservar el JSX actual sin crear un formulario genérico.
- Recibir `estadoFiltro`, `setCursos` y `recargar` desde el hook de consultas,
  evitando otra fuente de verdad o peticiones duplicadas.
- Reutilizar `JORNADA_CURSO_INICIAL` para inicialización, limpieza y fallback de
  edición sin duplicar el literal Mañana.
- No introducir estados de guardado, bloqueos ni mensajes nuevos.
- No iniciar la capa 5 ni modificar Materias u Horarios.

## Decisiones de cursos - capa 5

- Separar formulario y listado porque tienen responsabilidades visuales y
  eventos distintos, sin crear controles genéricos sin segundo uso.
- Mantener el filtro de estado como prop del listado porque sigue perteneciendo
  al hook de consulta y dispara transporte.
- Permitir imports de constantes y transformaciones puras desde presentación,
  sin exponer rutas, efectos ni comandos HTTP.
- Mantener el borde exterior y la conexión de hooks en `CrearCurso.jsx` durante
  esta capa; su ubicación definitiva corresponde a composición.
- Conservar las etiquetas sin asociación `htmlFor` para no mezclar una mejora
  de accesibilidad no solicitada con la migración arquitectónica.
- No iniciar la capa 6 ni modificar Materias u Horarios.

## Decisiones de cursos - capa 6

- Mantener `Admin.jsx` como página raíz porque Cursos continúa siendo una
  pestaña y no una ruta independiente.
- Mover el contenedor sin archivo puente para asegurar un único punto de entrada
  y evitar dos rutas internas para la misma implementación.
- Actualizar la raíz histórica `GestionAcademica.jsx` sin decidir todavía su
  eliminación; esa decisión permanece aplazada hasta la consolidación global.
- Ampliar la prueba de `Admin` antes del movimiento para proteger explícitamente
  el contenido de Cursos, sin cargar los dominios reales dentro de esa prueba.
- No iniciar Materias, Horarios ni el cierre global en esta capa.

## Decisiones de materias - capa 1

- Mantener utilidades específicas de Materias en vez de acoplarlas a Cursos o
  Profesores; la coincidencia visual no justifica mezclar contratos de dominio.
- Mantener la asimetría `POST /materia` fuera de las utilidades puras; el
  servicio de la capa 2 deberá preservarla explícitamente.
- Preservar la comparación estricta de ids al actualizar estado y la retirada
  inmediata según el filtro operativo.
- Mantener el filtro remoto `estadoFiltro` en el componente; consultas y efectos
  corresponden a la capa 3 después del servicio HTTP.
- No mover peticiones, estado React, comandos ni JSX durante esta capa.
- No iniciar la capa 2 ni modificar Horarios.

## Decisiones de materias - capa 2

- Crear un servicio específico de Materias en vez de ampliar servicios de otras
  entidades o anticipar un servicio académico monolítico.
- Nombrar `crearMateria` por la operación de dominio sin ocultar en pruebas que
  su endpoint real permanece singular `/materia`.
- Conservar construcción del payload en utilidades y limitar el servicio a
  transportar contratos ya formados, sin clonar ni normalizar valores.
- Mantener en `CrearMateria.jsx` carga, recarga, confirmación, mensajes y
  actualización de listas; mover esas responsabilidades corresponde a hooks.
- Propagar los errores sin reinterpretarlos para conservar detalles y fallbacks.
- No iniciar la capa 3 ni modificar Horarios.

## Decisiones de materias - capa 3

- Mantener lista y filtro juntos porque cada cambio del filtro determina la
  consulta que produce esa lista.
- Exponer temporalmente `setMaterias` para que el comando de cambio de estado
  conserve su actualización inmediata; la coordinación definitiva pasará al
  hook de comandos en la capa 4.
- Cancelar por cambio de filtro, recarga y desmontaje y comparar además el
  controlador vigente para descartar clientes que resuelvan después de abortar.
- No agregar indicador de carga porque la interfaz anterior no lo mostraba.
- Mantener validación, payload, alertas, confirmación y edición en el componente
  hasta la capa de comandos.
- No iniciar la capa 4 ni modificar Horarios.

## Decisiones de materias - capa 4

- Mantener formulario y comandos en un hook porque creación, actualización y
  estado coordinan el mismo modo de edición.
- Representar los dos campos en un objeto interno y exponer valores planos para
  conservar el JSX sin crear un formulario genérico.
- Recibir `estadoFiltro`, `setMaterias` y `recargar` desde consultas, evitando
  otra fuente de verdad o peticiones duplicadas.
- Mantener la ruta singular encapsulada en el servicio; el hook opera por el
  comando de dominio `crearMateria`.
- No introducir estados de guardado, bloqueos ni mensajes nuevos.
- No iniciar la capa 5 ni modificar Horarios.

## Decisiones de materias - capa 5

- Separar formulario y listado porque poseen responsabilidades visuales y
  eventos distintos, sin introducir componentes genéricos sin un segundo uso.
- Mantener filtro y acciones como props: su estado y efectos continúan en los
  hooks y la presentación se limita a delegar eventos.
- Permitir imports de constantes y transformaciones puras de Materias desde la
  presentación, sin exponer transporte, mensajes ni comandos HTTP.
- Mantener temporalmente el borde exterior y la conexión de hooks en
  `src/components/CrearMateria.jsx`; su ubicación definitiva corresponde a la
  capa de composición.
- Conservar las etiquetas sin asociación `htmlFor` para no mezclar una mejora
  de accesibilidad ajena con la migración arquitectónica.
- No iniciar la capa 6 ni modificar Horarios.

## Decisiones de materias - capa 6

- Mantener `Admin.jsx` como página raíz porque Materias continúa siendo una
  pestaña y no una ruta independiente.
- Mover el contenedor sin archivo puente para asegurar un único punto de entrada
  y evitar dos rutas internas para la misma implementación.
- Actualizar la raíz histórica `GestionAcademica.jsx` sin decidir todavía su
  eliminación; esa decisión permanece aplazada hasta la consolidación global.
- Ampliar la prueba de `Admin` antes del movimiento para proteger explícitamente
  el contenido de Materias sin cargar el dominio real dentro de esa prueba.
- No iniciar Horarios ni el cierre global en esta capa.

## Decisiones de horarios - capa 1

- Mantener utilidades específicas de Horarios; sus funciones compartidas tienen
  uso real en las dos vistas y no se mezclan con asignaciones.
- Conservar por separado el orden original usado para la selección inicial y el
  orden alfabético solicitado por la lista visible de cursos.
- Ordenar clases por hora solo en la vista por curso; la vista por profesor
  conserva el orden recibido del backend.
- Mantener comparación estricta de profesor, curso y día, sin normalizar datos
  ni agregar fallbacks que no existían.
- No mover todavía `GET /hora/horarios-admin`, estado React, efectos, errores o
  presentación; corresponden a las capas siguientes.
- No iniciar la capa 2 ni el cierre global.

## Decisiones de horarios - capa 2

- Mantener una única función de servicio porque ambas vistas consumen el mismo
  contrato sin parámetros ni variaciones de respuesta.
- Conservar dos invocaciones independientes para no anticipar coordinación de
  estado o ciclo de vida antes de la capa de hooks.
- No agregar `AbortSignal` durante la extracción de transporte; cancelación y
  descarte de respuestas se evaluarán al proteger los efectos en la capa 3.
- Mantener los dos mensajes de consola en sus vistas, donde todavía se decide el
  comportamiento observable de cada carga.
- No iniciar la capa 3 ni el cierre global.

## Decisiones de horarios - capa 3

- Usar dos hooks específicos para conservar consultas, mensajes y ciclos de vida
  independientes; no introducir caché, contexto ni una fuente compartida nueva.
- Mantener selección y búsqueda junto a la consulta que determina sus opciones y
  horarios derivados, sin crear un hook genérico de selector.
- Agregar señal opcional al servicio únicamente para cancelación desde hooks;
  la llamada sin opciones conserva exactamente el contrato de la capa 2.
- Mantener el orden original para selección inicial y el orden alfabético de las
  opciones visibles por curso.
- No crear hooks de comandos: Horarios no expone mutaciones HTTP ni payloads. La
  capa 4 realizará la auditoría formal antes de marcarla como no aplicable.
- No iniciar la capa 4, presentación ni composición.

## Decisiones de horarios - capa 4

- Marcar la capa de comandos como terminada y no aplicable después de comprobar
  fuentes, contrato y pruebas, en vez de inventar una unidad sin comportamiento.
- Considerar selección y búsqueda como estado de consulta local, no como
  comandos, porque no producen transporte ni mutaciones externas.
- Mantener el servicio con una única operación GET y conservar los dos hooks de
  consulta independientes.
- No modificar fuentes durante esta auditoría: la protección existente ya cubre
  íntegramente el contrato de solo lectura.
- No iniciar presentación, composición ni cierre global.

## Decisiones de horarios - capa 5

- Mantener dos calendarios presentacionales porque sus controles, colores y
  contenido de tarjetas difieren; no crear una grilla genérica anticipada.
- Permitir imports de constantes y transformaciones puras desde presentación,
  sin exponer estado, efectos ni transporte.
- Mantener carga y vacío dentro de cada calendario porque son estados visibles
  propios de cada vista y sus textos son diferentes.
- Conservar temporalmente los contenedores en `src/components/`; su ubicación
  definitiva y los imports de la página corresponden a composición.
- Conservar etiquetas sin asociación `htmlFor` para no introducir una mejora de
  accesibilidad ajena a la migración solicitada.
- No iniciar la capa 6 ni el cierre global.

## Decisiones de horarios - capa 6

- Mantener `HorariosAdmin.jsx` como página raíz porque ya corresponde a la ruta
  independiente `/admin/horarios` y posee el saludo del usuario.
- Mover ambos contenedores sin archivos puente para garantizar un único punto de
  entrada por vista.
- Proteger primero la composición de la página mediante mocks de los
  contenedores, sin ejecutar consultas reales dentro de esa prueba.
- Mantener `App.jsx` intacto porque su carga diferida apunta a la página, cuya
  ubicación no cambió.
- No iniciar la consolidación ni el cierre global en esta capa.

## Capa 7: cierre global

- Se auditaron rutas, imports y puntos de entrada: `/admin` conserva
  `Admin.jsx` y `/admin/horarios` conserva `HorariosAdmin.jsx`, ambas bajo
  `AdminRoute`.
- Se retiró `GestionAcademica.jsx` después de confirmar que no estaba enrutada,
  importada ni consumida y que duplicaba la gestión académica activa.
- Se comprobó que existe una sola implementación por contenedor del módulo y
  que no quedan imports hacia las ubicaciones antiguas de `src/components/`.
- Las páginas y los componentes de producción quedaron sin transporte HTTP
  directo; los cinco servicios concentran las operaciones del backend.
- Se actualizaron la arquitectura, el catálogo de componentes, el registro de
  cambios y el índice global de modularización.
- `pnpm run check:deploy` terminó correctamente con 77 archivos y 287 pruebas,
  ESLint correcto y build de producción correcto.
- `git diff --check` terminó correctamente y los 94 archivos del cambio
  pertenecen exclusivamente al módulo o a sus cinco documentos autorizados.

## Decisiones de cierre global

- Mantener `Admin.jsx` y `HorariosAdmin.jsx` como únicas raíces activas; sus
  rutas, protección, carga diferida, navegación y textos no cambian.
- Eliminar la raíz histórica en lugar de conservar un archivo puente sin
  consumidores, evitando dos composiciones distintas para el mismo dominio.
- Conservar servicios separados por entidad; no existe uso real que justifique
  fusionarlos en una abstracción compartida adicional.
- Mantener Orden boletín fuera del alcance aunque comparta la página `/admin`;
  no se modificó su implementación.
- No alterar contratos, mensajes, confirmaciones, payloads ni transformaciones
  durante el cierre.

## Riesgos residuales

- Los dos hooks de horarios consultan independientemente el mismo endpoint para
  conservar sus ciclos de carga, errores y selección originales.
- Los contratos del backend mantienen asimetrías existentes, entre ellas
  `documento` frente a `documento_identidad`, `POST /materia` en singular y las
  semánticas actuales de desactivación y eliminación.
- Las etiquetas visuales que originalmente no estaban asociadas mediante
  `htmlFor` se conservan así para no introducir un cambio ajeno a la migración.
- Los mensajes y formas de error siguen variando por entidad porque forman
  parte del comportamiento observable protegido.

## Estrategia adicional

Las extracciones continuarán por entidad. Un futuro servicio puede exponer
secciones claras, pero no debe convertirse en un archivo monolítico sin límites.

## Seguimiento por capas

| Capa | Estado |
|---:|---|
| 0. Contrato y protección | Terminada |
| 1. Utilidades puras | Terminada en asignaciones, profesores, cursos, materias y horarios |
| 2. Servicio HTTP | Terminada en asignaciones, profesores, cursos, materias y horarios |
| 3. Hooks de consulta | Terminada en asignaciones, profesores, cursos, materias y horarios |
| 4. Hooks de comandos | Terminada en asignaciones, profesores, cursos y materias; no aplica a horarios |
| 5. Presentación | Terminada en asignaciones, profesores, cursos, materias y horarios |
| 6. Composición | Terminada en asignaciones, profesores, cursos, materias y horarios |
| 7. Cierre | Terminada |

## Seguimiento por entidad

| Entidad | Estado arquitectónico | Siguiente trabajo |
|---|---|---|
| Asignaciones | Capas 0-6 y cierre global terminados | Ninguno |
| Profesores | Capas 1-6 y cierre global terminados | Ninguno |
| Cursos | Capas 1-6 y cierre global terminados | Ninguno |
| Materias | Capas 1-6 y cierre global terminados | Ninguno |
| Horarios | Capas 1-6 y cierre global terminados; comandos no aplican | Ninguno |

## Entrega final

- Última capa terminada: capa 7 de cierre global.
- Verificación final: `pnpm run check:deploy` correcto; 77 archivos y 287
  pruebas correctas, ESLint correcto y build de producción correcto.
- Calidad del diff: `git diff --check` correcto; 94 archivos auditados y
  ninguno fuera del alcance autorizado.
- Implementaciones antiguas: retiradas; no quedan imports, raíces ni
  contenedores duplicados.
- Archivos pendientes de implementación: ninguno.
- Siguiente acción exacta: no queda commit ni publicación pendiente; conservar
  la verificación manual de producción como seguimiento operativo si todavía
  no fue registrada.
- Mensaje sugerido para el commit único:
  `refactor(administracion-academica): modularizar gestion y horarios`.
- Codex no realizó commit, push ni deploy.
