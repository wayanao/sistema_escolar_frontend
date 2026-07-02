import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import NavProfesor from "./components/NavProfesor";
import NavAdmin from "./components/NavAdmin";
import NavSuperAdmin from "./components/NavSuperAdmin";
import TenantStatusBanner from "./components/TenantStatusBanner";

const Planilla = lazy(() => import("./pages/Planilla"));
const Asistencia = lazy(() => import("./pages/Asistencia"));
const Boletin = lazy(() => import("./components/boletin/Boletin"));
const Admin = lazy(() => import("./pages/Admin"));
const Formulario = lazy(() => import("./pages/Formulario"));
const PlanDeClases = lazy(() => import("./pages/PlanDeClases"));
const DashboardProfesor = lazy(() => import("./pages/DashboardProfesor"));
const PlaneadorAnual = lazy(() => import("./pages/PlaneadorAnual"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const IngresoBoletinProfesor = lazy(() => import("./components/boletin/IngresoBoletinProfesor"));
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

function PageLoader() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
      Cargando...
    </div>
  );
}

function ProtectedRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  if (usuario?.debe_cambiar_password) {
    return <Navigate to="/cambiar-password" />;
  }
  return (usuario || profesor) ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  if (usuario?.debe_cambiar_password) {
    return <Navigate to="/cambiar-password" />;
  }
  return (usuario && usuario.rol === "admin") ? children : <Navigate to="/login" />;
}

function PasswordChangeRoute() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!usuario || usuario.rol !== "admin") {
    return <Navigate to="/login" />;
  }
  if (!usuario.debe_cambiar_password) {
    return <Navigate to="/dashboard-admin" />;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <CambiarPassword />
    </Suspense>
  );
}

function SuperAdminRoute({ children }) {
  const superAdmin = JSON.parse(localStorage.getItem("super_admin") || "null");
  return (superAdmin && superAdmin.rol === "super_admin") ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>} />
      <Route path="/cambiar-password" element={<PasswordChangeRoute />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

function SuperAdminLayout() {
  return (
    <div className="notranslate min-h-screen bg-slate-50" translate="no">
      <NavSuperAdmin />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 xl:px-8">
        <Suspense fallback={<PageLoader />}>
          <SuperAdminDashboard />
        </Suspense>
      </main>
    </div>
  );
}

function Layout() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  const currentUser = usuario || profesor;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="notranslate min-h-screen bg-slate-50" translate="no">
      {usuario && usuario.rol === "admin" ? <NavAdmin /> : <NavProfesor />}
      <TenantStatusBanner />
      <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 xl:px-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><DashboardProfesor /></ProtectedRoute>} />
            <Route path="/dashboard-admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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
