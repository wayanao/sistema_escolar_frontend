# Funcionalidad: Año lectivo — Frontend

## Control

- Estado: **Fase 4 iniciada el 2026-10-03**, con la autorización del
  usuario: inventario confirmado y plan por pasos, solo documento. Todavía
  no hay código de esta funcionalidad. La fase 3 del backend está en GitHub
  desde el 2026-10-03 (`9edbe5d`); su contrato está en "Contrato del
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
- Última actualización: 2026-10-03.

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
   día, lo que se deba de 2026 solo llega en ese campo.
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

### Fase 6 — Activar el año

1. En la página de años lectivos: vista previa con cuántos pasan, cuántos
   quedan retirados por "no continúa" y la **lista de los que faltan por
   decidir**. Con alguno pendiente, el botón de activar queda bloqueado.
2. Confirmación fuerte antes de activar: escribir el año, por ejemplo
   "2027", porque el paso cierra el año actual para todos, incluidos los
   profesores.
3. Reabrir y volver a cerrar un año pasado, con la misma confirmación.

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

- Fase 4, antes del paso 4.1: ¿el selector (y el aviso) se esconde o se
  desactiva en las pantallas que no dependen del año? Cuáles son, en el
  "Inventario confirmado el 2026-10-03".
- Fase 4, antes del paso 4.2 (encontrada el 2026-10-03): ¿qué puede hacer
  el admin cuando mira
  un año **en preparación**? Los documentos no lo dejan claro. Por un lado,
  el punto 4 de la fase 4 oculta crear, editar y borrar en todo año que no
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
  solo consulta. **Sin respuesta del usuario.**

## Entrega para el siguiente chat

- Última acción terminada: **inventario y plan por pasos de la fase 4**
  (2026-10-03, solo documento), con la autorización del usuario para
  empezar la fase 4. Ver "Inventario confirmado el 2026-10-03" y "Plan por
  pasos" en la fase 4. Todavía no hay código de esta funcionalidad en este
  repo.
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
- Siguiente acción de este repo: que el usuario revise y apruebe el plan
  por pasos de la fase 4. Con él quedan aceptados las dos decisiones de
  diseño "a confirmar al empezar la fase 4", los cambios del inventario
  (Pagos, el inicio y Reportes siempre en el año activo) y el costo de una
  petición. Después, antes del paso 4.1, hacerle la primera pregunta
  abierta (selector y aviso en las pantallas que no dependen del año), y
  antes del 4.2 la segunda (qué puede hacer el admin en un año en
  preparación). De una en una. El contrato de la fase 2 para pagos y
  cartera sigue en la fase 5 de este documento. El estado al día está en la
  "Entrega" del documento del backend.
- Prompt para retomar: `docs/funcionalidades/PROMPT_CONTINUACION_ANIO_LECTIVO.md`.
