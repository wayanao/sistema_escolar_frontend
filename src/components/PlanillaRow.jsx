const VALORACIONES_DESARROLLO = [
    { value: "destacado", label: "Destacado", emoji: "⭐" },
    { value: "logrado", label: "Logrado", emoji: "😀" },
    { value: "proceso", label: "En proceso", emoji: "🙂" },
    { value: "apoyo", label: "Requiere apoyo", emoji: "🧩" },
];

function PlanillaRow({ est, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna }) {

    return (
        <tr className="hover:bg-gray-50">
            <td className="sticky left-0 bg-white z-10 px-6 py-4 truncate">
                <div className="text-sm font-medium text-gray-900 capitalize" title={`${est.apellido} ${est.nombre}`}>
                    {est.apellido} {est.nombre}
                </div>
            </td>

                {columnas.map((col) => (
                    <td
                        key={`${est.estudiante_id}-${col}`}
                        className="px-2 py-4 text-center min-w-[100px]"
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
                                onBlur={(e) =>
                                    guardarNota(est.estudiante_id, col, e.target.value)
                                }
                            />
                        )}
                    </td>
                ))}

            <td className="md:sticky md:right-0 bg-white md:z-10 px-6 py-4 text-center ">
                <span className="text-sm font-semibold text-gray-900">
                    {tipoEvaluacion === "desarrollo" ? "—" : est.promedio}
                </span>
            </td>
        </tr>
    );
}

export default PlanillaRow;
