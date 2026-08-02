import { documentoEstudiante } from "../../utils/boletines/generacionBoletin";

export default function SeleccionBoletinAdministrativo({
  busqueda,
  cargando,
  cargandoBoletin,
  cursoSeleccionado,
  cursos,
  estudiantes,
  periodo,
  onCambiarBusqueda,
  onCambiarCurso,
  onCambiarPeriodo,
  onGenerarBoletin,
}) {
  return (
    <div className="w-full p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Generar Boletines Administrativos
      </h1>
      <p className="text-gray-600 mb-8">
        Escoge un estudiante para extraer y consolidar las notas digitadas por los profesores.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          className="p-3 border rounded-lg shadow-sm w-full md:w-1/3 focus:ring-2 focus:ring-purple-500"
          value={cursoSeleccionado}
          onChange={(event) => onCambiarCurso(event.target.value)}
        >
          <option value="">-- Todos los Cursos --</option>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              {curso.nombre} ({curso.jornada || "Mañana"})
            </option>
          ))}
        </select>

        <input
          type="text"
          className="p-3 border rounded-lg shadow-sm w-full md:w-2/3 focus:ring-2 focus:ring-purple-500"
          placeholder="Buscar alumno por nombre, apellido o documento..."
          value={busqueda}
          onChange={(event) => onCambiarBusqueda(event.target.value)}
        />

        <select
          className="p-3 border rounded-lg shadow-sm w-full md:w-32 focus:ring-2 focus:ring-purple-500 border-purple-300"
          value={periodo}
          onChange={(event) => onCambiarPeriodo(event.target.value)}
          title="Periodo Académico"
        >
          <option value={1}>Per 1</option>
          <option value={2}>Per 2</option>
          <option value={3}>Per 3</option>
          <option value={4}>Per 4</option>
        </select>
      </div>

      {cargando ? (
        <div className="animate-pulse p-10 text-center text-gray-500 font-bold">
          Cargando base de datos...
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-4 font-semibold">Documento</th>
                  <th className="p-4 font-semibold">Estudiante</th>
                  <th className="p-4 font-semibold">Curso</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estudiantes.map((estudiante) => {
                  const curso = cursos.find(
                    (item) => item.id === estudiante.curso_id,
                  );
                  const cursoNombre = curso ? curso.nombre : "Sin Asignar";

                  return (
                    <tr
                      key={estudiante.id}
                      className="hover:bg-purple-50 transition duration-150"
                    >
                      <td className="p-4 text-sm text-gray-600">
                        {documentoEstudiante(estudiante)}
                      </td>
                      <td className="p-4 font-bold text-gray-800 uppercase">
                        {estudiante.apellido}, {estudiante.nombre}
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-medium">
                        {cursoNombre}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={cargandoBoletin}
                          onClick={() => onGenerarBoletin(estudiante.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition transform hover:-translate-y-1 disabled:opacity-50"
                        >
                          {cargandoBoletin
                            ? "⏳ Generando..."
                            : "📄 Generar Boletín"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {estudiantes.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      No se encontraron estudiantes asociados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
