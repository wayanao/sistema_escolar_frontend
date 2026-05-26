import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

function NavAdmin() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }

    localStorage.removeItem("profesor");
    localStorage.removeItem("usuario");
    localStorage.removeItem("asignacionId");
    localStorage.removeItem("periodo");
    // Remover token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombreUsuario = usuario ? usuario.nombre : "";
  const topLinkClass = ({ isActive }) =>
    isActive
      ? "rounded-md bg-purple-50 px-3 py-1.5 font-semibold text-purple-900 transition"
      : "text-white hover:text-purple-100 transition";
  const dropdownLinkClass = ({ isActive }) =>
    "block px-4 py-2 text-sm " +
    (isActive
      ? "text-purple-900 bg-purple-50 font-semibold border-l-4 border-purple-600"
      : "hover:bg-gray-100 hover:text-purple-700 border-l-4 border-transparent");
  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-purple-50 px-3 py-2 font-semibold text-purple-900"
      : "text-white hover:text-purple-100 block px-2";

  return (
    <header className="bg-purple-700 text-white px-4 py-3 shadow-md relative z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div>
          <NavLink to="/dashboard-admin" className="hover:opacity-80 transition cursor-pointer">
            <strong className="text-lg">Sistema Escolar - Admin</strong>
          </NavLink>
          {nombreUsuario && <span className="ml-3 text-sm opacity-80 hidden sm:inline">Admin: {nombreUsuario}</span>}
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white hover:text-purple-100 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLink className={topLinkClass} to="/dashboard-admin">Dashboard</NavLink>
          
          {/* Dropdown Gestión Académica */}
          <div className="relative group py-2">
            <span className="text-white hover:text-purple-100 transition cursor-pointer font-medium flex items-center gap-1">
              Gestión Académica 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-gray-800 py-2 rounded shadow-lg min-w-[170px] z-50 border border-gray-100">
                <NavLink className={dropdownLinkClass} to="/admin">Administración</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/horarios">Horarios Asignados</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/planeadores-clases">Planeadores de Clases</NavLink>
                <NavLink className={dropdownLinkClass} to="/boletin">Gestión Boletines</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/diseno-impresos">Diseño de impresos</NavLink>
            </div>
          </div>

          {/* Dropdown Cartera */}
          <div className="relative group py-2">
            <span className="text-white hover:text-purple-100 transition cursor-pointer font-medium flex items-center gap-1">
              Cartera 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-gray-800 py-2 rounded shadow-lg min-w-[170px] z-50 border border-gray-100">
                <NavLink className={dropdownLinkClass} to="/admin/pagos">Gestión de Pagos</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/tipos-pagos">Tipos de Pago</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/cartera-vencida">Cartera Vencida</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/inventario">Inventario</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/ventas">Punto de Venta</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/egresos">Egresos</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/prestamos">Préstamos</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/nomina">Nómina</NavLink>
              </div>
          </div>
          <NavLink className={topLinkClass} to="/admin/estudiantes">Estudiantes</NavLink>
          <NavLink className={topLinkClass} to="/admin/reportes">Reportes</NavLink>
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cerrar sesión</button>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="md:hidden mt-4 pb-2 flex flex-col gap-3">
          <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/dashboard-admin">Dashboard</NavLink>
          
          <div className="flex flex-col gap-2 mt-1 mb-1 border-l-2 border-white/20 pl-2">
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider px-2">🎓 Gestión Académica</span>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin">Administración</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/horarios">Horarios Asignados</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/planeadores-clases">Planeadores de Clases</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/boletin">Gestión Boletines</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/diseno-impresos">Diseño de impresos</NavLink>
          </div>

          <div className="flex flex-col gap-2 mt-1 mb-1 border-l-2 border-white/20 pl-2">
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider px-2">📂 Cartera</span>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/pagos">Pagos</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/tipos-pagos">Tipos de Pago</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/cartera-vencida">Cartera Vencida</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/inventario">Inventario</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/ventas">Punto de Venta</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/egresos">Egresos</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/prestamos">Préstamos</NavLink>
              <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/nomina">Nómina</NavLink>
          </div>
          <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/estudiantes">Estudiantes</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={mobileLinkClass} to="/admin/reportes">Reportes</NavLink>
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2">Cerrar sesión</button>
        </nav>
      )}
    </header>
  );
}

export default NavAdmin;
