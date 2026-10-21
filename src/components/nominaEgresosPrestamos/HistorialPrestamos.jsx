import React from "react";
import SpinnerView from "../anioLectivo/SpinnerView";
import {
    claseEstadoPrestamo,
    puedeSaldarPrestamo,
} from "../../utils/nominaEgresosPrestamos/prestamos";

// Cada fila lleva `data-prestamo-id` para que la página pueda llevarla a la
// vista. `resaltadoId` pinta en verde la última registrada o saldada;
// `saldandoId` es la que se está saldando y `bloqueado` hace esperar a las
// demás. Con `actualizando`, la tabla se queda a la vista mientras recarga.
const HistorialPrestamos = ({
    prestamos,
    profesores,
    cargando,
    cargandoProfesores,
    historialConsultado,
    total,
    profesorFiltro,
    actualizando = false,
    saldandoId = null,
    bloqueado = false,
    resaltadoId = null,
    onCambiarFiltro,
    onBuscar,
    onLimpiar,
    onSaldar,
}) => (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">Historial de Préstamos</h2>
                    {actualizando && (
                        <span role="status" className="inline-flex items-center gap-2 text-sm text-purple-700">
                            <SpinnerView />
                            Actualizando...
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    El historial se carga solo cuando seleccionas un profesor o trabajador.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Profesor o trabajador</label>
                    <select
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={profesorFiltro}
                        onChange={(e) => onCambiarFiltro(e.target.value)}
                        disabled={cargandoProfesores}
                    >
                        <option value="">Selecciona para ver historial</option>
                        {profesores.map(prof => (
                            <option key={prof.id} value={prof.id}>
                                {prof.apellido} {prof.nombre}
                            </option>
                        ))}
                    </select>
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
                    onClick={onLimpiar}
                    className="self-end rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                    Limpiar
                </button>
            </div>
            <span className="text-lg font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded">
                Total por Cobrar: ${total.toFixed(2)}
            </span>
        </div>

        {cargando ? (
            <p className="flex items-center gap-2">
                <SpinnerView />
                Cargando préstamos...
            </p>
        ) : !historialConsultado ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="font-semibold text-gray-700">Selecciona un profesor o trabajador para ver su historial de préstamos.</p>
                <p className="mt-1 text-sm text-gray-500">El historial no se carga automáticamente al abrir la página.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">Fecha</th>
                            <th className="px-4 py-2 text-left">Profesor</th>
                            <th className="px-4 py-2 text-right">Monto</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                            <th className="px-4 py-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prestamos.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">No hay préstamos registrados.</td>
                            </tr>
                        ) : (
                            prestamos.map((prestamo) => (
                                <tr
                                    key={prestamo.id}
                                    data-prestamo-id={prestamo.id}
                                    className={`scroll-my-8 border-b hover:bg-gray-50 ${prestamo.id === resaltadoId ? "bg-green-50" : ""}`}
                                >
                                    <td className="px-4 py-2">{prestamo.fecha}</td>
                                    <td className="px-4 py-2 font-medium capitalize">{prestamo.profesor_nombre}</td>
                                    <td className="px-4 py-2 text-right font-bold">${prestamo.monto.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${claseEstadoPrestamo(prestamo.estado)}`}>
                                            {prestamo.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {puedeSaldarPrestamo(prestamo) && (
                                            <button
                                                onClick={() => onSaldar(prestamo)}
                                                disabled={bloqueado}
                                                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors disabled:cursor-wait disabled:opacity-60"
                                                title="Marcar como recuperado"
                                            >
                                                {saldandoId === prestamo.id ? (
                                                    <>
                                                        <SpinnerView />
                                                        Saldando...
                                                    </>
                                                ) : (
                                                    "Saldar"
                                                )}
                                            </button>
                                        )}
                                        {!puedeSaldarPrestamo(prestamo) && (
                                            <span className="text-xs text-gray-400">Saldado</span>
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

export default HistorialPrestamos;
