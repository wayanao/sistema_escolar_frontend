import {
    CLASES_ESTADO_CURSO,
    ESTADOS_CURSO,
    FILTROS_CURSO,
    JORNADA_CURSO_INICIAL,
    obtenerEtiquetaEstadoCurso,
} from "../../../utils/administracionAcademica/cursos";

export default function ListaCursos({
    cursos,
    estadoFiltro,
    onCambiarEstadoFiltro,
    onCambiarEstado,
    onEditar,
}) {
    return (
        <div className="p-6">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Cursos</h3>
                <select
                    value={estadoFiltro}
                    onChange={(event) => onCambiarEstadoFiltro(event.target.value)}
                    className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                    {FILTROS_CURSO.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600">
                            <th className="p-2 border-b">Nombre</th>
                            <th className="p-2 border-b">Jornada</th>
                            <th className="p-2 border-b">Estado</th>
                            <th className="p-2 border-b text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cursos.map((curso) => (
                            <tr key={curso.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{curso.nombre}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${curso.jornada === "Tarde" ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-900"}`}>
                                        {curso.jornada || JORNADA_CURSO_INICIAL}
                                    </span>
                                </td>
                                <td className="p-2">
                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CLASES_ESTADO_CURSO[curso.estado || "activo"] || CLASES_ESTADO_CURSO.activo}`}>
                                        {obtenerEtiquetaEstadoCurso(curso.estado || "activo")}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <select
                                            value={curso.estado || "activo"}
                                            onChange={(event) => onCambiarEstado(curso, event.target.value)}
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                                        >
                                            {ESTADOS_CURSO.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => onEditar(curso)}
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
