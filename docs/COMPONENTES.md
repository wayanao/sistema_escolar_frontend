# Componentes

Estado actual de componentes y paginas del frontend.

## Componentes principales

- `LoginForm.jsx`: formulario de acceso; consume `/login`.
- `NavAdmin.jsx`: menu principal para usuario admin; en movil agrupa secciones,
  usa etiquetas principales mas legibles, muestra solo la marca mas visible en
  un encabezado compacto y protege etiquetas como `Nómina` con `translate="no"`.
- `NavProfesor.jsx`: menu principal para profesor; en movil separa control
  academico y planeacion, con etiquetas principales mas legibles y encabezado
  compacto con solo la marca visible.
- `DesktopAnimatedNav.jsx`: nav compartido de escritorio para admin/profesor;
  usa indicador animado medido por elemento activo/hover, sin depender de
  `nth-child` ni de una cantidad fija de pestañas. Las pestañas principales de
  escritorio usan `15px` para mejorar lectura.
- `NavSuperAdmin.jsx`: menu principal para super admin de plataforma.
- `TenantStatusBanner.jsx`: aviso global cuando el backend marca el tenant como `en_mora`.
- `ImagenProtegida.jsx`: carga imagenes protegidas usando el cliente `api` y `responseType: "blob"`.
- `AsignarClase.jsx` y `AsignarClaseGrid.jsx`: asignacion de clases.
  `AsignarClase.jsx` no selecciona un curso por defecto al cargar; el admin
  debe escoger `Seleccionar curso` para fijar el contexto de trabajo.
- `CrearCurso.jsx`: creacion/gestion relacionada con cursos.
- `CrearEstudiante.jsx`: creacion/gestion relacionada con estudiantes.
- `CrearMateria.jsx`: creacion/gestion relacionada con materias.
- `CrearProfesor.jsx`: creacion/gestion relacionada con profesores.
- `OrdenBoletin.jsx`: orden responsive de materias por curso para impresion
  de boletines.
- `HorariosProfesores.jsx`: vista de horarios por profesor.
- `HorariosPorCurso.jsx`: vista de horarios por curso.
- `FacturaModerna.jsx`: componente de factura.
- `PlanillaRow.jsx`: fila de planilla.
- `AsistenciaRow.jsx`: fila de asistencia; muestra botones presente/ausente y
  contador de inasistencias cuando el historial ya cargo.
- `Observaciones.jsx`: manejo de observaciones; su verificacion inicial usa
  cancelacion con tiempo limite para no dejar el badge en `Verificando`
  indefinidamente.
- `ReporteEstudiante.jsx`: reporte individual de estudiante.
- `dashboard/CumpleanosSemana.jsx`: panel reutilizable para mostrar cumpleaños
  de estudiantes de los proximos 7 dias en dashboards con estados de carga,
  error y lista vacia.

## Dashboard admin

- `pages/AdminDashboard.jsx`: panel inicial del perfil admin en
  `/dashboard-admin`.
- El encabezado saluda con `Hola`, primer nombre del admin en negrita y una
  frase corta de inicio de labor al lado del nombre.
- La card destacada de cartera mantiene su presencia visual original.
- Las cards principales de pagos, estudiantes, gestion academica y reportes son
  accesos compactos con fondo tintado, franja lateral de color, burbuja visual
  suave y elevacion en hover/focus.
- Debajo de las cards muestra `Cumpleaños de la semana` consumiendo
  `/dashboard/cumpleanos/admin?dias=7`.
- La animacion respeta `prefers-reduced-motion` y no cambia rutas, permisos ni
  carga de datos.
- Este cambio no aplica al dashboard profesor ni a la pagina academica
  `pages/Admin.jsx`.

## Dashboard profesor

- `pages/DashboardProfesor.jsx`: panel inicial del perfil profesor.
- El encabezado saluda con `Hola`, primer nombre del profesor en negrita y una
  frase corta para iniciar la jornada docente al lado del nombre.
- Muestra `Cumpleaños de la semana` con estudiantes activos de cursos
  asignados al profesor, consumiendo
  `/dashboard/cumpleanos/profesor/{profesor_id}?dias=7`.
- Carga `GET /mis-clases/{profesor_id}` una sola vez y reutiliza esa respuesta
  para selector de clases y horario semanal.
- La pantalla ya no depende de un `loading` global. Cada bloque muestra su
  propio estado de carga:
  - horario/clases;
  - ranking de inasistencias;
  - rendimiento bajo y alto.
