import { useState } from "react";
import { NavLink } from "react-router-dom";
import auligoLogoNav from "../../assets/auligo-logo-nav.png";
import { PROFESOR_DESKTOP_ITEMS } from "../../utils/autenticacion/navegacion";
import { RUTAS_SESION } from "../../utils/autenticacion/sesion";
import DesktopAnimatedNav from "./DesktopAnimatedNav";

function NavProfesorView({ onCerrarSesion, renderNotificaciones }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState(null);

  const dropdownLinkClass = ({ isActive }) =>
    "block px-4 py-2.5 text-[15px] " +
    (isActive
      ? "text-purple-900 bg-purple-50 font-semibold border-l-4 border-purple-600"
      : "hover:bg-gray-100 hover:text-purple-700 border-l-4 border-transparent");

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-white px-3 py-2.5 text-base font-semibold text-purple-900"
      : "block rounded-md px-3 py-2.5 text-base font-medium text-white hover:bg-purple-600 hover:text-white";

  const mobileSubLinkClass = ({ isActive }) =>
    isActive
      ? "block rounded-md bg-purple-50 px-3 py-2.5 text-[15px] font-semibold text-purple-900"
      : "block rounded-md px-3 py-2.5 text-[15px] font-medium text-purple-50 hover:bg-purple-600 hover:text-white";

  const closeMobile = () => {
    setIsMenuOpen(false);
    setOpenMobileGroup(null);
  };

  const toggleMobileGroup = (key) => {
    setOpenMobileGroup((prev) => (prev === key ? null : key));
  };

  return (
    <header className="bg-purple-700 text-white shadow-md relative z-50">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 xl:px-8">
        <div className="min-w-0">
          <NavLink
            to={RUTAS_SESION.INICIO_PROFESOR}
            className="inline-flex items-center transition hover:opacity-90"
            aria-label="Ir al inicio de Auligo"
          >
            <img
              src={auligoLogoNav}
              alt="Auligo"
              className="nav-brand-logo h-9 w-auto object-contain sm:h-10"
            />
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <div className="ml-auto hidden lg:flex lg:items-center">
          <DesktopAnimatedNav
            items={PROFESOR_DESKTOP_ITEMS}
            variant="profesor"
            dropdownLinkClass={dropdownLinkClass}
            ariaLabel="Navegación principal de profesor"
          />
        </div>
        <div className="ml-auto lg:ml-0">
          {renderNotificaciones(closeMobile)}
        </div>
        <span className="hidden h-6 w-px shrink-0 bg-white/35 lg:block" aria-hidden="true" />
        <button onClick={onCerrarSesion} className="hidden whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 lg:block">Cerrar sesion</button>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white hover:text-purple-100 focus:outline-none lg:hidden"
          aria-label="Abrir menu de profesor"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 pb-4 sm:px-6 xl:px-8 lg:hidden">
          <NavLink onClick={closeMobile} className={mobileLinkClass} to={RUTAS_SESION.INICIO_PROFESOR}>Dashboard</NavLink>

          {/* Grupo móvil: Control Académico */}
          <button
            type="button"
            onClick={() => toggleMobileGroup("control")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-base font-semibold transition ${
              openMobileGroup === "control"
                ? "bg-purple-900/35 text-white"
                : "text-white hover:bg-purple-600 hover:text-white"
            }`}
            aria-expanded={openMobileGroup === "control"}
          >
            <span>Control Académico</span>
            <svg className={`w-4 h-4 transition-transform ${openMobileGroup === "control" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "control" && (
            <div className="ml-3 flex flex-col gap-1 border-l border-purple-300/40 pl-3">
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/planilla">Planilla</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/asistencia">Asistencia</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/Formulario">Observaciones</NavLink>
            </div>
          )}

          {/* Grupo móvil: Planeación Académica */}
          <button
            type="button"
            onClick={() => toggleMobileGroup("planeacion")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-base font-semibold transition ${
              openMobileGroup === "planeacion"
                ? "bg-purple-900/35 text-white"
                : "text-white hover:bg-purple-600 hover:text-white"
            }`}
            aria-expanded={openMobileGroup === "planeacion"}
          >
            <span>Planeación Académica</span>
            <svg className={`w-4 h-4 transition-transform ${openMobileGroup === "planeacion" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "planeacion" && (
            <div className="ml-3 flex flex-col gap-1 border-l border-purple-300/40 pl-3">
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/plan-de-clases">Plan de Clases</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/planeador-anual">Malla Curricular</NavLink>
            </div>
          )}

          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/observador">Observador</NavLink>

          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/ingreso-boletin">Boletín Final</NavLink>

          <button onClick={onCerrarSesion} className="text-white bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2">Cerrar sesion</button>
        </nav>
      )}
    </header>
  );
}

export default NavProfesorView;
