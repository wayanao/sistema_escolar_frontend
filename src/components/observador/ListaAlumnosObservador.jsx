/**
 * Los alumnos de la asignación elegida, **solo sus nombres**.
 *
 * Es una única petición para toda la lista, la que ya hacía la planilla. La
 * bitácora de un alumno se pide al abrirlo, no antes: es lo que evita las doce
 * peticiones simultáneas de la pantalla vieja.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function ListaAlumnosObservador({
  busqueda,
  onCambiarBusqueda,
  estudiantes,
  cargando,
  error,
  onAbrir,
}) {
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
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          No se pudo cargar la lista de estudiantes. Intenta recargar la página.
        </p>
      )}

      {!cargando && !error && estudiantes.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No hay estudiantes que coincidan.
        </p>
      )}

      <ul className="space-y-2">
        {estudiantes.map((estudiante) => (
          <li key={estudiante.estudiante_id}>
            <button
              type="button"
              onClick={() => onAbrir(estudiante)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {`${estudiante.nombre} ${estudiante.apellido}`.trim()}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
