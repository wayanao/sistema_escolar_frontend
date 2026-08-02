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
- `src/components/admin/`: componentes administrativos de branding/plantillas.
- `src/components/boletin/`: vistas presentacionales de generación,
  impresión, ingreso docente y orden del módulo de boletines.
- `src/components/cartera/`: componentes del modulo de cartera.
- `src/components/impresion/`: componentes de documentos imprimibles.
- `src/components/asistencia/`: componentes presentacionales del flujo docente
  de asistencia, sin acceso a hooks ni transporte HTTP.
- `src/components/administracionAcademica/`: componentes y contenedores de
  asignaciones, profesores, cursos, materias y horarios, separados por dominio.
- `src/components/planeaciones/admin/`: componentes presentacionales de la
  bandeja administrativa y elementos visuales compartidos de revisión.
- `src/components/planeaciones/profesor/`: componentes presentacionales del
  flujo docente de planeaciones.
- `src/constants/`: constantes compartidas entre paginas/componentes.
- `src/hooks/`: hooks propios del frontend.
- `src/hooks/asistencia/`: consultas cancelables y comandos del flujo docente
  de asistencia, separados entre estado remoto y marcación editable.
- `src/hooks/boletines/`: consultas cancelables y comandos editables de
  generación administrativa, ingreso docente y orden de materias.
- `src/hooks/administracionAcademica/`: consultas cancelables, formularios y
  comandos de administración académica; Horarios conserva dos consultas de
  solo lectura independientes.
- `src/hooks/planeaciones/`: estado y efectos reutilizables del módulo de
  planeaciones, separados de la presentación.
- `src/pages/`: paginas principales de la aplicacion.
- `src/services/`: fronteras HTTP del frontend. Los servicios encapsulan rutas
  y configuración de transporte, devuelven datos y no administran estado de
  React ni decisiones de interfaz.
- `src/services/planeacionesApi.js`: contrato HTTP compartido por los flujos de
  planeaciones del profesor y del administrador.
- `src/services/asistenciaApi.js`: contrato HTTP de planilla, clases, historial
  y guardado de asistencia del profesor.
- `src/services/boletinesApi.js`: contrato HTTP de cursos, estudiantes,
  generación, referencia y guardado docente y orden de materias.
- `src/services/asignacionesApi.js`, `profesoresApi.js`, `cursosApi.js`,
  `materiasApi.js` y `horariosApi.js`: contratos HTTP de administración
  académica y horarios.
- `src/styles/`: estilos globales adicionales.
- `src/utils/`: utilidades compartidas, incluyendo cliente API.
- `src/utils/planeaciones/`: contratos puros del dominio, separados por perfil
  y acompañados por sus pruebas unitarias.
- `src/utils/planeaciones/profesor.js` y `src/utils/planeaciones/admin.js`:
  contratos y transformaciones puras del módulo de planeaciones. No realizan
  solicitudes, no acceden al DOM y no administran estado de React.
- `src/utils/asistencia/`: contratos y transformaciones puras de asistencia,
  incluidas fechas, historial, resumen, cambios, marcación masiva y payload.
- `src/utils/boletines/`: contratos y transformaciones puras de generación,
  ingreso docente y orden de materias, con pruebas adyacentes.
- `src/utils/administracionAcademica/`: contratos, validaciones, payloads,
  filtros, estados y transformaciones puras del módulo académico.

## Entrada de la aplicacion

`src/main.jsx` renderiza:

- `BrowserRouter`
- `App`

`src/App.jsx` carga varias paginas con `React.lazy` y usa `Suspense` con un loader simple de texto `Cargando...`.

## Layout principal

La aplicacion tiene una ruta superior:

- `/login`: pantalla de login.
- `/*`: layout autenticado.

El layout autenticado lee `usuario` y `profesor` desde `localStorage`.

- Si existe `usuario` con rol `admin`, muestra `NavAdmin`.
- Si no, muestra `NavProfesor`.
- Si no existe ningun usuario/profesor en sesion, redirige a `/login`.

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

## Criterios de UX responsive

- Los ajustes moviles se concentran en clases responsive de Tailwind y en
  `src/styles/print.css`.
- En documentos imprimibles, la regla general es:
  - documentos comunes se adaptan al ancho de pantalla;
  - boletin, certificados y cartera mantienen formato A4 (`210mm`) y usan
    scroll horizontal en movil.
- `DocumentoImprimible` es el punto de entrada para toolbar, branding,
  encabezado, firmas, pie de pagina y comportamiento especial por documento.
- `NavAdmin` mantiene grupos colapsables en movil para reducir ruido visual y
  diferenciar subpestanas de enlaces principales.
- `NavAdmin` marca etiquetas sensibles como `Nómina` con `translate="no"` para
  evitar traducciones automaticas en Android/Chrome.
- `NavProfesor` mantiene grupos moviles para control academico y planeacion.
- `Planilla` usa vista de tarjetas en movil y tabla en escritorio; las etiquetas
  tecnicas se formatean y se protegen con `translate="no"`.
- `IngresoBoletinProfesor` reutiliza el criterio de planilla: oculta notas
  internas y evita traduccion automatica de tipos de nota.
- `Asistencia` muestra estados de carga/reintento para historial y aviso cuando
  la asistencia de la fecha ya fue tomada.
- `Observaciones` acota la verificacion inicial para evitar estados
  `Verificando` indefinidos en conexiones moviles lentas.
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
  entre selecciones y lectura de observaciones sin renderizar la página
  completa.
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
- Las pruebas de `src/components/administracionAcademica/`,
  `src/hooks/administracionAcademica/`, sus cinco servicios y utilidades
  protegen contratos, consultas, comandos y presentación. `Admin.test.jsx` y
  `HorariosAdmin.test.jsx` protegen las dos raíces de composición.
- Las pruebas de `src/utils/boletines/`, `src/services/boletinesApi.test.js`,
  `src/hooks/boletines/`, `src/components/boletin/` y sus tres páginas protegen
  cálculos, payloads, cancelación, comandos, presentación e integración. La
  prueba de `Admin` incluye la composición de la pestaña de orden.
