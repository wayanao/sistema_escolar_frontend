# Arquitectura Frontend

Estado documentado del frontend `frontend-react`.

## Stack actual

- React 19.
- React Router DOM 7.
- Vite 8.
- Axios para consumo del backend.
- SweetAlert2 para alertas.
- js-cookie para lectura/eliminacion de cookie `token`.
- jsPDF y jspdf-autotable para impresos/reportes.
- pnpm como gestor obligatorio del proyecto.

## Estructura raiz observada

- `src/`: codigo fuente de React.
- `public/`: archivos publicos servidos por Vite.
- `dist/`: salida generada por build.
- `docs/`: documentacion de control del frontend.
- `scripts/`: scripts auxiliares del proyecto.
- `index.html`: entrada HTML de Vite.
- `vite.config.js`: configuracion de Vite con plugin React.
- `vercel.json`: reescritura SPA hacia `index.html`.
- `.env`: variables de entorno locales.
- `package.json`: scripts, dependencias y version de pnpm.

## Estructura de `src/`

- `src/main.jsx`: monta React en el DOM y envuelve `App` con `BrowserRouter`.
- `src/App.jsx`: define rutas, layouts, lazy loading y guards principales.
- `src/assets/`: imagenes y recursos estaticos del frontend.
- `src/components/`: componentes reutilizables y componentes por modulo.
- `src/components/autenticacion/`: vistas presentacionales de login, cambio de
  password, estado del tenant y navegación de admin, profesor y super admin,
  incluido el menú animado de escritorio compartido por dos roles.
- `src/components/certificadosImpresion/`: selección, vistas imprimibles y
  formularios presentacionales de identidad y plantillas.
- `src/components/boletin/`: vistas presentacionales de generación,
  impresión, ingreso docente y orden del módulo de boletines.
- `src/components/carteraTiposPago/`: vistas presentacionales de cartera
  vencida, estados de cuenta y administración de conceptos de pago.
- `src/components/inventarioVentas/`: vistas presentacionales del catálogo de
  productos, la caja y el volante imprimible de un cargo.
- `src/components/nominaEgresosPrestamos/`: vistas presentacionales del estado
  de cuenta del personal, el historial y el modal de pago de nómina, el
  formulario e historial de egresos, y el formulario e historial de préstamos.
- `src/components/pagos/`: listado, valores personalizados, formulario,
  historial y comprobante presentacionales del módulo de pagos.
- `src/components/reportesFinancieros/`: resumen financiero, movimiento
  mensual, panel de rango de fechas con estudiantes por curso, y detalle de
  ingresos/egresos presentacionales del módulo de reportes.
- `src/components/impresion/`: componentes de documentos imprimibles.
- `src/components/asistencia/`: componentes presentacionales del flujo docente
  de asistencia, sin acceso a hooks ni transporte HTTP.
- `src/components/planilla/`: tarjeta móvil, fila de escritorio, selector de
  tipo de calificación, gestión de tipos de evaluación y tabla de notas de la
  planilla del profesor, sin acceso a hooks ni transporte HTTP.
- `src/components/mallaCurricular/`: encabezado, estados, editor responsive,
  acciones, impresión y contratos visuales de la malla curricular.
- `src/components/administracionAcademica/`: componentes y contenedores de
  asignaciones, profesores, cursos, materias y horarios, separados por dominio.
- `src/components/estudiantesObservador/`: vistas presentacionales del listado,
  formulario y detalle administrativo, y del observador del profesor.
- `src/components/observador/`: lista de alumnos, bitácora agrupada por
  dimensión o por fecha, anotación individual, formulario e impreso del
  observador del estudiante unificado.
  Módulo aparte del anterior a propósito, para que retirar la pantalla vieja no
  se lo lleve por delante.
- `src/components/planeaciones/admin/`: componentes presentacionales de la
  bandeja administrativa y elementos visuales compartidos de revisión.
- `src/components/planeaciones/profesor/`: componentes presentacionales del
  flujo docente de planeaciones.
- `src/components/planeaciones/NotificacionesPlaneadores.jsx`: conector de la
  campana compartida por admin y profesor; enlaza hook, router y estado local.
  `NotificacionesPlaneadoresVista.jsx` contiene su presentación controlada.
- `src/components/dashboards/`: `CumpleanosSemana`, el único componente
  compartido por dos roles del módulo de dashboards.
- `src/components/dashboards/admin/`: tarjeta de cartera vencida y rejilla de
  accesos principales del panel de administración.
- `src/components/dashboards/profesor/`: contexto de trabajo, horario semanal
  por jornada, filtro de rendimiento, las tres tarjetas de resultados y las dos
  tablas de ranking.
- `src/components/dashboards/superAdmin/`: resumen por estado y tabla de tenants
  de la plataforma.
- `src/constants/`: constantes compartidas entre paginas/componentes.
- `src/constants/valoracionesDesarrollo.js`: única definición de la escala de
  desarrollo infantil —código, etiqueta, emoji y equivalencia numérica—,
  compartida por planilla y boletines. Las utilidades de boletines la derivan;
  no vuelven a declararla.
- `src/hooks/`: hooks propios del frontend.
- `src/hooks/autenticacion/`: lectura local y guards de sesión, consulta del
  estado tenant y comandos de login, cambio de password y logout.
- `src/hooks/asistencia/`: consultas cancelables y comandos del flujo docente
  de asistencia, separados entre estado remoto y marcación editable.
- `src/hooks/planilla/`: consultas cancelables de clases y planilla, y
  comandos de guardado de notas y de tipos de evaluación, separados entre
  estado remoto y edición.
- `src/hooks/mallaCurricular/`: consultas con descarte de respuestas antiguas y
  comandos editables del planeador anual, separados por responsabilidad.
- `src/hooks/boletines/`: consultas cancelables y comandos editables de
  generación administrativa, ingreso docente y orden de materias.
- `src/hooks/administracionAcademica/`: consultas cancelables, formularios y
  comandos de administración académica; Horarios conserva dos consultas de
  solo lectura independientes.
- `src/hooks/estudiantesObservador/`: consultas, formularios y comandos de
  estudiantes y observador, con aislamiento de respuestas obsoletas.
- `src/hooks/observador/`: consulta cancelable de la lista de alumnos del
  profesor —sin depender de ninguna clase elegida— y de la bitácora de un
  estudiante —una sola petición pinta la pantalla, y distingue el estudiante
  inexistente de la bitácora vacía—, estado editable del formulario con su marca
  de campos tocados, y los dos comandos de escritura. Sin comando de borrado.
