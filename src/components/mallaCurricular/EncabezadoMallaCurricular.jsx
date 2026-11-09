import "./mallaCurricular.css";

/**
 * Encabezado del planeador anual. `selector` es la clase y el período
 * (SelectorClaseTrabajo), que se eligen aquí mismo desde el 2026-11-09.
 * `estadoVisual` (guardado, cambios sin guardar...) y la nota de las fechas
 * solo salen cuando hay una clase con su planeador abierto.
 */
export default function EncabezadoMallaCurricular({ selector, estadoVisual = null }) {
  return (
    <>
      <div className="planeador-header">
        <h1 className="text-2xl font-bold mb-2 sm:text-4xl">Planeador Anual de Clases</h1>
        <p className="text-purple-100 text-base sm:text-lg">Planificación académica institucional</p>
      </div>

      <section className="mb-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm no-print sm:mb-6 sm:p-5">
        <h2 className="text-sm font-bold text-slate-950">¿Qué clase vas a planear?</h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-500">
          La clase y el período quedan elegidos también en Planilla y Asistencia.
        </p>
        {selector}
        {estadoVisual && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}>
              <span className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true" />
              {estadoVisual.label}
            </span>
            <span className="text-xs font-medium text-gray-500 sm:ml-3">{estadoVisual.detail}</span>
          </div>
        )}
      </section>

      {estadoVisual && (
        <p className="mb-4 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-900 no-print">
          Puedes diligenciar uno o varios campos por fila. Si una fila tiene contenido, su fecha límite es obligatoria.
        </p>
      )}
    </>
  );
}
