/**
 * Tarjeta de los rankings donde se elige la clase y el período
 * (`children`: SelectorClaseTrabajo). Antes los rankings los tomaban del
 * panel.
 */
function SeleccionClaseRanking({ children }) {
  return (
    <section className="mb-6 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-bold text-slate-950">¿De qué clase quieres ver el ranking?</h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-500">
        La clase y el período quedan elegidos también en Planilla y Asistencia.
      </p>
      {children}
    </section>
  );
}

export default SeleccionClaseRanking;
