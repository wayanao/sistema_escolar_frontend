// Barra fija de guardado. Presentacional: no sabe guardar, solo avisa.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Se habilita con **un** cambio pendiente, no con la grilla completa. Copiar
// de Asistencia la regla de "no se puede guardar hasta marcar a todos" seria
// un error aqui: en este modulo lo normal es que casi todas las celdas queden
// sin marcar.
function BarraGuardadoSeguimiento({
  cantidadCambios = 0,
  guardando = false,
  onGuardar,
  onDescartar,
}) {
  const hayCambios = cantidadCambios > 0;

  return (
    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <p className="text-sm text-gray-600">
        {hayCambios
          ? `${cantidadCambios} ${cantidadCambios === 1 ? "cambio sin guardar" : "cambios sin guardar"}.`
          : "No hay cambios sin guardar."}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!hayCambios || guardando}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onDescartar}
        >
          Descartar
        </button>

        <button
          type="button"
          disabled={!hayCambios || guardando}
          aria-busy={guardando}
          className="rounded-lg bg-purple-700 px-5 py-3 text-base font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-gray-300 sm:min-w-52"
          onClick={onGuardar}
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

export default BarraGuardadoSeguimiento;