- `src/hooks/certificadosImpresion/`: consultas cancelables de certificados,
  comandos administrativos y configuración compartida de impresión.
- `src/hooks/carteraTiposPago/`: consultas de cartera y conceptos, formulario
  básico, configuración financiera y asignación editable de cursos.
- `src/hooks/inventarioVentas/`: consulta del catálogo con filtro por estado,
  consultas paralelas de la caja, formulario de producto, carrito y anulación.
- `src/hooks/nominaEgresosPrestamos/`: consultas paralelas de nómina, consulta
  de egresos por rango de fechas, carga de profesores con historial de préstamos
  bajo demanda, y los tres comandos de pago, egreso y préstamo.
- `src/hooks/dashboards/`: un hook por sección independiente —cartera y
  cumpleaños del admin; contexto de trabajo, clases, inasistencias, cumpleaños,
  rendimiento y planeaciones recientes del profesor; rankings; y la lista,
  alta y cambio de estado de tenants—, de modo que el fallo de una sección no
  bloquee a las demás.
- `src/hooks/pagos/`: consultas, estado editable y comandos de pagos normales,
  cuotas vencidas, adelantos, valores personalizados y anulación.
- `src/hooks/reportesFinancieros/`: consulta del reporte general con sus
  derivados (estadísticas, movimiento mensual y estudiantes por curso), y
  consulta del detalle por rango o mes con sus derivados de filtro y
  totales por medio de pago. El módulo no tiene comandos de escritura.
- `src/hooks/planeaciones/`: estado y efectos reutilizables del módulo de
  planeaciones, separados de la presentación; incluye consulta y sincronización
  de notificaciones y ciclo de vida de imágenes protegidas.
- `src/pages/`: paginas principales de la aplicacion.
- `src/services/`: fronteras HTTP del frontend. Los servicios encapsulan rutas
  y configuración de transporte, devuelven datos y no administran estado de
  React ni decisiones de interfaz.
- `src/services/autenticacionApi.js`: contratos HTTP de login, logout, cambio
  obligatorio de password y estado del tenant.
- `src/services/planeacionesApi.js`: contrato HTTP compartido por los flujos de
  planeaciones del profesor y del administrador, incluidas notificaciones y
  descarga autenticada de imágenes como blob.
- `src/services/asistenciaApi.js`: contrato HTTP de planilla, clases, historial
  y guardado de asistencia del profesor.
- `src/services/planillaApi.js`: contrato HTTP de clases, planilla, guardado
  de nota y eliminación de tipo de evaluación del profesor; consumo
  independiente del de `asistenciaApi.js` aunque comparta dos rutas.
- `src/services/mallaCurricularApi.js`: contrato HTTP de asignaciones, consulta
  y guardado posicional de la malla curricular.
- `src/services/boletinesApi.js`: contrato HTTP de cursos, estudiantes,
  generación, referencia y guardado docente y orden de materias.
- `src/services/asignacionesApi.js`, `profesoresApi.js`, `cursosApi.js`,
  `materiasApi.js` y `horariosApi.js`: contratos HTTP de administración
  académica y horarios.
- `src/services/estudiantesObservadorApi.js`: contrato HTTP de estudiantes,
  cursos, detalle, deudas, planilla y observaciones.
- `src/services/observadorApi.js`: contrato HTTP del observador del estudiante
  unificado: listar los alumnos del profesor, leer una bitácora, crear una
  anotación y corregir la propia. **Sin** contrato de borrado: nadie borra una
  anotación.
- `src/services/certificadosImpresionApi.js`: fachada HTTP de certificados que
  reutiliza contratos compatibles de boletines y asistencia.
- `src/services/carteraTiposPagoApi.js`: frontera HTTP de cartera vencida,
  conceptos de pago, configuración y asignación de cursos.
- `src/services/inventarioVentasApi.js`: frontera HTTP de catálogo, alta,
  edición y estado de productos, y de ventas, registro y anulación de cargos.
- `src/services/nominaEgresosPrestamosApi.js`: frontera HTTP de empleados,
  historial y pago de nómina; egresos por rango, alta y edición; y préstamos por
  profesor, alta y saldado.
- `src/services/dashboardsApi.js`: frontera HTTP de los catorce contratos de los
  dashboards por rol y de los dos rankings del profesor.
- `src/services/pagosApi.js`: frontera HTTP de catálogos, historial, deudas,
  opciones, valores personalizados, registro y anulación de pagos.
- `src/services/reportesFinancierosApi.js`: frontera HTTP del reporte
  general y del detalle de ingresos/egresos por rango o por mes.
- `src/services/printingService.js`: frontera HTTP compartida de branding,
  logos y plantillas de impresión.
- `src/styles/`: estilos globales adicionales.
- `src/utils/`: utilidades compartidas, incluyendo cliente API.
- `src/utils/valoracionesDesarrollo.js`: traducción entre caritas y números de
  la escala de desarrollo infantil, en las dos direcciones. Compartida por
  boletines y planilla, como `periodoProfesor.js`; la escala vive en
  `src/constants/`.
- `src/utils/autenticacion/`: contratos puros de sesión, login, password y
  navegación, sin HTTP, React, DOM ni almacenamiento.
- `src/utils/planeaciones/`: contratos puros del dominio, separados por perfil
  y acompañados por sus pruebas unitarias.
- `src/utils/planeaciones/profesor.js` y `src/utils/planeaciones/admin.js`:
  contratos y transformaciones puras del módulo de planeaciones. No realizan
  solicitudes, no acceden al DOM y no administran estado de React.
- `src/utils/planeaciones/notificacionesContratos.js` e `imagenes.js`:
  agrupación, formato, rutas, nombre del evento y normalización de imágenes como
  contratos puros. El despacho y la escucha del evento viven en hooks, fuera de
  esta carpeta.
- `src/utils/asistencia/`: contratos y transformaciones puras de asistencia,
  incluidas fechas, historial, resumen, cambios, marcación masiva y payload.
- `src/utils/planilla/`: columna interna reservada, formateo de etiquetas,
  notas visibles, cálculo de promedio —numérico y por caritas—, normalización de
  coma decimal y construcción del payload de nota de la planilla.
- `src/utils/mallaCurricular/`: filas iniciales, normalización por `slot`,
  validaciones y construcción del payload posicional de ocho filas.