- Las consultas de rendimiento bajo y alto se ejecutan en paralelo cuando hay
  curso seleccionado.

## Planilla de notas profesor

- `pages/Planilla.jsx`: pantalla de captura y gestion de notas del perfil
  profesor.
- En escritorio conserva la tabla tradicional con estudiantes en filas, tipos
  de evaluacion en columnas y promedio al final, con color verde desde `3.0` y
  rojo por debajo de `3.0`.
- En movil usa tarjetas por estudiante para evitar que el nombre y las columnas
  queden comprimidos. Cada tarjeta lista los tipos de evaluacion de forma
  vertical.
- En calificacion numerica, la vista movil usa inputs de ancho completo con
  `inputMode="decimal"` para facilitar captura desde teclado movil.
- El promedio de cada tarjeta movil se pinta verde desde `3.0` y rojo por
  debajo de `3.0`.
- Al guardar una nota numerica, la tarjeta movil recalcula el promedio local
  mientras la planilla se sincroniza con el backend.
- La captura numerica normaliza coma decimal de teclado movil a punto para que
  el calculo local y el envio al backend usen el mismo valor.
- En desarrollo infantil, reutiliza las opciones compartidas desde
  `constants/valoracionesDesarrollo.js` y muestra botones tactiles con
  etiqueta humana.
- La planilla marca nombres, etiquetas e inputs con `translate="no"` para
  reducir traducciones automaticas del navegador sobre textos guardados por el
  profesor.
- Oculta columnas internas como `mas_alto` para que no aparezcan como tipos de
  nota reales.

## Asistencia profesor

- `pages/Asistencia.jsx`: pantalla para registrar asistencia por fecha,
  asignacion y periodo.
- Carga estudiantes desde `GET /planilla-excel/{asignacion_id}/{periodo}`.
- Carga historial desde `GET /asistencia/historial/{asignacion_id}/{periodo}`
  con estado visual de carga, reintento corto y mensaje de error con accion
  `Reintentar`.
- El historial se organiza en un mapa por estudiante para que el conteo de
  inasistencias no dependa de busquedas repetidas durante el render.
- Si existe registro para la fecha seleccionada, muestra aviso
  `Asistencia del día ya tomada`, precarga los botones presente/ausente y cambia
  el boton principal a `Actualizar Asistencia`.
- Mientras el historial esta cargando, las filas muestran
  `Cargando historial...` en lugar de un contador provisional.

## Plan de clases profesor

- `pages/PlanDeClases.jsx`: pantalla de elaboracion diaria de planes de clase
  del perfil profesor.
- Mantiene el guardado existente hacia `POST /plan-de-clases` con los mismos
  campos y evidencia visual opcional.
- La interfaz se organiza como taller docente: contexto de clase, estado de
  guardado, guia didactica y evidencias.
- Los planes recientes permiten cambiar a una fecha ya guardada o usar un plan
  anterior como base local para una nueva planeacion.
- Los apoyos laterales de plantillas rapidas e ideas para enriquecer fueron
  retirados temporalmente; el trabajo futuro es sugerir contenido desde la
  Malla Curricular de la asignacion y periodo.

## Planeadores admin

- `pages/PlaneadoresClasesAdmin.jsx`: bandeja administrativa de planes enviados
  por profesores.
- Consume `GET /admin/plan-de-clases` con filtros de profesor, fechas y
  busqueda, ademas de `limit` y `offset` para paginacion.
- Muestra resumen operativo de total, elementos cargados y envios con
  evidencia.
- La lista carga inicialmente 20 registros y permite traer mas con `Cargar más
  planeaciones`.
- El detalle conserva revision completa del plan y gestion de imagenes
  adjuntas sin cambiar permisos ni contrato de backend.
- El cuerpo del plan seleccionado se presenta como reporte visual: encabezado
  con chips de contexto, fundamentos pedagogicos en bloques, ruta de clase
  destacada, actividades separadas y evidencias al final.
- Solo la lista de envios tiene scroll interno; el detalle del plan crece con
  la pagina para evitar doble scroll.
- En escritorio, la lista conserva ancho lateral y su scroll interno se estira
  a la altura del detalle.
- La carga inicial se mantiene en 20 envios y los siguientes registros se
  solicitan con `Cargar más planeaciones`.

## Comportamiento UX movil documentado

- `NavAdmin.jsx`: en movil muestra enlaces principales y grupos colapsables.
  Las subpestanas de admin se abren solo al seleccionar su grupo, para evitar
  que el menu despliegue todas las opciones al abrirse.
