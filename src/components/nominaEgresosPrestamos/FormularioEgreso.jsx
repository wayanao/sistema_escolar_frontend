import React from "react";
import { CATEGORIAS_EGRESO } from "../../utils/nominaEgresosPrestamos/egresos";

const FormularioEgreso = ({
    formulario,
    editando,
    onCambiarCampo,
    onEnviar,
    onCancelarEdicion,
}) => (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{editando ? "Editar Egreso" : "Registrar Nuevo Egreso"}</h2>
        <form onSubmit={onEnviar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-gray-700 font-semibold mb-2">Concepto / Motivo</label>
                <input
                    type="text"
                    required
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={formulario.monto}
                    onChange={(e) => onCambiarCampo("monto", e.target.value)}
                    placeholder="Ej. 150.50"
                />
            </div>
            <div>
                <label className="block text-gray-700 font-semibold mb-2">Categoría</label>
                <select
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={formulario.fecha}
                    onChange={(e) => onCambiarCampo("fecha", e.target.value)}
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Notas adicionales</label>
                <textarea
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={formulario.notas}
                    onChange={(e) => onCambiarCampo("notas", e.target.value)}
                    placeholder="Ej. Aprobado por el director. Número de factura..."
                    rows="2"
                ></textarea>
            </div>
            <div className="md:col-span-2">
                <button
                    type="submit"
                    className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition"
                >
                    {editando ? "Actualizar Egreso" : "Registrar Egreso"}
                </button>
                {editando && (
                    <button
                        type="button"
                        onClick={onCancelarEdicion}
                        className="ml-3 rounded bg-gray-200 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-300"
                    >
                        Cancelar edición
                    </button>
                )}
            </div>
        </form>
    </div>
);

export default FormularioEgreso;