- `src/utils/boletines/`: contratos y transformaciones puras de generación,
  ingreso docente y orden de materias, con pruebas adyacentes.
- `src/utils/administracionAcademica/`: contratos, validaciones, payloads,
  filtros, estados y transformaciones puras del módulo académico.
- `src/utils/estudiantesObservador/`: formularios, filtros, normalización y
  payloads puros de estudiantes y observaciones.
- `src/utils/observador/`: agrupación por dimensión, opciones de periodo, fecha
  corta y título con nivel del curso; agrupación de la
  lista de alumnos por curso y su filtro; validación y cuerpos de las peticiones
  de escritura; el color de cada profesor, repartido por `profesor_id`; qué entra
  en cada impreso con sus firmas y títulos; y la
  corrección de mayúsculas, espejo comprobado de `app/core/texto_observador.py`.
  Todo como contratos puros.
- `src/utils/certificadosImpresion/`: contratos, filtros, consolidación
  académica y transformaciones puras de certificados e impresión.
- `src/utils/carteraTiposPago/`: formatos, filtros, totales, CSV, estados de
  cartera, normalización y payloads puros de conceptos y cursos.
- `src/utils/inventarioVentas/`: estados y payloads de producto, filtros del
  catálogo, transformaciones inmutables del carrito, totales, contratos de
  venta y anulación, y reglas puras de clase por estado y stock.
- `src/utils/nominaEgresosPrestamos/`: cálculo del neto y contratos de nómina,
  fecha local, categorías, normalización y contratos de egresos, estados,
  contratos y totales de préstamos, y reglas puras de clase por saldo y estado.
- `src/utils/dashboards/`: un archivo por subdominio —accesos, moneda y regla de
  mora del admin; jornadas, horario, deduplicación de clases, filtros y rankings
  del profesor; estados, validaciones y marcado de diálogos del super admin; y
  el cálculo de días y edad de cumpleaños, compartido por dos roles—, con sus
  reglas puras de clase.
- `src/utils/pagos/`: formatos, cálculos financieros, estados iniciales,
  normalización y payloads puros del módulo de pagos.
- `src/utils/reportesFinancieros/`: interpretación de medios de pago simples,
  combinados y con nota libre (incluidas variantes históricas de campos),
  formateadores de moneda/fecha/mes, normalización de listas paginadas o
  planas, y la combinación de ingresos/egresos mensuales en movimiento
  financiero.

## Entrada de la aplicacion

`src/main.jsx` renderiza:

- `BrowserRouter`
- `App`

`src/App.jsx` carga varias paginas con `React.lazy` y usa `Suspense` con un loader simple de texto `Cargando...`.

## Layout principal

La aplicacion tiene cuatro ramas superiores:

- `/login`: pantalla de login.
- `/cambiar-password`: cambio obligatorio para un admin con password temporal.
- `/super-admin`: layout exclusivo de la identidad `super_admin` con rol exacto.
- `/*`: layout autenticado.

Los hooks de `hooks/autenticacion/useSesion.js` conservan las lecturas locales
y decisiones de cada guard. El layout general lee `usuario` y después
`profesor` desde `localStorage`.

- Si existe `usuario` con rol `admin`, compone `NavAdminView`.
- Si no, compone `NavProfesorView`.
- Si no existe ningun usuario/profesor en sesion, redirige a `/login`.
- Una sesión válida monta después `TenantStatusBannerView` con la consulta de
  `useEstadoTenant`; los guards internos de rol y password conservan su orden.

## Autenticación, sesión y navegación

- `services/autenticacionApi.js` es la frontera de los cuatro contratos HTTP.
  Mensajes, almacenamiento, cookies, navegación y estado visual permanecen
  fuera del transporte.
- `utils/autenticacion/` concentra claves y limpieza diferenciada de logout y
  `401`, decisiones de guards, contratos del login y password, y árboles de
  navegación desktop.
- `hooks/autenticacion/` separa lectura/guards, consulta tenant y los tres
  comandos. El interceptor global de `401` permanece en `utils/api.js` porque
  pertenece al cliente HTTP compartido.
- `components/autenticacion/` recibe datos y acciones mediante props. Solo
  mantiene estado visual local para mostrar la contraseña y controlar los
  menús responsive.
- `pages/Login.jsx`, `pages/CambiarPassword.jsx` y los layouts privados de
  `App.jsx` son las raíces de composición. `App.jsx` conserva rutas, imports
  lazy, fallbacks y límites de `Suspense`.
- `components/planeaciones/NotificacionesPlaneadores.jsx` pertenece a
  planeaciones; autenticación conserva únicamente su integración estable por
  `rol` y `onNavigate`.
- Los conectores antiguos `LoginForm`, `NavAdmin`, `NavProfesor`,
  `NavSuperAdmin` y `TenantStatusBanner` fueron retirados después de confirmar
  que no tenían consumidores adicionales.

## Administración académica y horarios

- `/admin` monta `pages/Admin.jsx` como raíz de pestañas para Profesores,
  Cursos, Materias y Asignaciones, conservando carga diferida por dominio.
- `/admin/horarios` monta `pages/HorariosAdmin.jsx` y compone calendarios por
  profesor y curso.
- Ambas rutas permanecen bajo `AdminRoute`; permisos, navegación y textos no
  cambian.
- Las páginas conectan contenedores de `components/administracionAcademica/`;
  no realizan HTTP ni conservan implementaciones antiguas paralelas.

## Boletines

- `/boletin` monta `pages/Boletin.jsx` bajo `AdminRoute`; conecta la consulta
  administrativa con la selección y el documento imprimible.
- `/ingreso-boletin` monta `pages/IngresoBoletinProfesor.jsx` bajo
  `ProtectedRoute`; conecta consultas y comandos docentes con su vista.
- La pestaña `orden-boletin` de `/admin` carga `pages/OrdenBoletin.jsx` y
  conserva el orden configurable por curso.
- `services/boletinesApi.js` es la única frontera HTTP del módulo. Utilidades,
  hooks y componentes se separan bajo sus carpetas de dominio.
- Las páginas son raíces de composición y los componentes reciben datos y
  callbacks por props. No quedan conectores ni implementaciones legacy
  paralelas.
- El impreso conserva `DocumentoImprimible`, formato A4, identidad
  institucional y desplazamiento horizontal móvil.

## Estudiantes y observador

