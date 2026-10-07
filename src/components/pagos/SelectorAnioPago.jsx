import { etiquetaAnioLectivo } from "../../utils/anioLectivo";

export default function SelectorAnioPago({
  anios,
  anioSeleccionado,
  esAnioActivo,
  onCambiar,
}) {
  if (!anioSeleccionado || anios.length < 2) return null;

  return (
    <section className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold text-blue-950">Año del pago</h3>
          <p className="mt-1 text-sm text-blue-800">
            La deuda, los conceptos y el pago corresponden al año que elijas.
          </p>
        </div>
        <label className="text-sm font-semibold text-blue-950">
          <span className="mb-1 block">Año del pago</span>
          <select
            aria-label="Año del pago"
            value={anioSeleccionado.id}
            onChange={(event) => onCambiar(Number(event.target.value))}
            className="min-w-48 rounded-lg border border-blue-300 bg-white px-3 py-2"
          >
            {anios.map((anio) => (
              <option key={anio.id} value={anio.id}>
                {etiquetaAnioLectivo(anio)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!esAnioActivo && (
        <p className="mt-3 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-blue-900">
          Las ventas de inventario pertenecen al año activo y no se incluyen aquí.
        </p>
      )}
    </section>
  );
}
