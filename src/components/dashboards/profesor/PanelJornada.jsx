import {
  DIAS_SEMANA,
  JORNADA_ESTILOS,
  formatearHora12,
  obtenerEstiloHorarioDia,
} from "../../../utils/dashboards/profesor";

// Una jornada del horario semanal: tarjetas apiladas en móvil y rejilla de
// cinco días en escritorio.
function PanelJornada({ jornada, clasesJornada, horarioJornada }) {
  const estiloJornada = JORNADA_ESTILOS[jornada];

  return (
    <section className={`overflow-hidden rounded-lg border ${estiloJornada.panel}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4 ${estiloJornada.header} ${estiloJornada.panel}`}>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Jornada {jornada.toLowerCase()}</h3>
          <p className="mt-0.5 text-xs font-medium opacity-75">Horario institucional: {estiloJornada.rango}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estiloJornada.badge}`}>
          {clasesJornada.length} {clasesJornada.length === 1 ? "clase" : "clases"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 bg-white p-3 sm:grid-cols-2 lg:hidden">
        {DIAS_SEMANA.map((dia) => {
          const clasesDelDia = horarioJornada[dia];
          const estiloDia = obtenerEstiloHorarioDia(dia);

          return (
            <div key={dia} className={`rounded-lg border ${estiloDia.panel}`}>
              <div className="border-b border-gray-200 px-3 py-2">
                <h4 className={`text-sm font-bold uppercase tracking-wide ${estiloDia.headerMobile}`}>
                  {dia}
                </h4>
              </div>
              <div className="space-y-2 p-2.5">
                {clasesDelDia.length === 0 ? (
                  <p className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-3 text-center text-sm text-gray-500">
                    Sin clases
                  </p>
                ) : (
                  clasesDelDia.map((clase) => (
                    <article
                      key={`${clase.horario_id || clase.id}-${clase.dia}-${clase.hora_inicio}`}
                      className={`rounded-md border border-gray-100 border-l-4 bg-white px-2.5 py-2 shadow-sm ${estiloDia.card}`}
                    >
                      <p className={`text-[11px] font-bold leading-tight ${estiloDia.time}`}>
                        {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                      </p>
                      <h5 className="mt-1 text-xs font-semibold leading-tight text-gray-900">
                        {clase.materia}
                      </h5>
                      <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-600">
                        Curso: {clase.curso}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto bg-white p-3 lg:block">
        <div className="grid min-w-[860px] grid-cols-5 gap-2.5">
          {DIAS_SEMANA.map((dia) => {
            const clasesDelDia = horarioJornada[dia];
            const estiloDia = obtenerEstiloHorarioDia(dia);

            return (
              <div key={dia} className={`flex min-h-[220px] flex-col rounded-lg border ${estiloDia.panel}`}>
                <div className={`rounded-t-lg px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white ${estiloDia.header}`}>
                  {dia}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2.5">
                  {clasesDelDia.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-white px-3 text-sm italic text-gray-400">
                      Sin clases
                    </div>
                  ) : (
                    clasesDelDia.map((clase) => (
                      <article
                        key={`${clase.horario_id || clase.id}-${clase.dia}-${clase.hora_inicio}`}
                        className={`rounded-md border border-gray-200 border-l-4 bg-white px-2.5 py-2 shadow-sm transition hover:shadow-md ${estiloDia.card}`}
                      >
                        <p className={`text-[11px] font-bold leading-tight ${estiloDia.time}`}>
                          {formatearHora12(clase.hora_inicio)} - {formatearHora12(clase.hora_fin)}
                        </p>
                        <h5 className="mt-1 text-xs font-bold leading-tight text-gray-900">
                          {clase.materia}
                        </h5>
                        <p className="mt-0.5 text-[11px] font-medium leading-tight text-gray-600">
                          Curso: {clase.curso}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PanelJornada;
