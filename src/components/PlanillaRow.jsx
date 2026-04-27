function PlanillaRow({ est, columnas, guardarNota }) {

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
                        <input
                            key={`${est.estudiante_id}-${col}`}
                            type="number"
                            step="0.01"
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
                    </td>
                ))}

            <td className="md:sticky md:right-0 bg-white md:z-10 px-6 py-4 text-center ">
                <span className="text-sm font-semibold text-gray-900">
                    {est.promedio}
                </span>
            </td>
        </tr>
    );
}

export default PlanillaRow;