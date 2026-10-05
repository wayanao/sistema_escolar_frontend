import { FILTROS_ESTUDIANTE } from "../../../utils/estudiantesObservador/estudiantes";

export default function EncabezadoEstudiantesAdmin({
  searchTerm,
  onCambiarBusqueda,
  estadoFiltro,
  onCambiarEstadoFiltro,
  showForm,
  onAlternarFormulario,
  // Falso mirando un año que no es el activo: Estudiantes es solo consulta.
  puedeCrear = true,
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Estudiantes
        </h1>
        <p className="text-gray-600">
          Administra la información de los estudiantes del sistema
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:max-w-2xl sm:flex-row">
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <select
            value={estadoFiltro}
            onChange={(e) => onCambiarEstadoFiltro(e.target.value)}
            className="w-full sm:w-44 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {FILTROS_ESTUDIANTE.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>
        {puedeCrear && (
          <button
            onClick={onAlternarFormulario}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            {showForm ? "Cancelar" : "Nuevo Estudiante"}
          </button>
        )}
      </div>
    </>
  );
}
