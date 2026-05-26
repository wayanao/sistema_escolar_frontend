import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

function NavProfesor() {
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
    localStorage.removeItem("asignacionId");
    localStorage.removeItem("periodo");
    // Remover token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  const currentUser = usuario || profesor;
  const nombreUsuario = currentUser
    ? `${currentUser.nombre || ""} ${currentUser.apellido || ""}`.trim()
    : "";

  const topLinkClass = ({ isActive }) =>
    isActive
      ? "rounded-md bg-blue-50 px-3 py-1.5 font-semibold text-blue-900 transition"
      : "text-white hover:text-blue-100 transition";

  const dropdownLinkClass = ({ isActive }) =>
    "block px-4 py-2 text-sm " +
    (isActive
      ? "text-blue-900 bg-blue-50 font-semibold border-l-4 border-blue-600"
      : "hover:bg-gray-100 hover:text-blue-700 border-l-4 border-transparent");

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-blue-50 px-3 py-2 font-semibold text-blue-900"
      : "text-white hover:text-blue-100 block px-2 py-2";

  const mobileSubLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-blue-50 px-3 py-2 font-semibold text-blue-900 ml-4"
      : "text-white hover:text-blue-100 block px-2 py-2 ml-4";

  const closeMobile = () => {
    setIsMenuOpen(false);
    setOpenMobileGroup(null);
  };

  const toggleMobileGroup = (key) => {
    setOpenMobileGroup((prev) => (prev === key ? null : key));
  };

  return (
    <header className="bg-blue-700 text-white px-4 py-3 shadow-md relative z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div>
          <NavLink to="/" className="hover:opacity-80 transition cursor-pointer">
            <strong className="text-lg">Sistema Escolar</strong>
          </NavLink>
          {nombreUsuario && <span className="ml-3 text-sm opacity-80 hidden sm:inline">Profesor/a: {nombreUsuario}</span>}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white hover:text-blue-100 focus:outline-none"
          aria-label="Abrir menu de profesor"
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
          <NavLink className={topLinkClass} to="/">Dashboard</NavLink>

          {/* Dropdown Control Académico */}
          <div className="relative group py-2">
            <span className="text-white hover:text-blue-100 transition cursor-pointer font-medium flex items-center gap-1">
              Control Académico
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-gray-800 py-2 rounded shadow-lg min-w-[180px] z-50 border border-gray-100">
              <NavLink className={dropdownLinkClass} to="/planilla">Planilla</NavLink>
              <NavLink className={dropdownLinkClass} to="/asistencia">Asistencia</NavLink>
              <NavLink className={dropdownLinkClass} to="/Formulario">Observaciones</NavLink>
            </div>
          </div>

          {/* Dropdown Planeación Académica */}
          <div className="relative group py-2">
            <span className="text-white hover:text-blue-100 transition cursor-pointer font-medium flex items-center gap-1">
              Planeación Académica
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-gray-800 py-2 rounded shadow-lg min-w-[190px] z-50 border border-gray-100">
              <NavLink className={dropdownLinkClass} to="/plan-de-clases">Plan de Clases</NavLink>
              <NavLink className={dropdownLinkClass} to="/planeador-anual">Malla Curricular</NavLink>
            </div>
          </div>

          <NavLink className={topLinkClass} to="/ingreso-boletin">Boletín Final</NavLink>

          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cerrar sesion</button>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="md:hidden mt-4 pb-2 flex flex-col gap-1">
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/">Dashboard</NavLink>

          {/* Grupo móvil: Control Académico */}
          <button
            type="button"
            onClick={() => toggleMobileGroup("control")}
            className="flex items-center justify-between text-white hover:text-blue-100 px-2 py-2 w-full text-left font-medium"
            aria-expanded={openMobileGroup === "control"}
          >
            <span>Control Académico</span>
            <svg className={`w-4 h-4 transition-transform ${openMobileGroup === "control" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "control" && (
            <div className="flex flex-col gap-1">
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/planilla">Planilla</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/asistencia">Asistencia</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/Formulario">Observaciones</NavLink>
            </div>
          )}

          {/* Grupo móvil: Planeación Académica */}
          <button
            type="button"
            onClick={() => toggleMobileGroup("planeacion")}
            className="flex items-center justify-between text-white hover:text-blue-100 px-2 py-2 w-full text-left font-medium"
            aria-expanded={openMobileGroup === "planeacion"}
          >
            <span>Planeación Académica</span>
            <svg className={`w-4 h-4 transition-transform ${openMobileGroup === "planeacion" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "planeacion" && (
            <div className="flex flex-col gap-1">
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/plan-de-clases">Plan de Clases</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/planeador-anual">Malla Curricular</NavLink>
            </div>
          )}

          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/ingreso-boletin">Boletín Final</NavLink>

          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2">Cerrar sesion</button>
        </nav>
      )}
    </header>
  );
}

export default NavProfesor;
