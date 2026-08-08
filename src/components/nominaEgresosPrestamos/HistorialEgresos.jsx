import React from "react";
import { puedeEditarEgreso } from "../../utils/nominaEgresosPrestamos/egresos";

const HistorialEgresos = ({
    egresos,
    cargando,
    total,
    fechaDesde,
    fechaHasta,
    onCambiarDesde,
    onCambiarHasta,
    onBuscar,
    onFiltrarHoy,
    onEditar,
}) => (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h2 className="text-xl font-bold">Historial de Egresos</h2>
                <p className="text-sm text-gray-500">Por defecto se muestran solo los egresos del día.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => onCambiarDesde(e.target.value)}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => onCambiarHasta(e.target.value)}
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={onBuscar}
                    className="self-end rounded bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700"
                >
                    Buscar
                </button>
                <button
                    type="button"
                    onClick={onFiltrarHoy}
                    className="self-end rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                    Hoy
                </button>
            </div>
            <span className="text-lg font-bold text-red-600 bg-red-100 px-3 py-2 rounded">
                Total: ${total.toFixed(2)}
            </span>
        </div>

        {cargando ? (
            <p>Cargando egresos...</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">Fecha</th>
                            <th className="px-4 py-2 text-left">Concepto</th>
                            <th className="px-4 py-2 text-left">Categoría</th>
                            <th className="px-4 py-2 text-right">Monto</th>
                            <th className="px-4 py-2 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {egresos.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">No hay egresos registrados para las fechas seleccionadas.</td>
                            </tr>
                        ) : (
                            egresos.map((egreso) => (
                                <tr key={egreso.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">{egreso.fecha}</td>
                                    <td className="px-4 py-2 font-medium">{egreso.concepto}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600">{egreso.categoria}</td>
                                    <td className="px-4 py-2 text-right font-bold text-red-600">${Number(egreso.monto || 0).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">
                                        {puedeEditarEgreso(egreso) ? (
                                            <button
                                                type="button"
                                                onClick={() => onEditar(egreso)}
                                                className="rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                                            >
                                                Editar
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">Automático</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default HistorialEgresos;
