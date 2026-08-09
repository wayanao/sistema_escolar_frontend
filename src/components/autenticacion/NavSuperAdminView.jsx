import { NavLink } from "react-router-dom";
import auligoLogoNav from "../../assets/auligo-logo-nav.png";
import { RUTAS_SESION } from "../../utils/autenticacion/sesion";

function NavSuperAdminView({ nombre, onCerrarSesion }) {
  return (
    <header className="border-b border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8">
        <div className="min-w-0">
          <NavLink
            to={RUTAS_SESION.INICIO_SUPER_ADMIN}
            className="inline-flex items-center transition hover:opacity-90"
            aria-label="Ir al inicio de Auligo"
          >
            <img
              src={auligoLogoNav}
              alt="Auligo"
              className="nav-brand-logo h-9 w-auto object-contain"
            />
          </NavLink>
          {nombre && (
            <span className="block max-w-[260px] truncate text-xs font-medium text-slate-300 sm:max-w-[360px]">
              Plataforma: {nombre}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-3">
          <NavLink
            to={RUTAS_SESION.INICIO_SUPER_ADMIN}
            className={({ isActive }) =>
              isActive
                ? "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-950"
                : "text-sm font-medium text-slate-200 hover:text-white"
            }
          >
            Tenants
          </NavLink>
          <button
            type="button"
            onClick={onCerrarSesion}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}

export default NavSuperAdminView;
