import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import auligoLogoNav from "../assets/auligo-logo-nav.png";
import DesktopAnimatedNav from "./DesktopAnimatedNav";

const adminDesktopItems = [
  { id: "dashboard", type: "link", label: "Dashboard", to: "/dashboard-admin" },
  {
    id: "academica",
    type: "group",
    label: "Gestión Académica",
    children: [
      { id: "horarios", label: "Horarios Asignados", to: "/admin/horarios" },
      { id: "planeadores", label: "Planeadores de Clases", to: "/admin/planeadores-clases" },
      { id: "certificados", label: "Certificados", to: "/admin/certificados" },
      { id: "boletines", label: "Gestión Boletines", to: "/boletin" },
      { id: "diseno-impresos", label: "Diseño de impresos", to: "/admin/diseno-impresos" },
    ],
  },
  {
    id: "cartera",
    type: "group",
    label: "Cartera",
    children: [
      { id: "pagos", label: "Gestión de Pagos", to: "/admin/pagos" },
      { id: "tipos-pagos", label: "Tipos de Pago", to: "/admin/tipos-pagos" },
      { id: "cartera-vencida", label: "Cartera Vencida", to: "/admin/cartera-vencida" },
      { id: "inventario", label: "Inventario", to: "/admin/inventario" },
      { id: "ventas", label: "Punto de Venta", to: "/admin/ventas" },
      { id: "egresos", label: "Egresos", to: "/admin/egresos" },
      { id: "prestamos", label: "Préstamos", to: "/admin/prestamos" },
      { id: "nomina", label: "Nómina", to: "/admin/nomina", translate: "no" },
    ],
  },
  { id: "administracion", type: "link", label: "Administración", to: "/admin", end: true },
  { id: "estudiantes", type: "link", label: "Estudiantes", to: "/admin/estudiantes" },
  { id: "reportes", type: "link", label: "Reportes", to: "/admin/reportes" },
];

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
            to="/dashboard-admin"
            className="inline-flex items-center transition hover:opacity-90"
            aria-label="Ir al inicio de Auligo"
          >
            <img
              src={auligoLogoNav}
              alt="Auligo"
              className="h-9 w-auto object-contain sm:h-10"
            />
          </NavLink>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden text-white hover:text-purple-100 focus:outline-none"
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
        <div className="hidden lg:flex items-center gap-3">
          <DesktopAnimatedNav
            items={adminDesktopItems}
            variant="admin"
            dropdownLinkClass={dropdownLinkClass}
            ariaLabel="Navegación principal de administrador"
          />
          <span className="h-6 w-px shrink-0 bg-white/35" aria-hidden="true" />
          <button onClick={handleLogout} className="text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Cerrar sesión</button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 px-4 pb-4 sm:px-6 xl:px-8 lg:hidden">
          <NavLink onClick={closeMobile} className={mobileLinkClass} to="/dashboard-admin">Dashboard</NavLink>

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
