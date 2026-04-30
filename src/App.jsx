import { Routes, Route, Navigate } from "react-router-dom";
import Planilla from "./pages/Planilla";
import Asistencia from "./pages/Asistencia";
import Boletin from "./components/boletin/Boletin";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Formulario from "./pages/Formulario";
import PlanDeClases from "./pages/PlanDeClases";
import DashboardProfesor from "./pages/DashboardProfesor";
import PlaneadorAnual from "./pages/PlaneadorAnual";
import AdminDashboard from "./pages/AdminDashboard";
import IngresoBoletinProfesor from "./components/boletin/IngresoBoletinProfesor";
import RankingRendimiento from "./pages/RankingRendimiento";
import RankingMejorRendimiento from "./pages/RankingMejorRendimiento";
import NavProfesor from "./components/NavProfesor";
import NavAdmin from "./components/NavAdmin";
import PagosAdmin from "./pages/PagosAdmin";
import InventarioAdmin from "./pages/InventarioAdmin";
import VentasAdmin from "./pages/VentasAdmin";
import EgresosAdmin from "./pages/EgresosAdmin";
import PrestamosAdmin from "./pages/PrestamosAdmin";
import NominaAdmin from "./pages/NominaAdmin";
import EstudiantesAdmin from "./pages/EstudiantesAdmin";
import ReportesAdmin from "./pages/ReportesAdmin";
import HorariosAdmin from "./pages/HorariosAdmin";
import PlaneadoresClasesAdmin from "./pages/PlaneadoresClasesAdmin";

function ProtectedRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  return (usuario || profesor) ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  return (usuario && usuario.rol === "admin") ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
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
    <div className="min-h-screen bg-slate-50">
      {usuario && usuario.rol === "admin" ? <NavAdmin /> : <NavProfesor />}
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<ProtectedRoute><DashboardProfesor /></ProtectedRoute>} />
          <Route path="/dashboard-admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/pagos" element={<AdminRoute><PagosAdmin /></AdminRoute>} />
          <Route path="/admin/inventario" element={<AdminRoute><InventarioAdmin /></AdminRoute>} />
          <Route path="/admin/ventas" element={<AdminRoute><VentasAdmin /></AdminRoute>} />
          <Route path="/admin/egresos" element={<AdminRoute><EgresosAdmin /></AdminRoute>} />
          <Route path="/admin/prestamos" element={<AdminRoute><PrestamosAdmin /></AdminRoute>} />
          <Route path="/admin/nomina" element={<AdminRoute><NominaAdmin /></AdminRoute>} />
          <Route path="/admin/estudiantes" element={<AdminRoute><EstudiantesAdmin /></AdminRoute>} />
          <Route path="/admin/reportes" element={<AdminRoute><ReportesAdmin /></AdminRoute>} />
          <Route path="/admin/horarios" element={<AdminRoute><HorariosAdmin /></AdminRoute>} />
          <Route path="/admin/planeadores-clases" element={<AdminRoute><PlaneadoresClasesAdmin /></AdminRoute>} />
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
      </main>
    </div>
  );
}

export default App;
