import { ACCESOS_ADMIN, esTeclaDeActivacion } from "../../../utils/dashboards/admin";

// Íconos de trazo (sin emoji), uno por acceso.
const ICONOS = {
  pagos: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  estudiantes: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  academica: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v18H5.5A1.5 1.5 0 0 1 4 19.5z" />
      <path d="M8 7.5h8M8 11.5h5" />
    </>
  ),
  reportes: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8.5 16v-4M12.5 16V8M16.5 16v-6" />
    </>
  ),
};

/**
 * «Accesos rápidos»: los cuatro accesos de siempre, con sus rutas y su orden,
 * en botones pequeños de dos en dos. `Enter` y espacio abren el acceso; el
 * manejador evita que el botón lo abra dos veces.
 */
function AccesosAdmin({ onAbrir, className = "" }) {
  const manejarTecla = (event, path) => {
    if (esTeclaDeActivacion(event.key)) {
      event.preventDefault();
      onAbrir(path);
    }
  };

  return (
    <section
      aria-labelledby="titulo-accesos-admin"
      className={`min-w-0 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
          </svg>
        </span>
        <h2 id="titulo-accesos-admin" className="text-base font-extrabold text-slate-950">
          Accesos rápidos
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {ACCESOS_ADMIN.map((acceso) => (
          <button
            key={acceso.path}
            type="button"
            aria-label={`Abrir ${acceso.title}`}
            onClick={() => onAbrir(acceso.path)}
            onKeyDown={(event) => manejarTecla(event, acceso.path)}
            className="flex min-h-[84px] flex-col items-start gap-2 rounded-2xl border border-purple-100 bg-purple-50/40 p-3 text-left transition hover:border-purple-200 hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: acceso.accentSoft, color: acceso.accent }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {ICONOS[acceso.icono]}
              </svg>
            </span>
            <span className="text-sm font-bold leading-snug text-slate-950">{acceso.title}</span>
            <span className="hidden text-xs leading-snug text-slate-600 sm:block">{acceso.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default AccesosAdmin;
