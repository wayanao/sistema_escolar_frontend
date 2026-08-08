import { claseNotaBaja, formatearPromedio } from "../../../utils/dashboards/profesor";

// Hermana de TarjetaMejorRendimiento: el color del promedio lo decide el campo
// `color` del backend, mientras que en la otra tarjeta es fijo.
function TarjetaBajoRendimiento({
  notasBajas,
  loading,
  error = "",
  cursoFiltroNombre,
  materiaFiltroNombre,
  onVerRanking,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
      <div className="p-6">
        <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
          <span className="text-2xl" aria-hidden="true">↓</span>
        </div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
          Estudiantes con bajo rendimiento
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
              {cursoFiltroNombre}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
              {materiaFiltroNombre}
            </span>
          </div>
        </div>
        {loading ? (
          <p className="text-sm font-medium text-gray-500">Cargando rendimiento...</p>
        ) : notasBajas.length > 0 ? (
          <div className="space-y-2">
            {notasBajas.map((estudiante, index) => (
              <div key={`${estudiante.nombre}-${index}`} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-gray-900">{estudiante.nombre}</p>
                  <p className={`text-sm font-bold ${claseNotaBaja(estudiante.color)}`}>
                    {formatearPromedio(estudiante.promedio)}
                  </p>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-gray-600">
                  Curso: {estudiante.curso} · Materia: {estudiante.materia || materiaFiltroNombre}
                </p>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : (
          <p className="text-gray-600">No hay estudiantes con bajo rendimiento</p>
        )}
        <button
          type="button"
          onClick={onVerRanking}
          className="mt-4 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Ver ranking por materia
        </button>
      </div>
    </div>
  );
}

export default TarjetaBajoRendimiento;
