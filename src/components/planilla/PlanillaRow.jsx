import { VALORACIONES_DESARROLLO } from "../../constants/valoracionesDesarrollo";
import { valoracionDesdePromedio } from "../../utils/valoracionesDesarrollo";

function PlanillaRow({ est, numero, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna }) {
    const promedioNumerico = Number(est.promedio);
    const promedioClass = tipoEvaluacion === "desarrollo" || Number.isNaN(promedioNumerico)
        ? "text-gray-900"
        : promedioNumerico >= 3
            ? "text-emerald-600"
            : "text-red-600";
    // En desarrollo el promedio se calcula como numero para poder compararlo,
    // pero la planilla muestra la carita equivalente, nunca el numero.
    const valoracionPromedio = tipoEvaluacion === "desarrollo"
        ? valoracionDesdePromedio(est.promedio === "" ? null : promedioNumerico)
        : null;
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
        <tr className="hover:bg-gray-50">
            <td className="sticky left-0 z-20 w-16 min-w-16 max-w-16 border-b border-r border-b-gray-100/70 border-r-purple-300 bg-purple-200 px-3 py-4 text-center">
                <span className="text-sm font-semibold tabular-nums text-purple-700">
                    {numero}
                </span>
            </td>
            <td className="sticky left-16 z-10 border-b border-r border-b-gray-100/70 border-r-violet-100/50 bg-white px-6 py-4 truncate">
                <div className="text-sm font-medium text-gray-900 capitalize" title={`${est.apellido} ${est.nombre}`} translate="no">
                    {est.apellido} {est.nombre}
                </div>
            </td>

                {columnas.map((col, index) => (
                    <td
                        key={`${est.estudiante_id}-${col}`}
                        className={`min-w-[100px] border-b border-b-gray-100/70 px-2 py-4 text-center ${
                            index < columnas.length - 1
                                ? "border-r border-violet-100/50"
                                : ""
                        }`}
                    >
                        {tipoEvaluacion === "desarrollo" ? (
                            <div className="grid grid-cols-2 gap-1">
                                {VALORACIONES_DESARROLLO.map((opcion) => {
                                    const activa = est.valoraciones?.[col] === opcion.value;
                                    return (
                                        <button
                                            key={opcion.value}
                                            type="button"
                                            title={opcion.label}
                                            aria-label={`${opcion.label} en ${formatearEtiquetaColumna?.(col) || col}`}
                                            translate="no"
                                            onClick={() => guardarNota(est.estudiante_id, col, opcion.value)}
                                            className={`border rounded px-2 py-1 text-lg ${
                                                activa
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-gray-200 hover:bg-gray-100"
                                            }`}
                                        >
                                            {opcion.emoji}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <input
                                key={`${est.estudiante_id}-${col}`}
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                defaultValue={
                                    est.notas[col] !== null && est.notas[col] !== undefined
                                        ? est.notas[col]
                                        : ""
                                }
                                className="w-full max-w-[70px] px-1 py-1 border border-gray-300 rounded text-center text-sm"
                                translate="no"
                                onBlur={(event) => guardarNotaNumerica(event, col)}
                            />
                        )}
                    </td>
                ))}

            <td className="border-b border-l border-b-gray-100/70 border-l-emerald-100/50 bg-white px-6 py-4 text-center md:sticky md:right-0 md:z-10">
                <span className={`text-sm font-semibold ${promedioClass}`}>
                    {tipoEvaluacion === "desarrollo" ? (
                        <span
                            className="inline-flex items-center gap-1"
                            title={valoracionPromedio?.label || "Sin calificar"}
                        >
                            <span className="text-lg leading-none">
                                {valoracionPromedio?.emoji || "—"}
                            </span>
                        </span>
                    ) : (
                        est.promedio
                    )}
                </span>
            </td>
        </tr>
    );
}

export default PlanillaRow;
