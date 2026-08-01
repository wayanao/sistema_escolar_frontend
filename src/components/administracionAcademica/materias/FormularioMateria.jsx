import { ESTADOS_MATERIA } from "../../../utils/administracionAcademica/materias";

export default function FormularioMateria({
    editId,
    nombre,
    estado,
    onActualizarCampo,
    onCancelarEdicion,
    onGuardar,
}) {
    return (
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📚 {editId ? "Editar" : "Crear"} Materia
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                        placeholder="Matemáticas, Biología..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={nombre}
                        onChange={(event) => onActualizarCampo("nombre", event.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                        value={estado}
                        onChange={(event) => onActualizarCampo("estado", event.target.value)}
                    >
                        {ESTADOS_MATERIA.map((item) => (
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
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                >
                    {editId ? "Actualizar Materia" : "Crear Materia"}
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
