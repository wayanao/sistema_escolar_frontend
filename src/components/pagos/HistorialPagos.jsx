import { useState } from "react";

const ID_LISTA = "historial-pagos-lista";

function TarjetaPago({ pago, onImprimir, onAnular }) {
  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        pago.anulado
          ? "bg-red-50 border-red-200"
          : "bg-gray-50 border-gray-200 hover:border-purple-300"
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className={`font-medium text-lg ${pago.anulado ? "line-through text-gray-500" : ""}`}>
              {pago.descripcion}
            </p>
            {pago.anulado && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                Anulado
              </span>
            )}
          </div>
          <p className="text-gray-500">{pago.fecha}</p>
          {pago.tipo_pago && (
            <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Método: {pago.tipo_pago}
            </span>
          )}
          {pago.anulado && (
            <p className="mt-2 text-sm text-red-700">
              Motivo: {pago.motivo_anulacion || "Sin motivo registrado"}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className={`font-bold text-lg ${pago.anulado ? "text-red-600 line-through" : "text-green-600"}`}>
            ${pago.monto.toLocaleString()}
          </p>
          <div className="mt-2 flex flex-col items-end gap-2">
            <button
              onClick={() => onImprimir(pago)}
              disabled={pago.anulado}
              className="text-sm text-purple-700 hover:text-purple-800 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <span>🖨️</span> Imprimir Recibo
            </button>
            {!pago.anulado && (
              <button
                onClick={() => onAnular(pago)}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Anular pago
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// El historial empieza cerrado: no se despliega solo al elegir un estudiante
// (pedido del usuario, 2026-11-04). Después de registrar un pago se ve solo
// ese pago, con todas sus filas (una por método), para imprimir el recibo a la
// mano. El botón muestra o esconde todo. Qué está abierto es estado de la
// vista; la página lo reinicia por estudiante y por pago con `key`.
export default function HistorialPagos({ pagos, idsRecientes = [], onImprimir, onAnular }) {
  const [abierto, setAbierto] = useState(false);
  const recientes = pagos.filter((pago) => idsRecientes.includes(Number(pago.pago_id)));
  const cantidad = pagos.length;

  return (
    <section aria-label="Historial de Pagos" className="mt-6">
      <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">
        Historial de Pagos
      </h3>

      {cantidad === 0 ? (
        <p className="text-gray-500 italic">No hay pagos registrados para este estudiante.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {!abierto && recientes.length > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50/60 p-2">
              <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-green-700">
                <span aria-hidden="true">✓</span> Pago recién registrado
              </p>
              <div className="flex flex-col gap-2">
                {recientes.map((pago) => (
                  <TarjetaPago
                    key={pago.pago_id}
                    pago={pago}
                    onImprimir={onImprimir}
                    onAnular={onAnular}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            aria-expanded={abierto}
            aria-controls={ID_LISTA}
            onClick={() => setAbierto(!abierto)}
            className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-purple-300 hover:bg-purple-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-base"
              >
                🧾
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-slate-900">
                  {abierto ? "Ocultar historial" : "Ver historial de pagos"}
                </span>
                <span className="block text-xs text-slate-500">
                  {cantidad} {cantidad === 1 ? "pago registrado" : "pagos registrados"}
                </span>
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`inline-block shrink-0 text-sm text-purple-700 transition-transform motion-reduce:transition-none ${
                abierto ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {abierto && (
            <div id={ID_LISTA} className="flex flex-col gap-3">
              {pagos.map((pago) => (
                <TarjetaPago
                  key={pago.pago_id}
                  pago={pago}
                  onImprimir={onImprimir}
                  onAnular={onAnular}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
