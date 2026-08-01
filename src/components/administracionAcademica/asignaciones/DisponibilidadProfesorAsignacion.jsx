import { formatearHora12 } from "../../../utils/administracionAcademica/asignaciones";

function DisponibilidadProfesorAsignacion({
    disponibilidad,
    cargando,
    profesorId,
    dia,
}) {
    if (!profesorId || !dia) {
        return (
            <div className="border border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 bg-gray-50">
                Selecciona profesor y día para ver rangos disponibles.
            </div>
        );
    }

    if (cargando) {
        return (
            <div className="border border-gray-200 rounded-lg p-3 text-sm text-gray-500 bg-gray-50">
                Calculando disponibilidad...
            </div>
        );
    }

    if (!disponibilidad) {
        return (
            <div className="border border-red-200 rounded-lg p-3 text-sm text-red-700 bg-red-50">
                No se pudo calcular la disponibilidad.
            </div>
        );
    }

    return (
        <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">
                Disponibilidad del profesor para {dia}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {disponibilidad.jornadas.map((jornada) => (
                    <div key={jornada.jornada} className="bg-white border border-emerald-100 rounded-lg p-3">
                        <div className="text-xs font-bold text-emerald-800 uppercase mb-2">
                            {jornada.jornada} · {formatearHora12(jornada.inicio)} - {formatearHora12(jornada.fin)}
                        </div>
                        {jornada.rangos.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Sin rangos libres.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {jornada.rangos.map((rango) => (
                                    <span
                                        key={`${jornada.jornada}-${rango.inicio}-${rango.fin}`}
                                        className="inline-flex rounded-md bg-emerald-100 text-emerald-900 px-2 py-1 text-xs font-semibold"
                                    >
                                        {formatearHora12(rango.inicio)} - {formatearHora12(rango.fin)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DisponibilidadProfesorAsignacion;
