# Rutas Frontend

Estado actual de rutas definido en `src/App.jsx`.

## Rutas publicas

| Ruta | Componente | Observacion |
| --- | --- | --- |
| `/login` | `Login` | Pantalla de acceso. |

## Rutas dentro del layout autenticado

El layout `/*` valida que exista `usuario` o `profesor` en `localStorage`.

| Ruta | Componente | Guard |
| --- | --- | --- |
| `/` | `DashboardProfesor` | `ProtectedRoute` |
| `/planilla` | `Planilla` | `ProtectedRoute` |
| `/Formulario` | `Formulario` | `ProtectedRoute` |
| `/asistencia` | `Asistencia` | `ProtectedRoute` |
| `/ranking-rendimiento` | `RankingRendimiento` | `ProtectedRoute` |
| `/ranking-mejor-rendimiento` | `RankingMejorRendimiento` | `ProtectedRoute` |
| `/plan-de-clases` | `PlanDeClases` | `ProtectedRoute` |
| `/planeador-anual` | `PlaneadorAnual` | `ProtectedRoute` |
| `/ingreso-boletin` | `IngresoBoletinProfesor` | `ProtectedRoute` |

## Rutas administrativas

Estas rutas usan `AdminRoute`, que revisa `localStorage.usuario.rol === "admin"`.

| Ruta | Componente |
| --- | --- |
| `/dashboard-admin` | `AdminDashboard` |
| `/admin` | `Admin` |
| `/admin/pagos` | `PagosAdmin` |
| `/admin/tipos-pagos` | `TiposPagosAdmin` |
| `/admin/cartera-vencida` | `CarteraVencidaAdmin` |
| `/admin/inventario` | `InventarioAdmin` |
| `/admin/ventas` | `VentasAdmin` |
| `/admin/egresos` | `EgresosAdmin` |
| `/admin/prestamos` | `PrestamosAdmin` |
| `/admin/nomina` | `NominaAdmin` |
| `/admin/estudiantes` | `EstudiantesAdmin` |
| `/admin/reportes` | `ReportesAdmin` |
| `/admin/horarios` | `HorariosAdmin` |
| `/admin/planeadores-clases` | `PlaneadoresClasesAdmin` |
| `/admin/certificados` | `CertificadosAdmin` |
| `/admin/diseno-impresos` | `BrandingAdmin` |
| `/boletin` | `Boletin` |

## Rutas de super admin

Esta ruta usa `SuperAdminRoute`, que revisa `localStorage.super_admin.rol === "super_admin"`.

| Ruta | Componente |
| --- | --- |
| `/super-admin` | `SuperAdminDashboard` |
| `/cambiar-password` | `CambiarPassword` |

## Navegacion de administrador

`src/components/NavAdmin.jsx` muestra enlaces a:

- Dashboard admin.
- Administracion academica.
- Horarios.
- Planeadores de clases.
- Certificados.
- Boletin.
- Diseno de impresos.
- Pagos.
- Tipos de pagos.
- Cartera vencida.
- Inventario.
- Ventas.
- Egresos.
- Prestamos.
- Nomina.
- Estudiantes.
- Reportes.

En movil, `NavAdmin` separa enlaces principales de grupos colapsables. Al abrir
el menu no se despliegan todas las subpestanas: el usuario selecciona el grupo
correspondiente, por ejemplo Gestion Academica o Cartera, y entonces se muestran
sus subenlaces. Los subenlaces usan estilo indentado/diferenciado para no
confundirse con las pestañas principales.

Notas de UX por ruta admin:

- `/boletin`: el boletin imprimible usa ancho A4 con scroll lateral en movil y
  boton `Atras` arriba a la izquierda.
- `/admin/certificados`: certificado de notas y certificado de matricula usan
  ancho A4 con scroll lateral en movil y boton `Atras` arriba a la izquierda.
- `/admin/cartera-vencida`: los reportes imprimibles por estudiante y por curso
  usan ancho A4 con scroll lateral en movil.
- `/admin/estudiantes`: el modal de detalle organiza el observador en tarjetas
  legibles en movil.
- `/admin/diseno-impresos`: tabs y controles de plantillas se ajustan para uso
  en pantallas estrechas.

## Navegacion de profesor

`src/components/NavProfesor.jsx` muestra enlaces a:

- Dashboard.
- Planilla.
- Asistencia.
- Formulario.
- Plan de clases.
- Planeador anual.
- Ingreso de boletin.

## Navegacion de super admin

`src/components/NavSuperAdmin.jsx` muestra enlace a:

- Tenants.

## Reescritura SPA

`vercel.json` contiene una regla que redirige cualquier ruta hacia `index.html`, necesaria para rutas internas de React Router en despliegues tipo SPA.
