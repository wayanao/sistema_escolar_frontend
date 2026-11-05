import React, { useEffect, useId, useRef } from "react";
import SpinnerView from "../anioLectivo/SpinnerView";
import { formatearPesos } from "../../utils/formatoPesos";
import {
    claseDeudaEmpleado,
    puedeAbonarAPrestamos,
    tieneDeudaDePrestamos,
} from "../../utils/nominaEgresosPrestamos/nomina";

const SIN_PROBLEMAS = { abono: null, total: null };

// Mientras `registrando`, los campos y los tres botones quedan bloqueados: lo
// que se ve es exactamente lo que se está enviando, y no se puede cerrar sin
// conocer el resultado. `problemas` ({ abono, total }) son los avisos que
// impiden pagar; se muestran mientras se escribe y el botón espera.
const ModalPagoNomina = ({
    empleado,
    formulario,
    totalNeto,
    problemas = SIN_PROBLEMAS,
    registrando = false,
    onCambiarCampo,
    onCerrar,
    onEnviar,
}) => {
    const idTitulo = useId();
    const dialogoRef = useRef(null);
    const hayProblemas = Boolean(problemas.abono || problemas.total);

    // Al abrir, el foco entra al diálogo (no a un campo: en el celular
    // abriría el teclado).
    useEffect(() => {
        dialogoRef.current?.focus();
    }, []);

    // Esc cierra, salvo mientras registra. Se escucha dentro del diálogo: si
    // hay una ventana de aviso encima, su Esc no cierra también el pago.
    const alPulsarTecla = (evento) => {
        if (evento.key === "Escape" && !registrando) onCerrar();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div
                ref={dialogoRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                tabIndex={-1}
                onKeyDown={alPulsarTecla}
                className="bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl mx-auto flex flex-col max-h-[95vh] focus:outline-none"
            >
                <div className="bg-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-lg shrink-0">
                    <h3 id={idTitulo} className="text-xl font-bold truncate">Procesar Pago Nómina</h3>
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={registrando}
                        aria-label="Cerrar"
                        className="text-white hover:text-gray-200 ml-4 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
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
                                {formatearPesos(empleado.saldo_prestamos)}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={onEnviar} aria-busy={registrando}>
                        <fieldset disabled={registrando} className="min-w-0">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Salario Base ($)</label>
                                    <input type="number" required min="0" step="0.01"
                                        className="w-full border rounded p-2 focus:ring-purple-500 disabled:bg-gray-100"
                                        value={formulario.salarioBase}
                                        onChange={(e) => onCambiarCampo("salarioBase", e.target.value)}
                                        placeholder="Ej. 1500000" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Bonos Adicionales ($)</label>
                                    <input type="number" min="0" step="0.01" disabled={false}
                                        className="w-full border rounded p-2 focus:ring-purple-500 text-green-700 disabled:bg-gray-100"
                                        value={formulario.bonificaciones}
                                        onChange={(e) => onCambiarCampo("bonificaciones", e.target.value)} />
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Abonar a Préstamos ($)</label>
                                    <input type="number" min="0" step="0.01" disabled={!puedeAbonarAPrestamos(empleado)}
                                        className="w-full border rounded p-2 focus:ring-purple-500 text-red-600 bg-red-50"
                                        value={formulario.abonoPrestamo}
                                        onChange={(e) => onCambiarCampo("abonoPrestamo", e.target.value)} />
                                    {tieneDeudaDePrestamos(empleado) ? (
                                        <span className="text-xs text-gray-500">Máx: {formatearPesos(empleado.saldo_prestamos)}</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">Sin préstamos pendientes</span>
                                    )}
                                    {problemas.abono && (
                                        <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{problemas.abono}</p>
                                    )}
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Otras Deducciones ($)</label>
                                    <input type="number" min="0" step="0.01"
                                        className="w-full border rounded p-2 focus:ring-purple-500 disabled:bg-gray-100"
                                        value={formulario.otrosDescuentos}
                                        onChange={(e) => onCambiarCampo("otrosDescuentos", e.target.value)} />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-gray-700 text-sm font-bold mb-1">Concepto / Notas</label>
                                    <input type="text"
                                        className="w-full border rounded p-2 focus:ring-purple-500 disabled:bg-gray-100"
                                        value={formulario.notas}
                                        onChange={(e) => onCambiarCampo("notas", e.target.value)}
                                        placeholder="Mes de Marzo 2026..." />
                                </div>
                            </div>

                            <div className="bg-purple-50 p-4 rounded mt-6 mb-6 text-center border border-purple-200">
                                <p className="text-gray-600 font-semibold mb-1">TOTAL NETO A DEPOSITAR:</p>
                                <p className="text-4xl font-black text-purple-900">{formatearPesos(totalNeto)}</p>
                                {problemas.total && (
                                    <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{problemas.total}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={onCerrar} disabled={registrando}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition disabled:cursor-not-allowed disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={registrando || hayProblemas}
                                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-6 rounded transition shadow-md disabled:cursor-not-allowed disabled:opacity-60">
                                    {registrando ? (
                                        <>
                                            <SpinnerView />
                                            Registrando pago...
                                        </>
                                    ) : (
                                        "Confirmar Pago"
                                    )}
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalPagoNomina;
