import React from "react";
import SpinnerView from "../anioLectivo/SpinnerView";
import { formatearPesos } from "../../utils/formatoPesos";

const HistorialNomina = ({ pagos, cargando, hayBusqueda, busqueda, onCambiarBusqueda }) => (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
            <h2 className="text-xl font-bold">Historial de Pagos de Nómina</h2>
            <input
                type="text"
                placeholder="Buscar por empleado..."
                value={busqueda}
                onChange={(e) => onCambiarBusqueda(e.target.value)}
                className="border rounded p-2 focus:ring-purple-500 w-full md:w-64"
            />
        </div>

        {cargando ? (
            <p className="flex items-center gap-2 text-gray-500">
                <SpinnerView />
                Cargando historial...
            </p>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border text-left">N° Ref</th>
                            <th className="px-4 py-2 border text-left">Fecha</th>
                            <th className="px-4 py-2 border text-left">Personal</th>
                            <th className="px-4 py-2 border text-right">Salario Base</th>
                            <th className="px-4 py-2 border text-right text-red-600">Abono Préstamo</th>
                            <th className="px-4 py-2 border text-right text-green-600">Bono</th>
                            <th className="px-4 py-2 border text-right font-black">Pagado Neto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!hayBusqueda ? (
                            <tr>
                                <td colSpan="7" className="text-center py-6 text-gray-500">
                                    🔍 Escriba el nombre de un empleado para ver su historial de pagos.
                                </td>
                            </tr>
                        ) : pagos.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-6 text-gray-500">
                                    No hay pagos registrados para este empleado.
                                </td>
                            </tr>
                        ) : (
                            pagos.map((pago) => (
                                <tr key={pago.id} className="hover:bg-gray-50 text-sm">
                                    <td className="border px-4 py-2 text-gray-500">#N-{pago.id}</td>
                                    <td className="border px-4 py-2">{pago.fecha}</td>
                                    <td className="border px-4 py-2 capitalize font-medium">{pago.profesor}</td>
                                    <td className="border px-4 py-2 text-right">{formatearPesos(pago.salario_base)}</td>
                                    <td className="border px-4 py-2 text-right text-red-600">{formatearPesos(pago.deduccion_prestamos)}</td>
                                    <td className="border px-4 py-2 text-right text-green-600">{formatearPesos(pago.bonificaciones)}</td>
                                    <td className="border px-4 py-2 text-right font-bold text-lg">{formatearPesos(pago.total_pagado)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default HistorialNomina;