- `/admin/estudiantes` monta `pages/EstudiantesAdmin.jsx` bajo `AdminRoute` y
  conserva listado, filtros, formulario, cambio de estado y detalle parcial.
- `/Formulario` monta `pages/Formulario.jsx` bajo `ProtectedRoute` y conserva la
  planilla del observador asociada a la asignación y periodo activos.
- `services/estudiantesObservadorApi.js` es la única frontera HTTP del módulo;
  utilidades, hooks y componentes se separan bajo sus carpetas de dominio.
- `EstudiantesAdmin.jsx` y `Formulario.jsx` son raíces de composición.
  `components/estudiantesObservador/Observaciones.jsx` conecta el hook editable
  con alertas e impresión, y delega el formulario a presentación.
- Los componentes reciben datos y callbacks por props. No quedan componentes
  legacy ni implementaciones HTTP paralelas.
- El módulo conserva la diferencia contractual entre `id` administrativo y
  `estudiante_id` de planilla, el guardado parcial y el aislamiento entre
  estudiantes.
- Las tarjetas permanecen visibles sin exigir búsqueda, pero su consulta se
  activa progresivamente al acercarse al viewport. Un fallo se presenta como
  error recuperable y bloquea la edición hasta reintentar; nunca se interpreta
  como una observación pendiente.

## Certificados e impresión

- `/admin/certificados` monta `pages/CertificadosAdmin.jsx` bajo `AdminRoute` y
  conserva certificados de notas y matrícula, además del reporte académico
  parcial individual o por curso.
- `/admin/diseno-impresos` monta `pages/BrandingAdmin.jsx` bajo `AdminRoute` y
  conserva las pestañas de identidad institucional y plantillas con carga
  condicional por sección.
- Ambas páginas son raíces de composición. Conectan hooks con vistas
  controladas de `components/certificadosImpresion/` y no contienen transporte
  HTTP ni bloques visuales extensos.
- `services/certificadosImpresionApi.js` y `printingService.js` encapsulan el
  transporte; los hooks separan consultas, comandos y caché compartida, y las
  utilidades concentran filtros, normalización y construcción de reportes.
- `hooks/certificadosImpresion/usePrintConfig.js` es la implementación única de
  la caché compartida de impresión. Todos sus consumidores importan esa ruta
  directamente; no queda una reexportación histórica en la raíz de `hooks/`.
- `DocumentoImprimible` conserva branding, plantilla activa, firmas, pie,
  formato A4, desplazamiento horizontal móvil y ambos comandos basados en
  `window.print()`.
- No quedan adaptadores administrativos ni implementaciones antiguas paralelas
  de identidad, plantillas o vistas de certificados.

## Malla curricular

- `/planeador-anual` monta `pages/PlaneadorAnual.jsx` bajo `ProtectedRoute` y
  conserva la asignación seleccionada y el período persistido del profesor.
- La página es una raíz de composición: lee el contexto superior, conecta
  consultas y comandos, alterna impresión y entrega datos y callbacks a los
  componentes. No contiene transporte, payloads ni bloques visuales extensos.
- `services/mallaCurricularApi.js` es la única frontera HTTP del módulo para
  `/mis-clases` y `/planeador-anual`.
- `utils/mallaCurricular/planeadorAnual.js` conserva el contrato de ocho
  posiciones, el mapeo por `slot`, las validaciones contenido/fecha y el
  payload que permite la eliminación implícita de filas vaciadas.
- `hooks/mallaCurricular/` separa carga, período y descarte de respuestas
  antiguas del estado editable, validaciones, progreso, guardado y alertas.
- `components/mallaCurricular/` conserva tarjetas móviles, tabla de escritorio,
  estados, acciones, autoajuste de textareas y vista imprimible mediante props.
- No quedan llamadas HTTP directas, transformaciones ni implementaciones
  visuales antiguas paralelas en `PlaneadorAnual.jsx`.

## Cartera y tipos de pago

- `/admin/cartera-vencida` monta `pages/CarteraVencidaAdmin.jsx` y conserva
  KPIs, filtros, detalle expandible, CSV, navegación a Pagos e impresión A4 por
  estudiante o curso.
- `/admin/tipos-pagos` monta `pages/TiposPagosAdmin.jsx` y conserva creación y
  edición de conceptos, estados activo/inactivo/borrador, configuración de
  cobro y mora, y reemplazo de asignaciones por curso.
- Ambas rutas permanecen bajo `AdminRoute`. La navegación `Cobrar` conserva
  `/admin/pagos` con `{ state: { estudiante_id } }`; `PagosAdmin` no forma parte
  de este módulo.
- Las páginas son raíces de composición y conectan los hooks con
  `components/carteraTiposPago/`. Las vistas reciben datos y callbacks y no
  conocen servicios, rutas ni estado de dominio.
- `services/carteraTiposPagoApi.js` es la única frontera HTTP del módulo. Los
  hooks separan consultas, fallback, detalle, formularios y comandos; las
  utilidades concentran formatos, filtros, totales, CSV y payloads.
- `DocumentoImprimible` conserva identidad institucional, formato A4 y scroll
  horizontal móvil para los estados de cuenta.
- No queda el controlador anterior `components/cartera/AdministrarTiposPago`
  ni existen implementaciones HTTP o visuales paralelas.

## Pagos

- `/admin/pagos` monta `pages/PagosAdmin.jsx` bajo `AdminRoute` y conserva
  pagos normales de deudas o ventas, cuotas vencidas, abonos libres, adelantos
  por meses o monto, subsidios, métodos combinados, valores personalizados,
  historial, impresión y anulación.
- La página es la raíz de composición: lee sesión y `location.state`, conserva
  navegación, búsqueda e impresión activa, conecta siete hooks y entrega datos
  y callbacks a `components/pagos/`.
- `services/pagosApi.js` es la única frontera HTTP. Los hooks separan catálogos,
  consultas por estudiante, opciones de adelanto, formulario, valores
  personalizados, registro y anulación.
- `utils/pagos/` conserva contratos y transformaciones puras, incluidas
  normalización de opciones, cálculos en centavos y payloads diferentes para
  pago normal y adelantado.
- Los componentes presentacionales no conocen servicios. `FacturaModerna` vive
  dentro del dominio y `ComprobantePago` reutiliza el
  `components/impresion/DocumentoImprimible.jsx` compartido.
- No quedan llamadas HTTP, payloads, reglas financieras ni bloques visuales
  extensos en `PagosAdmin.jsx`; tampoco existe una implementación paralela del
  comprobante en `src/components/FacturaModerna.jsx`.

