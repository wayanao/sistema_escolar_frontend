import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import NotificacionesPlaneadores from "./components/planeaciones/NotificacionesPlaneadores";
import MenuLateralView from "./components/autenticacion/MenuLateralView";
import NavSuperAdminView from "./components/autenticacion/NavSuperAdminView";
import TenantStatusBannerView from "./components/autenticacion/TenantStatusBannerView";
import AvisoAnioLectivoView from "./components/anioLectivo/AvisoAnioLectivoView";
import SelectorAnioLectivoView from "./components/anioLectivo/SelectorAnioLectivoView";
import AnioLectivoProvider from "./hooks/anioLectivo/AnioLectivoProvider";
import useAnioLectivo from "./hooks/anioLectivo/useAnioLectivo";
import useAnioLectivoEnPantalla from "./hooks/anioLectivo/useAnioLectivoEnPantalla";
import { useCerrarSesion } from "./hooks/autenticacion/useCerrarSesion";
import { useEstadoTenant } from "./hooks/autenticacion/useEstadoTenant";
import { useMenuLateral } from "./hooks/autenticacion/useMenuLateral";
import {
  useEstadoSesionGeneral,
  useRedireccionCambioPassword,
  useRedireccionRutaAdmin,
  useRedireccionRutaProtegida,
  useRedireccionSuperAdmin,
  useSesionProfesor,
  useSesionSuperAdmin,
  useSesionUsuario,
} from "./hooks/autenticacion/useSesion";
import {
  ADMIN_DESKTOP_ITEMS,
  PROFESOR_BARRA_INFERIOR,
  PROFESOR_DESKTOP_ITEMS,
} from "./utils/autenticacion/navegacion";
import { RUTAS_SESION } from "./utils/autenticacion/sesion";
import { capitalizarNombreVisible } from "./utils/nombres";

