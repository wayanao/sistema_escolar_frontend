export default function ListaEstudiantesPagos({
  estudiantes,
  loading,
  searchTerm,
  selectedEstudianteId,
  obtenerNombreCurso,
  onSearchTermChange,
  onSelectEstudiante,
}) {
  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-[calc(100vh-140px)] flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Estudiantes</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
        {loading ? (
          <p className="text-gray-500 text-sm">Cargando...</p>
        ) : estudiantes.length === 0 ? (
          <p className="text-gray-500 text-sm">No se encontraron estudiantes.</p>
        ) : (
          estudiantes.map((estudiante) => (
            <div
              key={estudiante.id}
              onClick={() => onSelectEstudiante(estudiante)}
              className={"p-3 rounded-lg border cursor-pointer transition-colors " +
                (selectedEstudianteId === estudiante.id
                  ? "bg-purple-50 border-purple-600 text-purple-900 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100")
              }
            >
              <div className="font-medium capitalize leading-snug">
                {estudiante.apellido} {estudiante.nombre}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-500">
                <span>Doc: {estudiante.documento || "N/A"}</span>
                <span className="text-gray-300" aria-hidden="true">|</span>
                <span className="max-w-full truncate text-xs font-semibold uppercase tracking-wide text-purple-700">
                  {obtenerNombreCurso(estudiante)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
