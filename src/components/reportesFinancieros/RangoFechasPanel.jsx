export default function RangoFechasPanel({
  fechaInicio,
  fechaFin,
  onCambiarFechaInicio,
  onCambiarFechaFin,
  onConsultarIngresos,
  onConsultarEgresos,
  loadingDetalle,
  estudiantesPorCurso,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Rango de fechas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => onCambiarFechaInicio(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => onCambiarFechaFin(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onConsultarIngresos}
          disabled={loadingDetalle}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          Ingresos
        </button>
        <button
          type="button"
          onClick={onConsultarEgresos}
          disabled={loadingDetalle}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          Egresos
        </button>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold text-gray-700">Estudiantes por curso</h3>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {estudiantesPorCurso.map((item) => (
            <div key={item.curso} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-800">{item.curso}</span>
              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                {item.cantidad}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
