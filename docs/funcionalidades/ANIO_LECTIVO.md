# Funcionalidad: Año lectivo — Frontend

## Control

- Estado: **Fase 5 completa y confirmada en Git; ajuste de navegación
  confirmado en `365d083`; fase 6 iniciada en el backend, sin código de esta
  fase todavía en el frontend.** El
  paso 5.10 quedó en `82675ba` y su registro principal en `cc0f45e`; el paso
  5.9 quedó confirmado en `0689b7d`, el paso 5.8 en `817c47e`; el paso 5.7 quedó en los
  commits `0848214` y `e3aced5`; los pasos 5.1 a 5.6 del backend ya están
  terminados. La fase 4 quedó completa en el commit
  `8eac0ce`. Se inició el 2026-10-03 con
  la autorización del usuario: inventario y plan por pasos (commit
  `dbb0e48`), paso 4.1 (la
  base: años, selector y aviso; commit `4b14347`), paso 4.2 (Administración
  y horarios por año; commit `78c48f7`), paso 4.3 (Tipos de pago y Cartera
  vencida por año; commit `0798f21`), paso 4.4 (Estudiantes por año; commit
  `c7f0622`), paso 4.5 (Boletines y certificados por año; commit `2140fae`)
  paso 4.6 (Listas de seguimiento y bandeja de planes por año; commit
  `72be3da`) y **paso 4.7 (diálogo al renombrar materias, `8eac0ce`)**. Con
  un solo año no cambia nada visible en datos ni botones. La fase 3 del backend está en
  GitHub desde el 2026-10-03 (`9edbe5d`); su contrato está en "Contrato del
  backend para la fase 4", más abajo.
- Tipo: Función nueva de producto. No es un módulo del plan de
  `docs/modularizacion/README.md` y no debe confundirse con uno.
- Repos afectados: este repo y `sistema_escolar_api`. **El documento
  principal es `sistema_escolar_api/docs/funcionalidades/ANIO_LECTIVO.md`**:
  ahí están el diagnóstico, el modelo de datos, las decisiones, las fechas
  límite y el plan de fases completo. Este documento cubre solo las
  pantallas.
- Riesgo: Alto en conjunto (dinero, migraciones y datos académicos), bajo en
  este repo si se respeta la regla "con el año activo, las peticiones son
  idénticas a las de hoy".
- Depende de: fases 1 a 3 del backend en producción antes de la fase 4 de
  este repo. Cumplido el 2026-10-03: el usuario subió la fase 3 a
  producción (`origin/main` en `9edbe5d`); el despliegue en Render no se ve
  desde el repo.
- Última actualización: 2026-10-07.

## Objetivo

1. Un selector de año **discreto**, solo para el admin, que no aparece
   mientras el colegio tenga un solo año. Hoy, en producción, no cambia nada
   visible.
2. Cuando el admin mira un año que no es el activo, un aviso claro de "solo
   consulta" y las pantallas cargando los datos de ese año.
3. Una pantalla de admin para preparar el año siguiente (copiar cursos,
   matricular) y activarlo.
4. Que en la pantalla de pagos se pueda elegir a qué año va un pago cuando
   existe un año en preparación o hay deuda de años anteriores.
5. Que el profesor pueda empezar 2027 con el planeador anual y los planes de
   clase de 2026 como base.

## Decisiones ya tomadas (con el usuario, 2026-09-29)

Las decisiones numeradas (17 al 2026-09-30) están en el documento del
backend. Las que cambian pantallas:

- Cursos nuevos cada año → los selectores de curso muestran solo los del
  año que se está mirando.
- Solo el admin consulta años pasados; los profesores ven solo el año
  activo → **el profesor no tiene selector** y sus pantallas no cambian.
- La deuda de años anteriores se ve aparte → estado de cuenta y cartera
  muestran una línea o columna "Años anteriores".
- Un pago se registra en el año de la deuda que salda → la pantalla de
  pagos permite elegir el año del pago.
- No se activa el año nuevo sin decidir por cada estudiante → la pantalla
  de activación muestra los pendientes y no deja continuar.
- Renombrar una materia que se usa en otro año: avisar y dejar elegir
  (decisión 12) → diálogo en la edición de materias.
- Planeador anual: lo trae el profesor con un botón, solo si su planeador
  está vacío (decisión 14), aunque el de 2026 lo haya escrito otro profesor
  (decisión 15).
- Planes de clase: el profesor usa uno de 2026 como base al crear uno nuevo;
  se copia solo el texto, no las evidencias (decisión 16).
- Conceptos de pago por año (decisión 17) → la pantalla de Tipos de pago
  muestra y edita los conceptos del año que se está mirando. Al preparar
  2027 se copian siempre, y el admin los ajusta mirando 2027 (por ejemplo,
  la mensualidad desde febrero) sin tocar 2026.
- Un año cerrado se ve como se veía al cerrarse (decisión 13) → no cambia
  nada en el frontend: el boletín que llega del backend ya viene así.

Decisiones de diseño de este repo (propuestas por el asistente, a confirmar
al empezar la fase 4):

- **El año elegido no se guarda entre sesiones.** Al entrar, siempre es el
  año activo. Vive en memoria (estado de React): recargar la página vuelve
  al año activo. Así nadie queda trabajando en un año viejo sin darse
  cuenta, y no se agrega ninguna clave nueva a `localStorage`.
- **El frontend no decide qué es editable.** El backend devuelve el estado
  de cada año; la pantalla oculta o desactiva botones por comodidad, pero la
  protección real es el 409 del backend, que se muestra tal cual.

## Arquitectura (según las capas del proyecto)

El año se usa en muchos módulos, así que su contrato va en la raíz de
`src/utils/`, igual que `src/utils/nivelAcademico.js`. Ningún módulo copia
constantes de otro (regla del `CLAUDE.md`).

| Pieza | Archivo propuesto | Qué hace |
|---|---|---|
| Servicio | `src/services/aniosLectivosApi.js` | Único punto HTTP: listar años; en la fase 5, crear, copiar, matricular, activar |
| Contrato puro | `src/utils/anioLectivo.js` | Normalizar la respuesta, encontrar el activo, etiqueta "2026 · Cerrado", y `parametrosAnio(seleccionado, activo)` |
| Estado compartido | `src/hooks/anioLectivo/AnioLectivoProvider.jsx` + `useAnioLectivo.js` | Carga los años una vez y guarda cuál se está mirando |
| Vistas | `src/components/anioLectivo/SelectorAnioLectivoView.jsx`, `AvisoAnioLectivoView.jsx` | Solo presentación, reciben datos y funciones por props |

### La regla que protege producción

`parametrosAnio` devuelve `{}` cuando se mira el año activo y
`{ anio_lectivo_id }` solo cuando se mira otro. Consecuencia: **mientras el
admin mire el año activo, cada petición es idéntica, byte a byte, a la de
hoy.** Las pruebas de servicio de cada módulo lo comprueban.

### Por qué un Context (patrón nuevo en este repo)

Hoy ninguna parte del proyecto usa `createContext`; las selecciones de
trabajo, como el periodo del profesor (`src/utils/periodoProfesor.js`), van
en `localStorage`. Para el año no sirve: la barra de navegación y la página
abierta necesitan el mismo valor, y la página tiene que recargar sus datos
en el momento en que el admin cambia de año. `localStorage` no avisa a los
componentes que ya están en pantalla. Un Context de React es la herramienta
estándar para eso. Se limita a este único caso y se documenta en
`docs/ARQUITECTURA_FRONTEND.md` al implementarlo.

- El proveedor envuelve solo el layout autenticado del admin (`Layout` en
  `src/App.jsx`).
- `useAnioLectivo()` usado fuera del proveedor (pantallas del profesor,
  pruebas de página existentes) devuelve el comportamiento de hoy: año
  activo, sin parámetros, editable. Así ninguna pantalla del profesor ni
  ninguna prueba existente necesita cambios.

### Dónde se ve

- **Selector**: en `NavAdminView`, con el mismo patrón que
  `renderNotificaciones`: la vista recibe una función que dibuja el
  selector, sin importar hooks. Oculto si hay un solo año.
- **Aviso de solo consulta**: debajo de la navegación, en el mismo lugar y
  con el mismo estilo que `TenantStatusBannerView` (`AvisoEstadoTenant` en
  `src/App.jsx`). Texto propuesto: "Estás viendo el año 2026 (cerrado).
  Solo consulta." con un botón "Volver a 2027". Para un año en preparación:
  "Estás preparando el año 2027."

## Plan de fases (numeración compartida con el backend)

Las fases 0 a 3 son solo del backend. Este repo empieza en la fase 4.

### Fase 4 — Selector y pantallas por año

1. Servicio, contrato puro, proveedor y vistas de la tabla anterior, cada uno
   con sus pruebas.
2. Consultas que pasan a depender del año. Cada hook agrega el año a sus
   dependencias para recargar cuando cambia, y cada servicio acepta
   `params` opcionales. Inventario del 2026-09-29 (confirmar con `grep` al
   empezar):
   - Cursos: `hooks/administracionAcademica/useCursos.js`,
     `useDatosAsignaciones.js`.
   - Boletines: `hooks/boletines/useConsultaBoletinesAdministrativos.js`,
     `useConsultaOrdenBoletin.js`.
   - Certificados: `hooks/certificadosImpresion/useConsultasCertificadosAdmin.js`.
   - Estudiantes: `hooks/estudiantesObservador/useListadoEstudiantesAdmin.js`.
   - Pagos: el listado de estudiantes de `services/pagosApi.js` y las deudas
     de `services/estudiantesObservadorApi.js`.
   - Cartera y tipos de pago: `services/carteraTiposPagoApi.js` (resumen,
     detalle, listado de conceptos y cursos para tipos de pago).
   - Dashboard del admin, listas de seguimiento y observador del admin: se
     confirman al empezar.
3. Pantallas que **no** dependen del año (inventario, ventas, egresos,
   nómina, préstamos, diseño de impresos): ignoran el selector. Pregunta de
   diseño para esta fase: ¿el selector se esconde en esas pantallas o se
   muestra desactivado con la nota "Esta sección no depende del año"?
4. Mirando un año que no es el activo: botones de crear, editar y borrar
   ocultos o desactivados en las pantallas académicas. Si igual llega un
   409 del backend, se muestra su mensaje tal cual.
5. Materias (`hooks/administracionAcademica/useComandosMaterias.js`): si al
   renombrar llega el 409 con el código de "materia usada en otro año", se
   muestra un diálogo con el mensaje del backend y dos botones:
   "Cambiar igual", que reenvía con la confirmación, y "Crear una materia
   nueva", que abre el formulario de crear con el nombre nuevo. El frontend
   no calcula si la materia se usa en otro año: lo dice el backend.
6. Terminado cuando: con un solo año no cambia nada visible (prueba de
   composición de `App`); con dos años, cada pantalla del inventario muestra
   lo del año elegido; `pnpm run check:deploy` pasa; el usuario lo revisa en
   local.

#### Contrato del backend para la fase 4 (su fase 3, terminada el 2026-10-02)

Fuente: `sistema_escolar_api/docs/API_ENDPOINTS.md` y la fase 3 de
`sistema_escolar_api/docs/funcionalidades/ANIO_LECTIVO.md`. Antes de usarlo,
confirmar que la fase 3 del backend ya está en producción.

- **Lista de años:** `GET /anios-lectivos` → `[{ "id", "anio", "estado" }]`,
  el más reciente primero. Estados: `preparacion`, `activo`, `cerrado`,
  `reabierto`. El admin recibe todos; el profesor, solo el activo.
- **Regla común de las lecturas:** aceptan `?anio_lectivo_id=` opcional. Sin
  él, el año activo, con la misma respuesta de siempre (por eso
  `parametrosAnio` debe devolver `{}` con el activo). Un año que no existe da
  `404` (en pagos, `400`); un profesor que pide otro año, `403`.
