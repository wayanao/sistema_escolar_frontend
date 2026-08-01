import {
    DIAS_SEMANA,
    MANANA_INICIO,
    TARDE_FIN,
} from "../../../utils/administracionAcademica/asignaciones";
import DisponibilidadProfesorAsignacion from "./DisponibilidadProfesorAsignacion";

function FormularioAsignacion({
    cursoId,
    profesorId,
    materiaId,
    dia,
    horaInicio,
    horaFin,
    editandoId,
    guardando,
    mensajeEstado,
    profesores,
    materias,
    disponibilidad,
    cargandoDisponibilidad,
    onActualizarCampo,
    onCancelarEdicion,
    onGuardar,
}) {
    return (
        <section className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    {editandoId ? "Editar asignación" : "Nueva asignación"}
                </h2>
                {editandoId && (
                    <button
                        type="button"
                        onClick={onCancelarEdicion}
                        className="self-start md:self-auto text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancelar edición
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
                    <select
                        value={profesorId}
                        onChange={(event) => onActualizarCampo("profesorId", event.target.value)}
                        disabled={!cursoId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Seleccionar profesor</option>
                        {profesores.map((profesor) => (
                            <option key={profesor.id} value={profesor.id}>
                                {profesor.nombre} {profesor.apellido}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                    <select
                        value={materiaId}
                        onChange={(event) => onActualizarCampo("materiaId", event.target.value)}
                        disabled={!cursoId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Seleccionar materia</option>
                        {materias.map((materia) => (
                            <option key={materia.id} value={materia.id}>
                                {materia.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                    <select
                        value={dia}
                        onChange={(event) => onActualizarCampo("dia", event.target.value)}
                        disabled={!cursoId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Seleccionar día</option>
                        {DIAS_SEMANA.map((diaSemana) => (
                            <option key={diaSemana} value={diaSemana}>{diaSemana}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                    <input
                        type="time"
                        value={horaInicio}
                        onChange={(event) => onActualizarCampo("horaInicio", event.target.value)}
                        disabled={!cursoId}
                        min={MANANA_INICIO}
                        max={TARDE_FIN}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                    <input
                        type="time"
                        value={horaFin}
                        onChange={(event) => onActualizarCampo("horaFin", event.target.value)}
                        disabled={!cursoId}
                        min={MANANA_INICIO}
                        max={TARDE_FIN}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
                <DisponibilidadProfesorAsignacion
                    disponibilidad={disponibilidad}
                    cargando={cargandoDisponibilidad}
                    profesorId={profesorId}
                    dia={dia}
                />

                <button
                    type="button"
                    onClick={onGuardar}
                    disabled={guardando || !cursoId}
                    className={`w-full lg:w-56 text-white py-2.5 px-4 rounded-lg transition-colors font-semibold disabled:opacity-60 ${
                        editandoId ? "bg-blue-700 hover:bg-blue-800" : "bg-orange-600 hover:bg-orange-700"
                    }`}
                >
                    {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Asignar clase"}
                </button>
            </div>

            {mensajeEstado && (
                <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                    mensajeEstado.toLowerCase().includes("correctamente")
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700"
                }`}
                >
                    {mensajeEstado}
                </div>
            )}
        </section>
    );
}

export default FormularioAsignacion;
