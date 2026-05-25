# Componentes

Estado actual de componentes y paginas del frontend.

## Componentes principales

- `LoginForm.jsx`: formulario de acceso; consume `/login`.
- `NavAdmin.jsx`: menu principal para usuario admin.
- `NavProfesor.jsx`: menu principal para profesor.
- `ImagenProtegida.jsx`: carga imagenes protegidas usando el cliente `api` y `responseType: "blob"`.
- `AsignarClase.jsx` y `AsignarClaseGrid.jsx`: asignacion de clases.
- `CrearCurso.jsx`: creacion/gestion relacionada con cursos.
- `CrearEstudiante.jsx`: creacion/gestion relacionada con estudiantes.
- `CrearMateria.jsx`: creacion/gestion relacionada con materias.
- `CrearProfesor.jsx`: creacion/gestion relacionada con profesores.
- `HorariosProfesores.jsx`: vista de horarios por profesor.
- `HorariosPorCurso.jsx`: vista de horarios por curso.
- `FacturaModerna.jsx`: componente de factura.
- `PlanillaRow.jsx`: fila de planilla.
- `AsistenciaRow.jsx`: fila de asistencia.
- `Observaciones.jsx`: manejo de observaciones.
- `ReporteEstudiante.jsx`: reporte individual de estudiante.

## Componentes por modulo

### Admin

- `components/admin/IdentidadInstitucional.jsx`
- `components/admin/PlantillasAdmin.jsx`

### Boletin

- `components/boletin/Boletin.jsx`
- `components/boletin/Header.jsx`
- `components/boletin/IngresoBoletinProfesor.jsx`
- `components/boletin/Materia.jsx`
- `components/boletin/TablaNotas.jsx`

### Cartera

- `components/cartera/AdministrarTiposPago.jsx`

### Impresion

- `components/impresion/DocumentoImprimible.jsx`

## Paginas existentes

- `Admin.jsx`
- `AdminDashboard.jsx`
- `Asistencia.jsx`
- `BrandingAdmin.jsx`
- `CarteraVencidaAdmin.jsx`
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
- `TiposPagosAdmin.jsx`
- `VentasAdmin.jsx`

## Hooks y servicios

- `hooks/usePrintConfig.js`: hook relacionado con configuracion de impresion.
- `services/printingService.js`: servicio para branding, plantillas e impresion.
- `utils/api.js`: cliente Axios compartido.

## Estilos

- `src/index.css`: estilos globales cargados desde `main.jsx`.
- `styles/print.css`: estilos para impresion.
