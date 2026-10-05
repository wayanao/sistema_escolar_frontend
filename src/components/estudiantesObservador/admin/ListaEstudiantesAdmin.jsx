import {
  ESTADOS_ESTUDIANTE,
  obtenerEtiquetaEstadoEstudiante,
} from "../../../utils/estudiantesObservador/estudiantes";

const estadoClasses = {
  activo: "bg-green-100 text-green-800 border-green-200",
  retirado: "bg-yellow-100 text-yellow-800 border-yellow-200",
  egresado: "bg-blue-100 text-blue-800 border-blue-200",
  inactivo: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ListaEstudiantesAdmin({
  estudiantes,
  cursos,
  onVerDetalles,
  onCambiarEstado,
  onEditar,
  // Falso mirando un año que no es el activo: sin cambiar el estado ni
  // editar (la ficha se sigue abriendo).
  puedeEditar = true,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">
          Lista de Estudiantes ({estudiantes.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre del Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              {puedeEditar && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {estudiantes.map((estudiante) => (
              <tr
                key={estudiante.id}
                className="hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onVerDetalles(estudiante)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {estudiante.apellido.charAt(0)}
                          {estudiante.nombre.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 border-b border-transparent hover:border-purple-500 text-left capitalize">
                        {estudiante.apellido} {estudiante.nombre}{" "}
                        <span className="ml-2 text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
                          {cursos.find((curso) => curso.id === estudiante.curso_id)
                            ?.nombre || "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 text-left">
                        Click para ver detalles
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses[estudiante.estado || "activo"] || estadoClasses.activo}`}
                  >
                    {obtenerEtiquetaEstadoEstudiante(
                      estudiante.estado || "activo",
                    )}
                  </span>
                </td>
                {puedeEditar && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <select
                        value={estudiante.estado || "activo"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          onCambiarEstado(estudiante, e.target.value);
                        }}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                      >
                        {ESTADOS_ESTUDIANTE.map((estado) => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(estudiante.id);
                        }}
                        className="text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {estudiantes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">👨‍🎓</div>
          <p>No se encontraron estudiantes</p>
        </div>
      )}
    </div>
  );
}
