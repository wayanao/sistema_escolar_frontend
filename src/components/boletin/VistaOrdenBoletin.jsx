// `puedeEditar` en falso (un año cerrado) deja el orden solo para consultar:
// sin A-Z, sin guardar y sin mover materias.
export default function VistaOrdenBoletin({
  cargandoCursos,
  cargandoOrden,
  cursoId,
  cursos,
  cursoSeleccionado,
  guardando,
  materias,
  mensaje,
  puedeEditar = true,
  onCambiarCurso,
  onGuardarOrden,
  onMoverAPosicion,
  onMoverMateria,
  onOrdenarAlfabetico,
}) {
  if (cargandoCursos) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm font-medium text-gray-500 shadow-sm">
        Cargando cursos...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Curso
            </label>
            <select
              value={cursoId}
              onChange={(event) => onCambiarCurso(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 lg:max-w-md"
            >
              <option value="">Seleccionar curso</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nombre}
                  {curso.jornada ? ` (${curso.jornada})` : ""}
                </option>
              ))}
            </select>
          </div>

          {puedeEditar && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onOrdenarAlfabetico}
                disabled={guardando || materias.length === 0}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                A-Z
              </button>
              <button
                type="button"
                onClick={onGuardarOrden}
                disabled={guardando || materias.length === 0}
                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar orden"}
              </button>
            </div>
          )}
        </div>

        {cursoSeleccionado && (
          <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-900">
            {cursoSeleccionado.nombre}
            {cursoSeleccionado.jornada
              ? ` · ${cursoSeleccionado.jornada}`
              : ""}
          </div>
        )}
      </section>

      {mensaje && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            mensaje.toLowerCase().includes("correctamente")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {mensaje}
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="text-lg font-bold text-gray-900">
            Materias del boletín
          </h2>
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
            {materias.length}
          </span>
        </div>

        {cargandoOrden ? (
          <div className="p-6 text-sm font-medium text-gray-500">
            Cargando materias...
          </div>
        ) : materias.length === 0 ? (
          <div className="p-6 text-sm font-medium text-gray-500">
            No hay materias asignadas para este curso.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {materias.map((materia, index) => (
              <article
                key={`${materia.curso_id}-${materia.materia_id}`}
                className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  {puedeEditar && (
                    <input
                      type="number"
                      min="1"
                      max={materias.length}
                      value={index + 1}
                      onChange={(event) =>
                        onMoverAPosicion(index, event.target.value)
                      }
                      className="h-10 w-20 rounded-lg border border-gray-300 px-2 text-center text-sm font-bold text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      aria-label={`Posición de ${materia.materia_nombre}`}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h3
                    className="truncate text-sm font-black uppercase tracking-wide text-gray-900"
                    translate="no"
                  >
                    {materia.materia_nombre}
                  </h3>
                  <p
                    className="mt-1 truncate text-xs font-medium text-gray-500"
                    translate="no"
                  >
                    {materia.profesor_nombre || "Sin profesor"} · {materia.horarios}{" "}
                    horario(s)
                  </p>
                </div>

                {puedeEditar && (
                  <div className="flex gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onMoverMateria(index, -1)}
                      disabled={index === 0 || guardando}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                      title="Subir"
                      aria-label={`Subir ${materia.materia_nombre}`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoverMateria(index, 1)}
                      disabled={index === materias.length - 1 || guardando}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg font-black text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                      title="Bajar"
                      aria-label={`Bajar ${materia.materia_nombre}`}
                    >
                      ↓
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
