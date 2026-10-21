import React from "react";
import SpinnerView from "../anioLectivo/SpinnerView";
import { claseSaldoEmpleado } from "../../utils/nominaEgresosPrestamos/nomina";

// `pagosRegistrados` ({ [empleadoId]: nominaId }) marca a quien se le pagó
// mientras la página sigue abierta; `ultimoPagadoId` resalta la última fila.
// Mientras `actualizando`, la tabla se queda a la vista y los pagos esperan a
// que lleguen los saldos nuevos.
const EstadoCuentaPersonal = ({
    empleados,
    cargando,
    actualizando = false,
    pagosRegistrados = {},
    ultimoPagadoId = null,
    onPagar,
}) => (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Estado de Cuenta de Personal</h2>
            {actualizando && (
                <span role="status" className="inline-flex items-center gap-2 text-sm text-purple-700">
                    <SpinnerView />
                    Actualizando...
                </span>
            )}
        </div>

        {cargando ? (
            <p className="flex items-center gap-2 text-gray-500">
                <SpinnerView />
                Cargando datos...
            </p>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border text-left">Documento</th>
                            <th className="px-4 py-2 border text-left">Personal</th>
                            <th className="px-4 py-2 border text-right">Saldo Préstamos</th>
                            <th className="px-4 py-2 border text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empleados.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-4 text-gray-500">
                                    No se encontraron empleados registrados.
                                </td>
                            </tr>
                        ) : (
                            empleados.map((emp) => (
                                <tr
                                    key={emp.id}
                                    className={`hover:bg-gray-50 ${emp.id === ultimoPagadoId ? "bg-green-50" : ""}`}
                                >
                                    <td className="border px-4 py-2">{emp.documento}</td>
                                    <td className="border px-4 py-2 font-medium capitalize">
                                        {emp.apellido} {emp.nombre}
                                        {emp.id in pagosRegistrados && (
                                            <span className="block text-xs font-semibold normal-case text-green-700">
                                                {pagosRegistrados[emp.id]
                                                    ? `✓ Pago #N-${pagosRegistrados[emp.id]} registrado`
                                                    : "✓ Pago registrado"}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`border px-4 py-2 text-right font-bold ${claseSaldoEmpleado(emp.saldo_prestamos)}`}>
                                        ${emp.saldo_prestamos.toFixed(2)}
                                    </td>
                                    <td className="border px-4 py-2 text-center">
                                        <button
                                            onClick={() => onPagar(emp)}
                                            disabled={actualizando}
                                            title={actualizando ? "Espera a que se actualicen los saldos" : undefined}
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition disabled:cursor-wait disabled:opacity-50"
                                        >
                                            Realizar Pago
                                        </button>
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

export default EstadoCuentaPersonal;
