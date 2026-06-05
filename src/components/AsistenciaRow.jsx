function AsistenciaRow({ est, asistencia, marcar }) {
    const inasistencias = (est.historial || []).filter((h) => h.estado === "ausente").length;
    const nombreCompleto = `${est.apellido} ${est.nombre}`;

    return (
        <div className="mb-2 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <span className="block truncate font-medium capitalize text-gray-900">
                    {nombreCompleto}
                </span>
                <p className="mt-1 text-sm font-semibold text-red-600">
                    Inasistencias: {inasistencias}
                </p>
            </div>

            <div className="flex shrink-0 gap-2">
                <button
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                        asistencia[est.estudiante_id] === "presente"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200"
                    }`}
                    onClick={() => marcar(est.estudiante_id, "presente")}
                    title={`Marcar presente a ${nombreCompleto}`}
                    aria-label={`Marcar presente a ${nombreCompleto}`}
                >
                    ✔
                </button>

                <button
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded border text-sm ${
                        asistencia[est.estudiante_id] === "ausente"
                            ? "bg-red-500 text-white"
                            : "bg-gray-200"
                    }`}
                    onClick={() => marcar(est.estudiante_id, "ausente")}
                    title={`Marcar ausente a ${nombreCompleto}`}
                    aria-label={`Marcar ausente a ${nombreCompleto}`}
                >
                    ✖
                </button>
            </div>
        </div>
    );
}

export default AsistenciaRow;
