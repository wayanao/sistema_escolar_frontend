import { useState } from "react";
import { NavLink } from "react-router-dom";
import auligoLogoNav from "../../assets/auligo-logo-nav.png";
import { ADMIN_DESKTOP_ITEMS } from "../../utils/autenticacion/navegacion";
import { RUTAS_SESION } from "../../utils/autenticacion/sesion";
import DesktopAnimatedNav from "./DesktopAnimatedNav";

function NavAdminView({ onCerrarSesion, renderNotificaciones, renderSelectorAnio }) {
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
            to={RUTAS_SESION.INICIO_ADMIN}
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
            items={ADMIN_DESKTOP_ITEMS}
            variant="admin"
            dropdownLinkClass={dropdownLinkClass}
            ariaLabel="Navegación principal de administrador"
          />
        </div>
        {/* Campana, año y cerrar sesión, aparte de las pestañas: en escritorio
            los separa una línea y más espacio (menos en pantallas medianas,
            donde las pestañas van justas). En celular se ve como antes. */}
        <div
          role="group"
          aria-label="Notificaciones, año lectivo y sesión"
          className="ml-auto flex shrink-0 items-center gap-3 lg:ml-3 lg:border-l lg:border-white/35 lg:pl-4 xl:ml-5 xl:pl-6"
        >
          <div>
            {renderNotificaciones(closeMobile)}
          </div>
          {/* Selector de año: no dibuja nada mientras el colegio tenga un solo año. */}
          {renderSelectorAnio ? renderSelectorAnio() : null}
          <span className="hidden h-6 w-px shrink-0 bg-white/35 lg:block" aria-hidden="true" />
          <button onClick={onCerrarSesion} className="hidden whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-500 lg:block">Cerrar sesión</button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white hover:text-purple-100 focus:outline-none lg:hidden"
          aria-label="Abrir menu de administrador"
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
          <NavLink onClick={closeMobile} className={mobileLinkClass} to={RUTAS_SESION.INICIO_ADMIN}>Dashboard</NavLink>

          <button
            type="button"
            onClick={() => toggleMobileGroup("academica")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-base font-semibold transition ${
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
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/listas-seguimiento">Listas de Seguimiento</NavLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleMobileGroup("cartera")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-base font-semibold transition ${
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
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/nomina" translate="no">Nómina</NavLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => toggleMobileGroup("administracion")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-base font-semibold transition ${
              openMobileGroup === "administracion"
                ? "bg-purple-900/35 text-white"
                : "text-white hover:bg-purple-600 hover:text-white"
            }`}
            aria-expanded={openMobileGroup === "administracion"}
          >
            <span>Administración</span>
            <svg className={`h-4 w-4 transition-transform ${openMobileGroup === "administracion" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openMobileGroup === "administracion" && (
            <div className="ml-3 flex flex-col gap-1 border-l border-purple-300/40 pl-3">
              <NavLink end onClick={closeMobile} className={mobileSubLinkClass} to="/admin">Estructura académica</NavLink>
              <NavLink onClick={closeMobile} className={mobileSubLinkClass} to="/admin/anios-lectivos">Años lectivos</NavLink>
            </div>
          )}

          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/admin/estudiantes">Estudiantes</NavLink>
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/admin/reportes">Reportes</NavLink>
          <button onClick={onCerrarSesion} className="text-white bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left mt-2">Cerrar sesión</button>
        </nav>
      )}
    </header>
  );
}

export default NavAdminView;
