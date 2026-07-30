import { formatearFechaPlan } from "../../../utils/planeaciones/profesor";
import EstadoRevisionBadge from "./EstadoRevisionBadge";

export default function HistorialPlanesProfesor({
  asignacionId,
  fechaActiva,
  planes,
  pagina,
  hayMas,
  cargando,
  error,
  pageSize,
  onCargarPagina,
  onAbrirPlan,
}) {
  const visible =
    asignacionId &&
    (cargando || error || planes.length > 0 || pagina > 0);

  if (!visible) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-emerald-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M8 2v4M16 2v4M3 10h18"
                strokeLinecap="round"
              />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M8 14h3M8 18h7" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-950 sm:text-lg">
              Planes guardados de esta clase
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Consulta las planeaciones desde las más recientes hacia las más
              antiguas.
            </p>
          </div>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm">
          {pageSize} planes por vista
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {error && (
          <div
            className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <span className="font-semibold">{error}</span>
            <button
              type="button"
              onClick={() => onCargarPagina(pagina)}
              className="w-fit rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <EsqueletoHistorial cantidad={pageSize} />
        ) : planes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {planes.map((plan) => (
                <TarjetaPlanHistorial
                  key={plan.id}
                  plan={plan}
                  activo={String(plan.fecha) === String(fechaActiva)}
                  onAbrirPlan={onAbrirPlan}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xs font-semibold text-slate-500 sm:text-left">
                Mostrando planes {pagina * pageSize + 1}–
                {pagina * pageSize + planes.length}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  disabled={pagina === 0 || cargando}
                  onClick={() => onCargarPagina(pagina - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Más recientes
                </button>
                <button
                  type="button"
                  disabled={!hayMas || cargando}
                  onClick={() => onCargarPagina(pagina + 1)}
                  className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Cargar {pageSize} más antiguas
                </button>
              </div>
            </div>
          </>
        ) : !error ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No hay planes guardados en esta parte del historial.
            </p>
            {pagina > 0 && (
              <button
                type="button"
                onClick={() => onCargarPagina(pagina - 1)}
                className="mt-3 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50"
              >
                Volver a planes recientes
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TarjetaPlanHistorial({ plan, activo, onAbrirPlan }) {
  const nuevas = Number(plan.observaciones_no_vistas) || 0;

  return (
    <article
      className={`group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        activo
          ? "border-emerald-300 ring-2 ring-emerald-100"
          : "border-slate-200 hover:border-violet-300"
      }`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 ${
          activo
            ? "bg-gradient-to-r from-emerald-400 to-teal-500"
            : "bg-gradient-to-r from-violet-500 to-purple-400"
        }`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5 text-violet-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M6 2v3M14 2v3M3 8h14" strokeLinecap="round" />
            <rect x="3" y="4" width="14" height="14" rx="2" />
          </svg>
          {formatearFechaPlan(plan.fecha)}
        </span>
        <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
          Periodo {plan.periodo || 1}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-violet-600">
          Tema de la clase
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-slate-950">
          {plan.tema || "Sin tema registrado"}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
          <span className="font-semibold text-slate-700">Unidad:</span>{" "}
          {plan.unidad || "Sin unidad registrada"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <EstadoRevisionBadge
          estado={plan.estado_revision}
          totalObservaciones={plan.total_observaciones}
          compact
        />
        {activo && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
            Plan en edición
          </span>
        )}
        {nuevas > 0 && (
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
            {nuevas} nueva{nuevas === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          disabled={activo}
          onClick={() => {
            if (!activo) onAbrirPlan(plan.fecha);
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-default disabled:bg-emerald-600"
        >
          {activo ? "En edición" : "Abrir plan"}
        </button>
      </div>
    </article>
  );
}

function EsqueletoHistorial({ cantidad }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      role="status"
      aria-label="Cargando planes guardados"
    >
      {Array.from({ length: cantidad }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-56 animate-pulse flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="h-7 w-28 rounded-full bg-slate-200" />
          <div className="mt-5 h-5 w-4/5 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded bg-slate-200" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-auto h-9 w-full rounded-lg bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
