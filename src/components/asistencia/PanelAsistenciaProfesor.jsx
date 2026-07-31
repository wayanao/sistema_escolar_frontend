import AsistenciaRow from "./AsistenciaRow";

function PanelAsistenciaProfesor({
  estudiantes,
  historialPorEstudiante,
  asistencia,
  cargandoHistorial,
  historialListo,
  errorHistorial,
  puedeInteractuar,
  hayCambiosSinGuardar,
  asistenciaDelDiaTomada,
  resumenAsistencia,
  onReintentarHistorial,
  onMarcarTodosPresentes,
  onRestaurarSeleccion,
  onMarcar,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Lista de Estudiantes</h2>
          {cargandoHistorial && (
            <p className="mt-1 text-sm font-medium text-gray-500">Cargando historial de inasistencias...</p>
          )}
          {errorHistorial && (
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-sm font-semibold text-red-600">{errorHistorial}</p>
              <button
                type="button"
                onClick={onReintentarHistorial}
                className="w-fit rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
        {historialListo && !errorHistorial && (
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Historial actualizado
          </span>
        )}
      </div>

      <div className="mb-5 rounded-lg border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Marcación rápida</p>
            <p className="mt-1 text-sm text-gray-600">
              Marca a todos como presentes y cambia únicamente a quienes no asistieron.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={!puedeInteractuar}
              onClick={onMarcarTodosPresentes}
              className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              ✔ Marcar todos presentes
            </button>
            <button
              type="button"
              disabled={!puedeInteractuar || !hayCambiosSinGuardar}
              onClick={onRestaurarSeleccion}
              className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              {asistenciaDelDiaTomada ? "Restaurar guardado" : "Limpiar selección"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Resumen de asistencia">
          <div className="rounded-md border border-emerald-200 bg-white px-2 py-2 text-center">
            <p className="text-lg font-bold text-emerald-700">{resumenAsistencia.presentes}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 sm:text-xs">Presentes</p>
          </div>
          <div className="rounded-md border border-red-200 bg-white px-2 py-2 text-center">
            <p className="text-lg font-bold text-red-700">{resumenAsistencia.ausentes}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 sm:text-xs">Ausentes</p>
          </div>
          <div className="rounded-md border border-amber-200 bg-white px-2 py-2 text-center">
            <p className="text-lg font-bold text-amber-700">{resumenAsistencia.pendientes}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 sm:text-xs">Pendientes</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {estudiantes.map((estudiante) => {
          const historial = historialPorEstudiante.get(Number(estudiante.estudiante_id)) || [];
          return (
            <AsistenciaRow
              key={estudiante.estudiante_id}
              est={{ ...estudiante, historial }}
              estado={asistencia[estudiante.estudiante_id]}
              marcar={onMarcar}
              cargandoHistorial={cargandoHistorial}
              disabled={!puedeInteractuar}
            />
          );
        })}
        {historialListo && estudiantes.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No hay estudiantes activos en esta clase.
          </p>
        )}
      </div>
    </div>
  );
}

export default PanelAsistenciaProfesor;
