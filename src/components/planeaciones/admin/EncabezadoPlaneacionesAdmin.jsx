import { VISTAS_FECHA } from "../../../utils/planeaciones/admin";

// `onAbrirNombresCuadros` abre la ventana para renombrar los cuadros del plan
// (docs/funcionalidades/NOMBRES_CUADROS_PLAN.md); sin él, no hay botón.
function EncabezadoPlaneacionesAdmin({
  vista,
  onCambiarVista,
  onAbrirNombresCuadros,
  avisoNombresCuadros = "",
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
      <div className="relative px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="xl:max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
              Seguimiento académico
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Planeaciones de clase
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Revisa los envíos docentes desde una sola bandeja y abre cada clase en su propio espacio de
              trabajo.
            </p>
            {onAbrirNombresCuadros && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onAbrirNombresCuadros}
                  className="inline-flex min-h-9 items-center rounded-xl border border-violet-200 bg-white px-3.5 py-1.5 text-sm font-bold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                >
                  Nombres de los cuadros
                </button>
                {avisoNombresCuadros && (
                  <p role="status" className="text-sm font-semibold text-emerald-700">
                    {avisoNombresCuadros}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="w-full rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-3 shadow-[0_18px_40px_-26px_rgba(5,150,105,0.8)] xl:max-w-[520px]">
            <div className="flex items-start gap-3 px-1 pb-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100">
                <IconoCalendario />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
                  Vista por fecha
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                  {vista
                    ? VISTAS_FECHA[vista].descripcion
                    : "Elige el periodo de clases que quieres consultar."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-emerald-100/80 p-1 ring-1 ring-emerald-200/70">
              {Object.entries(VISTAS_FECHA).map(([value, config]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onCambiarVista(value)}
                  aria-pressed={vista === value}
                  className={`min-h-10 rounded-lg px-2 py-2 text-xs font-black leading-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:px-3 sm:text-sm ${
                    vista === value
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-800 hover:bg-white/75 hover:text-emerald-950"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path
        d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default EncabezadoPlaneacionesAdmin;
