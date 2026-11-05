// Año lectivo, fase 7 (paso 7.3). Solo presentación: la página decide cuándo
// mostrarla, con lo que dice el backend.
export default function TraerPlaneadorAnioAnteriorView({ onTraer, trayendo }) {
  return (
    <section
      aria-labelledby="titulo-planeador-anio-anterior"
      className="mb-4 flex flex-col gap-3 rounded-lg border border-purple-200 bg-white p-4 shadow-sm no-print sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2
          id="titulo-planeador-anio-anterior"
          className="text-sm font-black uppercase tracking-wide text-purple-900"
        >
          Planeador del año pasado
        </h2>
        <p className="mt-1 text-sm text-gray-700">
          Tu planeador de esta clase está vacío. Puedes traer el del año pasado
          de esta materia como base: se copian los textos de los cuatro periodos,
          sin las fechas.
        </p>
      </div>
      <button
        type="button"
        onClick={onTraer}
        disabled={trayendo}
        className="w-full shrink-0 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-purple-800 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300 sm:w-auto"
      >
        {trayendo ? "Trayendo..." : "Traer el planeador del año pasado"}
      </button>
    </section>
  );
}
