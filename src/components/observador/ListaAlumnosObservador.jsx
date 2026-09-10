import {
  agruparAlumnosPorCurso,
  nombreCompletoAlumno,
} from "../../utils/observador/alumnos";

/**
 * Los alumnos del profesor, **solo sus nombres**, agrupados por curso.
 *
 * Es una única petición para toda la lista, sin necesidad de elegir clase. La
 * bitácora de un alumno se pide al abrirlo, no antes: es lo que evita las doce
 * peticiones simultáneas de la pantalla vieja.
 *
 * Se agrupa por curso porque un profesor puede tener 81 alumnos en seis cursos
 * —medido—, y una lista plana de 81 nombres no se lee.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function ListaAlumnosObservador({
  busqueda,
  onCambiarBusqueda,
  estudiantes,
  cargando,
  error,
  onReintentar,
  onAbrir,
}) {
  const grupos = agruparAlumnosPorCurso(estudiantes);

  return (
    <section className="space-y-3">
      <label className="block">
        <span className="sr-only">Buscar estudiante</span>
        <input
          type="search"
          placeholder="Buscar estudiante..."
          value={busqueda}
          onChange={(event) => onCambiarBusqueda(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-sm"
        />
      </label>

      {cargando && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Cargando estudiantes...
        </p>
      )}

      {!cargando && error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p>{error}</p>
          {onReintentar && (
            <button
              type="button"
              onClick={onReintentar}
              className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1 font-medium hover:bg-rose-100"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {!cargando && !error && grupos.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {busqueda
            ? "No hay estudiantes que coincidan."
            : "No tienes estudiantes asignados todavía."}
        </p>
      )}

      {!cargando
        && !error
        && grupos.map((grupo) => (
          <div key={grupo.curso} className="space-y-2">
            <h2 className="border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
              {grupo.curso}
              <span className="ml-2 font-normal normal-case text-slate-500">
                {grupo.alumnos.length}
              </span>
            </h2>
            <ul className="space-y-2">
              {grupo.alumnos.map((estudiante) => (
                <li key={estudiante.estudiante_id}>
                  <button
                    type="button"
                    onClick={() => onAbrir(estudiante)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    {nombreCompletoAlumno(estudiante)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