## Reportes financieros

- `/admin/reportes` monta `pages/ReportesAdmin.jsx` bajo `AdminRoute` (la
  página repite además su propio control de rol) y conserva el reporte
  general del día y acumulado, el movimiento de los últimos meses, la
  consulta por rango de fechas o por mes, y el detalle de ingresos con
  filtro por medio de pago o de egresos.
- El módulo es de solo lectura: no tiene formularios, comandos ni endpoints
  de escritura, por lo que su capa 4 (hooks de comandos) no aplica.
- La página es la raíz de composición: conecta `useReporteGeneral` y
  `useDetalleReportes` con `components/reportesFinancieros/` y conserva
  únicamente el control de acceso, el estado de carga inicial y las
  funciones que traducen una interacción en una llamada a los hooks.
- `services/reportesFinancierosApi.js` es la única frontera HTTP del módulo.
  Los hooks separan la consulta del reporte general (con su recarga al
  volver a la pestaña) de la consulta de detalle (validación de rango,
  filtro de medio de pago y scroll automático al resultado).
- `utils/reportesFinancieros/` interpreta medios de pago simples,
  combinados (unidos con `" + "` en `tipo_pago`) y con nota libre, incluida
  compatibilidad con variantes históricas de campos que el backend actual
  ya no envía. Cuando un pago combinado no trae monto por método, el total
  filtrado cae al monto completo del pago; es un comportamiento heredado y
  caracterizado, no un defecto introducido por la modularización.
- `hoyISO()` (fecha "hoy" en UTC) y `nombreMes()` (nombre de mes por
  parseo de fecha sin compensar zona horaria) tienen defectos de zona
  horaria preexistentes, documentados y deliberadamente sin corregir en
  `docs/modularizacion/REPORTES_FINANCIEROS.md`.
- No quedan llamadas HTTP directas en la página ni en los componentes, y no
  existe una implementación paralela de `reportesMediosPago.js` fuera de
  `utils/reportesFinancieros/mediosPago.js`.

## Inventario y ventas

- `/admin/inventario` monta `pages/InventarioAdmin.jsx` y conserva el filtro
  activo/inactivo/todos, el alta y edición de productos, la utilidad y el margen
  recibidos del backend, y el cambio de estado con confirmación.
- `/admin/ventas` monta `pages/VentasAdmin.jsx` y conserva el catálogo vendible,
  el carrito limitado por existencias, el cargo a crédito sobre un estudiante,
  el historial por estudiante, la anulación con motivo y el volante imprimible.
- Ambas rutas permanecen bajo `AdminRoute`. Ninguna recibe parámetros de ruta.
- Las páginas son raíces de composición de 44 y 66 líneas y conectan los hooks
  con `components/inventarioVentas/`. Las vistas reciben datos y callbacks y no
  conocen servicios ni estado de dominio.
- `services/inventarioVentasApi.js` es la única frontera HTTP del módulo y
  concentra sus ocho contratos. `GET /estudiantes` se consume desde allí en modo
  lectura, con el mismo criterio que ya aplican `pagosApi.js` y
  `carteraTiposPagoApi.js` con endpoints compartidos.
- Los hooks separan la consulta del catálogo, las tres consultas paralelas de la
  caja, el formulario de producto, el carrito y la anulación. Las utilidades
  concentran payloads, filtros, totales y reglas de clase puras.
- Cambiar el estado de un producto actualiza la lista en memoria y descarta las
  filas que dejan de cumplir el filtro, sin volver a consultar.
- `DocumentoImprimible` conserva el volante con `tipo="volante_venta"`.
- El módulo no adopta las capacidades de paginación y búsqueda que el backend ya
  ofrece en `/inventario` y `/api/ventas/`: siguen sin usarse, como antes.
- No quedan llamadas HTTP, payloads ni bloques visuales extensos en las dos
  páginas, ni implementaciones visuales paralelas.

## Nómina, egresos y préstamos

- `/admin/nomina` monta `pages/NominaAdmin.jsx` y conserva el estado de cuenta
  de todo el personal, el historial de pagos que solo se muestra al buscar un
  nombre, y el modal que precarga el sueldo del profesor como salario base.
- `/admin/egresos` monta `pages/EgresosAdmin.jsx` y conserva la consulta inicial
  del día, el filtro por rango de fechas, el total del rango visible, el alta y
  edición manual, y la distinción entre egreso manual y automático.
- `/admin/prestamos` monta `pages/PrestamosAdmin.jsx` y conserva que el historial
  solo se consulta al elegir un profesor, el alta con confirmación y la acción
  `Saldar`.
- Las tres rutas permanecen bajo `AdminRoute`. Ninguna recibe parámetros de ruta.
- Las páginas son raíces de composición de 64, 62 y 60 líneas y conectan los
  hooks con `components/nominaEgresosPrestamos/`. Solo importan React, sus
  componentes y sus hooks.
- `services/nominaEgresosPrestamosApi.js` es la única frontera HTTP del módulo y
  concentra sus diez contratos. `GET /profesores` se consume desde allí en modo
  lectura, con el mismo criterio que ya aplican `pagosApi.js` y
  `inventarioVentasApi.js` con endpoints compartidos.
- El acoplamiento entre los tres subflujos es del backend, no del frontend:
  `POST /api/nomina/pagar` abona los préstamos pendientes del profesor y crea un
  egreso automático dentro de la misma transacción. Las tres pantallas son
  independientes entre sí y no comparten estado ni componentes.
- Registrar un egreso mueve el filtro al día registrado; actualizarlo conserva el
  rango vigente.
- El módulo no adopta las capacidades que el backend ya ofrece y el frontend
  nunca usó: préstamos sin `profesor_id`, egresos con fechas nulas y los dos
  `DELETE` que responden `405` para recordar que estos registros no se eliminan.
- Nómina y préstamos formatean montos con `valor.toFixed(2)` y egresos con
  `Number(valor || 0).toFixed(2)`. La diferencia es previa a la migración y se
  conserva: unificarla cambiaría el comportamiento de una de las pantallas.
- No quedan llamadas HTTP, payloads ni bloques visuales extensos en las tres
  páginas, ni implementaciones visuales paralelas.

## Dashboards y rankings