- **Lecturas que aceptan el año:**
  - Cursos: `GET /cursos` (con y sin paginar).
  - Conceptos: `GET /tipos-pagos` y `GET /tipos-pagos/detallado`.
  - Estudiantes: `GET /estudiantes` (sin año o con el activo, todos con su
    curso actual, como hoy; con otro año, los matriculados de ese año con el
    curso de ese año), `GET /estudiantes/{id}/detalles` y
    `GET /estudiantes/{id}/deudas`.
  - Clases y horarios del admin: `GET /asignaciones/lista`,
    `GET /hora/horarios-admin` y `GET /profesores/{id}/disponibilidad`.
  - Boletín y reporte parcial: `GET /boletines/admin/generar/{estudiante}/{periodo}`
    y `GET /boletines/admin/reporte-parcial/{estudiante}/{periodo}`.
  - Cartera: `GET /cartera/mora` y `GET /cartera/mora/resumen`. Mirando el
    activo, solo estudiantes activos y con ventas, como hoy; mirando otro
    año, todos los matriculados de ese año que deben (también retirados) y
    sin ventas (decisiones 18 y 19 del backend).
  - Observador: `GET /observador/{estudiante_id}` (el profesor solo el
    activo).
  - Planes del admin: `GET /admin/plan-de-clases` (un año que no existe da
    la lista vacía).
  - Pagos (fase 2): `GET /pagos/vencidos/opciones/{id}` y
    `GET /pagos/adelanto/opciones/{id}`; `POST /pagos` y
    `POST /pagos/adelanto` con `anio_lectivo_id` en el cuerpo.
- **Sin año, a propósito:** lo que parte de un id (un curso, una clase, un
  concepto, un plan) ya implica su año. Lo que ve el profesor (mis clases,
  sus cursos, su inicio, cumpleaños) es siempre del año activo.
- **Escrituras (la guardia):** el backend responde, y la pantalla muestra el
  `detail` tal cual:
  - `409` `{"detail": "El año lectivo 2026 está cerrado. Solo se puede consultar."}`
    al guardar algo de un año cerrado (admin y profesor).
  - `403` `{"detail": "Solo se pueden guardar cambios en el año lectivo activo."}`
    al profesor en un año en preparación o reabierto.
  - Límite conocido: en asistencia, boletín y observaciones, para una clase
    de un año que ya no es el activo, el backend responde antes `403`
    ("El estudiante no pertenece a esta asignación").
  - `POST /listas-seguimiento/columnas-en-todos-los-cursos?anio_lectivo_id=`
    crea la columna en los cursos de ese año (sin año, del activo).
  - Crear un curso o un concepto siempre lo crea en el año activo (pregunta
    abierta del backend para la fase 5).
- **Materias (punto 5):** `PUT /materias/{id}` responde `409` con
  `{"detail": {"codigo": "materia_usada_en_otro_anio", "mensaje": "..."}}`
  si el nombre cambia y la materia se usa en otro año. "Cambiar igual"
  reenvía el mismo cuerpo con `"confirmar_cambio_nombre": true`. El `409` de
  nombre repetido sigue trayendo `detail` de texto. Hoy
  `obtenerMensajeErrorMateria` espera texto y mostraría `[object Object]`;
  no puede pasar con un solo año, y el diálogo de este punto lo resuelve.

#### Inventario confirmado el 2026-10-03

Con `grep` sobre `src/`, y el contrato confirmado en las rutas del backend
(`anio_lectivo_id` en `app/routes/`). Solo lectura, sin cambios de código.
Cada lectura va servicio → hook → pantalla.

**Siguen el selector** (pantallas de un año lectivo que el backend ya sirve
por año):

1. Administración (`pages/Admin.jsx`):
   - Cursos: `useCursos` → `cursosApi.listarCursos` (`GET /cursos?estado=`).
   - Asignar clase: `useDatosAsignaciones` →
     `asignacionesApi.listarCursosAsignacion` (`GET /cursos`) y
     `listarAsignaciones` (`GET /asignaciones/lista`);
     `useDisponibilidadAsignacion` → `obtenerDisponibilidadProfesor`
     (`GET /profesores/{id}/disponibilidad`).
   - Orden del boletín (`pages/OrdenBoletin.jsx`, que se abre dentro de
     Administración): `useConsultaOrdenBoletin` →
     `boletinesApi.listarCursosBoletines` (`GET /cursos`).
   - Profesores y Materias no tienen año: son catálogos. Materias tiene el
     diálogo del punto 5.
2. Horarios asignados (`pages/HorariosAdmin.jsx`): `useHorariosPorCurso` y
   `useHorariosProfesores` → `horariosApi.listarHorariosAdmin`
   (`GET /hora/horarios-admin`).
3. Planeadores de clases (`pages/PlaneadoresClasesAdmin.jsx`):
   `useListadoPlaneacionesAdmin` → `planeacionesApi.listarPlaneacionesAdmin`
   (`GET /admin/plan-de-clases`).
4. Gestión de boletines (`pages/Boletin.jsx`):
   `useConsultaBoletinesAdministrativos` → `listarCursosBoletines`,
   `listarEstudiantesBoletines` (`GET /estudiantes`) y
   `generarBoletinAdministrativo` (`GET /boletines/admin/generar/...`).
5. Certificados (`pages/CertificadosAdmin.jsx`):
   `useConsultasCertificadosAdmin` → las mismas tres de boletines
   (reexportadas en `certificadosImpresionApi.js`) y
   `generarReporteParcialCertificado`
   (`GET /boletines/admin/reporte-parcial/...`). El historial de asistencia
   parte de una clase (`/asistencia/historial/{asignacion}/{periodo}`) y no
   necesita año.
6. Listas de seguimiento (`pages/ListasSeguimientoAdmin.jsx`):
   `useConsultasListasSeguimiento` → `obtenerCursosListasSeguimiento`
   (`GET /cursos`); `useComandosListasSeguimiento` →
   `crearColumnaEnTodosLosCursos`
   (`POST /listas-seguimiento/columnas-en-todos-los-cursos`).
7. Estudiantes (`pages/EstudiantesAdmin.jsx`): `useListadoEstudiantesAdmin`
   → `estudiantesObservadorApi.listarEstudiantes`
   (`GET /estudiantes?estado=`) y `listarCursosEstudiantes` (`GET /cursos`);
   `useDetalleEstudianteAdmin` → `obtenerDetalleEstudiante` y
   `obtenerDeudasEstudiante` (`/estudiantes/{id}/detalles` y `/deudas`); el
   observador de la ficha (`ObservadorEnFichaAdmin`, dentro de
   `DetalleEstudianteAdmin`) → `useObservadorEstudiante` →
   `observadorApi.obtenerObservador` (`GET /observador/{id}`). Ese hook
   también lo usa la pantalla del profesor (`pages/Observador.jsx`), que
   queda fuera del proveedor y sin año.
8. Tipos de pago (`pages/TiposPagosAdmin.jsx`): `useConsultasTiposPago` →
   `obtenerTiposPagoDetallados`, `obtenerTiposPago` y
   `obtenerCursosParaTiposPago` (`GET /tipos-pagos/detallado`,
   `/tipos-pagos` y `/cursos`).
9. Cartera vencida (`pages/CarteraVencidaAdmin.jsx`): `useCarteraVencida` →
   `obtenerResumenCarteraVencida` y `obtenerDetalleCarteraVencida`
   (`GET /cartera/mora/resumen` y `/cartera/mora`).

**Siempre el año activo, como hoy** (propuesta de este plan; no siguen el
selector):

- Pagos (`pages/PagosAdmin.jsx`). **Cambio respecto del inventario del
  2026-09-29**, que la incluía. Por qué: si el año de un pago dependiera del
  selector general, sería fácil registrar dinero en un año que no era sin
  darse cuenta. La fase 5 trae para eso un selector propio, "Año del
  pago", junto al pago y con el año activo por defecto (decisión 6 y punto
  3 de la fase 5). Su búsqueda de estudiantes (`GET /estudiantes` sin año)
  sigue trayendo a todos, también a un estudiante nuevo de 2027 sin curso
  este año. "Las deudas de `estudiantesObservadorApi.js`" de aquel
  inventario son las de la ficha de Estudiantes (punto 7), que sí sigue el
  selector.
- Inicio del admin (`pages/AdminDashboard.jsx`, `useDashboardAdmin`). Su
  resumen de cartera (`dashboardsApi.obtenerResumenCarteraParaDashboard`)
  acepta el año, pero el inicio es el resumen del día; la cartera de otro
  año se consulta en Cartera vencida. Cumpleaños y notificaciones no
  tienen año.
- Reportes (`pages/ReportesAdmin.jsx`): "estudiantes por curso"
  (`GET /reportes/general`) es siempre del año activo en el backend, sin
  parámetro, y lo demás va por fechas.

**Por fechas o sin año** (ignoran el selector): Inventario, Punto de venta
(su `GET /estudiantes` va sin año a propósito), Egresos, Préstamos, Nómina
y Diseño de impresos.

**No cambia:** lo que ve el profesor (sin proveedor, sin selector y sin
parámetros); las notificaciones de planeadores
(`/notificaciones/planeadores`, sin año en el backend); lo que parte de un
id (un curso, una clase, un concepto, un plan).

Hallazgos que dan forma al plan:

1. **Varios hooks cargan su base una sola vez** al abrir la pantalla y
   guardan lo elegido (curso, filtros); por ejemplo
   `useConsultaBoletinesAdministrativos` y `useCarteraVencida`
   (`useEffect` con `[]`). Si el año cambiara sin más, la pantalla seguiría
   con los datos y el curso elegido del año anterior. Por eso el paso 4.1
   reinicia la página al cambiar de año.
2. **Crear o editar un estudiante no valida el año del curso** (backend,
   `estudiante_controller.py`). Guarda `estudiantes.curso_id` con el curso
   que llegue, y `sincronizar_matricula_del_anio_activo` solo actúa si ese
   curso es del año activo. Con un curso de otro año, el estudiante quedaría
   con ese curso y su matrícula del año activo sin cambiar: la consulta de
   control dejaría de dar 0, y el estudiante desaparecería de las pantallas
   de sus profesores. Hoy no puede pasar: todos los cursos son de 2026, y el
   formulario solo ofrece cursos del año activo (`GET /cursos` sin año).
   Para este plan: mirando otro año, Estudiantes queda en solo consulta
   (paso 4.4). Para el backend: anotado en su fase 5, validarlo antes de
   crear el primer curso de 2027.
3. **Crear un curso o un concepto siempre crea en el año activo** (pregunta
   abierta del backend para la fase 5). Mirando otro año, esos dos botones
   quedan ocultos mientras no se responda.
4. Dos páginas del inventario no tienen prueba de página:
   `EstudiantesAdmin.jsx` y `PlaneadoresClasesAdmin.jsx` (sus hooks sí). Se
   escribe su caracterización antes de tocarlas.
5. `obtenerMensajeErrorMateria` muestra el `detail` tal cual: con el 409
   nuevo, que trae un objeto, la alerta diría `[object Object]` (punto 5).

**Costo en peticiones**, a aceptar con el plan: con el año activo, las
peticiones de hoy quedan idénticas y se suma una sola, `GET /anios-lectivos`,
cada vez que el admin abre o recarga la aplicación (no al cambiar de
pantalla). El profesor no la hace.

#### Plan por pasos (propuesto el 2026-10-03; cada paso, con el visto bueno del usuario)

Principios, los mismos del backend: con el año activo, cada petición queda
idéntica a la de hoy (`parametrosAnio` devuelve `{}`, y sin año cada
servicio llama a `api` con los mismos argumentos que hoy); caracterización
antes de cambiar; cada paso se puede publicar solo, porque con un solo año
el selector no aparece. Cada paso de pantallas deja completas las suyas:
los datos del año elegido y los botones según el estado de ese año, para que
ninguna muestre un año con los botones de otro. Un año cerrado es siempre
de solo consulta (decisión 3). Al cerrar cada paso: pruebas,
`pnpm run check:deploy`, `git diff --check`, documentos y mensaje de commit.

