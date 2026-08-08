// El error se pinta distinto del estado vacío: «no hay inasistencias» y «no se
// pudieron cargar» son dos cosas diferentes.
function TarjetaInasistencias({ inasistencias, loading, error = "" }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
      <div className="p-6">
        <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
          <span className="text-2xl" aria-hidden="true">!</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ranking de inasistencias por curso
        </h3>
        {loading ? (
          <p className="text-sm font-medium text-gray-500">Cargando inasistencias...</p>
        ) : inasistencias.length > 0 ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {inasistencias.map((item) => (
              <div
                key={`${item.curso_id}-${item.estudiante_id}-${item.posicion}`}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      #{item.posicion}
                    </span>
                    <p className="truncate text-sm font-semibold text-gray-900">{item.nombre}</p>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-gray-600">Curso: {item.curso}</p>
                </div>
                <span className="shrink-0 rounded bg-white px-2 py-1 text-sm font-bold text-red-600">
                  {item.total_fallas}
                </span>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : (
          <p className="text-gray-600">No hay datos disponibles</p>
        )}
      </div>
    </div>
  );
}

export default TarjetaInasistencias;
