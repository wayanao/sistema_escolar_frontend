import { formatearPesos } from "../../utils/formatoPesos";

// Sale en vez del paz y salvo cuando el estudiante debe algo: el certificado
// no se expide hasta que se registre el pago.
export default function AvisoDeudaPazSalvo({ deuda, onCerrar }) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            No se puede expedir el paz y salvo: {deuda.estudiante} debe {formatearPesos(deuda.total)}.
          </p>
          <p className="mt-1 text-amber-800">
            Registra el pago en Pagos y vuelve a generarlo. Solo cuenta lo vencido a hoy.
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
        >
          Cerrar
        </button>
      </div>
      <ul className="mt-3 divide-y divide-amber-200 border-t border-amber-200">
        {deuda.items.map((item, indice) => (
          <li key={indice} className="flex justify-between gap-4 py-1.5">
            <span>{item.etiqueta}</span>
            <span className="font-semibold">{formatearPesos(item.valor)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
