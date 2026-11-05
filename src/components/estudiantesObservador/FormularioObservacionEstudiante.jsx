export default function FormularioObservacionEstudiante({
  estudiante,
  periodo,
  conductual,
  cognitivo,
  lenguaje,
  onCambiarConductual,
  onCambiarCognitivo,
  onCambiarLenguaje,
  guardando,
  estadoVisual,
  cargando,
  errorCarga,
  onGuardar,
  onImprimir,
  onReintentar,
}) {
  const bloqueado = guardando || cargando || Boolean(errorCarga);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {estudiante.nombre} {estudiante.apellido} (Período {periodo})
          </h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            {estadoVisual.detail}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${estadoVisual.badgeClass}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${estadoVisual.dotClass}`}
            aria-hidden="true"
          />
          {estadoVisual.label}
        </span>
      </div>

      {errorCarga && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <p className="font-semibold">
            No pudimos recuperar la observación guardada.
          </p>
          <p className="mt-1 text-xs">
            Revisa la conexión y vuelve a intentarlo antes de editar.
          </p>
          <button
            type="button"
            onClick={onReintentar}
            className="mt-2 font-bold text-rose-800 underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensión Conductual / Disciplinario
          </label>
          <textarea
            placeholder="Observaciones sobre el comportamiento del estudiante..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            value={conductual}
            disabled={bloqueado}
            onChange={(e) => onCambiarConductual(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensión Cognitiva
          </label>
          <textarea
            placeholder="Observaciones sobre el desarrollo cognitivo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            value={cognitivo}
            disabled={bloqueado}
            onChange={(e) => onCambiarCognitivo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensión del Lenguaje
          </label>
          <textarea
            placeholder="Observaciones sobre el desarrollo del lenguaje..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            value={lenguaje}
            disabled={bloqueado}
            onChange={(e) => onCambiarLenguaje(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onGuardar}
          disabled={bloqueado}
          className="inline-flex min-w-44 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-purple-300"
        >
          {guardando && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {guardando ? "Guardando..." : estadoVisual.buttonText}
        </button>

        <button
          type="button"
          onClick={onImprimir}
          disabled={bloqueado}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Imprimir Reporte
        </button>
      </div>
    </div>
  );
}
