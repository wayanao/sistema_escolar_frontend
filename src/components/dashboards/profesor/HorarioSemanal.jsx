import PanelJornada from "./PanelJornada";
import {
  FILTRO_JORNADA_AMBAS,
  JORNADAS,
  JORNADA_ESTILOS,
  jornadaUnicaDe,
} from "../../../utils/dashboards/profesor";

// El filtro de jornada solo aparece cuando ambas tienen clases; con una sola se
// muestra su insignia.
function HorarioSemanal({
  loadingClases,
  clasesConHorario,
  clasesPorJornada,
  horarioPorJornada,
  hayDosJornadas,
  filtroJornada,
  onCambiarJornada,
  jornadasVisibles,
}) {
  const jornadaUnica = jornadaUnicaDe(clasesPorJornada);

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
      <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
              Horario asignado
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
              Tus clases de la semana
            </h2>
            {!loadingClases && clasesConHorario.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                {clasesPorJornada.Mañana.length} en la mañana · {clasesPorJornada.Tarde.length} en la tarde
              </p>
            )}
          </div>
          <span className="w-max rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-700">
            {clasesConHorario.length} {clasesConHorario.length === 1 ? "clase" : "clases"}
          </span>
        </div>
        {!loadingClases && clasesConHorario.length > 0 && (
          hayDosJornadas ? (
            <div className="mt-4 inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1 sm:w-auto" role="group" aria-label="Filtrar horario por jornada">
              {[FILTRO_JORNADA_AMBAS, ...JORNADAS].map((jornada) => {
                const activo = filtroJornada === jornada;
                return (
                  <button
                    key={jornada}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => onCambiarJornada(jornada)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                      activo
                        ? "bg-purple-700 text-white shadow-sm"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    {jornada}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${JORNADA_ESTILOS[jornadaUnica].badge}`}>
              Jornada {jornadaUnica.toLowerCase()}
            </span>
          )
        )}
      </div>

      {loadingClases ? (
        <div className="p-6 text-sm font-medium text-gray-500">
          Cargando horario asignado...
        </div>
      ) : clasesConHorario.length === 0 ? (
        <div className="p-6 text-gray-600">
          No tienes clases con horario asignado todavía.
        </div>
      ) : (
        <div className="space-y-4 bg-gray-50/60 p-3 sm:p-4">
          {jornadasVisibles.map((jornada) => (
            <PanelJornada
              key={jornada}
              jornada={jornada}
              clasesJornada={clasesPorJornada[jornada]}
              horarioJornada={horarioPorJornada[jornada]}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HorarioSemanal;
