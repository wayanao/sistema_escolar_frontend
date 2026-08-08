import React from "react";
import {
    claseDeudaEmpleado,
    puedeAbonarAPrestamos,
    tieneDeudaDePrestamos,
} from "../../utils/nominaEgresosPrestamos/nomina";

const ModalPagoNomina = ({
    empleado,
    formulario,
    totalNeto,
    onCambiarCampo,
    onCerrar,
    onEnviar,
}) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl mx-auto flex flex-col max-h-[95vh]">
            <div className="bg-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-lg shrink-0">
                <h3 className="text-xl font-bold truncate">Procesar Pago Nómina</h3>
                <button onClick={onCerrar} className="text-white hover:text-gray-200 ml-4 shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
                <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200 flex flex-col sm:flex-row justify-between gap-2 sm:items-center">
                    <div>
                        <p className="text-sm text-gray-500">Pagando a (Personal)</p>
                        <p className="font-bold text-gray-800 capitalize truncate max-w-[200px]">{empleado.nombre} {empleado.apellido}</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-500">Deuda por Préstamos</p>
                        <p className={`font-bold text-lg ${claseDeudaEmpleado(empleado.saldo_prestamos)}`}>
                            ${empleado.saldo_prestamos.toFixed(2)}
                        </p>
                    </div>
                </div>

                <form onSubmit={onEnviar}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-gray-700 text-sm font-bold mb-1">Salario Base ($)</label>
                            <input type="number" required min="0" step="0.01"
                                className="w-full border rounded p-2 focus:ring-purple-500"
                                value={formulario.salarioBase}
                                onChange={(e) => onCambiarCampo("salarioBase", e.target.value)}
                                placeholder="Ej. 1500" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-gray-700 text-sm font-bold mb-1">Bonos Adicionales ($)</label>
                            <input type="number" min="0" step="0.01" disabled={false}
                                className="w-full border rounded p-2 focus:ring-purple-500 text-green-700"
                                value={formulario.bonificaciones}
                                onChange={(e) => onCambiarCampo("bonificaciones", e.target.value)} />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-gray-700 text-sm font-bold mb-1">Abonar a Préstamos ($)</label>
                            <input type="number" min="0" step="0.01" disabled={!puedeAbonarAPrestamos(empleado)}
                                className="w-full border rounded p-2 focus:ring-purple-500 text-red-600 bg-red-50"
                                value={formulario.abonoPrestamo}
                                onChange={(e) => onCambiarCampo("abonoPrestamo", e.target.value)} />
                            {tieneDeudaDePrestamos(empleado) && <span className="text-xs text-gray-500">Máx: {empleado.saldo_prestamos}</span>}
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-gray-700 text-sm font-bold mb-1">Otras Deducciones ($)</label>
                            <input type="number" min="0" step="0.01"
                                className="w-full border rounded p-2 focus:ring-purple-500"
                                value={formulario.otrosDescuentos}
                                onChange={(e) => onCambiarCampo("otrosDescuentos", e.target.value)} />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-1">Concepto / Notas</label>
                            <input type="text"
                                className="w-full border rounded p-2 focus:ring-purple-500"
                                value={formulario.notas}
                                onChange={(e) => onCambiarCampo("notas", e.target.value)}
                                placeholder="Mes de Marzo 2026..." />
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded mt-6 mb-6 text-center border border-purple-200">
                        <p className="text-gray-600 font-semibold mb-1">TOTAL NETO A DEPOSITAR:</p>
                        <p className="text-4xl font-black text-purple-900">${totalNeto.toFixed(2)}</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onCerrar}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition">
                            Cancelar
                        </button>
                        <button type="submit"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded transition shadow-md">
                            Confirmar Pago
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);

export default ModalPagoNomina;
