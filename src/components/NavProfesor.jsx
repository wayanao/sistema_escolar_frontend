import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

function NavProfesor() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
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
          className="md:hidden text-white hover:text-yellow-200 focus:outline-none"
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
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/">Dashboard</NavLink>
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/planilla">Planilla</NavLink>
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/asistencia">Asistencia</NavLink>
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/Formulario">Observaciones</NavLink>
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/plan-de-clases">Plan de Clases</NavLink>
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/planeador-anual">Malla curricular</NavLink>
          <NavLink className={({ isActive }) => isActive ? "text-yellow-300 font-semibold" : "text-white hover:text-yellow-200"} to="/ingreso-boletin">Boletín Final</NavLink>
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cerrar sesión</button>
        </nav>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="md:hidden mt-4 pb-2 flex flex-col gap-3">
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/">Dashboard</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/planilla">Planilla</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/asistencia">Asistencia</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/Formulario">Observaciones</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/plan-de-clases">Plan de Clases</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/planeador-anual">Malla curricular</NavLink>
          <NavLink onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? "text-yellow-300 font-semibold block px-2" : "text-white hover:text-yellow-200 block px-2"} to="/ingreso-boletin">Boletín Final</NavLink>
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2">Cerrar sesión</button>
        </nav>
      )}
    </header>
  );
}

export default NavProfesor;