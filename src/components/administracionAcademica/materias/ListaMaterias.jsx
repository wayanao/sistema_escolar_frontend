import {
    CLASES_ESTADO_MATERIA,
    ESTADOS_MATERIA,
    FILTROS_MATERIA,
    obtenerEtiquetaEstadoMateria,
} from "../../../utils/administracionAcademica/materias";

export default function ListaMaterias({
    materias,
    estadoFiltro,
    onCambiarEstadoFiltro,
    onCambiarEstado,
    onEditar,
}) {
    return (
        <div className="p-6">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Materias</h3>
                <select
                    value={estadoFiltro}
                    onChange={(event) => onCambiarEstadoFiltro(event.target.value)}
                    className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                    {FILTROS_MATERIA.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="overflow-y-auto max-h-64">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600">
                            <th className="p-2 border-b">Nombre</th>
                            <th className="p-2 border-b">Estado</th>
                            <th className="p-2 border-b text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materias.map((materia) => (
                            <tr key={materia.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{materia.nombre}</td>
                                <td className="p-2">
                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CLASES_ESTADO_MATERIA[materia.estado || "activo"] || CLASES_ESTADO_MATERIA.activo}`}>
                                        {obtenerEtiquetaEstadoMateria(materia.estado || "activo")}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <select
                                            value={materia.estado || "activo"}
                                            onChange={(event) => onCambiarEstado(materia, event.target.value)}
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                                        >
                                            {ESTADOS_MATERIA.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => onEditar(materia)}
                                            className="text-purple-700 hover:underline"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
