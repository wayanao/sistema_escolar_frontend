import {
  OPCIONES_PERIODO_RESUMEN,
  rendimientoDelPeriodo,
} from "../../../utils/estudiantesObservador/estudiantes";

const TONO_NOTA = {
  aprobada: "font-semibold text-green-600",
  reprobada: "font-semibold text-red-600",
  carita: "font-semibold text-purple-800",
  sin_nota: "text-gray-500 italic",
};

/**
 * La tarjeta "Rendimiento" de la ficha del admin. Ver
 * `docs/funcionalidades/NOTAS_RESUMEN_ESTUDIANTE.md`.
 *
 * Botones para escoger el periodo o "Todo el año"; debajo, el promedio
 * general (solo si hay materias con número: preescolar no lo tiene), las
 * inasistencias y cada materia con su nota o su carita. Cambiar de periodo no
 * pide nada al servidor: `detalles` ya trae los cuatro y el año.
 *
 * Si el backend todavía no manda `notas_por_periodo`, se ve como antes.
 * Presentacional: el periodo vive en `useDetalleEstudianteAdmin`.
 */
export default function RendimientoEstudianteAdmin({ detalles, periodo, onCambiarPeriodo }) {
  return (
    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
      <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
        👨‍🏫 Rendimiento
      </h3>
      {detalles.notas_por_periodo ? (
        <RendimientoPorPeriodo
          detalles={detalles}
          periodo={periodo}
          onCambiarPeriodo={onCambiarPeriodo}
        />
      ) : (
        <RendimientoDelAnio detalles={detalles} />
      )}
    </div>
  );
}

function RendimientoPorPeriodo({ detalles, periodo, onCambiarPeriodo }) {
  const rendimiento = rendimientoDelPeriodo(detalles, periodo);

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Periodo de las notas">
        {OPCIONES_PERIODO_RESUMEN.map((opcion) => {
          const activa = opcion.value === periodo;
          return (
            <button
              key={opcion.value}
              type="button"
              aria-pressed={activa}
              onClick={() => onCambiarPeriodo?.(opcion.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                activa
                  ? "border-purple-700 bg-purple-700 text-white"
                  : "border-purple-200 bg-white text-purple-800 hover:bg-purple-100"
              }`}
            >
              {opcion.label}
            </button>
          );
        })}
      </div>

      {rendimiento.promedio && (
        <p className="text-sm text-gray-700 mb-2">
          <strong>Promedio General:</strong>{" "}
          <span
            className={`font-bold ${rendimiento.promedio.aprobado ? "text-green-600" : "text-red-600"}`}
          >
            {rendimiento.promedio.texto}
          </span>
        </p>
      )}
      <p className="text-sm text-gray-700 mb-2">
        <strong>Inasistencias:</strong> {rendimiento.inasistencias}
      </p>

      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Notas por materia:</p>
        {rendimiento.hayNotas ? (
          <ul className="space-y-1">
            {rendimiento.materias.map((fila, indice) => (
              <li
                key={`${fila.materia}-${indice}`}
                className="text-sm flex justify-between gap-3 bg-white px-2 py-1 rounded shadow-sm"
              >
                <span className="min-w-0 break-words">{fila.materia}</span>
                <span className={`shrink-0 ${TONO_NOTA[fila.tono]}`}>{fila.texto}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No hay notas en este periodo.</p>
        )}
      </div>
    </>
  );
}

// La tarjeta de antes, para un backend que todavía no manda los periodos.
function RendimientoDelAnio({ detalles }) {
  return (
    <>
      <p className="text-sm text-gray-700 mb-2">
        <strong>Promedio General:</strong>{" "}
        <span
          className={`font-bold ${detalles.promedio_general >= 3.0 ? "text-green-600" : "text-red-600"}`}
        >
          {detalles.promedio_general !== undefined ? detalles.promedio_general : "N/A"}
        </span>
      </p>
      <p className="text-sm text-gray-700 mb-2">
        <strong>Inasistencias Acumuladas:</strong> {detalles.inasistencias}
      </p>
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Promedio de Notas por Materia:</p>
        {detalles.notas && detalles.notas.length > 0 ? (
          <ul className="space-y-1">
            {detalles.notas.map((nota, indice) => (
              <li
                key={indice}
                className="text-sm flex justify-between bg-white px-2 py-1 rounded shadow-sm"
              >
                <span>{nota.materia}</span>
                <span
                  className={`font-semibold ${nota.promedio >= 3.0 ? "text-green-600" : "text-red-600"}`}
                >
                  {nota.promedio}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No hay notas registradas</p>
        )}
      </div>
    </>
  );
}