- `/` monta `pages/DashboardProfesor.jsx` bajo `ProtectedRoute` y conserva el
  contexto de trabajo del profesor —clase, período y fecha—, el horario semanal
  por jornada, el filtro de rendimiento por curso y materia, y las tarjetas de
  inasistencias, bajo rendimiento y mejores estudiantes.
- `/dashboard-admin` monta `pages/AdminDashboard.jsx` bajo `AdminRoute` y
  conserva la tarjeta de cartera vencida, los cuatro accesos principales y los
  cumpleaños de la semana.
- `/ranking-rendimiento` y `/ranking-mejor-rendimiento` montan las dos pantallas
  de ranking bajo `ProtectedRoute`. Solo se alcanzan desde el panel del profesor
  y leen su `asignacionId` y su período del almacenamiento local.
- `/super-admin` monta `pages/SuperAdminDashboard.jsx` bajo `SuperAdminRoute`,
  fuera del `Layout` común, con el resumen por estado, la tabla de tenants, el
  alta de colegios y el cambio de estado con motivo y auditoría.
- Las cinco páginas son raíces de composición de 58, 168, 63, 41 y 41 líneas.
  Importan solo `react-router-dom`, sus componentes, sus hooks y las constantes
  de las rutas a las que navegan.
- `services/dashboardsApi.js` es la única frontera HTTP del módulo y concentra
  sus catorce contratos. `GET /mis-clases/:id`, `GET /plan-de-clases/:id` y
  `GET /cartera/mora/resumen` se consumen desde allí en modo lectura: el módulo
  posee su transporte en lugar de reutilizar el de planeaciones y cartera, con
  el mismo criterio que ya aplican `pagosApi.js` e `inventarioVentasApi.js`.
- Cada sección tiene su propio hook, su propio indicador de carga y su propio
  manejo de error, de modo que el fallo de una no bloquea a las demás. Es la
  invariante central del módulo.
- El panel del profesor escribe `asignacionId` y `fechaAsistencia` en el
  almacenamiento local; son el contrato de contexto que leen asistencia,
  planilla, boletines y planeaciones. El período viaja por
  `utils/periodoProfesor.js`, utilidad transversal que el módulo no modifica.
- El selector de clases deduplica por curso y materia; el horario semanal, en
  cambio, conserva cada franja. La jornada se deduce del texto recibido y, si no
  lo trae, de la hora de inicio con el corte en las 12:30.
- Las planeaciones recientes se cachean por asignación durante la vida de la
  página; una planeación creada en otra pantalla no aparece hasta recargarla.
- El módulo no adopta las capacidades que el backend ofrece y el frontend nunca
  usó: un rango de cumpleaños distinto de siete días, el parámetro `fecha` y el
  `limit` de hasta cincuenta de las planeaciones, ni las consultas de
  rendimiento sin `curso_id`.
- Cada sección distingue el fallo de red del dato en cero: los hooks de clases,
  cartera, inasistencias, rendimiento, cumpleaños, planeaciones, rankings y
  tenants publican su error como estado y sus componentes lo pintan con paleta
  propia. Ninguna pantalla del módulo muestra un estado vacío cuando en realidad
  la consulta falló.
- Toda consulta del módulo descarta las respuestas superadas: los hooks numeran
  cada petición y solo la vigente aplica su resultado, su error y su indicador de
  carga. Así, cambiar de curso o pulsar `Actualizar` dos veces seguidas no puede
  dejar visible el resultado de la consulta anterior.
- No quedan llamadas HTTP, payloads ni bloques visuales extensos en las cinco
  páginas, ni implementaciones visuales paralelas.

## Criterios de UX responsive

- Los ajustes moviles se concentran en clases responsive de Tailwind y en
  `src/styles/print.css`.
- En documentos imprimibles, la regla general es:
  - documentos comunes se adaptan al ancho de pantalla;
  - boletin, certificados y cartera mantienen formato A4 (`210mm`) y usan
    scroll horizontal en movil.
- `DocumentoImprimible` es el punto de entrada para toolbar, branding,
  encabezado, firmas, pie de pagina y comportamiento especial por documento.
- `NavAdminView` mantiene grupos colapsables en movil para reducir ruido visual y
  diferenciar subpestanas de enlaces principales.
- `NavAdminView` marca etiquetas sensibles como `Nómina` con `translate="no"` para
  evitar traducciones automaticas en Android/Chrome.
- `NavProfesorView` mantiene grupos moviles para control academico y planeacion.
- `Planilla` usa vista de tarjetas en movil y tabla en escritorio; las etiquetas
  tecnicas se formatean y se protegen con `translate="no"`.
- `IngresoBoletinProfesor` reutiliza el criterio de planilla: oculta notas
  internas y evita traduccion automatica de tipos de nota.
- `Asistencia` muestra estados de carga/reintento para historial y aviso cuando
  la asistencia de la fecha ya fue tomada.
- `Observaciones` activa consultas al acercar cada tarjeta al viewport, acota la
  verificación inicial y ofrece reintento visible cuando no puede recuperar el
  registro guardado.
- `EstudiantesAdmin` mantiene el observador dentro del modal de detalle; la UI
  movil usa tarjetas apiladas y la UI de escritorio conserva disposicion amplia.

## Convenciones actuales

- Para textos guardados por usuarios o etiquetas academicas que no deben ser
  traducidas por el navegador, usar `translate="no"`.
- Las columnas internas o tecnicas, como `mas_alto`, no deben mostrarse al
  usuario final.
- Las mejoras moviles deben conservar la experiencia de escritorio salvo que el
  cambio sea explicitamente solicitado para ambas vistas.
- Los documentos imprimibles que representan formatos A4 deben conservar ancho
  fijo y usar scroll horizontal en pantalla movil.
- **Un dato que consumen dos modulos no se copia: se comparte.** Va a
  `src/constants/` si es una constante, o a la raiz de `src/utils/` si es un
  contrato puro. Un modulo nunca importa de `utils/<otro-modulo>/`.

### Por que existe esa regla

La organizacion por modulos hace que copiar cuatro lineas se sienta mas limpio
que compartirlas. Es barato el dia uno y se cobra meses despues.

`VALORACIONES_DESARROLLO` llego a estar declarada **tres veces**: en
`constants/valoracionesDesarrollo.js`, en `utils/boletines/ingresoBoletin.js` y
en `utils/boletines/generacionBoletin.js`. Alguien mejoro la etiqueta de `apoyo`
en unas copias y no en otras, y durante meses el profesor leyo "Requiere apoyo"
en la planilla mientras el acudiente leia "Requiere acompanamiento" en el
boletin del mismo estudiante. Nadie lo noto porque son pantallas distintas.

