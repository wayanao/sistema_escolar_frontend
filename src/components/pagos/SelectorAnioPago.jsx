import { etiquetaEstadoAnio } from "../../utils/anioLectivo";

// El año al que va el pago: la deuda, los conceptos y el pago son del año
// elegido. Antes era un recuadro azul grande; desde el 2026-11-04 es una fila
// sutil de pestañas pequeñas (pedido del usuario).
export default function SelectorAnioPago({
  anios,
  anioSeleccionado,
  esAnioActivo,
  onCambiar,
}) {
  if (!anioSeleccionado || anios.length < 2) return null;

  return (
    <div className="mb-3">
      <div role="group" aria-label="Año del pago" className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-slate-500">Año del pago</span>
        {anios.map((anio) => {
          const elegido = anio.id === anioSeleccionado.id;
          return (
            <button
              key={anio.id}
              type="button"
              aria-pressed={elegido}
              onClick={() => onCambiar(anio.id)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                elegido
                  ? "bg-purple-100 font-semibold text-purple-800 ring-1 ring-purple-300"
                  : "text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {anio.anio}{" "}
              <span className="font-normal opacity-75">
                {etiquetaEstadoAnio(anio.estado).toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>
      {!esAnioActivo && (
        <p className="mt-1 text-xs text-slate-500">
          Las ventas de inventario pertenecen al año activo y no se incluyen aquí.
        </p>
      )}
    </div>
  );
}
