import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import NotificacionesPlaneadores from "./components/planeaciones/NotificacionesPlaneadores";
import NavAdminView from "./components/autenticacion/NavAdminView";
import NavProfesorView from "./components/autenticacion/NavProfesorView";
import NavSuperAdminView from "./components/autenticacion/NavSuperAdminView";
import TenantStatusBannerView from "./components/autenticacion/TenantStatusBannerView";
import { useCerrarSesion } from "./hooks/autenticacion/useCerrarSesion";
import { useEstadoTenant } from "./hooks/autenticacion/useEstadoTenant";
import {
  useEstadoSesionGeneral,
  useRedireccionCambioPassword,
  useRedireccionRutaAdmin,
  useRedireccionRutaProtegida,
  useRedireccionSuperAdmin,
  useSesionSuperAdmin,
} from "./hooks/autenticacion/useSesion";
import { RUTAS_SESION } from "./utils/autenticacion/sesion";

const Planilla = lazy(() => import("./pages/Planilla"));
const Asistencia = lazy(() => import("./pages/Asistencia"));
const Boletin = lazy(() => import("./pages/Boletin"));
const Admin = lazy(() => import("./pages/Admin"));
const Formulario = lazy(() => import("./pages/Formulario"));
const PlanDeClases = lazy(() => import("./pages/PlanDeClases"));
const DashboardProfesor = lazy(() => import("./pages/DashboardProfesor"));
const PlaneadorAnual = lazy(() => import("./pages/PlaneadorAnual"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const IngresoBoletinProfesor = lazy(() => import("./pages/IngresoBoletinProfesor"));
const RankingRendimiento = lazy(() => import("./pages/RankingRendimiento"));
const RankingMejorRendimiento = lazy(() => import("./pages/RankingMejorRendimiento"));
const PagosAdmin = lazy(() => import("./pages/PagosAdmin"));
const InventarioAdmin = lazy(() => import("./pages/InventarioAdmin"));
const VentasAdmin = lazy(() => import("./pages/VentasAdmin"));
const EgresosAdmin = lazy(() => import("./pages/EgresosAdmin"));
const PrestamosAdmin = lazy(() => import("./pages/PrestamosAdmin"));
const NominaAdmin = lazy(() => import("./pages/NominaAdmin"));
const EstudiantesAdmin = lazy(() => import("./pages/EstudiantesAdmin"));
const ReportesAdmin = lazy(() => import("./pages/ReportesAdmin"));
const HorariosAdmin = lazy(() => import("./pages/HorariosAdmin"));
const PlaneadoresClasesAdmin = lazy(() => import("./pages/PlaneadoresClasesAdmin"));
const CertificadosAdmin = lazy(() => import("./pages/CertificadosAdmin"));
const BrandingAdmin = lazy(() => import("./pages/BrandingAdmin"));
const TiposPagosAdmin = lazy(() => import("./pages/TiposPagosAdmin"));
const CarteraVencidaAdmin = lazy(() => import("./pages/CarteraVencidaAdmin"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const CambiarPassword = lazy(() => import("./pages/CambiarPassword"));

function renderNotificacionesAdmin(onNavigate) {
  return <NotificacionesPlaneadores rol="admin" onNavigate={onNavigate} />;
}

function renderNotificacionesProfesor(onNavigate) {
  return <NotificacionesPlaneadores rol="profesor" onNavigate={onNavigate} />;
}

function PageLoader() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
      Cargando...
    </div>
  );
}

function ProtectedRoute({ children }) {
  const redireccion = useRedireccionRutaProtegida();
  return redireccion ? <Navigate to={redireccion} /> : children;
}

function AdminRoute({ children }) {
  const redireccion = useRedireccionRutaAdmin();
  return redireccion ? <Navigate to={redireccion} /> : children;
}

function PasswordChangeRoute() {
  const redireccion = useRedireccionCambioPassword();
  if (redireccion) return <Navigate to={redireccion} />;
  return (
    <Suspense fallback={<PageLoader />}>
      <CambiarPassword />
    </Suspense>
  );
}

function SuperAdminRoute({ children }) {
  const redireccion = useRedireccionSuperAdmin();
  return redireccion ? <Navigate to={redireccion} /> : children;
}

function NavegacionSesion({ esAdmin }) {
  const cerrarSesion = useCerrarSesion();

  return esAdmin ? (
    <NavAdminView
      onCerrarSesion={cerrarSesion}
      renderNotificaciones={renderNotificacionesAdmin}
    />
  ) : (
    <NavProfesorView
      onCerrarSesion={cerrarSesion}
      renderNotificaciones={renderNotificacionesProfesor}
    />
  );
}

function NavegacionSuperAdmin() {
  const superAdmin = useSesionSuperAdmin();
  const cerrarSesion = useCerrarSesion();

  return (
    <NavSuperAdminView
      nombre={superAdmin?.nombre}
      onCerrarSesion={cerrarSesion}
    />
  );
}

function AvisoEstadoTenant() {
  const aviso = useEstadoTenant();
  return <TenantStatusBannerView aviso={aviso} />;
}

function App() {
  return (
    <Routes>
      <Route path={RUTAS_SESION.LOGIN} element={<Login />} />
      <Route path={RUTAS_SESION.INICIO_SUPER_ADMIN} element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>} />
      <Route path={RUTAS_SESION.CAMBIAR_PASSWORD} element={<PasswordChangeRoute />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

function SuperAdminLayout() {
  return (
    <div className="notranslate min-h-screen bg-slate-50" translate="no">
      <NavegacionSuperAdmin />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 xl:px-8">
        <Suspense fallback={<PageLoader />}>
          <SuperAdminDashboard />
        </Suspense>
      </main>
    </div>
  );
}

function Layout() {
  const { haySesion, esAdmin } = useEstadoSesionGeneral();

  if (!haySesion) {
    return <Navigate to={RUTAS_SESION.LOGIN} />;
  }

  return (
    <div className="notranslate min-h-screen bg-slate-50" translate="no">
      <NavegacionSesion esAdmin={esAdmin} />
      <AvisoEstadoTenant />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 xl:px-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path={RUTAS_SESION.INICIO_PROFESOR} element={<ProtectedRoute><DashboardProfesor /></ProtectedRoute>} />
            <Route path={RUTAS_SESION.INICIO_ADMIN} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/pagos" element={<AdminRoute><PagosAdmin /></AdminRoute>} />
            <Route path="/admin/tipos-pagos" element={<AdminRoute><TiposPagosAdmin /></AdminRoute>} />
            <Route path="/admin/cartera-vencida" element={<AdminRoute><CarteraVencidaAdmin /></AdminRoute>} />
            <Route path="/admin/inventario" element={<AdminRoute><InventarioAdmin /></AdminRoute>} />
            <Route path="/admin/ventas" element={<AdminRoute><VentasAdmin /></AdminRoute>} />
            <Route path="/admin/egresos" element={<AdminRoute><EgresosAdmin /></AdminRoute>} />
            <Route path="/admin/prestamos" element={<AdminRoute><PrestamosAdmin /></AdminRoute>} />
            <Route path="/admin/nomina" element={<AdminRoute><NominaAdmin /></AdminRoute>} />
            <Route path="/admin/estudiantes" element={<AdminRoute><EstudiantesAdmin /></AdminRoute>} />
            <Route path="/admin/reportes" element={<AdminRoute><ReportesAdmin /></AdminRoute>} />
            <Route path="/admin/horarios" element={<AdminRoute><HorariosAdmin /></AdminRoute>} />
            <Route path="/admin/planeadores-clases" element={<AdminRoute><PlaneadoresClasesAdmin /></AdminRoute>} />
            <Route path="/admin/planeadores-clases/:planId" element={<AdminRoute><PlaneadoresClasesAdmin /></AdminRoute>} />
            <Route path="/admin/certificados" element={<AdminRoute><CertificadosAdmin /></AdminRoute>} />
            <Route path="/admin/diseno-impresos" element={<AdminRoute><BrandingAdmin /></AdminRoute>} />
            <Route path="/planilla" element={<ProtectedRoute><Planilla /></ProtectedRoute>} />
            <Route path="/Formulario" element={<ProtectedRoute><Formulario /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/asistencia" element={<ProtectedRoute><Asistencia /></ProtectedRoute>} />
            <Route path="/ranking-rendimiento" element={<ProtectedRoute><RankingRendimiento /></ProtectedRoute>} />
            <Route path="/ranking-mejor-rendimiento" element={<ProtectedRoute><RankingMejorRendimiento /></ProtectedRoute>} />
            <Route path="/plan-de-clases" element={<ProtectedRoute><PlanDeClases /></ProtectedRoute>} />
            <Route path="/planeador-anual" element={<ProtectedRoute><PlaneadorAnual /></ProtectedRoute>} />
            <Route path="/ingreso-boletin" element={<ProtectedRoute><IngresoBoletinProfesor /></ProtectedRoute>} />
            <Route path="/boletin" element={<AdminRoute><Boletin /></AdminRoute>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