const Planilla = lazy(() => import("./pages/Planilla"));
const Asistencia = lazy(() => import("./pages/Asistencia"));
const Boletin = lazy(() => import("./pages/Boletin"));
const Admin = lazy(() => import("./pages/Admin"));
const Observador = lazy(() => import("./pages/Observador"));
const PlanDeClases = lazy(() => import("./pages/PlanDeClases"));
const DashboardProfesor = lazy(() => import("./pages/DashboardProfesor"));
const PlaneadorAnual = lazy(() => import("./pages/PlaneadorAnual"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AniosLectivosAdmin = lazy(() => import("./pages/AniosLectivosAdmin"));
const AdmisionesAdmin = lazy(() => import("./pages/AdmisionesAdmin"));
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
const ListasSeguimientoAdmin = lazy(() => import("./pages/ListasSeguimientoAdmin"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const CambiarPassword = lazy(() => import("./pages/CambiarPassword"));
const Landing = lazy(() => import("./pages/Landing"));

// `tono` es el de la barra donde va la campana: oscura en celular, blanca desde tablet.
function renderNotificacionesAdmin(onNavigate, opciones) {
  return <NotificacionesPlaneadores rol="admin" onNavigate={onNavigate} tono={opciones?.tono} />;
}

function renderNotificacionesProfesor(onNavigate, opciones) {
  return <NotificacionesPlaneadores rol="profesor" onNavigate={onNavigate} tono={opciones?.tono} />;
}

function SelectorAnioLectivoAdmin({ tono }) {
  const { mostrarSelector, opciones, anioSeleccionadoId, seleccionarAnio } =
    useAnioLectivoEnPantalla();

  if (!mostrarSelector) return null;

  return (
    <SelectorAnioLectivoView
      opciones={opciones}
      anioSeleccionadoId={anioSeleccionadoId}
      onCambiar={seleccionarAnio}
      tono={tono}
    />
  );
}

function renderSelectorAnioAdmin(opciones) {
  return <SelectorAnioLectivoAdmin tono={opciones?.tono} />;
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

// Lo que cambia entre el menú del admin y el del profesor. Solo el profesor
// tiene barra abajo en el celular; solo el admin, selector de año.
const MENU_ADMIN = {
  items: ADMIN_DESKTOP_ITEMS,
  rutaInicio: RUTAS_SESION.INICIO_ADMIN,
  etiqueta: "Navegación principal de administrador",
  rol: "Administrador",
  renderNotificaciones: renderNotificacionesAdmin,
  renderSelectorAnio: renderSelectorAnioAdmin,
};

const MENU_PROFESOR = {
  items: PROFESOR_DESKTOP_ITEMS,
  rutaInicio: RUTAS_SESION.INICIO_PROFESOR,
  etiqueta: "Navegación principal de profesor",
  rol: "Profesor",
  renderNotificaciones: renderNotificacionesProfesor,
  barraInferior: PROFESOR_BARRA_INFERIOR,
};

// Admin y profesor trabajan dentro del menú lateral: el menú a la izquierda
// (en celular, barras arriba y abajo) y la página a la derecha.
function MarcoMenuLateral({ menu, nombre, children }) {
  const cerrarSesion = useCerrarSesion();
  const { modo, puedeAlternar, alternarMenu } = useMenuLateral();

  return (
    <MenuLateralView
      {...menu}
      nombre={nombre}
      modo={modo}
      puedeAlternar={puedeAlternar}
      onAlternarMenu={alternarMenu}
      onCerrarSesion={cerrarSesion}
    >
      {children}
    </MenuLateralView>
  );
}

// El nombre se muestra con mayúscula inicial aunque se haya guardado en
// minúscula («david rodriguez» → «David Rodriguez»).
function MarcoAdmin({ children }) {
  const usuario = useSesionUsuario();
  return (
    <MarcoMenuLateral menu={MENU_ADMIN} nombre={capitalizarNombreVisible(usuario?.nombre) || undefined}>
      {children}
    </MarcoMenuLateral>
  );
}

function MarcoProfesor({ children }) {
  const profesor = useSesionProfesor();

  // Una sola tonalidad de morados en el perfil profesor (ver index.css). Va en
  // el body para alcanzar también lo que se abre por portal, como la
  // presentación de clase; al salir del perfil se quita.
  useEffect(() => {
    document.body.classList.add("tema-profesor");
    return () => document.body.classList.remove("tema-profesor");
  }, []);

  return (
    <MarcoMenuLateral menu={MENU_PROFESOR} nombre={capitalizarNombreVisible(profesor?.nombre) || undefined}>
      {children}
    </MarcoMenuLateral>
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

function AvisoAnioLectivo() {
  const { aviso, volverAlActivo } = useAnioLectivoEnPantalla();
  return <AvisoAnioLectivoView aviso={aviso} onVolver={volverAlActivo} />;
}

// Al cambiar de año, la página abierta empieza de cero (la `key`): ningún
// curso ni filtro del año anterior queda pegado, y cada pantalla carga con el
// año nuevo. Mirando el activo, y siempre para el profesor, la `key` no cambia.
function RutasDelAnio({ children }) {
  const { anioSeleccionadoId } = useAnioLectivo();
  return <Routes key={anioSeleccionadoId ?? "anio-activo"}>{children}</Routes>;
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
  const { pathname } = useLocation();

  if (!haySesion) {
    // Sin sesión, la dirección principal es la portada pública. Cualquier otra
    // ruta sigue mandando al login, igual que antes de la landing.
    if (pathname === RUTAS_SESION.PORTADA) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <Landing rutaIngreso={RUTAS_SESION.LOGIN} />
        </Suspense>
      );
    }
    return <Navigate to={RUTAS_SESION.LOGIN} />;
  }

  const contenido = (
    <>
      <AvisoEstadoTenant />
      {esAdmin ? <AvisoAnioLectivo /> : null}
      <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 xl:px-8">
        <Suspense fallback={<PageLoader />}>
          <RutasDelAnio>
            <Route path={RUTAS_SESION.INICIO_PROFESOR} element={<ProtectedRoute><DashboardProfesor /></ProtectedRoute>} />
            <Route path={RUTAS_SESION.INICIO_ADMIN} element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/anios-lectivos" element={<AdminRoute><AniosLectivosAdmin /></AdminRoute>} />
            <Route path="/admin/anios-lectivos/admisiones" element={<AdminRoute><AdmisionesAdmin /></AdminRoute>} />
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
            <Route path="/admin/listas-seguimiento" element={<AdminRoute><ListasSeguimientoAdmin /></AdminRoute>} />
            <Route path="/planilla" element={<ProtectedRoute><Planilla /></ProtectedRoute>} />
            {/* El observador viejo se oculto el 2026-09-10. La direccion se
                conserva y manda al nuevo: quien la tuviera guardada llega a
                donde queria ir, en vez de a una pagina en blanco. El codigo de
                la pantalla vieja sigue entero -retirarlo es la fase 4-. */}
            <Route path="/Formulario" element={<Navigate to="/observador" replace />} />
            <Route path="/observador" element={<ProtectedRoute><Observador /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/asistencia" element={<ProtectedRoute><Asistencia /></ProtectedRoute>} />
            <Route path="/ranking-rendimiento" element={<ProtectedRoute><RankingRendimiento /></ProtectedRoute>} />
            <Route path="/ranking-mejor-rendimiento" element={<ProtectedRoute><RankingMejorRendimiento /></ProtectedRoute>} />
            <Route path="/plan-de-clases" element={<ProtectedRoute><PlanDeClases /></ProtectedRoute>} />
            <Route path="/planeador-anual" element={<ProtectedRoute><PlaneadorAnual /></ProtectedRoute>} />
            <Route path="/ingreso-boletin" element={<ProtectedRoute><IngresoBoletinProfesor /></ProtectedRoute>} />
            <Route path="/boletin" element={<AdminRoute><Boletin /></AdminRoute>} />
          </RutasDelAnio>
        </Suspense>
      </main>
    </>
  );

  const layout = (
    <div className="notranslate min-h-screen bg-slate-50" translate="no">
      {esAdmin ? <MarcoAdmin>{contenido}</MarcoAdmin> : <MarcoProfesor>{contenido}</MarcoProfesor>}
    </div>
  );

  // El año lectivo es solo del admin: el profesor no tiene proveedor, ni
  // selector, ni pide la lista de años (solo trabaja en el año activo).
  return esAdmin ? <AnioLectivoProvider>{layout}</AnioLectivoProvider> : layout;
}

export default App;
