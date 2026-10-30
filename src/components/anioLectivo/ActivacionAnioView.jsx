import {
  agruparMatriculadosPorCurso,
  agruparPendientesPorCurso,
  confirmacionCoincide,
} from "../../utils/anioLectivo";
import AvisoTrabajandoView from "./AvisoTrabajandoView";
import SpinnerView from "./SpinnerView";

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

function contarEstudiantes(cantidad) {
  return cantidad === 1 ? "1 estudiante" : `${cantidad} estudiantes`;
}

// Paso 6.7: vista previa y activación del año en preparación. Presentacional:
// los números, las listas y `puede_activar` vienen del backend.
//
// Ajuste del 2026-10-30, pedido por el usuario: la lista grande es la de
// quién va en cada curso del año en preparación. De los pendientes queda
// cuántos faltan por curso del año activo: sus nombres ya se ven al
// matricular cada curso.
export default function ActivacionAnioView({
  anioActivo,
  anioPreparacion,
  vistaPrevia,
  matriculados,
  cursosDestino,
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
  const gruposMatriculados = matriculados
    ? agruparMatriculadosPorCurso(matriculados, cursosDestino)
    : [];
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {cargando && <SpinnerView />}
          {cargando ? "Actualizando..." : "Actualizar vista previa"}
        </button>
      </div>

      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Al activar, {anioActivo.anio} queda cerrado para todos, también para los
        profesores, y {anioPreparacion.anio} pasa a ser el año en que se trabaja.
        Quien quedó marcado pasa a retirado o egresado. Hazlo cuando empiecen las
        clases de {anioPreparacion.anio}.
      </p>

      {cargando && !vistaPrevia && (
        <p className="mt-5 flex items-center gap-2 text-sm text-gray-600">
          <SpinnerView />
          Cargando vista previa...
        </p>
      )}

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

      {gruposMatriculados.length > 0 && (
        <div className="mt-5">
          <h3 className="text-base font-bold text-gray-900">
            Matriculados en {anioPreparacion.anio} por curso
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gruposMatriculados.map((grupo) => (
              <div
                key={grupo.clave}
                className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <h4 className="text-sm font-bold text-gray-900">{grupo.curso}</h4>
                  <span className="text-xs font-semibold text-emerald-800">
                    {contarEstudiantes(grupo.estudiantes.length)}
                  </span>
                </div>
                {grupo.estudiantes.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-sm text-gray-800">
                    {grupo.estudiantes.map((estudiante) => (
                      <li key={estudiante.id} className="break-words">
                        {estudiante.nombre} {estudiante.apellido}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Todavía nadie.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">{textoPendientes(pendientes.length)}</p>
          <p className="mt-1 text-sm">
            Pásalos a {anioPreparacion.anio} o márcalos como retirados o egresados
            en "Matricular estudiantes". Cuántos faltan en cada curso de{" "}
            {anioActivo.anio}:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {grupos.map((grupo) => (
              <li
                key={grupo.clave}
                className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900"
              >
                {grupo.curso}: {grupo.estudiantes.length}
              </li>
            ))}
          </ul>
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {activando && <SpinnerView />}
          {activando ? "Activando..." : `Activar ${anioPreparacion.anio}`}
        </button>
      </div>

      {/* La activación es una sola transacción en el backend: o cambia todo
          o nada. */}
      {activando && (
        <div className="mt-4">
          <AvisoTrabajandoView
            titulo={`Activando ${anioPreparacion.anio}...`}
            detalle={`Se cierra ${anioActivo.anio}, cada estudiante queda en su curso de ${anioPreparacion.anio} y quienes no siguen pasan a retirado o egresado. Puede tardar unos segundos; no cierres ni recargues la página. Si algo falla, no cambia nada.`}
          />
        </div>
      )}
    </section>
  );
}
