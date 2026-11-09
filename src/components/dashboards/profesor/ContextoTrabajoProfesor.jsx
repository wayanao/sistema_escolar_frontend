import {
  formatearFechaPlaneacion,
  iconoJornada,
  obtenerJornadaClase,
} from "../../../utils/dashboards/profesor";

// Clase y período que otros módulos leen del almacenamiento local, más
// el acceso directo a las planeaciones recientes de la clase elegida.
function ContextoTrabajoProfesor({
  asignacionId,
  onCambiarAsignacion,
  loadingClases,
  errorClases = "",
  clasesUnicas,
  claseSeleccionada,
  planeacionesRecientes,
  loadingPlaneacionesRecientes,
  errorPlaneacionesRecientes,
  onAbrirPlaneacion,
  periodo,
  onCambiarPeriodo,
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
      <div className="border-b border-purple-100 bg-gradient-to-r from-purple-50 via-white to-sky-50 px-4 py-4 sm:px-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700">Contexto de trabajo</p>
        <h2 className="mt-1 text-lg font-bold text-gray-950">¿Con qué clase vas a trabajar?</h2>
        <p className="mt-1 text-sm text-gray-600">
          La clase y el período se conservarán al abrir los módulos académicos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)]">
        <div>
          <label htmlFor="clase-profesor" className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
            </span>
            Clase / grupo
          </label>
          <div className="relative">
            <select
              id="clase-profesor"
              value={asignacionId}
              onChange={(e) => onCambiarAsignacion(e.target.value)}
              disabled={loadingClases}
              className="min-h-12 w-full appearance-none rounded-xl border border-purple-200 bg-purple-50/70 py-3 pl-4 pr-11 text-base font-semibold text-purple-950 shadow-sm outline-none transition hover:border-purple-300 hover:bg-purple-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-wait disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">
                {loadingClases
                  ? "Cargando clases..."
                  : errorClases
                    ? "No se pudieron cargar las clases"
                    : clasesUnicas.length > 0
                      ? "Vista general de clases"
                      : "Sin clases asignadas"}
              </option>
              {clasesUnicas.map((clase) => {
                const jornada = obtenerJornadaClase(clase);
                return (
                  <option key={clase.id} value={clase.id}>
                    {clase.materia} - {clase.curso} - {iconoJornada(jornada)} {jornada}
                  </option>
                );
              })}
            </select>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
          {asignacionId && claseSeleccionada && !loadingClases && (
            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/55 p-3">
              <label
                htmlFor="planeacion-reciente-profesor"
                className="mb-1.5 flex min-w-0 items-center gap-2 text-xs font-bold text-violet-900"
                title={`Planeaciones recientes de ${claseSeleccionada.materia}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm ring-1 ring-violet-100" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="truncate">Planeaciones recientes de {claseSeleccionada.materia}</span>
              </label>
              <div className="relative">
                <select
                  id="planeacion-reciente-profesor"
                  value=""
                  onChange={(e) => onAbrirPlaneacion(e.target.value)}
                  disabled={loadingPlaneacionesRecientes || planeacionesRecientes.length === 0}
                  aria-busy={loadingPlaneacionesRecientes}
                  className="min-h-10 w-full appearance-none rounded-lg border border-violet-200 bg-white py-2 pl-3 pr-10 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-violet-300 focus:border-violet-500 focus:ring-3 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">
                    {loadingPlaneacionesRecientes
                      ? "Cargando planeaciones recientes..."
                      : errorPlaneacionesRecientes
                        ? "No se pudieron cargar"
                        : planeacionesRecientes.length > 0
                          ? "Selecciona una planeación"
                          : "Sin planeaciones recientes"}
                  </option>
                  {planeacionesRecientes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.tema || "Sin tema registrado"} — {formatearFechaPlaneacion(plan.fecha)}
                    </option>
                  ))}
                </select>
                {loadingPlaneacionesRecientes ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-violet-200 border-t-violet-700" aria-hidden="true"></span>
                ) : (
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-600"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {errorPlaneacionesRecientes && (
                <p className="mt-1.5 text-xs font-semibold text-rose-700">{errorPlaneacionesRecientes}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="periodo-profesor" className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 2v4M16 2v4M3 10h18" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
              </svg>
            </span>
            Período
          </label>
          <div className="relative">
            <select
              id="periodo-profesor"
              value={periodo}
              onChange={(e) => onCambiarPeriodo(e.target.value)}
              className="min-h-12 w-full appearance-none rounded-xl border border-emerald-100 bg-emerald-50/40 py-3 pl-4 pr-11 text-base font-semibold text-emerald-950 shadow-sm outline-none transition hover:border-emerald-200 hover:bg-emerald-50/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70"
            >
              <option value="1">Período 1</option>
              <option value="2">Período 2</option>
              <option value="3">Período 3</option>
              <option value="4">Período 4</option>
            </select>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

      </div>

    </section>
  );
}

export default ContextoTrabajoProfesor;
