export default function HistorialPagos({ pagos, onImprimir, onAnular }) {
  return (
    <>
      <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3 border-b pb-2">
        Historial de Pagos
      </h3>
      <div className="flex flex-col gap-3">
        {pagos.length === 0 ? (
          <p className="text-gray-500 italic">No hay pagos registrados para este estudiante.</p>
        ) : (
          pagos.map((pago) => (
            <div
              key={pago.pago_id}
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
          ))
        )}
      </div>
    </>
  );
}
