import React from "react";
import SpinnerView from "../anioLectivo/SpinnerView";
import { formatearPesos } from "../../utils/formatoPesos";
import { puedeEditarEgreso } from "../../utils/nominaEgresosPrestamos/egresos";

// Cada fila lleva `data-egreso-id` para que la página pueda llevarla a la
// vista. `editandoId` marca en ámbar la que está en el formulario;
// `resaltadoId` pinta en verde la última guardada; `bloqueado` hace esperar
// a Editar mientras se guarda. Con `actualizando`, la tabla se queda a la
// vista mientras recarga.
const HistorialEgresos = ({
    egresos,
    cargando,
    total,
    fechaDesde,
    fechaHasta,
    actualizando = false,
    editandoId = null,
    resaltadoId = null,
    bloqueado = false,
    onCambiarDesde,
    onCambiarHasta,
    onBuscar,
    onFiltrarHoy,
    onEditar,
}) => {
    const claseFila = (egreso) => {
        if (egreso.id === editandoId) return "bg-amber-50";
        if (egreso.id === resaltadoId) return "bg-green-50";
        return "";
    };
    // En el celular no hay "title" al pasar el mouse: la explicación va abajo.
    const hayAutomaticos = egresos.some((egreso) => !puedeEditarEgreso(egreso));

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">Historial de Egresos</h2>
                        {actualizando && (
                            <span role="status" className="inline-flex items-center gap-2 text-sm text-purple-700">
                                <SpinnerView />
                                Actualizando...
                            </span>
                        )}
                    </div>
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
                    Total: {formatearPesos(total)}
                </span>
            </div>

            {cargando ? (
                <p className="flex items-center gap-2">
                    <SpinnerView />
                    Cargando egresos...
                </p>
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
                                    <tr
                                        key={egreso.id}
                                        data-egreso-id={egreso.id}
                                        className={`scroll-my-8 border-b hover:bg-gray-50 ${claseFila(egreso)}`}
                                    >
                                        <td className="px-4 py-2">{egreso.fecha}</td>
                                        <td className="px-4 py-2 font-medium">{egreso.concepto}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{egreso.categoria}</td>
                                        <td className="px-4 py-2 text-right font-bold text-red-600">{formatearPesos(egreso.monto)}</td>
                                        <td className="px-4 py-2 text-right">
                                            {!puedeEditarEgreso(egreso) ? (
                                                <span className="text-xs text-gray-400" title="Lo registró un pago de nómina; no se edita aquí.">Automático</span>
                                            ) : egreso.id === editandoId ? (
                                                <span className="text-xs font-semibold text-amber-700">Editando</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => onEditar(egreso)}
                                                    disabled={bloqueado}
                                                    className="rounded bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 disabled:cursor-wait disabled:opacity-50"
                                                >
                                                    Editar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {!cargando && hayAutomaticos && (
                <p className="mt-3 text-xs text-gray-500">
                    Automático: lo registra un pago de nómina y no se edita en esta pantalla.
                </p>
            )}
        </div>
    );
};

export default HistorialEgresos;
