import "./mallaCurricular.css";

export default function EncabezadoMallaCurricular({
  asignacion,
  estadoVisual,
  onPeriodoChange,
  periodo,
}) {
  return (
    <>
      <div className="planeador-header">
        <h1 className="text-2xl font-bold mb-2 sm:text-4xl">Planeador Anual de Clases</h1>
        <p className="text-purple-100 text-base sm:text-lg">Planificación académica institucional</p>
      </div>

      {asignacion && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3" />
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Curso</p>
                <p className="text-lg font-semibold text-gray-900">{asignacion.curso}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Materia</p>
                <p className="text-lg font-semibold text-gray-900">{asignacion.materia}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}>
                <span className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`} aria-hidden="true" />
                {estadoVisual.label}
              </span>
              <span className="text-xs font-medium text-gray-500 sm:ml-3">{estadoVisual.detail}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 no-print sm:mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Período:</label>
          <select
            value={periodo}
            onChange={(event) => onPeriodoChange(event.target.value)}
            className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition duration-200"
          >
            <option value="1">Período 1</option>
            <option value="2">Período 2</option>
            <option value="3">Período 3</option>
            <option value="4">Período 4</option>
          </select>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-900 no-print">
        Puedes diligenciar uno o varios campos por fila. Si una fila tiene contenido, su fecha límite es obligatoria.
      </p>
    </>
  );
}
