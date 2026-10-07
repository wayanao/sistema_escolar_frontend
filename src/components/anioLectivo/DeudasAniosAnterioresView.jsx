const formatearMontoPredeterminado = (valor) =>
  `$${Number(valor || 0).toLocaleString("es-CO")}`;

// Presentación compartida por Pagos, Cartera y la ficha del estudiante. El
// backend entrega cada año ya calculado; esta vista solo lo muestra aparte.
export default function DeudasAniosAnterioresView({
  deudasAnios = [],
  formatearMonto = formatearMontoPredeterminado,
  className = "",
}) {
  const aniosConDeuda = deudasAnios.filter(
    (item) => Number(item?.total_deuda || 0) > 0,
  );
  if (aniosConDeuda.length === 0) return null;

  return (
    <section
      className={`rounded-lg border border-amber-200 bg-amber-50 p-3 ${className}`.trim()}
    >
      <h4 className="font-semibold text-amber-950">Deudas de años anteriores</h4>
      <p className="mt-1 text-xs text-amber-800">
        Se muestran separadas de la deuda del año consultado.
      </p>

      <div className="mt-3 space-y-3">
        {aniosConDeuda.map((item) => (
          <div
            key={item.anio_lectivo_id ?? item.anio}
            className="rounded-md border border-amber-200 bg-white p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm text-slate-800">Año {item.anio}</strong>
              <strong className="text-sm text-amber-900">
                {formatearMonto(item.total_deuda)}
              </strong>
            </div>
            {(item.deudas || []).length > 0 && (
              <ul className="mt-2 space-y-1 border-t border-amber-100 pt-2">
                {item.deudas.map((deuda, indice) => (
                  <li
                    key={`${deuda.concepto || "concepto"}-${indice}`}
                    className="flex items-center justify-between gap-3 text-xs text-slate-700"
                  >
                    <span>{deuda.concepto}</span>
                    <span className="font-semibold text-amber-900">
                      {formatearMonto(deuda.deuda)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
