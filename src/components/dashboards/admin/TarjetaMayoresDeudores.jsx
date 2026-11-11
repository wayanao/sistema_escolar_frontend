import { montoVisible } from "../../../utils/dashboards/admin";

/**
 * «Los 5 que más deben» este año, de mayor a menor. Cada fila trae su barrita
 * frente al mayor y un botón «Cobrar» que abre Gestión de Pagos con ese
 * estudiante. Los datos llegan ya armados (`mayoresDeudores`); aquí solo se
 * pintan.
 */
function TarjetaMayoresDeudores({
  deudores = [],
  cargando = false,
  error = "",
  valoresOcultos = false,
  onCobrar,
  onVerCartera,
  className = "",
}) {
  return (
    <section
      aria-labelledby="titulo-mayores-deudores"
      className={`flex min-w-0 flex-col rounded-3xl border border-purple-100 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 px-5 pb-2 pt-5 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 18l6-6 4 4 6-8" />
            <path d="M15 8h5v5" />
          </svg>
        </span>
        <div>
          <h2 id="titulo-mayores-deudores" className="text-base font-extrabold text-slate-950">
            Los 5 que más deben
          </h2>
          <p className="text-sm text-slate-600">Este año, de mayor a menor</p>
        </div>
      </div>

      {cargando ? (
        <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">Cargando la cartera…</p>
      ) : error ? (
        <p role="alert" className="mx-5 my-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 sm:mx-6">
          {error}
        </p>
      ) : !deudores.length ? (
        <p className="px-5 py-4 text-sm text-slate-600 sm:px-6">Nadie debe este año.</p>
      ) : (
        <ol className="px-2 py-1 sm:px-3">
          {deudores.map((deudor) => (
            <li key={deudor.estudianteId} className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-2xl p-3">
              <div className="flex min-w-0 flex-[999_1_240px] items-center gap-3">
                <span className="w-4 shrink-0 text-center text-sm font-extrabold tabular-nums text-slate-500">{deudor.puesto}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-extrabold text-rose-800" aria-hidden="true">
                  {deudor.iniciales}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 break-words text-[15px] font-bold leading-snug text-slate-950" translate="no">
                      {deudor.nombre}
                    </span>
                    <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-rose-700">
                      {montoVisible(deudor.total, valoresOcultos)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-slate-600">
                    {[deudor.curso, deudor.detalle].filter(Boolean).join(" · ")}
                  </p>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-rose-100" aria-hidden="true">
                    <span className="block h-1.5 rounded-full bg-rose-600" style={{ width: `${deudor.porcentaje}%` }} />
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCobrar(deudor.estudianteId)}
                aria-label={`Cobrar a ${deudor.nombre}`}
                className="min-h-[44px] flex-[1_1_92px] rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Cobrar
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-auto border-t border-purple-50 px-5 py-1.5 sm:px-6">
        <button
          type="button"
          onClick={onVerCartera}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-extrabold text-purple-700 transition hover:text-purple-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
        >
          Ver toda la cartera vencida
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default TarjetaMayoresDeudores;
