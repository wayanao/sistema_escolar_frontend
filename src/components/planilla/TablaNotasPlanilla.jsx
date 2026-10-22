import PlanillaMobileCard from "./PlanillaMobileCard";
import PlanillaRow from "./PlanillaRow";

function TablaNotasPlanilla({ estudiantes, columnas, guardarNota, tipoEvaluacion, formatearEtiquetaColumna, notasSinGuardar, subnotasPorTipo, onAbrirSubnotas, porcentajesPorTipo }) {
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notas de Estudiantes</h2>
            </div>

            <div className="md:hidden">
                {estudiantes.length > 0 ? (
                    estudiantes.map((est, index) => (
                        <PlanillaMobileCard
                            key={`${est.estudiante_id}-mobile`}
                            est={est}
                            numero={index + 1}
                            columnas={columnas}
                            guardarNota={guardarNota}
                            tipoEvaluacion={tipoEvaluacion}
                            formatearEtiquetaColumna={formatearEtiquetaColumna}
                            notasSinGuardar={notasSinGuardar}
                            subnotasPorTipo={subnotasPorTipo}
                            onAbrirSubnotas={onAbrirSubnotas}
                        />
                    ))
                ) : (
                    <div className="p-4 text-sm text-gray-500">
                        No hay estudiantes para mostrar.
                    </div>
                )}
            </div>

            <div className="hidden w-full overflow-auto md:block">
                <table className="w-full min-w-max border-separate border-spacing-0">
                    <thead className="shadow-sm">
                        <tr>
                            <th
                                className="sticky left-0 top-0 z-40 w-16 min-w-16 max-w-16 rounded-tl-lg border-b border-r border-b-purple-300 border-r-purple-400 bg-purple-200 px-3 py-4 text-center text-purple-800"
                                title="Número de estudiante"
                            >
                                <svg
                                    className="mx-auto h-6 w-6 drop-shadow-sm"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M10 3.5 8 20.5M16 3.5l-2 17M4.5 9h15M3.5 15h15" />
                                </svg>
                                <span className="sr-only">Número</span>
                            </th>
                            <th className="sticky left-16 top-0 z-30 border-b border-b-gray-200 bg-white px-6 py-4 text-left text-purple-950">
                                <span className="inline-flex min-h-8 items-center gap-3 align-middle">
                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-400 bg-white/55 text-purple-700 shadow-sm ring-1 ring-purple-300/50">
                                        <svg
                                            className="h-[18px] w-[18px]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75 17.9 17.9 0 0 1 4.5 20.1Z" />
                                        </svg>
                                    </span>
                                    <span className="text-base font-bold leading-none text-purple-700">
                                        Estudiante
                                    </span>
                                </span>
                            </th>
                            {columnas.map((col) => (
                                <th
                                    key={col}
                                    className="sticky top-0 z-20 min-w-[120px] border-b border-l border-b-gray-200 border-l-violet-300 bg-white px-4 py-4 text-center align-middle before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-4 before:bg-gradient-to-r before:from-violet-200/70 before:to-transparent before:content-['']"
                                >
                                    <div
                                        className="inline-flex min-h-8 items-center justify-center gap-3 whitespace-nowrap text-purple-950 align-middle"
                                        title={formatearEtiquetaColumna(col)}
                                    >
                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/55 text-violet-700 shadow-sm ring-1 ring-violet-300/70">
                                            <svg
                                                className="h-[18px] w-[18px]"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25H6.75A2.25 2.25 0 0 0 4.5 7.5v11.25A2.25 2.25 0 0 0 6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5a2.25 2.25 0 0 0-2.25-2.25H15M9 5.25A3 3 0 0 1 12 2.25a3 3 0 0 1 3 3M9 5.25A3 3 0 0 0 12 8.25a3 3 0 0 0 3-3m-6 7.5 2 2 4-4" />
                                            </svg>
                                        </span>
                                        <span
                                            className="text-base font-bold leading-none text-purple-950"
                                            translate="no"
                                        >
                                            {formatearEtiquetaColumna(col)}
                                        </span>
                                        {/* Porcentajes, paso B4b (PB9): se cambian encima de la tabla. */}
                                        {Number.isInteger(porcentajesPorTipo?.[col]) && (
                                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-sm font-semibold leading-none text-violet-800">
                                                {porcentajesPorTipo[col]} %
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="sticky right-0 top-0 z-30 w-36 rounded-tr-lg border-b border-l border-b-gray-200 border-l-emerald-300 bg-white px-5 py-4 text-emerald-950 before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-4 before:bg-gradient-to-r before:from-emerald-200/70 before:to-transparent before:content-['']">
                                <span className="inline-flex min-h-8 items-center justify-center gap-3">
                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/55 text-emerald-700 shadow-sm ring-1 ring-emerald-300/70">
                                        <svg
                                            className="h-[18px] w-[18px]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V12m5 7.5V8m5 11.5V4.5m5 15v-10" />
                                        </svg>
                                    </span>
                                    <span className="text-base font-bold leading-none text-emerald-950">
                                        Promedio
                                    </span>
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {estudiantes.map((est, index) => (
                            <PlanillaRow
                                key={est.estudiante_id}
                                est={est}
                                numero={index + 1}
                                columnas={columnas}
                                guardarNota={guardarNota}
                                tipoEvaluacion={tipoEvaluacion}
                                formatearEtiquetaColumna={formatearEtiquetaColumna}
                                notasSinGuardar={notasSinGuardar}
                                subnotasPorTipo={subnotasPorTipo}
                                onAbrirSubnotas={onAbrirSubnotas}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TablaNotasPlanilla;
