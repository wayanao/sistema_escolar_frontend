import DocumentoImprimible from "../impresion/DocumentoImprimible";
import { subtotalItemCarrito } from "../../utils/inventarioVentas/ventas";

function VolanteVenta({ venta, onVolver }) {
    return (
        <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
            <div className="fixed top-4 left-4 no-print z-[60]">
                <button
                    onClick={onVolver}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900"
                >
                    ← Volver
                </button>
            </div>
            <DocumentoImprimible
                tipo="volante_venta"
                titulo="Volante de Pago"
                subtitulo={`Cargo #${venta.id} · ${venta.fecha}`}
            >
                <div className="mb-6">
                    <p><strong>Cliente:</strong> <span className="capitalize">{venta.cliente}</span></p>
                    <p><strong>Condición:</strong> {venta.tipo_venta}</p>
                </div>
                <table className="w-full text-left border-collapse mb-4">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-2">Cant</th>
                            <th className="py-2">Descripción</th>
                            <th className="py-2 text-right">P. Unitario</th>
                            <th className="py-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {venta.detalles.map((p, idx) => (
                            <tr key={idx} className="border-b">
                                <td className="py-2">{p.cantidad}</td>
                                <td className="py-2">{p.nombre}</td>
                                <td className="py-2 text-right">${p.precio_venta.toLocaleString()}</td>
                                <td className="py-2 text-right font-bold">${subtotalItemCarrito(p).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="py-4 text-right text-xl font-bold">TOTAL A PAGAR:</td>
                            <td className="py-4 text-right text-xl font-bold">${venta.total.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
                <div className="text-center mt-10 text-gray-500 text-sm font-medium">
                    <p>Gracias por contribuir con nuestra institución</p>
                </div>
            </DocumentoImprimible>
        </div>
    );
}

export default VolanteVenta;
