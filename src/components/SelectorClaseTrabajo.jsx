import { Children } from "react";

const FLECHA = (
  <path
    fillRule="evenodd"
    d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
    clipRule="evenodd"
  />
);

const TONOS_ETIQUETA = {
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
};

const ICONOS_ETIQUETA = {
  libro: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </>
  ),
  calendario: (
    <>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
    </>
  ),
  lista: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />,
};

/** Etiqueta con su icono, igual en todos los campos del selector. */
export function EtiquetaCampoTrabajo({ htmlFor, tono = "purple", icono = "libro", children }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONOS_ETIQUETA[tono]}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          {ICONOS_ETIQUETA[icono]}
        </svg>
      </span>
      {children}
    </label>
  );
}

/** Flecha del `select`, dibujada encima porque el nativo se oculta. */
export function FlechaSelect({ className = "text-gray-500" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 ${className}`}
      aria-hidden="true"
    >
      {FLECHA}
    </svg>
  );
}

function textoSinElegir({ cargando, error, hayOpciones }) {
  if (cargando) return "Cargando clases…";
  if (error) return "No se pudieron cargar las clases";
  if (!hayOpciones) return "Sin clases asignadas";
  return "Elige una clase";
}

/**
 * Clase y período con los que trabaja el profesor, dentro de la propia
 * pantalla (Planilla, Asistencia). `children` son los campos propios de cada
 * pantalla (la fecha en Asistencia, el tipo de calificación en Planilla).
 *
 * Solo presenta: la lista, lo elegido y qué hacer al cambiarlo llegan por
 * props.
 */
function SelectorClaseTrabajo({
  idPrefijo,
  opciones,
  asignacionId,
  onCambiarAsignacion,
  cargando = false,
  error = "",
  onReintentar,
  ayudaClase = "",
  periodo,
  onCambiarPeriodo,
  children,
}) {
  const conCamposExtra = Children.toArray(children).length > 0;
  const idClase = `${idPrefijo}-clase`;
  const idPeriodo = `${idPrefijo}-periodo`;
  const hayOpciones = opciones.length > 0;

  const columnas = conCamposExtra
    ? "grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(9rem,0.5fr)_minmax(12rem,0.7fr)]"
    : "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,14rem)]";

  return (
    <div className={`grid gap-4 ${columnas}`}>
      <div className={conCamposExtra ? "col-span-2 lg:col-span-1" : ""}>
        <EtiquetaCampoTrabajo htmlFor={idClase} tono="purple" icono="libro">
          Clase / grupo
        </EtiquetaCampoTrabajo>
        <div className="relative">
          <select
            id={idClase}
            value={asignacionId || ""}
            onChange={(e) => onCambiarAsignacion(e.target.value)}
            disabled={cargando}
            translate="no"
            className="min-h-12 w-full appearance-none rounded-xl border border-purple-200 bg-purple-50/70 py-3 pl-4 pr-11 text-base font-semibold text-purple-950 shadow-sm outline-none transition hover:border-purple-300 hover:bg-purple-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 disabled:cursor-wait disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="" disabled>
              {textoSinElegir({ cargando, error, hayOpciones })}
            </option>
            {opciones.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
          <FlechaSelect />
        </div>
        {error && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-rose-700">
            {error}
            {onReintentar && (
              <button
                type="button"
                onClick={onReintentar}
                className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
              >
                Reintentar
              </button>
            )}
          </p>
        )}
        {ayudaClase && !error && (
          <p className="mt-2 text-sm text-gray-600">{ayudaClase}</p>
        )}
      </div>

      <div>
        <EtiquetaCampoTrabajo htmlFor={idPeriodo} tono="emerald" icono="calendario">
          Período
        </EtiquetaCampoTrabajo>
        <div className="relative">
          <select
            id={idPeriodo}
            value={periodo}
            onChange={(e) => onCambiarPeriodo(e.target.value)}
            className="min-h-12 w-full appearance-none rounded-xl border border-emerald-100 bg-emerald-50/40 py-3 pl-4 pr-11 text-base font-semibold text-emerald-950 shadow-sm outline-none transition hover:border-emerald-200 hover:bg-emerald-50/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/70"
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
          <FlechaSelect className="text-emerald-700" />
        </div>
      </div>

      {children}
    </div>
  );
}

export default SelectorClaseTrabajo;