- **4.1 — La base: años, selector y aviso** (con un año, nada visible).
  Servicio, contrato puro, proveedor y vistas de la tabla de
  "Arquitectura", conectados en `App.jsx` (solo en el layout del admin) y
  en `NavAdminView` (con una función que dibuja el selector, como
  `renderNotificaciones`). Al cambiar de año, la página abierta se reinicia
  (una `key` con el año en sus rutas): ningún curso ni filtro del año
  anterior queda pegado, y cada hook carga con el año nuevo sin tener que
  vigilarlo (hallazgo 1). Si `GET /anios-lectivos` falla, queda el
  comportamiento de hoy. Antes de empezar: la primera pregunta abierta
  (selector y aviso en las pantallas que no dependen del año). Pruebas:
  contrato, servicio, proveedor (carga una vez, cambio de año, fuera del
  proveedor, error), vistas y composición de `App` (un año: nada visible;
  profesor: sin proveedor y sin la petición).
- **4.2 — Administración y horarios:** cursos, asignar clase (cursos, lista
  de clases y disponibilidad), orden del boletín y horarios. Es lo primero
  que la fase 5 necesita para armar 2027. Antes de empezar: la segunda
  pregunta abierta (qué puede hacer el admin en un año en preparación),
  porque decide sus botones. Crear curso, oculto mirando otro año
  (hallazgo 3).
- **4.3 — Tipos de pago y cartera vencida** (zona de dinero: explicación al
  usuario antes de tocar). Conceptos, cursos para los precios, cartera y su
  resumen. Mirando otro año, cartera trae también a los retirados que deben
  y no trae ventas (decisiones 18 y 19 del backend): la pantalla lo muestra
  tal cual llega. Crear concepto, oculto mirando otro año (hallazgo 3).
- **4.4 — Estudiantes:** lista, ficha (detalle y deudas) y el observador de
  la ficha. Caracterización de `EstudiantesAdmin.jsx` primero. Mirando otro
  año, solo consulta: crear, editar y cambiar el estado, ocultos
  (hallazgo 2; además, un estudiante no es de un año, así que editarlo desde
  otro año cambiaría también el actual).
- **4.5 — Boletines y certificados:** cursos, estudiantes, boletín y
  reporte parcial del año elegido. Son pantallas de solo consulta.
- **4.6 — Listas de seguimiento y bandeja de planes.** Caracterización de
  `PlaneadoresClasesAdmin.jsx` primero.
- **4.7 — Diálogo de materias** (punto 5). No depende del selector.

Al cerrar la fase: `ARQUITECTURA_FRONTEND.md` (el Context), `API_CLIENT.md`,
`COMPONENTES.md`, `CAMBIOS_FRONTEND.md` y `docs/README.md`; y la revisión
del usuario en local con dos años, en una rama de Neon donde se agrega a
mano un segundo año (en producción no puede existir antes de la fase 5).

Orden por urgencia: 4.1 a 4.4 son las pantallas con las que el admin
prepara 2027 en la fase 5 (Cursos, Horarios, Tipos de pago y Estudiantes);
4.5 y 4.6 sirven para consultar 2026 después de activar 2027 (fase 6), y
4.7 tiene que estar antes de que exista un segundo año (fase 5).

Plan aprobado por el usuario el 2026-10-03, tal como está, junto con el paso
4.1 ("Hagamos la A para empezar el 4.1").

**Avance del 2026-10-03 — paso 4.1, la base: años, selector y aviso (sin
commit):**

- Primera pregunta abierta respondida antes de empezar: el selector y el
  aviso **se esconden** en las pantallas que no dependen del año (opción A).
- Código, todo nuevo salvo dos archivos:
  - `services/aniosLectivosApi.js`: `listarAniosLectivos({ signal })` →
    `GET /anios-lectivos`.
  - `utils/anioLectivo.js`: normalizar la lista (descarta filas inválidas),
    año activo, etiquetas ("2026 · Cerrado"), `parametrosAnio` (mirando el
    activo, un `{}` congelado y siempre el mismo; mirando otro,
    `{ anio_lectivo_id }`), `RUTAS_POR_ANIO` (las pantallas que siguen el
    año; vacía en este paso), `esRutaPorAnio` (con `exacta`, para que
    `/admin` no alcance a `/admin/pagos`) y `construirAvisoAnio`.
  - `hooks/anioLectivo/useAnioLectivo.js`: el Context y el hook; fuera del
    proveedor, el comportamiento de antes. `AnioLectivoProvider.jsx`: carga
    la lista una vez, guarda en memoria el año elegido (elegir el activo es
    lo mismo que no elegir), corta la petición al desmontarse y, si falla,
    deja todo como antes. `useAnioLectivoEnPantalla.js`: selector solo con
    más de un año y en una pantalla del año; aviso solo en esas pantallas y
    mirando otro año; al volver a una pantalla del año, el año elegido sigue.
  - `components/anioLectivo/`: `SelectorAnioLectivoView` y
    `AvisoAnioLectivoView`, solo presentación. El aviso, en azul para no
    confundirlo con el de mora.
  - `App.jsx`: el proveedor envuelve solo el layout del admin; el aviso va
    debajo del aviso del tenant; `RutasDelAnio` pone el año elegido en la
    `key` de las rutas: al cambiar de año la página empieza de cero, y cargar
    la lista no la reinicia (la `key` usa el año elegido a mano, `null` para
    el activo).
  - `components/autenticacion/NavAdminView.jsx`: prop opcional
    `renderSelectorAnio`, dibujada junto a las notificaciones. Sin ella, la
    barra queda igual que antes.
- Por qué `RUTAS_POR_ANIO` empieza vacía: cada paso agrega sus pantallas
  cuando ya cargan los datos del año elegido. Así ningún paso deja una
  pantalla mostrando un año con los datos de otro.
- Peticiones, comprobadas en pruebas: con un año, las de hoy quedan idénticas
  (no se tocó ningún servicio existente) y se suma `GET /anios-lectivos`,
  una vez. El profesor, el super admin y quien no tiene sesión no la hacen.
- Pruebas: 46 nuevas.
  - Siete archivos nuevos: `utils/anioLectivo.test.js`,
    `services/aniosLectivosApi.test.js`, `AnioLectivoProvider.test.jsx`,
    `useAnioLectivoEnPantalla.test.jsx`, las pruebas de las dos vistas y
    `App.anioLectivo.test.jsx`. Este último prueba el mecanismo completo con
    una pantalla del año inventada: cambiar de año reinicia la página con el
    año nuevo, cargar la lista no la reinicia, "Volver a 2026" vuelve, y en
    una pantalla que no depende del año no hay selector ni aviso.
  - Una más en `NavegacionesView.test.jsx` (la barra dibuja el selector que
    recibe) y una en `App.composicion.test.jsx` (con dos años, el inicio no
    muestra selector ni aviso).
  - Ajustadas a propósito: `App.test.jsx` y `App.composicion.test.jsx`
    simulan el servicio nuevo. Sin eso, el layout del admin pedía la lista
    por la red durante la prueba: no fallaba, pero una prueba no debe salir a
    la red. `App.composicion.test.jsx` comprueba además cuántas veces se
    pide. Las 27 pruebas de `App` y de la barra pasaron sin tocarlas antes de
    ese ajuste.
  - Quince versiones dañadas del código hacen fallar alguna prueba: mandar
    parámetros con el activo, quitar la `key`, usar el año efectivo en la
    `key` (reiniciaría la página al cargar la lista), no tratar "elegir el
    activo" como no elegir, proveedor también para el profesor, selector o
    aviso en cualquier pantalla, no cortar la petición, barra que ignora el
    selector, una pantalla ya en la lista en este paso, `/admin` alcanzando a
    `/admin/pagos`, ruta equivocada, el selector avisando el año como texto,
    `seleccionarAnio` sin aceptar texto y el aviso de cerrado sin "Solo
    consulta".
- Documentación: `ARQUITECTURA_FRONTEND.md` (sección "Año lectivo", con la
  regla del único Context), `API_CLIENT.md`, `COMPONENTES.md`,
  `CAMBIOS_FRONTEND.md` y `docs/README.md`.
- Verificación: `pnpm run check:deploy` → **2085 pruebas pasan** (antes
  2039), lint limpio y build correcto; `git diff --check` limpio.
- Efecto al publicar: ninguno visible; una petición más cuando el admin abre
  o recarga la aplicación. Revisión en local: con un solo año no se ve nada
  nuevo; basta comprobar que el admin y el profesor entran y navegan como
  siempre.
- Commit `4b14347` (hecho por el usuario el 2026-10-03).

**Avance del 2026-10-03 — paso 4.2, Administración y horarios por año (sin
commit):**

- Aprobado por el usuario el 2026-10-03 ("si sigue"), después de responder
  la segunda pregunta abierta (el admin edita lo que ya existe en un año en
  preparación) y de aceptar que la pestaña de Administración quede en la
  dirección.
- Hallazgo al empezar: las pestañas de Administración eran un estado de la
  página. Con el selector, cambiar de año (que reinicia la página) habría
  devuelto a Profesores, y la cajita habría salido también en Profesores y
  Materias, que no tienen año. Arreglo aprobado: la pestaña en `?modulo=`.
- Código:
  - `utils/anioLectivo.js`: `RUTAS_POR_ANIO` con `/admin` (solo las
    pestañas `cursos`, `asignar-clases` y `orden-boletin`) y
    `/admin/horarios`; `esRutaPorAnio` recibe la ubicación (`pathname` y
    `search`) y entiende `parametro` y `valores`; `opcionesConAnio`, que
    agrega `parametrosAnio` a las opciones de un servicio solo mirando otro
    año; y `permisosAnio` (`esAnioActivo`, `puedeEditar`), espejo de
    `ESTADOS_EDITABLES_POR_ADMIN` del backend.
  - `useAnioLectivo` y el proveedor comparten `permisos`;
    `useAnioLectivoEnPantalla` mira también la pestaña.
  - Servicios con `parametrosAnio` opcional: `cursosApi.listarCursos` (junto
    al `estado`), `asignacionesApi.listarCursosAsignacion`,
    `listarAsignaciones` y `obtenerDisponibilidadProfesor` (junto a `dia`),
    `horariosApi.listarHorariosAdmin` y `boletinesApi.listarCursosBoletines`.
    Sin él, cada llamada a `api` es la de antes, letra por letra.
  - Hooks con `{ parametrosAnio }` opcional: `useCursos`,
    `useDatosAsignaciones` (profesores y materias sin año),
    `useDisponibilidadAsignacion`, `useHorariosPorCurso`,
    `useHorariosProfesores` y `useConsultaOrdenBoletin`. Los contenedores
    (`CrearCurso`, `AsignarClase`, los dos horarios y
    `pages/OrdenBoletin.jsx`) leen `useAnioLectivo()` y se lo pasan; los
    hooks de dominio no leen el Context.
  - Botones: en Cursos, el formulario aparece para crear solo mirando el año
    activo, y para editar si el año lo permite; en un año cerrado,
    `ListaCursos` queda sin acciones. En Asignaciones, en un año cerrado, sin
    formulario y sin Editar ni Desactivar. En Orden boletín, en un año
    cerrado, sin A-Z, sin guardar y sin mover. Horarios ya era de solo
    consulta.
  - `useComandosCursos`: al cambiar el estado de un curso muestra el mensaje
    del backend tal cual, como ya hacía al guardar, para que se lea el 409
    de un año cerrado. Sin mensaje del backend, el texto de siempre.
  - `pages/Admin.jsx`: la pestaña en `?modulo=`, con `replace` (no suma
    pasos al botón Atrás); sin `modulo`, o con uno desconocido, Profesores.
- Peticiones con el año activo: idénticas. Lo prueban las pruebas de siempre
  de Cursos, Asignaciones, Horarios, Orden boletín y sus servicios, que
  pasaron sin tocarlas. Contra el código nuevo fallaron solo las 4 esperadas:
  `Admin.test.jsx`, que ahora necesita un router, y tres del contrato puro
  que fijaban a propósito el estado del 4.1.