- `DocumentoImprimible.jsx`: recibe `className` para marcar documentos que
  necesitan comportamiento especial de pantalla. Los documentos marcados como
  boletin, certificado o cartera usan root con scroll lateral en movil.
- `Boletin.jsx`: el impreso final conserva ancho A4 en movil y se desplaza a
  los lados. El boton `Atras` queda arriba a la izquierda.
- `CertificadosAdmin.jsx`: certificado de notas, certificado de matricula y
  reporte academico parcial conservan ancho A4 en movil, tienen scroll lateral
  y boton `Atras` arriba. El reporte parcial permite imprimir curso completo o
  estudiante individual por periodo y materia, incluyendo inasistencias del
  periodo.
- `CarteraVencidaAdmin.jsx`: los estados de cuenta por estudiante y por curso
  conservan ancho A4 en movil y usan scroll lateral.
- `EstudiantesAdmin.jsx`: el modal de detalle del estudiante organiza el
  observador en tarjetas con chips de periodo, materia, profesor y fecha. En
  movil las secciones se apilan; en escritorio se muestran como columnas.

## Componentes por modulo

### Admin

- `components/admin/IdentidadInstitucional.jsx`
- `components/admin/PlantillasAdmin.jsx`
- `components/OrdenBoletin.jsx`: pestaña de Administracion para definir el
  orden de materias por curso en boletines, con flechas, posicion numerica y
  guardado por curso.

### Boletin

- `components/boletin/Boletin.jsx`
- `components/boletin/Header.jsx`
- `components/boletin/IngresoBoletinProfesor.jsx`: ingreso de observaciones de
  boletin final; oculta notas tecnicas como `mas_alto` y muestra los tipos de
  nota con etiquetas humanas marcadas con `translate="no"`.
- `components/boletin/Materia.jsx`
- `components/boletin/TablaNotas.jsx`

### Constantes

- `constants/valoracionesDesarrollo.js`: opciones compartidas de desarrollo
  infantil (`Destacado`, `Logrado`, `En proceso`, `Requiere apoyo`) usadas por
  planilla y vistas relacionadas.

### Cartera

- `components/cartera/AdministrarTiposPago.jsx`

### Impresion

- `components/impresion/DocumentoImprimible.jsx`

Notas:

- El toolbar de documentos imprimibles muestra `Descargar PDF` e `Imprimir`.
  Ambos botones usan el dialogo nativo del navegador mediante `window.print()`.
- En celular, el resultado de descarga depende del navegador. Android/Chrome
  suele mostrar `Guardar como PDF`; iOS/Safari puede mostrar opciones de
  compartir o imprimir.

## Paginas existentes

- `Admin.jsx`
- `AdminDashboard.jsx`
- `Asistencia.jsx`
- `BrandingAdmin.jsx`
- `CarteraVencidaAdmin.jsx`
- `CertificadosAdmin.jsx`
- `DashboardAdmin.jsx`
- `DashboardProfesor.jsx`
- `EgresosAdmin.jsx`
- `EstudiantesAdmin.jsx`
- `Formulario.jsx`
- `GestionAcademica.jsx`
- `HorariosAdmin.jsx`
- `InventarioAdmin.jsx`
- `Login.jsx`
- `NominaAdmin.jsx`
- `PagosAdmin.jsx`
- `PlanDeClases.jsx`
- `PlaneadorAnual.jsx`
- `PlaneadoresClasesAdmin.jsx`
- `Planilla.jsx`
- `PrestamosAdmin.jsx`
- `RankingMejorRendimiento.jsx`
- `RankingRendimiento.jsx`
- `ReportesAdmin.jsx`
- `SuperAdminDashboard.jsx`
- `TiposPagosAdmin.jsx`
- `VentasAdmin.jsx`

## Hooks y servicios

- `hooks/usePrintConfig.js`: hook relacionado con configuracion de impresion.
- `services/printingService.js`: servicio para branding, plantillas e impresion.
- `utils/api.js`: cliente Axios compartido.

## Estilos

- `src/index.css`: estilos globales cargados desde `main.jsx`.
- `styles/print.css`: estilos para impresion.

`styles/print.css` contiene las reglas moviles de documentos imprimibles:

- documentos comunes: se adaptan al ancho disponible;
- boletin/certificados/cartera: mantienen `210mm` de ancho y se desplazan
  horizontalmente en pantallas pequenas.
