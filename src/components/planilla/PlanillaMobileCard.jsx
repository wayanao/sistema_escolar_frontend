import { VALORACIONES_DESARROLLO } from "../../constants/valoracionesDesarrollo";

function PlanillaMobileCard({ est, numero, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna }) {
    const nombreCompleto = `${est.apellido || ""} ${est.nombre || ""}`.trim();
    const promedioNumerico = Number(est.promedio);
    const promedioClass = tipoEvaluacion === "desarrollo" || Number.isNaN(promedioNumerico)
        ? "text-gray-500"
        : promedioNumerico >= 3
            ? "text-emerald-600"
            : "text-red-600";
    const promedioMostrado = tipoEvaluacion === "desarrollo"
        ? "—"
        : Number.isNaN(promedioNumerico)
            ? est.promedio
            : promedioNumerico.toFixed(2);
    const guardarNotaNumerica = async (event, columna) => {
        const input = event.currentTarget;
        const notaAnterior = est.notas?.[columna];
        const valorAnterior = notaAnterior !== null && notaAnterior !== undefined
            ? String(notaAnterior)
            : "";
        const guardadoExitoso = await guardarNota(est.estudiante_id, columna, input.value);

        if (guardadoExitoso === false) {
            input.value = valorAnterior;
            input.focus();
            input.select();
        }
    };

    return (
        <article className="border-b border-gray-200 last:border-b-0">
            <div className="p-4">
                <div className="mb-4 flex items-start gap-3">
                    <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 px-2 text-sm font-bold tabular-nums text-purple-700">
                        {numero}
                    </span>
                    <div className="min-w-0">
                        <p
                            className="text-base font-semibold leading-snug text-gray-900 capitalize"
                            title={nombreCompleto}
                            translate="no"
                        >
                            {nombreCompleto}
                        </p>
                        <p className={`mt-1 text-xs font-bold uppercase ${promedioClass}`}>
                            Promedio: {promedioMostrado}
                        </p>
                    </div>
                </div>

                {columnas.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                        No hay tipos de evaluación registrados.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {columnas.map((col) => {
                            const etiqueta = formatearEtiquetaColumna(col);

                            return (
                                <div key={`${est.estudiante_id}-${col}-mobile`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-gray-800" title={etiqueta} translate="no">
                                            {etiqueta}
                                        </span>
                                        {tipoEvaluacion !== "desarrollo" && (
                                            <span className="text-xs font-medium text-gray-500">
                                                1.0 a 5.0
                                            </span>
                                        )}
                                    </div>

                                    {tipoEvaluacion === "desarrollo" ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {VALORACIONES_DESARROLLO.map((opcion) => {
                                                const activa = est.valoraciones?.[col] === opcion.value;

                                                return (
                                                    <button
                                                        key={opcion.value}
                                                        type="button"
                                                        title={opcion.label}
                                                        aria-label={`${opcion.label} en ${etiqueta}`}
                                                        translate="no"
                                                        onClick={() => guardarNota(est.estudiante_id, col, opcion.value)}
                                                        className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                                                            activa
                                                                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                                                        }`}
                                                    >
                                                        <span className="text-base" aria-hidden="true">{opcion.emoji}</span>
                                                        <span className="truncate">{opcion.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <input
                                            key={`${est.estudiante_id}-${col}-mobile-input`}
                                            type="number"
                                            min="1"
                                            max="5"
                                            step="0.1"
                                            inputMode="decimal"
                                            defaultValue={
                                                est.notas?.[col] !== null && est.notas?.[col] !== undefined
                                                    ? est.notas[col]
                                                    : ""
                                            }
                                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-center text-base font-semibold text-gray-900 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                                            translate="no"
                                            onBlur={(event) => guardarNotaNumerica(event, col)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </article>
    );
}

export default PlanillaMobileCard;
