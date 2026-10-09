import {
  agruparPendientesPorCurso,
  confirmacionCoincide,
} from "../../utils/anioLectivo";

const CONTEOS = [
  ["continuan", "Continúan"],
  ["nuevos", "Nuevos"],
  ["retirados", "Retirados"],
  ["egresados", "Egresados"],
  ["sin_decidir", "Sin decidir"],
];

function textoPendientes(cantidad) {
  return cantidad === 1
    ? "Falta 1 estudiante por decidir."
    : `Faltan ${cantidad} estudiantes por decidir.`;
}

// Paso 6.7: vista previa y activación del año en preparación. Presentacional:
// los números, la lista y `puede_activar` vienen del backend.
export default function ActivacionAnioView({
  anioActivo,
  anioPreparacion,
  vistaPrevia,
  cargando,
  confirmacion,
  activando,
  onCambiarConfirmacion,
  onActivar,
  onActualizar,
}) {
  const resumen = vistaPrevia?.resumen;
  const pendientes = vistaPrevia?.sin_decidir ?? [];
  const grupos = agruparPendientesPorCurso(pendientes);
  const puedeActivar = Boolean(vistaPrevia?.puede_activar);
  const coincide = confirmacionCoincide(confirmacion, anioPreparacion.anio);
  const idCampo = "confirmar-activacion";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">3. Activar {anioPreparacion.anio}</h2>
        <button
          type="button"
          onClick={() => onActualizar()}
          disabled={cargando || activando}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {cargando ? "Actualizando..." : "Actualizar vista previa"}
        </button>
      </div>

      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Al activar, {anioActivo.anio} queda cerrado para todos, también para los
        profesores, y {anioPreparacion.anio} pasa a ser el año en que se trabaja.
        Quien quedó marcado pasa a retirado o egresado. Hazlo cuando empiecen las
        clases de {anioPreparacion.anio}.
      </p>

      {resumen && (
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CONTEOS.map(([campo, etiqueta]) => (
            <div key={campo} className="rounded-lg border border-gray-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {etiqueta}
              </dt>
              <dd className="mt-1 text-2xl font-bold text-gray-900">{resumen[campo] ?? 0}</dd>
            </div>
          ))}
        </dl>
      )}

      {pendientes.length > 0 && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">{textoPendientes(pendientes.length)}</p>
          <p className="mt-1 text-sm">
            Pásalos a {anioPreparacion.anio} o márcalos como retirados o egresados
            en "Matricular estudiantes".
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {grupos.map((grupo) => (
              <div key={grupo.clave} className="min-w-0 rounded-lg bg-white p-3">
                <h3 className="text-sm font-bold text-gray-900">{grupo.curso}</h3>
                <ul className="mt-1 space-y-0.5 text-sm text-gray-800">
                  {grupo.estudiantes.map((estudiante) => (
                    <li key={estudiante.id} className="break-words">
                      {estudiante.nombre} {estudiante.apellido}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        {puedeActivar && (
          <div className="text-sm font-medium text-gray-800">
            <label htmlFor={idCampo}>Escribe {anioPreparacion.anio} para confirmar</label>
            <input
              id={idCampo}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={confirmacion}
              onChange={(event) => onCambiarConfirmacion(event.target.value)}
              disabled={activando}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 sm:w-40"
            />
          </div>
        )}
        <button
          type="button"
          onClick={onActivar}
          disabled={!puedeActivar || !coincide || activando}
          className="w-full rounded-lg bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {activando ? "Activando..." : `Activar ${anioPreparacion.anio}`}
        </button>
      </div>
    </section>
  );
}
