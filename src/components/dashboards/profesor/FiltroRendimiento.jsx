import { MATERIA_TODAS } from "../../../utils/dashboards/profesor";

const SELECT =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100 disabled:bg-slate-100 disabled:text-slate-500";

// Primero el curso, después la materia. Cambiar de curso devuelve la materia a
// «todas»; esa regla vive en el hook. Las fallas no dependen de este filtro.
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
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-900">¿De qué curso quieres ver los promedios?</p>
      <p className="text-sm text-slate-600">Elige el curso y, si quieres, una sola materia.</p>
      <div className="mt-3 grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Curso
          </label>
          <select
            value={cursoFiltro}
            onChange={(e) => onCambiarCurso(e.target.value)}
            disabled={loadingClases || cursosProfesor.length === 0}
            className={SELECT}
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
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Materia
          </label>
          <select
            value={materiaFiltro}
            onChange={(e) => onCambiarMateria(e.target.value)}
            disabled={loadingClases || !cursoFiltro}
            className={SELECT}
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
