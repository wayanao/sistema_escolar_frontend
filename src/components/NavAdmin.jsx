import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

function NavAdmin() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState(null);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }

    localStorage.removeItem("profesor");
    localStorage.removeItem("usuario");
    localStorage.removeItem("super_admin");
    localStorage.removeItem("tenant");
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
  const exactTopLinkClass = ({ isActive }) =>
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
      ? "block rounded-md bg-white px-3 py-2 font-semibold text-purple-900"
      : "block rounded-md px-3 py-2 font-medium text-white hover:bg-purple-600 hover:text-white";
  const mobileSubLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-purple-50 px-3 py-2 font-semibold text-purple-900"
      : "block rounded-md px-3 py-2 text-sm font-medium text-purple-50 hover:bg-purple-600 hover:text-white";

  const closeMobile = () => {
    setIsMenuOpen(false);
    setOpenMobileGroup(null);
  };

  const toggleMobileGroup = (key) => {
    setOpenMobileGroup((prev) => (prev === key ? null : key));
  };

  return (
    <header className="bg-purple-700 text-white shadow-md relative z-50">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8">
        <div className="min-w-0">
          <NavLink to="/dashboard-admin" className="inline-flex flex-col leading-tight hover:opacity-90 transition cursor-pointer">
            <strong className="text-xl font-black tracking-normal">
              Scholar<span className="text-fuchsia-200">ix</span>
            </strong>
          </NavLink>
          {nombreUsuario && (
            <span className="block max-w-[230px] truncate text-xs font-medium text-purple-100 sm:max-w-[320px]">
              Admin: {nombreUsuario}
            </span>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white hover:text-purple-100 focus:outline-none"
          aria-label="Abrir menu de administrador"
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
                <NavLink className={dropdownLinkClass} to="/admin/horarios">Horarios Asignados</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/planeadores-clases">Planeadores de Clases</NavLink>
                <NavLink className={dropdownLinkClass} to="/admin/certificados">Certificados</NavLink>
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
          <NavLink end className={exactTopLinkClass} to="/admin">Administración</NavLink>
          <NavLink className={topLinkClass} to="/admin/estudiantes">Estudiantes</NavLink>
          <NavLink className={topLinkClass} to="/admin/reportes">Reportes</NavLink>
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cerrar sesión</button>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 pb-4 sm:px-6 xl:px-8 md:hidden">
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/dashboard-admin">Dashboard</NavLink>

          <button
            type="button"
            onClick={() => toggleMobileGroup("academica")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-semibold transition ${
              openMobileGroup === "academica"
                ? "bg-purple-900/35 text-white"
                : "text-white hover:bg-purple-600 hover:text-white"
            }`}
            aria-expanded={openMobileGroup === "academica"}
          >
            <span>Gestión Académica</span>
            <svg className={`h-4 w-4 transition-transform ${openMobileGroup === "academica" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "academica" && (
            <div className="ml-3 flex flex-col gap-1 border-l border-purple-300/40 pl-3">
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/horarios">Horarios Asignados</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/planeadores-clases">Planeadores de Clases</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/certificados">Certificados</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/boletin">Gestión Boletines</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/diseno-impresos">Diseño de impresos</NavLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleMobileGroup("cartera")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left font-semibold transition ${
              openMobileGroup === "cartera"
                ? "bg-purple-900/35 text-white"
                : "text-white hover:bg-purple-600 hover:text-white"
            }`}
            aria-expanded={openMobileGroup === "cartera"}
          >
            <span>Cartera</span>
            <svg className={`h-4 w-4 transition-transform ${openMobileGroup === "cartera" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "cartera" && (
            <div className="ml-3 flex flex-col gap-1 border-l border-purple-300/40 pl-3">
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/pagos">Pagos</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/tipos-pagos">Tipos de Pago</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/cartera-vencida">Cartera Vencida</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/inventario">Inventario</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/ventas">Punto de Venta</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/egresos">Egresos</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/prestamos">Préstamos</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/nomina">Nómina</NavLink>
            </div>
          )}

          <NavLink end onClick={closeMobile} className={mobileLinkClass} to="/admin">Administración</NavLink>
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/admin/estudiantes">Estudiantes</NavLink>
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/admin/reportes">Reportes</NavLink>
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2">Cerrar sesión</button>
        </nav>
      )}
    </header>
  );
}

export default NavAdmin;
