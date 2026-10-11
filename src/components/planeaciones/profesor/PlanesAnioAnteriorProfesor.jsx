import { formatearFechaPlan } from "../../../utils/planeaciones/profesor";

// Año lectivo, fase 7 (paso 7.4). Solo presentación: la página decide cuándo
// mostrarla (al crear un plan y si el backend trajo planes).
export default function PlanesAnioAnteriorProfesor({
  planes,
  abierto,
  usandoId,
  onAbrir,
  onCerrar,
  onUsar,
}) {
  const usando = usandoId !== null && usandoId !== undefined;

  return (
    <section
      aria-labelledby="titulo-planes-anio-anterior"
      className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            id="titulo-planes-anio-anterior"
            className="text-sm font-black uppercase tracking-wide text-violet-900"
          >
            Planes del año pasado
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Puedes partir de un plan del año pasado de esta materia. Se copia solo
            el texto: la fecha, el periodo y las evidencias son las de tu plan
            nuevo.
          </p>
        </div>
        {abierto ? (
          <button
            type="button"
            onClick={onCerrar}
            className="w-full shrink-0 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 sm:w-auto"
          >
            Cerrar la lista
          </button>
        ) : (
          <button
            type="button"
            onClick={onAbrir}
            className="w-full shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:w-auto"
          >
            Usar un plan del año pasado
          </button>
        )}
      </div>

      {abierto && (
        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          {planes.map((plan) => {
            const fecha = formatearFechaPlan(plan.fecha);
            const esteSeUsa = usandoId === plan.id;
            return (
              <li
                key={plan.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">
                    <span>{fecha}</span>
                    {" · "}
                    <span>Periodo {plan.periodo}</span>
                  </p>
                  <p className="mt-0.5 break-words text-sm font-bold text-slate-900">
                    {plan.unidad || "Sin unidad"}
                  </p>
                  <p className="break-words text-sm text-slate-700">
                    {plan.tema || "Sin tema"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUsar(plan)}
                  disabled={usando}
                  aria-label={`Usar el plan del ${fecha}`}
                  className="w-full shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300 sm:w-auto"
                >
                  {esteSeUsa ? "Usando..." : "Usar este plan"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
