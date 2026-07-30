export default function EncabezadoPlanProfesor({
  estadoVisual,
  avisoGuardadoId,
  planActualId,
}) {
  return (
    <section className="rounded-xl border border-purple-100 bg-white/95 px-4 py-3 shadow-sm sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-10 w-1 shrink-0 rounded-full bg-purple-600"
            aria-hidden="true"
          ></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
                Plan de clases
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                Taller docente
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-600">
              Diseña la clase del día con propósito, actividades y evidencias
              claras.
            </p>
          </div>
        </div>

        <div
          key={`aviso-guardado-${avisoGuardadoId}`}
          className={`flex w-full items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs shadow-sm sm:w-auto ${estadoVisual.badgeClass} ${
            avisoGuardadoId > 0 ? "estado-guardado-campana" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${estadoVisual.dotClass}`}
            aria-hidden="true"
          ></span>
          <span className="shrink-0 font-bold">{estadoVisual.label}</span>
          <span
            className="h-4 w-px shrink-0 bg-current opacity-20"
            aria-hidden="true"
          ></span>
          <span className="min-w-0 truncate font-medium opacity-80">
            {estadoVisual.detail}
          </span>
          {planActualId && (
            <>
              <span
                className="hidden h-4 w-px shrink-0 bg-current opacity-20 sm:block"
                aria-hidden="true"
              ></span>
              <span className="hidden shrink-0 font-semibold opacity-70 sm:inline">
                Plan #{planActualId}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
