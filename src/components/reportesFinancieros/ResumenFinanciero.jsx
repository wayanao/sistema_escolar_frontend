import { formatoMoneda } from "../../utils/reportesFinancieros/formatos";

export default function ResumenFinanciero({ stats, onVerIngresosHoy, onVerEgresosHoy, onVerEgresosAcumulados }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={onVerIngresosHoy}
          className="rounded-lg border border-green-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-400 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700">Ingresos hoy</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatoMoneda(stats.ingresos_hoy)}</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">ING</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onVerEgresosHoy}
          className="rounded-lg border border-red-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-400 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">Egresos hoy</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatoMoneda(stats.egresos_hoy)}</p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">EGR</span>
          </div>
        </button>

        <div className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Balance hoy</p>
              <p className={`mt-2 text-2xl font-bold ${Number(stats.balance_hoy || 0) < 0 ? "text-red-700" : "text-gray-900"}`}>
                {formatoMoneda(stats.balance_hoy)}
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">BAL</span>
          </div>
        </div>

        <div className="rounded-lg border border-purple-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700">Balance general</p>
              <p className={`mt-2 text-2xl font-bold ${Number(stats.balance_general || 0) < 0 ? "text-red-700" : "text-gray-900"}`}>
                {formatoMoneda(stats.balance_general)}
              </p>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">GEN</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Estudiantes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_estudiantes || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Profesores</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total_profesores || 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Ingresos acumulados</p>
          <p className="mt-1 text-xl font-bold text-green-700">{formatoMoneda(stats.total_ingresos)}</p>
        </div>
        <button
          type="button"
          onClick={onVerEgresosAcumulados}
          className="rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-red-300 hover:bg-red-50"
        >
          <p className="text-xs font-semibold uppercase text-gray-500">Egresos acumulados</p>
          <p className="mt-1 text-xl font-bold text-red-700">{formatoMoneda(stats.total_egresos)}</p>
        </button>
      </div>
    </>
  );
}
