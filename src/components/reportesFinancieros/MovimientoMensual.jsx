import { formatoMoneda, nombreMes } from "../../utils/reportesFinancieros/formatos";

export default function MovimientoMensual({ mesesFinancieros, onVerIngresosMes, onVerEgresosMes }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Movimiento mensual</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Últimos meses</span>
      </div>
      <div className="space-y-4">
        {mesesFinancieros.map((item) => (
          <div key={item.mes} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => onVerIngresosMes(item.mes)}
                className="text-left text-sm font-bold capitalize text-purple-700 hover:text-purple-900"
              >
                {nombreMes(item.mes)}
              </button>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onVerIngresosMes(item.mes)}
                  className="rounded bg-green-100 px-2 py-1 text-green-700 hover:bg-green-200"
                >
                  {formatoMoneda(item.ingreso)}
                </button>
                <button
                  type="button"
                  onClick={() => onVerEgresosMes(item.mes)}
                  className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                >
                  {formatoMoneda(item.egreso)}
                </button>
                <span className={`rounded px-2 py-1 ${item.balance < 0 ? "bg-red-50 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                  {formatoMoneda(item.balance)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.max((item.ingreso / item.maximo) * 100, item.ingreso ? 6 : 0)}%` }}
                ></div>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${Math.max((item.egreso / item.maximo) * 100, item.egreso ? 6 : 0)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        {mesesFinancieros.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">No hay movimientos registrados.</p>
        )}
      </div>
    </div>
  );
}
