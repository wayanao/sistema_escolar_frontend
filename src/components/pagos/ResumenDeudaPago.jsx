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

const detalleAlDia = (fila) =>
  fila.mesesPorAdelantar > 0
    ? `Al día · ${formatearMoneda(fila.valorMes)} por mes · ${fila.mesesPorAdelantar} ${
        fila.mesesPorAdelantar === 1 ? "mes" : "meses"
      } por adelantar`
    : "Al día · Sin meses por adelantar";

// Celular: dos columnas (nombre | valor y botón, uno debajo del otro).
// Computador: tres (nombre y detalle | valor de ancho fijo | botón), así los
// valores quedan alineados como en una factura.
const claseFila =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto] sm:py-1.5";

// Verde lleno y con el ícono, para que se note: es la acción de la pantalla.
// Bajito, para que varios seguidos no se vean pesados.
const claseBotonCobro =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-green-300";

// "Lo que debe": desde el 2026-11-04 es la única forma de elegir qué cobrar.
// Cada deuda tiene su "Cobrar" y cada concepto mensual al día su "Adelantar";
// los dos abren el formulario con ese concepto. Compacto, para no empujar el
// formulario hacia abajo. Solo presenta: las filas y el total vienen de
// `crearResumenDeuda`. "Al día" solo se dice cuando ya se consultó todo sin
// errores.
export default function ResumenDeudaPago({
  anio,
  resumen,
  cargando,
  error,
  errorAdelanto = "",
  onReintentar,
  onReintentarAdelanto,
  onCobrar,
}) {
  const titulo = anio ? `Lo que debe en ${anio}` : "Lo que debe";
  const { filas, total } = resumen;
  const conDeuda = filas.some((fila) => !fila.alDia);
  const alDia = !conDeuda && !cargando && !error;
  // Que se vea de lejos (pedido del usuario, 2026-11-04): rojo si debe, verde
  // si está al día y gris mientras consulta o si falló.
  const claseEstado = conDeuda
    ? "border-2 border-red-300 bg-red-50/40"
    : alDia
      ? "border border-emerald-200 bg-white"
      : "border border-gray-200 bg-white";

  return (
    <section
      aria-label={titulo}
      className={`mb-4 rounded-lg px-3 py-2 ${claseEstado}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
        {conDeuda && !error && (
          <p className="font-bold text-red-700">{formatearMoneda(total)}</p>
        )}
      </div>

      {!conDeuda && cargando && (
        <p className="mt-1 text-sm text-slate-600">Consultando lo que debe...</p>
      )}
      {alDia && (
        <p className="mt-1 text-sm font-medium text-emerald-700">
          Al día: no debe nada{anio ? ` en ${anio}` : ""}.
        </p>
      )}

      {filas.length > 0 && (
        <ul className="mt-1 divide-y divide-gray-100">
          {filas.map((fila) => {
            // En computador, una línea por fila, como una tabla: nombre y
            // detalle, el valor en una columna alineada y el botón. En celular
            // no cabe: el detalle baja debajo del nombre y el botón debajo del
            // valor (capturas del usuario, 2026-11-04).
            if (fila.alDia) {
              return (
                <li key={fila.clave} className={claseFila}>
                  <p className="min-w-0 break-words text-sm sm:col-span-2">
                    <span className="font-semibold text-slate-900">{fila.nombre}</span>
                    <span className="block text-xs text-emerald-700 sm:ml-1.5 sm:inline">
                      <span aria-hidden="true" className="hidden sm:inline">· </span>
                      <span>{detalleAlDia(fila)}</span>
                    </span>
                  </p>
                  {fila.mesesPorAdelantar > 0 && (
                    <button
                      type="button"
                      onClick={() => onCobrar(fila)}
                      disabled={cargando}
                      aria-label={`Adelantar ${fila.nombre}`}
                      className={`${claseBotonCobro} justify-self-end`}
                    >
                      Adelantar
                    </button>
                  )}
                </li>
              );
            }

            const detalles = detallesDe(fila);
            return (
              <li key={fila.clave} className={claseFila}>
                <p className="row-span-2 min-w-0 break-words text-sm sm:row-span-1">
                  <span className="font-semibold text-slate-900">{fila.nombre}</span>
                  {fila.valorPersonalizado && (
                    <span className="ml-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      Valor personalizado
                    </span>
                  )}
                  {detalles.length > 0 && (
                    <span className="block text-xs text-slate-500 sm:ml-1.5 sm:inline">
                      <span aria-hidden="true" className="hidden sm:inline">· </span>
                      <span>{detalles.join(" · ")}</span>
                    </span>
                  )}
                </p>
                <strong className="whitespace-nowrap text-right text-sm tabular-nums text-slate-900">
                  {formatearMoneda(fila.monto)}
                </strong>
                <button
                  type="button"
                  onClick={() => onCobrar(fila)}
                  disabled={cargando}
                  aria-label={`Cobrar ${fila.nombre}`}
                  className={`${claseBotonCobro} justify-self-end`}
                >
                  <span aria-hidden="true">💰</span> Cobrar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div
          role="alert"
          className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900"
        >
          <p>{error}</p>
          <button type="button" onClick={onReintentar} className="mt-1 font-bold underline">
            Reintentar
          </button>
        </div>
      )}
      {errorAdelanto && (
        <p className="mt-2 text-xs text-amber-800">
          {errorAdelanto}{" "}
          <button
            type="button"
            onClick={onReintentarAdelanto}
            aria-label="Reintentar los meses para adelantar"
            className="font-bold underline"
          >
            Reintentar
          </button>
        </p>
      )}
      {cargando && conDeuda && (
        <p className="mt-1 text-xs text-slate-500">Actualizando...</p>
      )}
    </section>
  );
}
