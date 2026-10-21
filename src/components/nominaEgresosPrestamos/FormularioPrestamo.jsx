import React from "react";
import SpinnerView from "../anioLectivo/SpinnerView";

// `registrando`: este formulario se está guardando (campos bloqueados y el
// botón lo dice). `bloqueado`: otra operación está en curso y el botón espera.
const FormularioPrestamo = ({
    formulario,
    profesores,
    cargandoProfesores,
    registrando = false,
    bloqueado = false,
    onCambiarCampo,
    onEnviar,
}) => (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Registrar Nuevo Préstamo</h2>
        <form onSubmit={onEnviar} aria-busy={registrando}>
            <fieldset disabled={registrando} className="min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Profesor o trabajador</label>
                        <select
                            required
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.profesorId}
                            onChange={(e) => onCambiarCampo("profesorId", e.target.value)}
                            disabled={cargandoProfesores}
                        >
                            <option value="">{cargandoProfesores ? "Cargando profesores..." : "-- Seleccionar --"}</option>
                            {profesores.map(prof => (
                                <option key={prof.id} value={prof.id}>
                                    {prof.apellido} {prof.nombre} - {prof.documento_identidad}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Monto del Préstamo ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.monto}
                            onChange={(e) => onCambiarCampo("monto", e.target.value)}
                            placeholder="Ej. 500000"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Fecha (Opcional, hoy por defecto)</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.fecha}
                            onChange={(e) => onCambiarCampo("fecha", e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 font-semibold mb-2">Notas adicionales</label>
                        <textarea
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.notas}
                            onChange={(e) => onCambiarCampo("notas", e.target.value)}
                            placeholder="Ej. Descuento programado para la siguiente quincena..."
                            rows="2"
                        ></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={registrando || bloqueado}
                            className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition disabled:cursor-wait disabled:opacity-75"
                        >
                            {registrando ? (
                                <>
                                    <SpinnerView />
                                    Registrando préstamo...
                                </>
                            ) : (
                                "Registrar Préstamo"
                            )}
                        </button>
                    </div>
                </div>
            </fieldset>
        </form>
    </div>
);

export default FormularioPrestamo;
