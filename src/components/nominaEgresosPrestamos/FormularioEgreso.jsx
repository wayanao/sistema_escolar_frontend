import React from "react";
import SpinnerView from "../anioLectivo/SpinnerView";
import { CATEGORIAS_EGRESO } from "../../utils/nominaEgresosPrestamos/egresos";

// `guardando`: campos y botones bloqueados, y el botón dice qué hace.
// `tituloRef`: el título recibe el foco cuando la página sube a editar.
const FormularioEgreso = ({
    formulario,
    editando,
    guardando = false,
    tituloRef,
    onCambiarCampo,
    onEnviar,
    onCancelarEdicion,
}) => (
    <div className={`bg-white shadow rounded-lg p-6 mb-8 ${editando ? "ring-2 ring-amber-300" : ""}`}>
        <h2 ref={tituloRef} tabIndex={-1} className="text-xl font-bold mb-4 focus:outline-none">
            {editando ? "Editar Egreso" : "Registrar Nuevo Egreso"}
        </h2>
        {editando && (
            <p className="-mt-2 mb-4 text-sm text-amber-700">
                Estás cambiando un egreso que ya está en la lista.
            </p>
        )}
        <form onSubmit={onEnviar} aria-busy={guardando}>
            <fieldset disabled={guardando} className="min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Concepto / Motivo</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.concepto}
                            onChange={(e) => onCambiarCampo("concepto", e.target.value)}
                            placeholder="Ej. Compra de papelería"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Monto ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.monto}
                            onChange={(e) => onCambiarCampo("monto", e.target.value)}
                            placeholder="Ej. 150.50"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Categoría</label>
                        <select
                            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                            value={formulario.categoria}
                            onChange={(e) => onCambiarCampo("categoria", e.target.value)}
                        >
                            {CATEGORIAS_EGRESO.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
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
                            placeholder="Ej. Aprobado por el director. Número de factura..."
                            rows="2"
                        ></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition disabled:cursor-wait disabled:opacity-75"
                        >
                            {guardando ? (
                                <>
                                    <SpinnerView />
                                    {editando ? "Guardando cambios..." : "Registrando egreso..."}
                                </>
                            ) : editando ? (
                                "Actualizar Egreso"
                            ) : (
                                "Registrar Egreso"
                            )}
                        </button>
                        {editando && (
                            <button
                                type="button"
                                onClick={onCancelarEdicion}
                                disabled={guardando}
                                className="ml-3 rounded bg-gray-200 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancelar edición
                            </button>
                        )}
                    </div>
                </div>
            </fieldset>
        </form>
    </div>
);

export default FormularioEgreso;