- Pruebas: 35 nuevas.
  - Dos archivos nuevos, `AdministracionPorAnio.test.jsx` y
    `OrdenBoletin.anioLectivo.test.jsx`: las pantallas completas mirando un
    año en preparación (piden lo de ese año; Cursos no ofrece crear, pero
    deja editar; se puede asignar clases y ordenar) y uno cerrado (solo
    consulta).
  - En archivos existentes: los cuatro servicios con año; los seis hooks con
    año; `ListaCursos`, `HorarioCursoAsignacion` y `VistaOrdenBoletin` en
    solo consulta; los permisos del proveedor; `Admin` con la pestaña en la
    dirección (los ids, la entrada directa, una pestaña desconocida y el
    botón Atrás); el contrato puro (las rutas reales del paso, las pestañas,
    `opcionesConAnio` y `permisosAnio`); y el mensaje del backend al cambiar
    el estado de un curso.
  - Ajustadas a propósito: `Admin.test.jsx`, envuelta en un router (lo que
    comprueba no cambió), y, en `utils/anioLectivo.test.js`, la que fijaba
    "ninguna pantalla sigue el año" (ahora fija las de este paso) y las dos
    de rutas (por la nueva forma de llamar a `esRutaPorAnio`).
  - Veintiséis versiones dañadas del código hacen fallar alguna prueba: cada
    lectura sin año, un catálogo con año, cada servicio ignorando el año, la
    disponibilidad perdiendo el día, `opcionesConAnio` agregando un año
    vacío, crear cursos mirando otro año, cada botón de editar en un año
    cerrado, la pestaña con `push` o ignorada, un id de pestaña equivocado,
    la ruta ignorando la pestaña, preparación no editable, un año cerrado
    editable y el mensaje del backend escondido.
- Documentación: `RUTAS_FRONTEND.md` (`/admin?modulo=`), `API_CLIENT.md`,
  `COMPONENTES.md`, `ARQUITECTURA_FRONTEND.md` (cómo se conecta una pantalla
  al año) y `CAMBIOS_FRONTEND.md`.
- Verificación:
  - Las pruebas del paso (los archivos que toca, más los de `App` y del año
    lectivo): **248 pasan en 53 archivos**, en varias corridas.
  - `pnpm run check:deploy` completo **no salió limpio** al cerrar el paso:
    en tres intentos fallaron 1, 2 y 6 pruebas, cada vez otras y todas de
    pantallas que este paso no toca. Las que se revisaron fallaron por tiempo
    agotado (más de 5 s) o por no encontrar a tiempo algo en pantalla; del
    primer intento no se guardó el motivo. Cada archivo que falló pasa solo.
    El equipo tenía menos de 3 GB de memoria libre y la corrida pasó de 2,5 a
    21 minutos: es la carga del equipo, no el código.
  - Las 331 corridas en cuatro tandas, con dos procesos: componentes 119
    archivos y 491 pruebas; hooks 97 y 547; páginas, 27 de 31 en la tanda y
    las otras 4 aparte, 22 de 22 (en la tanda, dos dieron tiempo agotado, una
    comprobación de Planilla falló y un archivo no llegó a arrancar);
    servicios, contratos puros y `App`, 84 y 845. En total, las 2120 pruebas
    pasan (antes 2085).
  - Lint limpio, después de corregir dos avisos de la prueba nueva de
    Horarios (una tabla de casos, reescrita como dos pruebas iguales). Build
    correcto. `git diff --check` limpio.
  - Pendiente antes de subir: una corrida limpia de `pnpm run check:deploy`
    con el equipo más libre. *Hecha el 2026-10-03, con el paso 4.3 encima:
    limpia, 2144 pruebas, lint y build (ver su "Avance").*
- Efecto al publicar: con un solo año, ningún cambio en datos ni botones.
  Lo único visible: la dirección de Administración muestra la pestaña
  (`/admin?modulo=cursos`) y, al recargar, la página se queda en esa pestaña.
  Revisión en local: en Administración, cambiar de pestaña (cambia la
  dirección) y recargar (sigue en la misma); Cursos, Asignaciones, Orden
  boletín y Horarios, iguales que en producción. **Solo mirar**: guardar en
  local escribe en la base real.
- Commit `78c48f7` (hecho por el usuario el 2026-10-03).

**Avance del 2026-10-03 — paso 4.3, Tipos de pago y Cartera vencida por año
(sin commit):**

- Zona de dinero: antes de tocar nada se le explicó al usuario el cambio,
  archivo por archivo, y lo aprobó el 2026-10-03 ("si"), con dos decisiones
  de detalle propuestas por el asistente: esconder "Cobrar" y que
  "Actualizar" no salte de año (abajo). Ninguna pregunta abierta afectaba
  este paso: la de crear cursos o conceptos nuevos en el año en preparación
  es para antes de la fase 5, y mientras tanto crear un concepto queda
  oculto mirando otro año (hallazgo 3).
- Caracterización: las 82 pruebas que ya tenían estas dos pantallas (página,
  vistas, hooks, servicio y contratos puros) pasaban antes del cambio. Contra
  el código nuevo pasaron 81 sin tocarlas; falló solo la que fijaba a
  propósito que Tipos de pago todavía no seguía el año.
- Código:
  - `services/carteraTiposPagoApi.js`: las cinco lecturas de estas pantallas
    (conceptos detallados, su lista de respaldo, cursos para los precios, y
    resumen y lista de cartera) aceptan `{ parametrosAnio }`. Sin año, la
    llamada a `api` es la de antes, con un solo argumento. Lo que se guarda y
    el detalle de un concepto parten de su id y no cambian.
  - `useConsultasTiposPago({ parametrosAnio })`: conceptos y cursos del año,
    también al recargar la lista después de guardar (los guardados llaman a
    `cargarTiposPagos`). `useCarteraVencida({ parametrosAnio })`: resumen y
    lista del año, y `recargar`, que vuelve a pedirlos sin recargar la
    página; una respuesta vieja ya no pisa a una nueva.
  - `pages/TiposPagosAdmin.jsx` y `pages/CarteraVencidaAdmin.jsx` leen
    `useAnioLectivo()` y se lo pasan a sus hooks.
  - Botones de Tipos de pago (`VistaAdministrarTiposPago`, props
    `puedeCrear` y `puedeEditar`): en el año activo, como siempre; en uno en
    preparación no aparece el formulario para crear (un concepto nuevo
    nacería en el activo), pero se editan nombre, valor, configuración y
    precios por curso; en uno cerrado, sin ✏️, y "⚙️ Configurar" abre el
    concepto para mirarlo, con los campos bloqueados (un `fieldset`
    desactivado, patrón que ya usa `PlantillasAdminView`) y sin los dos
    botones de guardar.
  - Cartera vencida, mirando otro año: **sin "Cobrar"** (`VistaCarteraVencida`,
    prop `puedeCobrar`), porque Pagos cobra siempre en el año activo y la
    deuda de ese año iría a otro; vuelve en la fase 5, con el selector "Año
    del pago". Y **"Actualizar" vuelve a pedir la cartera de ese año**: hasta
    ahora recargaba la página, y recargar vuelve al año activo. En el año
    activo, los dos botones siguen igual. Retirados con deuda y sin ventas
    (decisiones 18 y 19 del backend) se muestran tal cual llegan.
  - `utils/anioLectivo.js`: `RUTAS_POR_ANIO` suma `/admin/tipos-pagos` y
    `/admin/cartera-vencida`.
- No se tocó: Pagos, el inicio del admin (su resumen de cartera sigue siendo
  del año activo), el diseño de impresos ni el backend.
- Peticiones con el año activo: idénticas. Lo prueban las pruebas de página
  de siempre, que comprueban cada llamada con un solo argumento y pasaron sin
  tocarlas, y una nueva del servicio que cuenta los argumentos.
- Pruebas: 24 nuevas.
  - Dos archivos nuevos, `TiposPagosAdmin.anioLectivo.test.jsx` y
    `CarteraVencidaAdmin.anioLectivo.test.jsx`, con las pantallas completas:
    en preparación, conceptos y cursos de ese año, sin crear, editar y
    configurar con los cursos de ese año (y la lista se vuelve a pedir del
    mismo año después de guardar); en un año cerrado, sin ✏️, configuración
    bloqueada y ningún guardado; la cartera de otro año sin "Cobrar", y
    "Actualizar" que pide otra vez ese año sin recargar la página; en el año
    activo, "Actualizar" recarga la página y "Cobrar" sigue.
  - En archivos existentes: el servicio (con las opciones del activo, un solo
    argumento; con otro año, las cinco lecturas con `anio_lectivo_id`; el
    detalle y los guardados sin año), los dos hooks (sin año, con año, si
    cambia el año, la lista de respaldo, `recargar` y la respuesta vieja que
    llega tarde), las dos vistas y el contrato puro.
  - Ajustada a propósito: en `utils/anioLectivo.test.js`, la que fijaba que
    Tipos de pago todavía no seguía el año.
  - Treinta y una versiones dañadas del código hacen fallar alguna prueba:
    cada lectura del servicio sin año, el servicio ignorando el año o
    mandando un segundo argumento vacío, cada hook sin año o sin vigilar el
    año, la respuesta vieja que pisa a la nueva, `recargar` que no recarga,
    cada página sin año, crear o editar donde no se puede, cada botón de
    guardar y la configuración sin bloquear en un año cerrado, "Cobrar" desde
    otro año (en la página y en la vista), "Actualizar" que siempre o nunca
    recarga la página, y cada pantalla fuera de `RUTAS_POR_ANIO`.
- Hallazgos, sin tocar (anotados para cuando hagan falta):
  - En Tipos de pago, el `409` de año cerrado saldría con el título de otro
    aviso ("Concepto duplicado" o "Migración pendiente"). Solo puede pasar
    desde la fase 6: ver el punto 4 de esa fase.
  - El estado de cuenta impreso y el CSV de Cartera no dicen de qué año son:
    pregunta abierta para antes de la fase 5.
- Documentación: `API_CLIENT.md`, `ARQUITECTURA_FRONTEND.md` (las dos
  trampas de una pantalla del año: recargar vuelve al activo, y un botón que
  lleva a una pantalla sin año), `COMPONENTES.md` y `CAMBIOS_FRONTEND.md`.
- Verificación: `pnpm run check:deploy` **limpio en una sola corrida**:
  **2144 pruebas pasan** en 333 archivos (antes 2120), lint limpio y build
  correcto. Con eso queda hecha también la corrida limpia que el paso 4.2
  dejó pendiente. `git diff --check` limpio. Las pruebas del paso, solas,
  no muestran ningún aviso; el "Not implemented: navigation to another
  Document" de la corrida completa sale de pruebas de pantallas que ya
  cambiaban `window.location.href` (inicio de sesión, sesión vencida,
  Asistencia, Planilla), no de este paso.
- Efecto al publicar: ninguno visible mientras haya un solo año. Revisión en
  local (solo mirar: guardar en local escribe en la base real): Tipos de pago
  (lista, "⚙️ Configurar" de un concepto con sus precios) y Cartera vencida
  (lista, filtro por curso, "Cobrar" y "↻ Actualizar"), iguales que en
  producción.
- Commit `0798f21` (hecho por el usuario el 2026-10-03).

**Avance del 2026-10-05 — paso 4.4, Estudiantes por año (sin commit):**

- Aprobado por el usuario el 2026-10-05 ("SI"), después de explicarle el
  cambio archivo por archivo, porque la ficha muestra deudas. Ninguna
  pregunta abierta afectaba este paso.
- Caracterización primero (hallazgo 4 del inventario): la página no tenía
  prueba. `pages/EstudiantesAdmin.test.jsx`, 7 pruebas escritas y pasadas
  contra el código anterior: la lista de activos y los cursos con sus
  peticiones exactas, el filtro de estado, la ficha (resumen, deudas y
  observador, con lo que muestra), editar (`GET` y `PUT`), crear (`POST`,
  con los cursos que ofrece el formulario), cambiar el estado (`PATCH`, con
  su confirmación) y quien no es admin vuelve al inicio de sesión sin pedir
  nada.
