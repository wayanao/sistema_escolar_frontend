import { useState } from "react";
import {
    CLASES_ESTADO_PROFESOR,
    ESTADOS_PROFESOR,
    FILTROS_PROFESOR,
    filtrarProfesores,
    obtenerEtiquetaEstadoProfesor,
} from "../../../utils/administracionAcademica/profesores";

export default function ListaProfesores({
    profesores,
    estadoFiltro,
    onCambiarEstadoFiltro,
    onCambiarEstado,
    onEditar,
}) {
    const [busqueda, setBusqueda] = useState("");

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Lista de Profesores</h3>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    placeholder="🔍 Buscar profesor..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                />
                <select
                    value={estadoFiltro}
                    onChange={(event) => onCambiarEstadoFiltro(event.target.value)}
                    className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                    {FILTROS_PROFESOR.map((item) => (
                        <option key={item.value} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className="max-h-64 overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[820px] table-fixed text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600">
                            <th className="w-[32%] p-2 border-b">Nombre</th>
                            <th className="w-[34%] p-2 border-b">Email</th>
                            <th className="w-[140px] p-2 border-b">Estado</th>
                            <th className="w-[240px] p-2 border-b text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrarProfesores(profesores, busqueda).map((profesor) => (
                            <tr key={profesor.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">
                                    <span
                                        className="block truncate"
                                        title={`${profesor.nombre} ${profesor.apellido}`}
                                    >
                                        {profesor.nombre} {profesor.apellido}
                                    </span>
                                </td>
                                <td className="p-2">
                                    <span className="block truncate" title={profesor.email}>
                                        {profesor.email}
                                    </span>
                                </td>
                                <td className="p-2">
                                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CLASES_ESTADO_PROFESOR[profesor.estado || "activo"] || CLASES_ESTADO_PROFESOR.activo}`}>
                                        {obtenerEtiquetaEstadoProfesor(profesor.estado || "activo")}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                        <select
                                            value={profesor.estado || "activo"}
                                            onChange={(event) => onCambiarEstado(profesor, event.target.value)}
                                            className="w-32 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
                                        >
                                            {ESTADOS_PROFESOR.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => onEditar(profesor)}
                                            className="rounded-md px-2 py-1 text-sm font-semibold text-purple-700 hover:bg-purple-50"
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
