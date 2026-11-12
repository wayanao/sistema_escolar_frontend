import ManitoSaludo from "../ManitoSaludo";

function IconoOjo({ tachado }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tachado ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1" />
          <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7c2 0 3.8-.6 5.4-1.6" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

/**
 * Lo primero del panel de administración (2026-11-11), con el mismo estilo
 * del panel del profesor: suelto sobre el fondo de la app, sin caja. A la
 * derecha, la fecha y el botón que tapa los montos cuando hay alguien al lado
 * mirando la pantalla. Solo presenta: todo llega por props.
 */
function EncabezadoPanelAdmin({ nombreAdmin, fechaDeHoy, valoresOcultos = false, onAlternarValores }) {
  return (
    <header className="mb-6 flex flex-col gap-4 px-1 pt-1 sm:flex-row sm:items-end sm:justify-between sm:pt-2">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">Panel de administración</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          Hola,{" "}
          {/* La manito va pegada al nombre: si no cabe, bajan juntos de línea. */}
          <span className="whitespace-nowrap">
            <span translate="no">{nombreAdmin}</span>
            <ManitoSaludo className="ml-2 h-[1.25em] w-[1.25em] -translate-y-[0.08em] align-middle" />
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Así van los pagos del colegio hoy.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <p className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-4 text-sm font-semibold text-purple-900 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
          </svg>
          {fechaDeHoy}
        </p>
        <button
          type="button"
          onClick={onAlternarValores}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-4 text-sm font-bold text-purple-900 shadow-sm transition hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
        >
          <IconoOjo tachado={!valoresOcultos} />
          {valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
        </button>
      </div>
    </header>
  );
}

export default EncabezadoPanelAdmin;
