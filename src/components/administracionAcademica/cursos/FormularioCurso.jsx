import {
    ESTADOS_CURSO,
    JORNADAS_CURSO,
} from "../../../utils/administracionAcademica/cursos";

export default function FormularioCurso({
    editId,
    nombre,
    jornada,
    estado,
    onActualizarCampo,
    onCancelarEdicion,
    onGuardar,
}) {
    return (
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🏫 {editId ? "Editar" : "Crear"} Curso
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                        placeholder="Nombre (6A, 7B...)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={nombre}
                        onChange={(event) => onActualizarCampo("nombre", event.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                        value={jornada}
                        onChange={(event) => onActualizarCampo("jornada", event.target.value)}
                    >
                        {JORNADAS_CURSO.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                        value={estado}
                        onChange={(event) => onActualizarCampo("estado", event.target.value)}
                    >
                        {ESTADOS_CURSO.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onGuardar}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                >
                    {editId ? "Actualizar Curso" : "Crear Curso"}
                </button>
                {editId && (
                    <button
                        onClick={onCancelarEdicion}
                        className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </div>
    );
}