- Contra el código nuevo, de las pruebas que ya había en todo lo tocado
  (218) fallaron solo las 2 esperadas: la del contrato puro que fijaba que
  Estudiantes no seguía el año, y la del hook de la lista, que fijaba la
  llamada al servicio sin opciones (ahora va con `{}`; la petición al backend
  es la misma, letra por letra, como prueban el servicio y la página).
- Código:
  - `services/estudiantesObservadorApi.js`: la lista (`?estado=` más el
    año), los cursos, el resumen de la ficha y sus deudas aceptan
    `{ parametrosAnio }`. `services/observadorApi.js`: `obtenerObservador`
    también, junto al periodo. Sin año, cada petición es la de antes.
  - Hooks con `{ parametrosAnio }`: `useListadoEstudiantesAdmin`,
    `useDetalleEstudianteAdmin` y `useObservadorEstudiante`, que vuelven a
    pedir si el año cambia. El de la ficha y el de la lista siguen
    descartando respuestas viejas, como antes.
  - `pages/EstudiantesAdmin.jsx` lee `useAnioLectivo()` y se lo pasa a sus
    hooks; `ObservadorEnFichaAdmin` (conector) lo lee para el observador de
    la ficha. La pantalla del observador del profesor (`pages/Observador.jsx`)
    no lo pasa: sigue igual.
  - Mirando otro año, **aunque esté en preparación**, solo consulta (hallazgo
    2): sin "Nuevo Estudiante" (`EncabezadoEstudiantesAdmin`, prop
    `puedeCrear`) y sin la columna de acciones, es decir, sin cambiar el
    estado ni "Editar" (`ListaEstudiantesAdmin`, prop `puedeEditar`). La
    ficha se sigue abriendo. Por eso la regla es `esAnioActivo` y no
    `puedeEditar`: un estudiante no es de un año, y editarlo mirando otro
    cambiaría también sus datos de hoy.
  - `utils/anioLectivo.js`: `RUTAS_POR_ANIO` suma `/admin/estudiantes`.
- La ficha mirando otro año: notas, faltas, observaciones, observador y
  deudas son las de ese año, y el curso que muestra es el de ese año (el de
  la lista, resuelto con los cursos de ese año). Los productos de inventario
  no son de un año: salen todos, como hoy.
- No se tocó: Pagos (usa su propia consulta de deudas, `pagosApi`), la
  pantalla del observador del profesor ni el backend.
- Pruebas: 23 nuevas, las 7 de la caracterización y 16 del año.
  - Archivo nuevo `EstudiantesAdmin.anioLectivo.test.jsx`, con la página
    completa: en preparación, lista y cursos de ese año (el curso que se ve
    es el de ese año) y sin "Nuevo Estudiante", "Editar" ni la columna de
    acciones; en un año cerrado, el filtro de estado sigue pidiendo ese año,
    y la ficha pide resumen, deudas y observador de ese año y los muestra.
  - En archivos existentes: los dos servicios (con las opciones del activo,
    la llamada de siempre; con otro año, cada lectura con `anio_lectivo_id`;
    el observador, el año junto al periodo), los tres hooks (sin año, con
    año y si cambia el año; el del observador, exactamente como siempre sin
    año), las dos vistas de la lista en solo consulta y el contrato puro
    (que además fija las pantallas que todavía no siguen el año: Pagos, el
    inicio, Reportes y las de los pasos 4.5 y 4.6).
  - Ajustadas a propósito: la del contrato puro que fijaba que Estudiantes
    no seguía el año, y la del hook de la lista (llamada al servicio con
    `{}`).
  - Veinticinco versiones dañadas del código hacen fallar alguna prueba:
    cada lectura de los dos servicios sin año, el servicio con un segundo
    argumento vacío, el observador perdiendo el periodo, cada hook sin año o
    sin vigilar el año, la página sin año en la lista o en la ficha, la
    página dejando modificar mirando otro año (también con `puedeEditar` en
    vez de `esAnioActivo`), cada botón o columna siempre visible (en la
    página y en las vistas), el observador de la ficha sin año y la pantalla
    fuera de `RUTAS_POR_ANIO`.
- Documentación: `API_CLIENT.md`, `ARQUITECTURA_FRONTEND.md`,
  `COMPONENTES.md` y `CAMBIOS_FRONTEND.md`. En la fase 5 de este documento
  (punto 4), el hallazgo de la ficha y la deuda de años anteriores.
- Verificación: `pnpm run check:deploy` **limpio en una sola corrida**:
  **2167 pruebas pasan** en 335 archivos (antes 2144), lint limpio y build
  correcto. `git diff --check` limpio. Las pruebas del paso, solas, no
  muestran ningún aviso.
- Efecto al publicar: ninguno visible mientras haya un solo año. Revisión en
  local (solo mirar: guardar en local escribe en la base real): la lista de
  Estudiantes y su filtro de estado, y la ficha de un estudiante (resumen,
  "Estado Financiero" y observador), iguales que en producción. Los botones
  "Nuevo Estudiante", "Editar" y el selector de estado siguen ahí.
- Commit `c7f0622` (hecho por el usuario el 2026-10-05).

**Avance del 2026-10-05 — paso 4.5, Boletines y certificados por año (sin
commit):**

- Aprobado por el usuario el 2026-10-05 ("OK"). No es zona de dinero y las
  dos pantallas solo consultan e imprimen: no hay botones que esconder.
  Ninguna pregunta abierta afectaba este paso.
- Las dos páginas ya tenían prueba de página. Contra el código nuevo, de las
  133 pruebas que ya había en todo lo tocado (incluidos el orden del boletín y
  el ingreso de boletines del profesor, que comparten el servicio) falló
  solo la esperada: la del contrato puro que fijaba que estas pantallas
  todavía no seguían el año.
- Código:
  - `services/boletinesApi.js`: `listarEstudiantesBoletines` y
    `generarBoletinAdministrativo` aceptan `parametrosAnio`, como ya lo hacía
    `listarCursosBoletines` desde el paso 4.2.
    `services/certificadosImpresionApi.js`:
    `generarReporteParcialCertificado` también; las otras tres lecturas de
    Certificados son las mismas de boletines, reexportadas. Sin año, cada
    petición es la de antes.
  - Hooks con `{ parametrosAnio }`: `useConsultaBoletinesAdministrativos`
    (cursos, estudiantes y el boletín) y `useConsultasCertificadosAdmin`
    (cursos, estudiantes, certificado de notas y reporte parcial). Las
    materias son un catálogo y el historial de asistencia parte de una
    clase: van sin año. Los dos vuelven a pedir si el año cambia.
  - `pages/Boletin.jsx` y `pages/CertificadosAdmin.jsx` leen
    `useAnioLectivo()` y se lo pasan a sus hooks.
  - `utils/anioLectivo.js`: `RUTAS_POR_ANIO` suma `/boletin` y
    `/admin/certificados`. El ingreso de boletines del profesor
    (`/ingreso-boletin`) es otra pantalla y no sigue el año.
- No se tocó: el certificado de matrícula (no pide nada al backend; ver la
  pregunta abierta de su año), el diseño de impresos ni el backend.
- Hallazgo, de antes de esta función (no lo causa el año lectivo): las
  listas de Boletines y de Certificados piden `GET /estudiantes` sin estado,
  y el backend responde entonces solo los activos (su valor por defecto desde
  el 2026-06-03, `6d4e75c`). Certificados se hizo un día después
  (`803894d`, 2026-06-04) con un filtro propio de Activos, Retirados,
  Egresados, Inactivos y Todos: **hoy esos filtros, salvo Activos, salen
  siempre vacíos**, y no se le puede sacar el certificado a un retirado. Sus
  pruebas no lo ven porque simulan el servicio con un retirado incluido. Con
  el año lectivo pasa lo mismo mirando un año pasado: quien ya no está activo
  no aparece, y suele ser quien pide un certificado. Este paso no lo empeora
  ni lo arregla: con el año activo, cada petición es la de siempre. Ver la
  pregunta abierta.
- Pruebas: 13 nuevas.
  - Dos archivos nuevos, `Boletin.anioLectivo.test.jsx` y
    `CertificadosAdmin.anioLectivo.test.jsx`, con las páginas completas
    mirando un año cerrado y las peticiones reales: cursos y estudiantes de
    ese año, el boletín, el certificado de notas y el reporte parcial de ese
    año, y las materias y la asistencia sin año.
  - En archivos existentes: los dos servicios (con las opciones del activo,
    la llamada de siempre; con otro año, cada lectura con `anio_lectivo_id`;
    materias e historial sin año), los dos hooks (con año y si cambia el
    año, también al generar) y el contrato puro (y que `/ingreso-boletin`
    no sigue el año).
  - Ajustada a propósito: la del contrato puro que fijaba que estas
    pantallas todavía no seguían el año.
  - Veinte versiones dañadas del código hacen fallar alguna prueba: cada
    lectura de los servicios sin año, el reporte parcial con un segundo
    argumento vacío, cada hook sin año o sin vigilar el año (base, boletín,
    certificado y reporte), las materias o la asistencia con año, cada
    página sin año y cada pantalla fuera de `RUTAS_POR_ANIO`.
- Documentación: `API_CLIENT.md` (también el hallazgo, en Certificados),
  `ARQUITECTURA_FRONTEND.md`, `COMPONENTES.md` y `CAMBIOS_FRONTEND.md`. En
  este documento, las dos preguntas abiertas nuevas y el punto 5 de la fase
  6.
- Verificación: la primera corrida de `pnpm run check:deploy` **no salió
  limpia**: falló 1 de 2180 pruebas por tiempo agotado
  (`IngresoBoletinProfesor.test.jsx`, que esperaba a un alumno mientras la
  lista de clases todavía cargaba), y por eso no llegó al lint ni al build.
  Esa pantalla no usa nada de lo que cambió, y su archivo pasó solo dos
  veces seguidas. La segunda corrida completa, con más memoria libre, salió
  **limpia**: **2180 pruebas pasan** en 337 archivos (antes 2167), lint
  limpio y build correcto. `git diff --check` limpio.
- Efecto al publicar: ninguno visible mientras haya un solo año. Revisión en
  local (solo mirar): generar el boletín de un estudiante, y en Certificados
  un certificado de notas y un reporte parcial, iguales que en producción.
- Commit `2140fae` (hecho por el usuario el 2026-10-05).

**Avance del 2026-10-05 — paso 4.6, Listas de seguimiento y bandeja de
planes por año (commit `72be3da`):**

- Aprobado por el usuario el 2026-10-05 ("CONTINUA"). La pregunta abierta de
  Certificados (listas que solo traen activos) no la decide ese "continúa":
  sigue abierta y no se tocó. Ninguna pregunta abierta afectaba este paso.
- Caracterización primero (hallazgo 4 del inventario): la bandeja de planes
  no tenía prueba de página. `pages/PlaneadoresClasesAdmin.test.jsx`, 3
  pruebas escritas y pasadas contra el código anterior: la bandeja con sus
  dos contadores y sus peticiones exactas, "marcar como visto" (`PATCH` de la
  revisión y recarga) y el detalle de un plan con su aprobación. Listas de
  seguimiento ya tenía prueba de página.
- Contra el código nuevo, de las 394 pruebas que ya había en todo lo tocado
  (incluidos los planes del profesor y las pruebas de `App`) fallaron 5: la
  del contrato puro que fijaba que estas pantallas todavía no seguían el año
  (esperada) y 4 de Listas que fijaban que "crear en todos los cursos" llama
  al servicio con un solo argumento. En vez de ajustarlas, el hook se cambió
  para que, mirando el año activo, la llamada sea exactamente la de antes;
  las 4 pasaron sin tocarlas.