Una copia duplicada no falla el dia que se crea. Falla cuando alguien cambia una
sola, y no falla con error: falla mostrando cosas distintas en pantallas
distintas.

Precedentes de dato compartido resuelto bien: `src/utils/periodoProfesor.js`,
usado por seis modulos, y `src/utils/valoracionesDesarrollo.js`, usado por
boletines y planilla.

## Build

Los scripts actuales de `package.json` son:

- `pnpm run dev`: inicia Vite.
- `pnpm run build`: ejecuta `vite build`.
- `pnpm run lint`: ejecuta ESLint.
- `pnpm run test`: ejecuta una vez las pruebas automáticas con Vitest.
- `pnpm run check:deploy`: ejecuta pruebas, lint y build.
- `pnpm run preview`: sirve el build con Vite preview.

El proyecto fuerza el uso de pnpm mediante scripts `preinstall`, `predev`,
`prebuild`, `prelint`, `pretest` y `prepreview`.

## Pruebas del frontend

- Vitest reutiliza la configuración de Vite y ejecuta componentes sobre JSDOM.
- React Testing Library comprueba el comportamiento visible y las acciones del
  usuario sin depender de la estructura interna de los componentes.
- `src/test/setup.js` registra los matchers de interfaz y limpia el DOM después
  de cada caso.
- `src/pages/PlanDeClases.test.jsx` simula la API y SweetAlert2 para verificar
  guardado, control de versión, desconexión y reintento sin conectarse a un
  tenant real.
- `src/utils/planeaciones/profesor.test.js` y
  `src/utils/planeaciones/admin.test.js` protegen las transformaciones puras
  extraídas antes de continuar con servicios, hooks y componentes.
- `src/services/planeacionesApi.test.js` verifica rutas, parámetros, payloads,
  configuración multipart, señales de cancelación y propagación de errores del
  contrato HTTP.
- Los tests de `src/hooks/planeaciones/` comprueban paginación, aislamiento
  entre selecciones, lectura de observaciones, recargas de notificaciones y
  ciclo de vida de blobs sin renderizar la página completa.
- Las pruebas adyacentes de `NotificacionesPlaneadoresVista`, contratos de
  notificaciones e imágenes protegen presentación, rutas, agrupación y
  normalización sin transporte ni estado de React.
- Los hooks de formulario y carga diaria separan el estado editable de la
  consulta remota. Sus pruebas protegen recuperación local, mapeo de planes,
  errores y descarte de respuestas obsoletas.
- `useGuardadoPlaneacionProfesor` encapsula el comando de guardado y sus
  recuperaciones. La construcción del multipart permanece como utilidad pura
  comprobable y el servicio conserva el transporte HTTP.
- Seguimiento, comentarios e historial del profesor se renderizan desde
  componentes sin acceso a servicios. La página y los hooks les entregan datos
  y acciones mediante props.
- La guía editable del profesor sigue el mismo límite: sus campos y evidencias
  viven en componentes presentacionales, mientras `PlanDeClases.jsx` conserva
  únicamente la coordinación con formulario, carga y guardado.
- Las pruebas de `GuiaDidacticaProfesor` cubren el estado de carga, la edición,
  la apertura de la presentación y la eliminación de evidencias guardadas.
- `PresentacionClaseProfesor` encapsula la vista en portal y sus efectos
  exclusivamente visuales. No conoce endpoints ni actualiza el estado del
  planeador; recibe contenido y acciones desde la página y reutiliza el hook
  compartido de imágenes protegidas.
- Sus pruebas protegen renderizado condicional, cierre accesible, restauración
  del documento y resolución de evidencias locales o protegidas.
- Encabezado y configuración del planeador son componentes controlados: reciben
  valores y acciones de la página y no sincronizan por sí mismos URL,
  almacenamiento ni consultas.
- `obtenerEstadoGuardadoVisual` mantiene en una utilidad pura la representación
  compartida por el encabezado y la acción de guardado. Las pruebas comprueban
  sus cuatro estados y las interacciones de los selectores.
- `GuardadoPlanProfesor` representa el comando sin implementarlo: renderiza el
  estado y delega la acción recibida. El hook de guardado conserva validaciones,
  transporte, conflictos de versión y recuperación de conectividad.
- Sus pruebas de componente cubren disponibilidad, progreso y mensajes; las
  pruebas de página y hook mantienen la cobertura del flujo completo.
- El flujo del profesor cierra su separación con hooks para clases, seguimiento
  y eliminación de evidencias. Cada comando remoto queda detrás de un servicio
  y un hook; `PlanDeClases.jsx` no importa transporte HTTP.
- La página funciona como raíz de composición y conserva únicamente estado
  local de pantalla, conexión entre contratos y renderizado de componentes.
- Las pruebas adicionales verifican deduplicación y persistencia de clases,
  normalización y lectura del seguimiento, enlaces profundos y eliminación
  sincronizada de imágenes.
- `useListadoPlaneacionesAdmin` encapsula el estado de la bandeja, URL, debounce
  y consultas cancelables. La página administrativa recibe datos y acciones
  sin conocer los servicios de listado.
- Sus pruebas cubren paginación restaurada desde URL, carga de profesores,
  conteos pendientes, filtros, búsqueda diferida y errores de consulta.
- `useDetallePlaneacionAdmin` coordina plan, comentarios y decisiones de
  revisión, incluyendo recuperación ante conflicto y descarte de respuestas
  antiguas.
- `useEliminacionImagenPlaneacionAdmin` mantiene el borrado de evidencias como
  comando aislado. La página administrativa ya no importa el servicio HTTP.
- Las pruebas de ambos hooks protegen cargas, actualizaciones locales,
  notificaciones, errores, conflictos y confirmaciones destructivas.
- El encabezado temporal y los filtros administrativos son componentes
  controlados. Reciben estado y acciones desde la página, sin conocer URL,
  consultas ni servicios.
- Badges, mensajes y spinners del módulo administrativo se comparten desde
  `components/planeaciones/admin/ElementosPlaneacionAdmin.jsx`.
- Las pruebas de estos componentes protegen selección temporal, profesor,
  estados, contador pendiente, mensajes accesibles y carga.
- `ResultadosPlaneacionesAdmin` concentra la presentación completa del
  historial: búsqueda, tabla, tarjetas móviles, estados y paginación. Recibe
  datos y acciones desde la página y no conoce servicios, URL ni navegación.
