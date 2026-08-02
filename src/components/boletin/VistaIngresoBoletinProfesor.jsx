import {
  correspondeFormularioAEstudiante,
  formatearEtiquetaNota,
  obtenerTipoNota,
  VALORACIONES_DESARROLLO,
} from "../../utils/boletines/ingresoBoletin";

export default function VistaIngresoBoletinProfesor({
  asignacionId,
  cargando,
  clases,
  datosBoletin,
  estudiantes,
  guardandoTodos,
  periodo,
  onAplicarLogros,
  onCambiarAsignacion,
  onCambiarPeriodo,
  onGuardarEstudiante,
  onGuardarTodos,
  onObservacionChange,
  obtenerEstadoVisual,
}) {
  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📝 Ingreso a Boletín Final
        </h1>
        <p className="text-gray-600">
          Completa las observaciones de tus alumnos guiándote de sus notas de la planilla.
        </p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clase (Curso / Materia)
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            value={asignacionId}
            onChange={(event) => onCambiarAsignacion(event.target.value)}
          >
            <option value="">Seleccione una clase...</option>
            {clases.map((clase) => (
              <option key={clase.id} value={clase.id}>
                {clase.curso} - {clase.materia}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Periodo
          </label>
          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            value={periodo}
            onChange={(event) => onCambiarPeriodo(event.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <p className="text-gray-500 text-center py-10">
          Cargando información del curso...
        </p>
      ) : estudiantes.length > 0 ? (
        <div className="space-y-6">
          <AccionesGrupo
            guardandoTodos={guardandoTodos}
            onAplicarLogros={onAplicarLogros}
            onGuardarTodos={onGuardarTodos}
          />

          {estudiantes.map((estudiante) => {
            const form = datosBoletin[estudiante.estudiante_id];
            if (!correspondeFormularioAEstudiante(form, estudiante)) {
              return null;
            }

            return (
              <TarjetaEstudiante
                key={estudiante.estudiante_id}
                estudiante={estudiante}
                form={form}
                estadoVisual={obtenerEstadoVisual(estudiante.estudiante_id)}
                onGuardar={() => onGuardarEstudiante(estudiante.estudiante_id)}
                onObservacionChange={(index, texto) =>
                  onObservacionChange(estudiante.estudiante_id, index, texto)
                }
              />
            );
          })}
        </div>
      ) : (
        asignacionId && (
          <p className="text-gray-500 text-center py-10 bg-white rounded-lg shadow border border-gray-200">
            No hay estudiantes en este curso o no han cargado información.
          </p>
        )
      )}
    </div>
  );
}

function AccionesGrupo({ guardandoTodos, onAplicarLogros, onGuardarTodos }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
            Acciones del grupo
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">
            Logros generales del periodo
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Usa el primer estudiante como plantilla, luego ajusta los casos individuales y guarda todo el grupo.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onAplicarLogros}
            className="rounded-md border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50"
          >
            Aplicar logros del primer estudiante
          </button>
          <button
            type="button"
            onClick={onGuardarTodos}
            disabled={guardandoTodos}
            className="rounded-md bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
          >
            {guardandoTodos ? "Guardando grupo..." : "Guardar todo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TarjetaEstudiante({
  estudiante,
  estadoVisual,
  form,
  onGuardar,
  onObservacionChange,
}) {
  const notasVisibles = estudiante.notas || [];
  const esDesarrollo = form.observaciones.some(
    (observacion) => observacion.tipo_evaluacion === "desarrollo",
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="border-b border-gray-200 bg-slate-50/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-gray-900">
              {estudiante.nombre}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`}
                  aria-hidden="true"
                />
                {estadoVisual.label}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {estadoVisual.detail}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            {esDesarrollo ? (
              <span className="inline-flex justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Desarrollo infantil
              </span>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 sm:justify-start">
                <span className="text-sm font-semibold text-gray-600">
                  Definitiva
                </span>
                <span className="min-w-14 rounded bg-gray-100 px-2 py-1 text-center text-lg font-bold text-gray-900">
                  {Number(form.definitiva || 0).toFixed(1)}
                </span>
              </div>
            )}
            <button
              onClick={onGuardar}
              className="w-full rounded-md bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 sm:w-auto"
            >
              {estadoVisual.buttonText}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {notasVisibles.length === 0 ? (
          <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded">
            Este alumno no tiene notas registradas en esta planilla para usar como referencia.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notasVisibles.map((nota, index) => (
              <NotaBoletin
                key={index}
                nota={nota}
                observacion={form.observaciones[index].observacion}
                onChange={(texto) => onObservacionChange(index, texto)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotaBoletin({ nota, observacion, onChange }) {
  const etiquetaNota = formatearEtiquetaNota(obtenerTipoNota(nota));
  const emoji =
    VALORACIONES_DESARROLLO.find((opcion) => opcion.value === nota.valoracion)
      ?.emoji || "—";

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate max-w-[120px]"
          title={etiquetaNota}
          translate="no"
        >
          {etiquetaNota}
        </span>
        {nota.tipo_evaluacion === "numerica" ? (
          <span className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-1 rounded-full">
            Nota: {nota.valor}
          </span>
        ) : (
          <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
            {emoji}
          </span>
        )}
      </div>
      {nota.tipo_evaluacion === "desarrollo" && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Valoración registrada
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            <span>{emoji}</span>
          </span>
        </div>
      )}
      <textarea
        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
        rows="3"
        placeholder={
          nota.tipo_evaluacion === "desarrollo"
            ? "Describe el proceso del niño en este logro..."
            : "Escribe la observación sobre esta nota específica para el boletín final..."
        }
        value={observacion}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
