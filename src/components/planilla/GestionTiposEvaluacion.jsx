function GestionTiposEvaluacion({
    nuevoTipo,
    onCambiarNuevoTipo,
    nuevoPorcentaje = "",
    onCambiarNuevoPorcentaje,
    onAgregarTipo,
    tipoEliminar,
    onCambiarTipoEliminar,
    onEliminarTipo,
    columnas,
    accionTipoEnCurso,
    formatearEtiquetaColumna,
}) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Gestión de Tipos de Evaluación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Tipo</label>
                    <input
                        type="text"
                        placeholder="Ej: Quiz, Taller..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={nuevoTipo}
                        onChange={(e) => onCambiarNuevoTipo(e.target.value)}
                        disabled={Boolean(accionTipoEnCurso)}
                    />
                    {/* Porcentajes, paso B4b (PB9): opcional. Sin el manejador, como antes. */}
                    {onCambiarNuevoPorcentaje && (
                        <>
                            <label
                                htmlFor="nuevo-tipo-porcentaje"
                                className="mt-3 block text-sm font-medium text-gray-700 mb-1"
                            >
                                Porcentaje (%)
                            </label>
                            <input
                                id="nuevo-tipo-porcentaje"
                                type="text"
                                inputMode="numeric"
                                placeholder="Opcional"
                                className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={nuevoPorcentaje}
                                onChange={(e) => onCambiarNuevoPorcentaje(e.target.value)}
                                disabled={Boolean(accionTipoEnCurso)}
                            />
                        </>
                    )}
                    <button
                        type="button"
                        disabled={Boolean(accionTipoEnCurso)}
                        aria-busy={accionTipoEnCurso === "agregar"}
                        className="mt-3 flex w-full items-center justify-center gap-2 self-stretch rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-700 shadow-sm transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
                        onClick={onAgregarTipo}
                    >
                        {accionTipoEnCurso === "agregar" && (
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700"
                                aria-hidden="true"
                            />
                        )}
                        {accionTipoEnCurso !== "agregar" && (
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                            </svg>
                        )}
                        {accionTipoEnCurso === "agregar" ? "Agregando..." : "Agregar Tipo"}
                    </button>
                </div>
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eliminar Tipo</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={tipoEliminar}
                        onChange={(e) => onCambiarTipoEliminar(e.target.value)}
                        disabled={Boolean(accionTipoEnCurso)}
                    >
                        <option value="">Seleccionar tipo</option>
                        {columnas.map((col, i) => (
                            <option key={i} value={col} translate="no">
                                {formatearEtiquetaColumna(col)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        disabled={Boolean(accionTipoEnCurso)}
                        aria-busy={accionTipoEnCurso === "eliminar"}
                        className="mt-3 flex w-full items-center justify-center gap-2 self-stretch rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
                        onClick={onEliminarTipo}
                    >
                        {accionTipoEnCurso === "eliminar" && (
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-700"
                                aria-hidden="true"
                            />
                        )}
                        {accionTipoEnCurso !== "eliminar" && (
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 .4 8m5.2 0L15 9m-8.5-3h11M10 6V4.75h4V6m-6.5 0 .7 14h7.6l.7-14" />
                            </svg>
                        )}
                        {accionTipoEnCurso === "eliminar" ? "Eliminando..." : "Eliminar Tipo"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GestionTiposEvaluacion;
