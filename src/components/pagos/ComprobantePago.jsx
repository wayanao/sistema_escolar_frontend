import DocumentoImprimible from "../impresion/DocumentoImprimible";
import FacturaModerna from "./FacturaModerna";

export default function ComprobantePago({ pago, estudiante, onCerrar }) {
  if (!pago || !estudiante) return null;

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
      <div className="fixed top-4 left-4 no-print z-[60]">
        <button
          onClick={onCerrar}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900"
        >
          ← Volver
        </button>
      </div>
      <DocumentoImprimible
        tipo="voucher_pago"
        titulo="Comprobante de Pago"
        subtitulo={`Factura #FAC-${(pago.pago_id || 0).toString().padStart(6, "0")}`}
      >
        <FacturaModerna pago={pago} estudiante={estudiante} />
      </DocumentoImprimible>
    </div>
  );
}
