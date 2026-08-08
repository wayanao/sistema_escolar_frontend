import React from "react";
import { claseSaldoEmpleado } from "../../utils/nominaEgresosPrestamos/nomina";

const EstadoCuentaPersonal = ({ empleados, cargando, onPagar }) => (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Estado de Cuenta de Personal</h2>

        {cargando ? (
            <p className="text-gray-500">Cargando datos...</p>
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
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="border px-4 py-2">{emp.documento}</td>
                                    <td className="border px-4 py-2 font-medium capitalize">
                                        {emp.apellido} {emp.nombre}
                                    </td>
                                    <td className={`border px-4 py-2 text-right font-bold ${claseSaldoEmpleado(emp.saldo_prestamos)}`}>
                                        ${emp.saldo_prestamos.toFixed(2)}
                                    </td>
                                    <td className="border px-4 py-2 text-center">
                                        <button
                                            onClick={() => onPagar(emp)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition"
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