- Sus pruebas cubren selección guiada, búsqueda controlada, prioridad de
  estados, renderizado responsive, apertura y límites de paginación.
- `DetallePlaneacionAdmin` concentra carga, fallo, reporte pedagógico,
  decisiones de revisión, historial y evidencias. Recibe datos y comandos
  mediante props y reutiliza el hook compartido de imágenes protegidas.
- `PlaneadoresClasesAdmin.jsx` funciona como raíz de composición: selecciona
  bandeja o detalle, conecta los hooks con los componentes y conserva la
  navegación. No contiene transporte HTTP ni bloques visuales extensos.
- Las pruebas del detalle protegen estados de apertura, contenido, edición,
  aprobación, solicitudes de ajuste, trazabilidad y evidencias.
- `src/pages/Asistencia.test.jsx` conserva la caracterización integrada de
  carga, marcación, pendientes, edición, guardado y reintento.
- `src/utils/asistencia/profesor.test.js` y
  `src/services/asistenciaApi.test.js` protegen transformaciones, payload, rutas,
  señales de cancelación y propagación de errores del módulo.
- Los hooks de `src/hooks/asistencia/` separan consultas cancelables y comandos
  editables. Sus pruebas cubren respuestas obsoletas, reintento, errores,
  hidratación, confirmaciones y bloqueo de guardados simultáneos.
- Los componentes de `src/components/asistencia/` reciben datos y acciones por
  props. Sus pruebas protegen estados de historial, resumen, filas, vacío,
  aviso de edición y barra de guardado.
- `Asistencia.jsx` funciona como raíz de composición: lee el contexto superior,
  conserva navegación y conecta ambos hooks con componentes presentacionales.
- `src/pages/Planilla.test.jsx` conserva la caracterización integrada de
  carga, guardado y limpieza de notas, rechazo de notas fuera de rango, alta
  y baja de tipos de evaluación y valoraciones de desarrollo.
- `src/utils/planilla/notas.test.js` y `src/services/planillaApi.test.js`
  protegen transformaciones, el payload de nota, rutas, señales de
  cancelación y propagación de errores del módulo.
- Los hooks de `src/hooks/planilla/` separan consultas cancelables de
  comandos editables. Sus pruebas cubren respuestas obsoletas, delegación de
  clase no disponible, guardado optimista, validación de rango y bloqueo de
  acciones de tipo simultáneas.
- Los componentes de `src/components/planilla/` reciben datos y acciones por
  props. Sus pruebas protegen límites del input numérico, valoraciones de
  desarrollo, estados deshabilitado/progreso y el estado vacío.
- `Planilla.jsx` funciona como raíz de composición de 127 líneas: lee el
  contexto superior, conserva navegación y conecta ambos hooks con
  componentes presentacionales, sin transporte, comandos ni bloques
  visuales propios.
- Las pruebas de `src/components/administracionAcademica/`,
  `src/hooks/administracionAcademica/`, sus cinco servicios y utilidades
  protegen contratos, consultas, comandos y presentación. `Admin.test.jsx` y
  `HorariosAdmin.test.jsx` protegen las dos raíces de composición.
- Las pruebas de `src/utils/boletines/`, `src/services/boletinesApi.test.js`,
  `src/hooks/boletines/`, `src/components/boletin/` y sus tres páginas protegen
  cálculos, payloads, cancelación, comandos, presentación e integración. La
  prueba de `Admin` incluye la composición de la pestaña de orden.
- Las pruebas de `src/utils/certificadosImpresion/`, servicios, hooks, vistas,
  `DocumentoImprimible`, `CertificadosAdmin` y `BrandingAdmin` protegen
  contratos HTTP, consolidación académica, cancelación, caché, comandos,
  presentación A4 y composición por pestañas.
- Las pruebas de `src/utils/carteraTiposPago/`,
  `src/services/carteraTiposPagoApi.test.js`, los cinco hooks, las dos vistas y
  `CarteraVencidaAdmin`/`TiposPagosAdmin` protegen transformaciones, contratos
  HTTP, fallback, filtros, comandos, impresión y composición del módulo.
- Las pruebas de `src/utils/inventarioVentas/`,
  `src/services/inventarioVentasApi.test.js`, los cinco hooks, las tres vistas y
  `InventarioAdmin`/`VentasAdmin` protegen contratos HTTP, payloads, filtro por
  estado, actualización local sin recarga, tope de existencias del carrito,
  cargo a crédito, anulación con motivo y el volante imprimible.
- Las pruebas de `src/utils/nominaEgresosPrestamos/`,
  `src/services/nominaEgresosPrestamosApi.test.js`, los seis hooks, los siete
  componentes y `NominaAdmin`/`EgresosAdmin`/`PrestamosAdmin` protegen los diez
  contratos HTTP, el cálculo del neto y sus dos bloqueos previos al pago, el
  modal que sobrevive a un error, el filtro del historial de nómina, el salto del
  filtro de egresos a la fecha registrada, el rechazo del rango invertido, la
  distinción manual/automático, la ausencia de consulta inicial de préstamos y
  el saldado con su recarga.
- Las pruebas de `src/utils/dashboards/`,
  `src/services/dashboardsApi.test.js`, los once hooks, los catorce componentes
  y las cinco caracterizaciones de página protegen los catorce contratos HTTP,
  los cuatro guardianes de acceso, la independencia de cada sección ante un
  fallo, la deduplicación del selector de clases, la agrupación del horario por
  jornada con su filtro, la persistencia del contexto de trabajo y el descarte de
  la clase obsoleta, la caché de planeaciones recientes, el escapado del
  historial de auditoría y las siete validaciones del alta de colegios.
- Las pruebas de `src/utils/autenticacion/`,
  `src/services/autenticacionApi.test.js`, los cinco hooks, las seis vistas,
  `Login`, `CambiarPassword` y las dos caracterizaciones de `App` protegen los
  contratos HTTP, almacenamiento, guards, rutas, comandos, textos, responsive,
  integración de notificaciones y composición por rol.
- Las pruebas de `src/utils/pagos/`, `src/services/pagosApi.test.js`, los siete
  hooks, los seis componentes y `PagosAdmin.test.jsx` protegen formatos,
  cálculos, payloads, transporte, consultas, comandos, presentación,
  autorización, navegación y los flujos normal y adelantado.
