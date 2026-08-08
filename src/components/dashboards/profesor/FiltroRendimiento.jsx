import { MATERIA_TODAS } from "../../../utils/dashboards/profesor";

// Primero el curso, después la materia. Cambiar de curso devuelve la materia a
// «todas»; esa regla vive en el hook.
function FiltroRendimiento({
  loadingClases,
  errorClases = "",
  cursosProfesor,
  cursoFiltro,
  onCambiarCurso,
  materiasDelCurso,
  materiaFiltro,
  onCambiarMateria,
}) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Filtro de rendimiento</p>
        <p className="text-sm text-gray-600">
          Primero selecciona el curso; luego mira todas las materias de ese curso o una materia especifica.
        </p>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Curso
          </label>
          <select
            value={cursoFiltro}
            onChange={(e) => onCambiarCurso(e.target.value)}
            disabled={loadingClases || cursosProfesor.length === 0}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {loadingClases && <option value="">Cargando cursos...</option>}
            {!loadingClases && cursosProfesor.length > 0 && <option value="" disabled>Selecciona un curso</option>}
            {!loadingClases && cursosProfesor.length === 0 && (
              <option value="">
                {errorClases ? "No se pudieron cargar los cursos" : "Sin cursos asignados"}
              </option>
            )}
            {cursosProfesor.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre} - {curso.jornada}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Materia
          </label>
          <select
            value={materiaFiltro}
            onChange={(e) => onCambiarMateria(e.target.value)}
            disabled={loadingClases || !cursoFiltro}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value={MATERIA_TODAS}>Todas las materias del curso</option>
            {materiasDelCurso.map((clase) => (
              <option key={clase.id} value={clase.id}>
                {clase.materia}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FiltroRendimiento;
