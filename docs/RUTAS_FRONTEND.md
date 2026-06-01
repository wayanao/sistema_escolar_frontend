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
| `/admin/diseno-impresos` | `BrandingAdmin` |
| `/boletin` | `Boletin` |

## Rutas de super admin

Esta ruta usa `SuperAdminRoute`, que revisa `localStorage.super_admin.rol === "super_admin"`.

| Ruta | Componente |
| --- | --- |
| `/super-admin` | `SuperAdminDashboard` |

## Navegacion de administrador

`src/components/NavAdmin.jsx` muestra enlaces a:

- Dashboard admin.
- Administracion academica.
- Horarios.
- Planeadores de clases.
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
