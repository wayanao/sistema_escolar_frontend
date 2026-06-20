import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import DesktopAnimatedNav from "./DesktopAnimatedNav";

const profesorDesktopItems = [
  { id: "dashboard", type: "link", label: "Dashboard", to: "/", end: true },
  {
    id: "control",
    type: "group",
    label: "Control Académico",
    children: [
      { id: "planilla", label: "Planilla", to: "/planilla" },
      { id: "asistencia", label: "Asistencia", to: "/asistencia" },
      { id: "observaciones", label: "Observaciones", to: "/Formulario" },
    ],
  },
  {
    id: "planeacion",
    type: "group",
    label: "Planeación Académica",
    children: [
      { id: "plan-clases", label: "Plan de Clases", to: "/plan-de-clases" },
      { id: "malla", label: "Malla Curricular", to: "/planeador-anual" },
    ],
  },
  { id: "boletin", type: "link", label: "Boletín Final", to: "/ingreso-boletin" },
];

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
    localStorage.removeItem("super_admin");
    localStorage.removeItem("tenant");
    localStorage.removeItem("asignacionId");
    localStorage.removeItem("periodo");
    // Remover token
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  const dropdownLinkClass = ({ isActive }) =>
    "block px-4 py-2.5 text-[15px] " +
    (isActive
      ? "text-blue-900 bg-blue-50 font-semibold border-l-4 border-blue-600"
      : "hover:bg-gray-100 hover:text-blue-700 border-l-4 border-transparent");

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-blue-50 px-3 py-2.5 text-base font-semibold text-blue-900"
      : "block px-2 py-2.5 text-base text-white hover:text-blue-100";

  const mobileSubLinkClass = ({ isActive }) =>
    isActive
      ? "ml-4 block rounded-md bg-blue-50 px-3 py-2.5 text-[15px] font-semibold text-blue-900"
      : "ml-4 block px-2 py-2.5 text-[15px] text-white hover:text-blue-100";

  const closeMobile = () => {
    setIsMenuOpen(false);
    setOpenMobileGroup(null);
  };

  const toggleMobileGroup = (key) => {
    setOpenMobileGroup((prev) => (prev === key ? null : key));
  };

  return (
    <header className="bg-blue-700 text-white shadow-md relative z-50">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 xl:px-8">
        <div className="min-w-0">
          <NavLink to="/" className="inline-flex items-center leading-none hover:opacity-90 transition cursor-pointer">
            <strong className="text-2xl font-black tracking-normal">
              Scholar<span className="text-cyan-200">ix</span>
            </strong>
          </NavLink>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden text-white hover:text-blue-100 focus:outline-none"
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
        <div className="hidden lg:flex items-center gap-3">
          <DesktopAnimatedNav
            items={profesorDesktopItems}
            variant="profesor"
            dropdownLinkClass={dropdownLinkClass}
            ariaLabel="Navegación principal de profesor"
          />
          <span className="h-6 w-px shrink-0 bg-white/35" aria-hidden="true" />
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cerrar sesion</button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 pb-4 sm:px-6 xl:px-8 lg:hidden">
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/">Dashboard</NavLink>

          {/* Grupo móvil: Control Académico */}
          <button
            type="button"
            onClick={() => toggleMobileGroup("control")}
            className="flex w-full items-center justify-between px-2 py-2.5 text-left text-base font-medium text-white hover:text-blue-100"
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
            className="flex w-full items-center justify-between px-2 py-2.5 text-left text-base font-medium text-white hover:text-blue-100"
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
