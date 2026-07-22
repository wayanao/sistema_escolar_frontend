import { NavLink, useNavigate } from "react-router-dom";
import api from "../utils/api";
import auligoLogoNav from "../assets/auligo-logo-nav.png";

function NavSuperAdmin() {
  const navigate = useNavigate();
  const superAdmin = JSON.parse(localStorage.getItem("super_admin") || "null");

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Error cerrando sesión", error);
    }

    localStorage.removeItem("super_admin");
    localStorage.removeItem("usuario");
    localStorage.removeItem("profesor");
    localStorage.removeItem("tenant");
    localStorage.removeItem("asignacionId");
    localStorage.removeItem("periodo");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8">
        <div className="min-w-0">
          <NavLink
            to="/super-admin"
            className="inline-flex items-center transition hover:opacity-90"
            aria-label="Ir al inicio de Auligo"
          >
            <img
              src={auligoLogoNav}
              alt="Auligo"
              className="h-9 w-auto object-contain"
            />
          </NavLink>
          {superAdmin?.nombre && (
            <span className="block max-w-[260px] truncate text-xs font-medium text-slate-300 sm:max-w-[360px]">
              Plataforma: {superAdmin.nombre}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-3">
          <NavLink
            to="/super-admin"
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
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}

export default NavSuperAdmin;
