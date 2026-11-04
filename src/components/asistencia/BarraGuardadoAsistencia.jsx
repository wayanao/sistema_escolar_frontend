function BarraGuardadoAsistencia({
  resumenAsistencia,
  hayCambiosSinGuardar,
  asistenciaDelDiaTomada,
  puedeGuardar,
  guardando,
  onGuardar,
}) {
  // En el celular del profesor queda encima de la barra de abajo del menú
  // (--alto-barra-inferior, que pone MenuLateralView); sin ella, a 12 px del borde.
  return (
    <div className="sticky bottom-[calc(var(--alto-barra-inferior,0px)+0.75rem)] z-10 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="text-sm text-gray-600">
        {resumenAsistencia.pendientes > 0
          ? `Falta marcar ${resumenAsistencia.pendientes} estudiante${resumenAsistencia.pendientes === 1 ? "" : "s"}.`
          : hayCambiosSinGuardar
            ? `${resumenAsistencia.presentes} presentes · ${resumenAsistencia.ausentes} ausentes`
            : asistenciaDelDiaTomada
              ? "La asistencia está guardada y no tiene cambios."
              : "Usa la marcación rápida o selecciona cada estudiante."}
      </div>
      <button
        type="button"
        disabled={!puedeGuardar}
        className="rounded-lg bg-purple-700 px-5 py-3 text-base font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:min-w-52"
        onClick={onGuardar}
      >
        {guardando
          ? "Guardando..."
          : asistenciaDelDiaTomada
            ? "Guardar cambios"
            : "Guardar asistencia"}
      </button>
    </div>
  );
}

export default BarraGuardadoAsistencia;