- Código:
  - Bandeja de planes: `listarPlaneacionesAdmin` suma `parametrosAnio` a sus
    filtros; `useListadoPlaneacionesAdmin` lo pasa en la bandeja y en sus dos
    contadores (los profesores no tienen año). El detalle, la revisión, las
    observaciones y las evidencias parten del id del plan.
  - Listas: `obtenerCursosListasSeguimiento` y `crearColumnaEnTodosLosCursos`
    aceptan `parametrosAnio`. **El alta masiva es una escritura que necesita
    el año**: sin él, el backend crea la columna en los cursos del año
    activo, así que mirando 2027 iría a los de 2026. La lista de un curso,
    las columnas sueltas y las marcas parten del curso.
  - Páginas: `PlaneadoresClasesAdmin.jsx` y `ListasSeguimientoAdmin.jsx` leen
    `useAnioLectivo()`.
  - Botones: en un año cerrado, solo consulta. En la bandeja, sin casillas ni
    "Marcar como vistos" (marcar es guardar una revisión); en el detalle de
    un plan (`DetallePlaneacionAdmin`, prop `puedeEditar`), sin el formulario
    de revisión ni "Borrar" en las evidencias; en Listas
    (`VistaListasSeguimiento`, prop `puedeEditar`), sin crear ni borrar
    columnas, con las casillas y notas bloqueadas (un `fieldset`
    desactivado, solo en ese caso: en un año que se edita la tabla queda sin
    envoltorio) y sin la barra de guardar. En un año en preparación, todo se
    puede, como en el activo.
  - `utils/anioLectivo.js`: `RUTAS_POR_ANIO` suma `/admin/listas-seguimiento`
    y `/admin/planeadores-clases`, que incluye el detalle de un plan.
- Límite conocido del detalle de un plan: parte del id y no trae su año, así
  que sus botones siguen el año que mira el admin. Si no coinciden (por
  ejemplo, se abre un plan de 2026 y después se pulsa "Volver a 2027" en el
  aviso), el backend rechaza con su `409` y el detalle muestra ese mensaje.
- Hallazgo del backend, para la fase 6 (no se toca aquí): la lista de un
  curso toma sus estudiantes de `estudiantes.curso_id`
  (`listas_seguimiento_repository.leer_estudiantes_del_curso`), o sea, del
  año activo. Mirando otro año, la lista de un curso sale sin estudiantes: en
  2027 en preparación hasta activarlo, y en 2026 después de activar 2027.
  Amplía el hallazgo del paso 3.7b (las marcas validan con el mismo campo).
- Pruebas: 24 nuevas, las 3 de la caracterización y 21 del año.
  - Dos archivos nuevos, `PlaneadoresClasesAdmin.anioLectivo.test.jsx` y
    `ListasSeguimientoAdmin.anioLectivo.test.jsx`, con las peticiones reales:
    en un año cerrado, la bandeja y sus contadores de ese año sin casillas
    ni "Marcar como vistos", el detalle de un plan sin revisión, y Listas con
    los cursos de ese año, casillas bloqueadas y sin crear ni guardar; en
    preparación, la bandeja de ese año con "Marcar como vistos", y el alta
    de una columna en todos los cursos **con el año**.
  - En archivos existentes: los dos servicios (con las opciones del activo,
    la llamada de siempre, incluso el mismo objeto de filtros; con otro año,
    el año en la bandeja, en los cursos y en el alta masiva), los tres hooks
    (con año y si cambia el año; el alta masiva, sin opciones con el
    activo), el detalle de un plan y la vista de Listas en los dos casos, y
    el contrato puro (también que los planes del profesor no tienen
    selector).
  - Ajustada a propósito: solo la del contrato puro que fijaba que estas
    pantallas todavía no seguían el año.
  - Veintinueve versiones dañadas del código hacen fallar alguna prueba:
    cada lectura y el alta masiva sin año, la bandeja copiando siempre sus
    filtros, un segundo argumento vacío, cada hook sin año o sin vigilar el
    año, el alta masiva siempre con opciones, cada página sin año o siempre
    editable, "Marcar como vistos" y las casillas en un año cerrado, el
    formulario de revisión y "Borrar" siempre visibles, la gestión de
    columnas y la barra siempre visibles, las casillas sin bloquear y cada
    pantalla fuera de `RUTAS_POR_ANIO`. Cuatro de ellas se repitieron aparte:
    en la primera vuelta no se aplicaron porque esos archivos usan finales de
    línea de Windows, y el script buscaba los de Unix.
- Documentación: `API_CLIENT.md`, `ARQUITECTURA_FRONTEND.md` (una tercera
  trampa: una escritura sobre "todos los cursos" también lleva el año),
  `COMPONENTES.md`, `CAMBIOS_FRONTEND.md` y
  `docs/funcionalidades/LISTAS_SEGUIMIENTO.md`. En este documento, el punto 6
  de la fase 6.
- Verificación: `pnpm run check:deploy` **limpio en una sola corrida**:
  **2204 pruebas pasan** en 340 archivos (antes 2180), lint limpio y build
  correcto. `git diff --check` limpio. Las pruebas del paso, solas, no
  muestran ningún aviso.
- Efecto al publicar: ninguno visible mientras haya un solo año. Revisión en
  local (solo mirar): la bandeja de planes con sus filtros y el detalle de un
  plan, y en Listas de seguimiento un curso con sus columnas, iguales que en
  producción, con todos sus botones.
- Commit `72be3da` (hecho por el usuario el 2026-10-05).

**Avance del 2026-10-05 — paso 4.7, diálogo al renombrar materias (sin
commit). Con él, el código de la fase 4 queda completo:**

- Aprobado por el usuario el 2026-10-05 ("SI"). Se confirmó antes que ambos
  repos estaban en `main` y limpios; Git mostró que el 4.6 ya estaba en el
  commit `72be3da`, aunque la entrega anterior todavía decía "sin commit".
  Ninguna pregunta abierta afecta este paso.
- Caracterización primero: las 25 pruebas existentes de Materias pasaron
  antes del cambio. Fijan el `PUT` y su cuerpo normal, la creación, los
  mensajes de error, el formulario y el listado.
- Código:
  - `utils/administracionAcademica/materias.js` reconoce únicamente el
    `409` cuyo `detail.codigo` es `materia_usada_en_otro_anio` y conserva el
    `detail.mensaje` del backend. No decide si una materia se usa en otro año.
  - `useComandosMaterias` guarda el cambio que produjo el aviso. "Cambiar
    igual" repite el mismo `PUT` con `confirmar_cambio_nombre: true`; "Crear
    una materia nueva" cambia el formulario de edición a creación con el
    nombre propuesto y **no guarda** hasta que el usuario pulse "Crear
    Materia".
  - `DialogoCambioNombreMateria` es una vista presentacional y accesible, con
    el mensaje del backend y exactamente esas dos decisiones.
- Compatibilidad: una edición normal sigue enviando el mismo cuerpo, sin
  `confirmar_cambio_nombre`; los demás errores siguen el flujo anterior. Con
  un solo año el backend no devuelve este aviso, así que no aparece nada
  nuevo.
- Pruebas: 6 nuevas (utilidad pura, dos del hook, diálogo y dos flujos
  completos de `CrearMateria`). Primero fallaron contra el código anterior
  por las piezas ausentes; después, la red específica quedó en 31 pruebas.
- Documentación: `API_CLIENT.md`, `ARQUITECTURA_FRONTEND.md`,
  `COMPONENTES.md`, `CAMBIOS_FRONTEND.md`, `docs/README.md` y este documento.
- Verificación: `pnpm run check:deploy` **limpio en una sola corrida**:
  **2210 pruebas pasan** en 341 archivos (antes 2204), lint limpio y build
  correcto. `git diff --check` limpio.
- Efecto al publicar: ninguno visible mientras haya un solo año. Con varios
  años, el admin recibe la elección explícita que exige la decisión 12, sin
  que el frontend invente el alcance del cambio.

### Fase 5 — Preparar el año siguiente

1. Página nueva `/admin/anios-lectivos` (guard `AdminRoute`), con tres
   pasos:
   1. **Crear 2027 y copiar** cursos, con casillas para precios, carga
      académica y director de grupo. Los conceptos de pago se copian
      siempre, sin casilla.
   2. **Matricular**: por curso de origen, elegir el curso destino, ver la
      lista y desmarcar a quien no pasa con ese grupo. Los valores
      especiales copiados aparecen marcados "revisar".
   3. **Resumen** de lo preparado (el botón de activar llega en la fase 6).
2. Estudiantes: al crear uno mientras se mira 2027, el formulario ofrece los
   cursos de 2027.
3. Pagos: si existe un año en preparación o el estudiante tiene deuda de
   años anteriores, aparece un selector "Año del pago". Por defecto, el año
   activo.
