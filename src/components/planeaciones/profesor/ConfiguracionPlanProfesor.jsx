const campoBase =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

export default function ConfiguracionPlanProfesor({
  asignacionId,
  clases,
  cargandoClases,
  periodo,
  fecha,
  onCambiarAsignacion,
  onCambiarPeriodo,
  onCambiarFecha,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-950">
          Configura tu clase
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Selecciona dónde y cuándo vas a desarrollar la planeación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-10">
        <div className="md:col-span-5">
          <EtiquetaConfiguracion
            htmlFor="plan-clase-asignada"
            label="Clase asignada"
            tono="purple"
            icono={<IconoLibro />}
          />
          <select
            id="plan-clase-asignada"
            value={asignacionId}
            onChange={(event) => onCambiarAsignacion(event.target.value)}
            disabled={cargandoClases}
            className={campoBase}
          >
            <option value="">
              {cargandoClases ? "Cargando clases..." : "Selecciona una clase"}
            </option>
            {clases.map((claseItem) => (
              <option key={claseItem.id} value={claseItem.id}>
                {claseItem.materia} - {claseItem.curso}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <EtiquetaConfiguracion
            htmlFor="plan-periodo"
            label="Periodo"
            tono="emerald"
            icono={<IconoCalendario />}
          />
          <select
            id="plan-periodo"
            value={periodo}
            onChange={(event) => onCambiarPeriodo(event.target.value)}
            className={campoBase}
          >
            <option value="1">Periodo 1</option>
            <option value="2">Periodo 2</option>
            <option value="3">Periodo 3</option>
            <option value="4">Periodo 4</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <EtiquetaConfiguracion
            htmlFor="plan-fecha"
            label="Fecha"
            tono="sky"
            icono={<IconoFecha />}
          />
          <input
            id="plan-fecha"
            type="date"
            value={fecha}
            onChange={(event) => onCambiarFecha(event.target.value)}
            className={campoBase}
          />
        </div>
      </div>
    </section>
  );
}

function EtiquetaConfiguracion({ htmlFor, label, tono, icono }) {
  const tonos = {
    purple: "bg-purple-100 text-purple-700",
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
  };

  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${tonos[tono]}`}
        aria-hidden="true"
      >
        {icono}
      </span>
      {label}
    </label>
  );
}

function IconoLibro() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
    </svg>
  );
}

function IconoFecha() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}
