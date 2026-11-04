import { formatearMoneda } from "../../utils/pagos/formatos";

const detallesDe = (fila) => {
  const detalles = [];
  if (fila.inventario) detalles.push("Cargo de inventario");
  if (fila.mesesPendientes > 0) {
    detalles.push(
      `${fila.mesesPendientes} ${fila.mesesPendientes === 1 ? "mes pendiente" : "meses pendientes"}`
    );
  }
  if (fila.abonado > 0) detalles.push(`Ya abonó ${formatearMoneda(fila.abonado)}`);
  if (fila.mora > 0) detalles.push(`Incluye mora de ${formatearMoneda(fila.mora)}`);
  return detalles;
};

// "Lo que debe", arriba del formulario: así no hay que abrirlo y desplegar la
// lista de conceptos para saberlo. Cada fila tiene su "Cobrar", que abre el
// formulario con ese concepto ya elegido. Solo presenta: las filas y el total
// vienen de `crearResumenDeuda`. "Al día" solo se dice cuando ya se consultó
// todo sin errores.
export default function ResumenDeudaPago({
  anio,
  resumen,
  cargando,
  error,
  onReintentar,
  onCobrar,
}) {
  const titulo = anio ? `Lo que debe en ${anio}` : "Lo que debe";
  const { filas, total } = resumen;
  const sinFilas = filas.length === 0;

  return (
    <section
      aria-label={titulo}
      className="mb-5 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{titulo}</h3>
        {!sinFilas && !error && (
          <p className="text-lg font-bold text-red-700">{formatearMoneda(total)}</p>
        )}
      </div>

      {sinFilas && cargando && (
        <p className="mt-2 text-sm text-slate-600">Consultando lo que debe...</p>
      )}
      {sinFilas && !cargando && !error && (
        <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          Al día: no debe nada{anio ? ` en ${anio}` : ""}.
        </p>
      )}

      {!sinFilas && (
        <ul className="mt-2 divide-y divide-gray-100">
          {filas.map((fila) => {
            const detalles = detallesDe(fila);
            return (
              <li
                key={fila.clave}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{fila.nombre}</p>
                  {(detalles.length > 0 || fila.valorPersonalizado) && (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                      {detalles.length > 0 && <span>{detalles.join(" · ")}</span>}
                      {fila.valorPersonalizado && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          Valor personalizado
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <strong className="text-slate-900">{formatearMoneda(fila.monto)}</strong>
                  <button
                    type="button"
                    onClick={() => onCobrar(fila)}
                    disabled={cargando}
                    aria-label={`Cobrar ${fila.nombre}`}
                    className="rounded-lg border border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                  >
                    Cobrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div
          role="alert"
          className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <p>{error}</p>
          <button type="button" onClick={onReintentar} className="mt-1 font-bold underline">
            Reintentar
          </button>
        </div>
      )}
      {cargando && !sinFilas && (
        <p className="mt-2 text-xs text-slate-500">Actualizando...</p>
      )}
    </section>
  );
}