4. Deuda de años anteriores (decisión 2): el detalle de deudas del
   estudiante en Pagos y Cartera vencida la muestran aparte, por año. Tiene
   que estar en producción **antes de activar 2027** (fase 6): desde ese
   día, lo que se deba de 2026 solo llega en ese campo. Hallazgo del paso
   4.4: la ficha de Estudiantes (`DetalleEstudianteAdmin`, "Estado
   Financiero") tampoco la muestra, aunque su `GET /estudiantes/{id}/deudas`
   ya la trae; conviene sumarla aquí, o el admin dejaría de ver en la ficha
   lo que se debe de 2026.
5. Documentación: `RUTAS_FRONTEND.md` (ruta nueva), `API_CLIENT.md`,
   `COMPONENTES.md`, `ROLES_UI.md` (la entrada de menú del admin),
   `CAMBIOS_FRONTEND.md`.

Contrato del backend ya listo para los puntos 3 y 4 (su fase 2, código del
2026-10-01; ver `sistema_escolar_api/docs/API_ENDPOINTS.md`):

- `POST /pagos` y `POST /pagos/adelanto` aceptan `anio_lectivo_id` opcional
  en el cuerpo. `GET /estudiantes/{id}/deudas`,
  `GET /pagos/vencidos/opciones/{id}` y `GET /pagos/adelanto/opciones/{id}`
  lo aceptan como parámetro opcional (`?anio_lectivo_id=`). Sin él, todo es
  del año activo, como hoy, así que el frontend actual sigue igual.
- `GET /estudiantes/{id}/deudas` y cada estudiante de `GET /cartera/mora`
  traen `deuda_anios_anteriores`: una lista por año con `anio_lectivo_id`,
  `anio`, `curso_id`, `deudas` y `total_deuda`, aparte de la deuda del año.
  En cartera puede venir un estudiante con `total` 0 que solo debe de años
  anteriores. `GET /cartera/mora/resumen` trae `total_anios_anteriores`.
  Mientras haya un solo año, la lista viene vacía y el total en 0.

**Inicio autorizado e inventario confirmado el 2026-10-05:**

- El usuario autorizó expresamente la fase 5 y aprobó: crear cursos y
  conceptos nuevos en el año en preparación enviando `anio_lectivo_id`; poner
  el año consultado en el impreso y nombre del CSV de Cartera; y proponer el
  año consultado en el certificado de matrícula. Mirando el activo se seguirá
  omitiendo el año para conservar cada petición anterior.
- Ambos repos estaban en `main` y limpios al iniciar: frontend `8eac0ce` y
  backend `ce8d7a7`, ambos `ahead 8` respecto de su remoto conocido. No se
  hizo `fetch`, push, despliegue ni acceso a producción.
- `AnioLectivoProvider` ya tiene la lista, el activo y el seleccionado, pero
  todavía no puede recargarla después de crear 2027. El servicio solo tiene
  `GET /anios-lectivos`; la ruta, página y entradas de menú de preparación no
  existen.
- Administración y Tipos de pago ya consultan y editan el año seleccionado,
  pero ocultan “Crear” fuera del activo y sus servicios envían el cuerpo de
  siempre. Al habilitar altas en preparación se añadirá el año únicamente en
  ese caso.
- Estudiantes ya carga cursos y matrículas del año seleccionado, pero deja
  toda escritura fuera del activo. La fase 5 habilitará solo el alta en el
  año en preparación; editar datos globales y cambiar estados seguirá fuera
  de ese flujo.
- Antes del paso 5.9, Pagos usaba siempre el activo. El paso ya agregó su
  selector propio, activo por defecto e independiente del selector general;
  el historial quedó como estaba y las ventas siguen perteneciendo al activo.
- Antes del paso 5.9, los hooks descartaban `deuda_anios_anteriores`; ya se
  conserva y muestra separada. El paso 5.10 completó los documentos: el
  impreso y el nombre del CSV de Cartera identifican el año consultado, y el
  certificado de matrícula lo propone sin dejar de ser editable.

El plan completo, incluidos los pasos 5.1 a 5.6 del backend, está en el
documento principal. Los pasos de este repo son:

1. **5.7 — Pantalla base:** servicio, ruta `AdminRoute`, menú y página para
   crear/copiar 2027; recargar el proveedor; permitir altas manuales de cursos
   y conceptos en preparación enviando el año solo entonces.
2. **5.8 — Matrículas y resumen:** promoción por curso, estudiantes marcados,
   valores especiales por revisar, alta de estudiante en 2027 y resumen sin
   activar.
3. **5.9 — Pagos y deuda anterior:** selector propio de año, activo por
   defecto; recargar deudas/opciones/conceptos y agregar el año al cuerpo solo
   si se eligió otro. Mostrar las deudas anteriores en Pagos, Cartera y ficha
   de Estudiantes sin mezclar ventas.
4. **5.10 — Documentos:** año consultado en el estado de cartera, nombre del
   CSV y valor propuesto del certificado de matrícula.

Cada paso empieza con caracterización, termina con pruebas específicas,
`pnpm run check:deploy` y `git diff --check`, actualiza este documento y se
detiene antes del siguiente.

**Avance del 2026-10-06 — paso 5.7 terminado (`0848214` y `e3aced5`):**

- Antes del cambio pasaron **94 pruebas de caracterización** de años,
  navegación, rutas, Cursos y Tipos de pago. Las pruebas nuevas se
  escribieron primero y fallaron porque aún no existían la pantalla, los dos
  comandos HTTP, la recarga del proveedor ni las altas dirigidas a 2027.
- Nueva ruta de admin `/admin/anios-lectivos`, visible en los menús de
  escritorio y móvil. La página permite crear exactamente el siguiente año
  sin enviar su número y copiar desde el activo: los cursos y conceptos se
  copian siempre; precios, carga académica y directores solo si el admin marca
  sus casillas. El backend sigue siendo quien decide el año y si puede
  editarse.
- Ajuste visual pedido por el usuario: la página usa todo el ancho disponible
  del `main` compartido (que ya limita la aplicación a 1600 px), sin un
  `max-w` más pequeño. En móvil reduce espacios, apila las acciones a ancho
  completo y mantiene las opciones en una columna; desde tableta/escritorio
  las distribuye progresivamente.
- `AnioLectivoProvider` puede recargar la lista después del alta y dejar el
  año nuevo seleccionado. Si 2027 ya existía al abrir la página, los enlaces
  a Cursos y Tipos de pago lo seleccionan antes de navegar; así no apuntan por
  accidente a 2026.
- Cursos y Tipos de pago permiten crear mirando un año en `preparacion` y
  agregan `anio_lectivo_id` únicamente en esa alta. Una edición nunca recibe
  ese campo. Mirando el activo, cuerpos y peticiones quedan idénticos a los
  anteriores; un año cerrado sigue siendo solo consulta.
- No se tocó matriculación, resumen visual, activación, fórmulas de cobro,
  cartera ni migraciones. No hubo acceso a una base real, producción, push ni
  despliegue. Esos flujos empiezan en los pasos siguientes.
- Pruebas específicas: **111 pasan en 14 archivos**. La primera verificación
  global tuvo un único timeout antiguo de plantillas (pasó aislado en 844 ms);
  después del ajuste responsive se repitió completa y quedó limpia: **2221
  pruebas pasan en 342 archivos**,
  lint limpio y build correcto.

**Avance del 2026-10-07 — paso 5.8 terminado (`817c47e`):**

- Antes de tocar el flujo pasaron **31 pruebas de caracterización en 7
  archivos**: años lectivos, cursos y el alta/listado de estudiantes. Las
  pruebas nuevas se escribieron primero y fallaron por los cuatro contratos
  HTTP y las vistas que todavía no existían.
- La misma página `/admin/anios-lectivos` permite elegir un curso de 2026 y
  su destino de 2027. El backend entrega los candidatos; la pantalla marca
  inicialmente a quienes todavía no están matriculados y el admin puede
  desmarcarlos antes de enviar sus identificadores. Quienes ya están en 2027
  aparecen bloqueados para no repetirlos.
- El resultado muestra cuántos quedaron matriculados y presenta cada valor
  especial copiado con la marca visible **Revisar**. La pantalla no calcula
  cuotas, precios ni deudas: únicamente muestra los datos devueltos por el
  backend.
- Si la matrícula se guarda pero falla la recarga posterior del resumen, el
  éxito se conserva y se muestra una advertencia separada. Así el admin no
  recibe un falso error que pudiera llevarlo a repetir una operación ya
  guardada.
- Si se limpia el curso de origen antes de terminar su consulta, también se
  limpia el indicador de carga; no queda un mensaje de espera atascado.
- El resumen de 2027 presenta cursos, conceptos, estudiantes matriculados,
  valores especiales, pagos y total pagado recibidos del backend. No existe
  botón de activar; esa acción sigue reservada para la fase 6.
- Desde Estudiantes, mirando un año en `preparacion`, se habilita únicamente
  el alta directa con los cursos de ese año mediante
  `POST /anios-lectivos/{id}/estudiantes`. Editar datos globales y cambiar el
  estado permanecen ocultos. Mirando el año activo se conserva exactamente
  el `POST /estudiantes` anterior.
- Las nuevas secciones mantienen el ancho amplio aprobado en 5.7 y se apilan
  en móvil; las tarjetas de candidatos y del resumen agregan columnas de
  forma progresiva en pantallas mayores.
- No se tocó el backend, activación, fórmulas de cobro, cartera, migraciones,
  bases reales ni producción. Tampoco hubo commit, push ni despliegue.
- Pruebas específicas: **37 pasan en 8 archivos**. Verificación global:
  **2227 pruebas pasan en 343 archivos**, lint limpio y build correcto.

**Avance del 2026-10-07 — paso 5.9 terminado (`0689b7d`):**

- Antes del cambio pasaron **114 pruebas de caracterización en 22 archivos**
  de Pagos, Cartera y la ficha de Estudiantes. Las pruebas nuevas se
  escribieron primero: 16 fallaron porque todavía no se enviaba el año, no
  existía el selector propio y las tres pantallas descartaban la deuda
  anterior.
- Pagos tiene un selector propio, independiente del selector general y con el
  año activo como valor inicial. Se muestra al seleccionar un estudiante si
  existe un año en preparación o hay deuda anterior. Cartera puede abrir
  Pagos conservando el año que se estaba consultando.
- Al elegir otro año se recargan conceptos, deuda, cuotas vencidas, opciones
  de adelanto y valores personalizados. `anio_lectivo_id` viaja en esas
  lecturas y en el cuerpo del pago normal o adelantado solo para ese otro
  año. Con el activo se conservan las llamadas y los cuerpos anteriores.
- El historial de pagos y las ventas continúan sin filtro por año. Las ventas
  solo se ofrecen para cobrar mirando el activo y se ocultan en el formulario
  de otro año. El frontend no calcula deuda ni meses cobrables: muestra las
  opciones del backend.
- Si una respuesta del año anterior llega después de cambiar el selector, se
  descarta para que no reemplace la deuda ni las opciones visibles.
- `deuda_anios_anteriores` se presenta en un componente compartido y separado
  de la deuda consultada. Pagos muestra el detalle por año; Cartera agrega su
  total y detalle sin sumarlo al total actual; la ficha del estudiante también
  lo conserva y lo muestra. Con la lista vacía no aparece ningún bloque nuevo.
- No se modificó código del backend, fórmulas financieras, migraciones, bases
  reales ni producción. Tampoco hubo commit, push ni despliegue.
- Pruebas específicas: **76 pasan en 12 archivos**. Verificación global:
  **2245 pruebas pasan en 344 archivos**, lint limpio y build correcto.

**Avance del 2026-10-08 — paso 5.10 terminado localmente, sin commit. Con él,
la fase 5 queda completa en código:**

- Antes de cambiar código pasaron **24 pruebas de caracterización en 6
  archivos** de Cartera y Certificados. Fijan la impresión, la exportación
  CSV y el campo editable del certificado de matrícula.
- Las tres pruebas nuevas se escribieron primero y fallaron por lo que todavía
  faltaba: el estado de cuenta no mostraba el año, el archivo no lo incluía en
  su nombre y el certificado proponía el año del reloj.
- El estado de cuenta por estudiante o curso muestra el año que mira el admin
  y el CSV se descarga como `cartera_vencida_AAAA_FECHA.csv`. Ambos toman el
  valor del proveedor de años lectivos; el frontend no calcula qué año es.
- El certificado de matrícula propone ese mismo año consultado. El campo
  continúa editable para que el admin pueda corregir el texto antes de
  generar el documento.
- No cambió ninguna petición ni respuesta HTTP, cálculo financiero, regla de
  cobro o pantalla fuera de las indicadas. No se tocó el backend, migraciones,
  bases reales ni producción; tampoco hubo commit, push ni despliegue.
- Pruebas específicas finales: **27 pasan en 6 archivos**. Verificación
  global: **2248 pruebas pasan en 344 archivos**, lint limpio y build
  correcto.

**Ajuste del 2026-10-08 — navegación de Años lectivos, terminado localmente
sin commit:**

- A pedido del usuario, `Años lectivos` deja de ser una entrada principal del
  menú. `Administración` pasa a ser un grupo con `Estructura académica`, que
  conserva `/admin`, y `Años lectivos`, que conserva
  `/admin/anios-lectivos`.
- La misma organización se aplicó al menú de escritorio y al móvil. No cambió
  ninguna ruta, pantalla, petición, permiso ni comportamiento del backend.
- Antes del cambio pasaron las **23 pruebas de caracterización** de navegación.
  Las expectativas nuevas se escribieron primero y fallaron en 3 puntos contra
  el menú anterior. Al terminar pasan las **23 pruebas específicas**.
- Verificación global: **2248 pruebas pasan en 344 archivos**, lint limpio y
  build correcto.

### Fase 6 — Activar el año

1. En la página de años lectivos: vista previa con cuántos pasan, cuántos
   quedan retirados por "no continúa" y la **lista de los que faltan por
   decidir**. Con alguno pendiente, el botón de activar queda bloqueado.
2. Confirmación fuerte antes de activar: escribir el año, por ejemplo
   "2027", porque el paso cierra el año actual para todos, incluidos los
   profesores.
3. Reabrir y volver a cerrar un año pasado, con la misma confirmación.
4. Ojo, hallazgo del paso 4.3: en Tipos de pago, si el backend rechaza un
   guardado con el `409` de año cerrado, el aviso sale con un título que no es
   el suyo, aunque con el texto correcto: "Concepto duplicado" al editar un
   concepto (`useFormularioTipoPago`) y "Migración pendiente", más un comando
   de consola, al guardar la configuración (`useConfiguracionTipoPago`). Hoy no
   puede pasar: mirando un año cerrado esos botones no aparecen. Desde esta
   fase sí, si el año se cierra mientras la pantalla está abierta. Arreglarlo
   antes de activar el primer año.
5. Ojo, hallazgo del paso 4.5: para que el admin pueda imprimir boletines y
   certificados de 2026 después de activar 2027, esas dos listas tienen que
   traer también a quien ya no esté activo (los marcados "no continúa" pasan
   a retirados al activar). Hoy solo traen activos: ver la pregunta abierta.
6. Ojo, hallazgo del paso 4.6 (del backend): la lista de seguimiento de un
   curso toma sus estudiantes de `estudiantes.curso_id`, así que la de un
   curso de 2026 saldrá vacía después de activar 2027. Si se quiere
   consultar las listas de 2026, el backend tiene que leerlas por matrícula,
   como el boletín desde el paso 3.5a.

### Fase 7 — Reutilizar el planeador anual y los planes de clase

Pantallas del profesor. Depende de la fase 7 del backend.

1. **Planeador anual** (`pages/PlaneadorAnual.jsx`,
   `hooks/mallaCurricular/`): si el backend dice que hay origen y que el
   planeador está vacío, aparece el botón "Traer el planeador del año
   pasado". Al usarlo, recarga el planeador. Las fechas quedan vacías para
   que el profesor ponga las de 2027. Si el backend responde 409 porque ya
   hay algo escrito, se muestra su mensaje y no se toca nada.
2. **Plan de clases** (`pages/PlanDeClases.jsx`, `hooks/planeaciones/`): en
   el formulario de crear, un botón "Usar un plan del año pasado". Abre la
   lista que da el backend (fecha, periodo, unidad, tema); al elegir uno, se
   llenan los campos de texto del formulario. La fecha y las evidencias
   quedan vacías y el plan se envía por el guardado normal, como uno nuevo.
3. Terminado cuando: el botón del planeador solo aparece con origen y
   planeador vacío; al elegir un plan base, el formulario se llena sin
   fecha ni evidencias; `pnpm run check:deploy` pasa; el usuario lo revisa en
   local con un profesor de prueba.

## Pruebas

- `src/utils/anioLectivo.test.js`: normalización, año activo, etiquetas y,
  sobre todo, `parametrosAnio` devolviendo `{}` con el año activo.
- `src/services/aniosLectivosApi.test.js`: rutas y cuerpos.
- Proveedor y hook: carga una vez, cambio de año, comportamiento fuera del
  proveedor.
- En cada servicio tocado: la petición con el año activo es idéntica a la de
  hoy, y con otro año lleva `anio_lectivo_id`.
- Una prueba de caracterización por página del inventario, antes de
  tocarla.

## Fuera de alcance

- Selector para profesores.
- Recordar el año elegido entre sesiones.
- Cualquier cálculo de años, meses cobrables o deuda en el frontend: todo
  viene del backend (regla del `CLAUDE.md`).

## Preguntas abiertas

- ~~Fase 4, antes del paso 4.1: ¿el selector (y el aviso) se esconde o se
  desactiva en las pantallas que no dependen del año?~~ **Respondida el
  2026-10-03: se esconde (opción A).** Motivo: en Pagos, un selector gris
  que dijera "2026" podría hacer creer que el pago va a 2026; escondido, esa
  duda no existe. Aceptado lo que cuesta: en esas pantallas no se ve qué año
  está elegido; se vuelve a ver al regresar a una pantalla del año.
- **Respondida el 2026-10-03, antes del paso 4.2: el admin sí puede editar
  lo que ya existe en un año en preparación**, menos crear cursos o
  conceptos y todo lo de Estudiantes, que siguen solo mirando el año activo
  hasta la fase 5 (hallazgos 2 y 3). Se le explicó que lo que cambie mirando
  2027 solo se ve en 2027 (cada año tiene sus cursos, clases, horarios,
  conceptos y precios), y que lo que no es de un año (el nombre de una
  materia, los datos de un estudiante) es uno solo para todos. La pregunta,
  tal como estaba: ~~Fase 4, antes del paso 4.2: ¿qué puede hacer el admin
  cuando mira un año **en preparación**? Los documentos no lo dejan claro.
  Por un lado, el punto 4 de la fase 4 oculta crear, editar y borrar en todo
  año que no
  sea el activo, y el objetivo 2 habla de "solo consulta". Por otro, el
  aviso propuesto para ese año es "Estás preparando el año 2027", el
  documento del backend dice que la fase 4 va antes de la 5 porque el admin
  necesita las pantallas de siempre mirando 2027 para prepararlo, la
  decisión 17 dice que los conceptos de 2027 se ajustan en Tipos de pago, y
  la guardia del backend deja guardar al admin en un año en preparación
  (`exigir_anio_editable`: solo un año cerrado lo frena). Además, crear un
  curso o un concepto siempre lo crea en el año activo (pregunta abierta del
  backend para la fase 5): un botón de crear visible mientras se mira 2027
  lo crearía en 2026. Lo que no depende de esta respuesta ya está en el
  plan: crear cursos o conceptos y todo lo de Estudiantes van solo mirando
  el año activo (hallazgos 2 y 3 del inventario), y un año cerrado es de
  solo consulta.~~
- ~~Antes de la fase 5 (encontrada en el paso 4.3): el estado de cuenta que
  imprime Cartera vencida y su archivo CSV no dicen de qué año son. Mirando
  otro año (por ejemplo, la matrícula de 2027 en preparación, o 2026 ya
  cerrado), un papel entregado a una familia no diría a qué año pertenece la
  deuda. ¿Se agrega el año al impreso y al nombre del CSV? Sería algo nuevo,
  que no está en los documentos, así que no se hizo. No bloquea la fase 4:
  mientras haya un solo año, no se puede mirar otro.~~ **Respondida el
  2026-10-05: sí.** El paso 5.10 quedó terminado el 2026-10-08: el impreso
  y el nombre del CSV identifican el año consultado.
- ~~Encontrada en el paso 4.5, de antes de esta función (ver su hallazgo):
  Boletines y Certificados solo listan estudiantes **activos**, así que hoy
  no se le puede sacar un certificado ni un boletín a un retirado o a un
  egresado, y mirando un año pasado tampoco a quien ya no siga activo. ¿Se
  arregla como cambio aparte? Propuesta del asistente: solo en Certificados,
  pidiendo todos los estados (`?estado=todos`). Su filtro propio ya abre en
  "Activos", así que nada cambia a la vista hasta que alguien elija
  "Retirados", y el certificado de notas cubre lo que suele pedir quien se
  va. Boletines quedaría como está. Cambiaría una petición del año activo,
  por eso no entró en el paso 4.5. Hace falta como muy tarde antes de la
  fase 6, cuando el admin tenga que imprimir 2026. **Pregunta hecha al
  usuario al cerrar el paso 4.5; respondió "continúa" sin decidirla.~~
  **Respondida el 2026-10-08:** Certificados pedirá todos los estados y
  conservará "Activos" como filtro inicial; Boletines seguirá como está.
- ~~Antes de la fase 5 (encontrada en el paso 4.5): el certificado de
  matrícula lleva el año en un campo de texto que propone el año del
  calendario (`useConsultasCertificadosAdmin`, existe desde junio de 2026 y
  no es parte de esta función). Mirando 2027 en preparación propondría 2026
  junto al curso de 2027. ¿Debe proponer el año que se está mirando?~~
  **Respondida el 2026-10-05: sí.** El paso 5.10 quedó terminado el
  2026-10-08: propone el año consultado y el campo sigue siendo editable.

## Entrega para el siguiente chat

- Última acción terminada con código: **ajuste de navegación posterior a la
  fase 5**. `Administración` agrupa ahora `Estructura académica` y `Años
  lectivos` en escritorio y móvil, sin cambiar sus rutas. Quedó confirmado en
  `365d083`. La fase 5 quedó completa y confirmada: paso
  5.10 en `82675ba`, paso 5.9 en `0689b7d`, paso 5.8 en `817c47e`; paso 5.7
  en `0848214` y su ajuste responsive en `e3aced5`.
  El paso anterior a la fase 5 fue 4.7, commit `8eac0ce` del 2026-10-05.
  Antes: inventario y
  plan por pasos (commit `dbb0e48`), paso 4.1 (`4b14347`), paso 4.2
  (`78c48f7`) y paso 4.3 (`0798f21`), el 2026-10-03; paso 4.4 (`c7f0622`) y
  paso 4.5 (`2140fae`) y paso 4.6 (`72be3da`), el 2026-10-05. Al iniciar la
  fase 5, este repo estaba limpio y `ahead 8`; subirlo lo decide el usuario.
- **Fase 5 iniciada el 2026-10-05 con autorización explícita del usuario.**
  El usuario aprobó las altas
  manuales de cursos/conceptos en preparación, el año en el impreso/CSV de
  Cartera y el año seleccionado como propuesta del certificado de matrícula.
  Los pasos 5.1 a 5.6 del backend ya terminaron; el último es el commit local
  `102ec77`. Al iniciar 5.7, ambos repos estaban en `main` y limpios; el
  backend registró después el paso 5.8 en `d3cdfd3` y el 5.9 en `53da8f0`.
  Antes de iniciar 5.10, ambos repos estaban en `main` y limpios: frontend
  `0689b7d` (`ahead 4`) y backend `53da8f0` (`ahead 7`).
- Antes: **diseño y documentación**, 2026-09-29, ampliado el 2026-09-30
  con el diálogo de materias, la fase 7 y los conceptos de pago por año.
  Comprobado el 2026-10-01: lo único con "año lectivo" en `src/` es el
  campo de texto del certificado de matrícula
  (`hooks/certificadosImpresion/`), que existe desde junio de 2026 y no es
  parte de esta funcionalidad.
- 2026-10-02: el backend terminó su fase 3 (lecturas por año, aviso al
  renombrar materias y guardia de escritura), todavía sin subir a GitHub; su
  fase 2 sí está en GitHub. Se anotó aquí el contrato completo, en
  "Contrato del backend para la fase 4". Sigue sin haber código de esta
  funcionalidad en este repo.
- 2026-10-03, comprobado al retomar: el backend tiene hechos los 11
  commits de su fase 3 (el último, `9edbe5d`, es el paso 3.7b), pero
  ninguno está en GitHub (`git fetch`: `ahead 11`). La fase 3 **no** está
  en producción, así que la fase 4 sigue sin empezar. Pasan
  `scripts/verify.py` del backend (2016 pruebas, con un `DATABASE_URL`
  inventado como en CI) y `pnpm run check:deploy` de este repo (2039
  pruebas, lint y build; en una primera corrida, 3 pruebas se pasaron del
  límite de 5 s por lentitud del equipo, pasan solas y la segunda corrida
  completa salió limpia). Se anotó una segunda pregunta abierta de la fase
  4 (qué puede hacer el admin mirando un año en preparación). Más tarde ese
  día el usuario subió la fase 3 a producción (`origin/main` en `9edbe5d`,
  visto con `git fetch`) y autorizó empezar la fase 4.
- **Fase 6 autorizada el 2026-10-08.** El usuario confirmó que quien termina el
  último grado queda como `egresado`, y que Certificados consultará todos los
  estados manteniendo "Activos" como filtro inicial; Boletines no cambia. El
  paso 6.1 del backend (migración de `matriculas.estado_salida` y de
  `anios_lectivos_materias_ocultas`) quedó terminado localmente el mismo día:
  probado en una rama de Neon y con el esquema base regenerado desde allí. No se
  inició código de fase 6 en este repo. Esta actualización solo documental se
  verificó con `pnpm run check:deploy`: 2248 pruebas en 344 archivos, lint y
  build correctos.
- El paso 6.1 del backend quedó en el commit `6c6aabb`, y la migración se aplicó
  en los dos tenants de producción el 2026-10-08.
- El 2026-10-08 el usuario autorizó el paso 6.2 del backend y lo dividió en
  6.2a (vista previa de activación, ya terminado localmente en el backend:
  `GET /anios-lectivos/{id}/activacion/vista-previa`) y 6.2b (guardar o quitar
  la marca `retirado`/`egresado`). Decidió también que una marca de salida y
  una matrícula en el año siguiente se excluyen: el backend rechaza el choque
  con un mensaje. Contrato en `sistema_escolar_api/docs/API_ENDPOINTS.md`.
- Pendiente de preguntar antes del código del frontend de esta fase: en qué
  pantalla marca el admin a quien no sigue (por ejemplo, en la de promoción por
  curso o en la lista de pendientes de la vista previa).
- Siguiente acción exacta: el paso 6.2b del backend, cuando el usuario lo
  autorice. No iniciar todavía el código del frontend.
- Verificación del ajuste: caracterización y resultado final, 23 pruebas en 2
  archivos; `pnpm run check:deploy` limpio con 2248 pruebas en 344 archivos,
  lint y build correctos. `git diff --check` limpio.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_ANIO_LECTIVO.md`.
