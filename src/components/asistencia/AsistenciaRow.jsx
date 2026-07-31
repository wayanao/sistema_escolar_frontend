function AsistenciaRow({ est, estado, marcar, cargandoHistorial, disabled = false }) {
  const inasistencias = (est.historial || []).filter((h) => h.estado === "ausente").length;
  const nombreCompleto = `${est.apellido} ${est.nombre}`;

  return (
    <div className={`mb-2 flex flex-col gap-3 rounded-lg border bg-white p-3 shadow-sm transition sm:flex-row sm:items-center sm:justify-between ${
      estado === "ausente"
        ? "border-red-200 bg-red-50/40"
        : estado === "presente"
          ? "border-emerald-200"
          : "border-gray-200"
    }`}>
      <div className="min-w-0">
        <span className="block truncate font-medium capitalize text-gray-900">
          {nombreCompleto}
        </span>
        <p className={`mt-1 text-sm font-semibold ${cargandoHistorial ? "text-gray-500" : "text-red-600"}`}>
          {cargandoHistorial ? "Cargando historial..." : `Inasistencias: ${inasistencias}`}
        </p>
      </div>

      <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto">
        <button
          type="button"
          disabled={disabled}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            estado === "presente"
              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
              : "border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50"
          }`}
          onClick={() => marcar(est.estudiante_id, "presente")}
          title={`Marcar presente a ${nombreCompleto}`}
          aria-label={`Marcar presente a ${nombreCompleto}`}
          aria-pressed={estado === "presente"}
        >
          <span aria-hidden="true">✔</span>
          Presente
        </button>

        <button
          type="button"
          disabled={disabled}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            estado === "ausente"
              ? "border-red-600 bg-red-600 text-white shadow-sm"
              : "border-gray-300 bg-white text-gray-700 hover:border-red-400 hover:bg-red-50"
          }`}
          onClick={() => marcar(est.estudiante_id, "ausente")}
          title={`Marcar ausente a ${nombreCompleto}`}
          aria-label={`Marcar ausente a ${nombreCompleto}`}
          aria-pressed={estado === "ausente"}
        >
          <span aria-hidden="true">✖</span>
          Ausente
        </button>
      </div>
    </div>
  );
}

export default AsistenciaRow;
