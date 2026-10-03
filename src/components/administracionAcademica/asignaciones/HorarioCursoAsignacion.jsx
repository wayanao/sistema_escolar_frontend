import {
    DIAS_SEMANA,
    formatearHora12,
} from "../../../utils/administracionAcademica/asignaciones";

// `puedeEditar` en falso (un año cerrado) quita Editar y Desactivar: el
// horario queda solo para consultar.
function HorarioCursoAsignacion({
    asignaciones,
    cursoSeleccionado,
    editandoId,
    puedeEditar = true,
    onEditar,
    onDesactivar,
    guardando,
}) {
    if (!cursoSeleccionado) {
        return (
            <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 text-gray-500">
                Selecciona un curso para ver sus asignaciones.
            </section>
        );
    }

    return (
        <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
                <h2 className="text-xl font-semibold text-gray-900">Horario asignado de {cursoSeleccionado.nombre}</h2>
                <span className="text-sm text-gray-500">{asignaciones.length} asignación(es) activa(s)</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                {DIAS_SEMANA.map((diaSemana) => {
                    const clasesDelDia = asignaciones.filter((asignacion) => asignacion.dia === diaSemana);

                    return (
                        <div key={diaSemana} className="flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm h-full">
                            <div className="bg-blue-600 text-white text-center py-3 font-semibold tracking-wide uppercase text-sm">
                                {diaSemana}
                            </div>

                            <div className="p-3 flex flex-col gap-3 min-h-[250px] flex-grow">
                                {clasesDelDia.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 italic text-sm border-2 border-dashed border-gray-200 rounded-lg flex-grow flex items-center justify-center">
                                        Día libre
                                    </div>
                                ) : (
                                    clasesDelDia.map((clase) => (
                                        <div
                                            key={clase.id}
                                            className={`bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all ${
                                                editandoId === clase.id ? "border-orange-500 ring-2 ring-orange-100" : "border-blue-500"
                                            }`}
                                        >
                                            <div className="text-xs font-bold text-blue-600 mb-2 bg-blue-50 w-max px-2 py-1 rounded-md">
                                                {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                                            </div>

                                            <div className="font-semibold text-gray-800 text-[15px] mb-1 leading-tight">
                                                {clase.materia_nombre}
                                            </div>

                                            <div className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 mt-2 rounded">
                                                {clase.profesor_nombre}
                                            </div>

                                            {puedeEditar && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditar(clase)}
                                                        className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDesactivar(clase)}
                                                        disabled={guardando}
                                                        className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-60"
                                                    >
                                                        Desactivar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default HorarioCursoAsignacion;
