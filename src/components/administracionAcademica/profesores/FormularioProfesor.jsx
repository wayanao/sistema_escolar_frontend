import { ESTADOS_PROFESOR } from "../../../utils/administracionAcademica/profesores";

export default function FormularioProfesor({
    editId,
    nombre,
    apellido,
    documentoIdentidad,
    email,
    telefono,
    password,
    sueldo,
    estado,
    guardando = false,
    onActualizarCampo,
    onCancelarEdicion,
    onGuardar,
}) {
    return (
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                👨‍🏫 {editId ? "Editar" : "Crear"} Profesor
            </h2>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onGuardar();
                }}
                className="space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            placeholder="Nombre"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={nombre}
                            onChange={(event) => onActualizarCampo("nombre", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                        <input
                            placeholder="Apellidos"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={apellido}
                            onChange={(event) => onActualizarCampo("apellido", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                        <input
                            placeholder="Documento"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={documentoIdentidad}
                            onChange={(event) => onActualizarCampo("documentoIdentidad", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Email"
                            autoComplete="username"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={email}
                            onChange={(event) => onActualizarCampo("email", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            placeholder="Teléfono"
                            autoComplete="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={telefono}
                            onChange={(event) => onActualizarCampo("telefono", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña {editId && "(dejar vacío para no cambiar)"}
                        </label>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            autoComplete="new-password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={password}
                            onChange={(event) => onActualizarCampo("password", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sueldo ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Ej. 1200.50"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            value={sueldo}
                            onChange={(event) => onActualizarCampo("sueldo", event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={estado}
                            onChange={(event) => onActualizarCampo("estado", event.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                        >
                            {ESTADOS_PROFESOR.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-800 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {guardando ? "Guardando..." : editId ? "Actualizar Profesor" : "Crear Profesor"}
                    </button>
                    {editId && (
                        <button
                            type="button"
                            onClick={onCancelarEdicion}
                            className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
