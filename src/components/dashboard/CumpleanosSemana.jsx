const nombreCompleto = (estudiante) =>
  `${estudiante?.nombre || ""} ${estudiante?.apellido || ""}`.trim() || "Estudiante";

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

const obtenerInfoCumpleanos = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const match = String(fechaNacimiento).match(/^(\d{4})-\d{2}-\d{2}/);
  if (!match) return null;

  const [anio, mes, dia] = String(fechaNacimiento)
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!anio || !mes || !dia) return null;

  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  let fechaCumple = new Date(hoy.getFullYear(), mes - 1, dia);

  if (fechaCumple < hoy) {
    fechaCumple = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  }

  const dias = Math.round((fechaCumple - hoy) / MILISEGUNDOS_DIA);
  const edad = fechaCumple.getFullYear() - anio;
  const etiqueta = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : `En ${dias} días`;

  return {
    dias,
    edad: edad > 0 ? edad : null,
    etiqueta,
  };
};

function CumpleanosSemana({
  estudiantes = [],
  loading = false,
  error = "",
  className = "",
  emptyText = "Esta semana no hay cumpleaños registrados.",
  diasRango = 7,
}) {
  const estudiantesOrdenados = [...estudiantes].sort((a, b) => {
    const diasA = obtenerInfoCumpleanos(a.fecha_nacimiento)?.dias ?? 999;
    const diasB = obtenerInfoCumpleanos(b.fecha_nacimiento)?.dias ?? 999;
    return diasA - diasB || nombreCompleto(a).localeCompare(nombreCompleto(b));
  });
  const total = estudiantesOrdenados.length;

  return (
    <section
      className={`overflow-hidden rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-amber-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
            Cumpleaños de la semana
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">Celebraciones próximas</h2>
        </div>
        <span className="w-max rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700 shadow-sm">
          🎂 {loading ? "Consultando..." : `${total} en ${diasRango} días`}
        </span>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <p className="text-sm font-medium text-gray-600">Consultando cumpleaños...</p>
        ) : error ? (
          <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : total === 0 ? (
          <p className="rounded-md border border-dashed border-amber-200 bg-white/70 px-3 py-3 text-sm text-gray-600">
            {emptyText}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {estudiantesOrdenados.map((estudiante) => {
              const infoCumpleanos = obtenerInfoCumpleanos(estudiante.fecha_nacimiento);

              return (
                <article
                  key={estudiante.estudiante_id || estudiante.id}
                  className="rounded-lg border border-amber-100 bg-white/85 px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl">
                      🎈
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-950">
                        {nombreCompleto(estudiante)}
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-gray-600">
                        Curso: {estudiante.curso || "Sin curso"}
                      </p>
                      {infoCumpleanos && (
                        <p className="mt-1 text-xs font-bold text-amber-700">
                          {infoCumpleanos.etiqueta}
                          {infoCumpleanos.edad ? ` · Cumple ${infoCumpleanos.edad} años` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default CumpleanosSemana;
