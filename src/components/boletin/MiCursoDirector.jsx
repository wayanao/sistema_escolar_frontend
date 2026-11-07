import {
  LARGO_MAXIMO_OBSERVACION,
  materiasPendientes,
  presentarNota,
  textoMateriaPendiente,
} from "../../utils/boletines/miCurso";

/**
 * «Mi curso» del director de grupo: el ranking del curso en el periodo, con el
 * puesto, el promedio, la nota de cada materia y las inasistencias. En PC es
 * una tabla; en celular, una tarjeta por estudiante. Solo muestra: los datos
 * y las acciones llegan por props.
 */
export default function MiCursoDirector({
  cursos,
  cursoId,
  datos,
  cargando,
  error,
  periodo,
  onCambiarCurso,
  onReintentar,
  observaciones = null,
}) {
  return (
    <div className="space-y-4">
      {cursos.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="curso-dirigido" className="mb-1 block text-sm font-medium text-gray-700">
            Curso que diriges
          </label>
          <select
            id="curso-dirigido"
            className="w-full rounded-md border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500 sm:w-auto"
            value={cursoId ?? ""}
            onChange={(event) => onCambiarCurso(event.target.value)}
          >
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {cargando ? (
        <p className="py-10 text-center text-gray-500">Cargando tu curso…</p>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm font-medium text-red-800">
            No se pudo cargar el ranking de tu curso. Revisa la conexión e intenta de nuevo.
          </p>
          <button
            type="button"
            onClick={onReintentar}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      ) : datos ? (
        <RankingDelCurso datos={datos} periodo={periodo} observaciones={observaciones} />
      ) : null}
    </div>
  );
}

function RankingDelCurso({ datos, periodo, observaciones }) {
  const pendientes = materiasPendientes(datos.materias);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="border-b border-gray-200 bg-slate-50/70 px-4 py-4 sm:px-5">
        <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
          Director de grupo
        </p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">
          {datos.curso.nombre} · Periodo {periodo}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {datos.estudiantes.length === 1 ? "1 estudiante" : `${datos.estudiantes.length} estudiantes`}.
          El puesto y el promedio salen de las notas que cada profesor ya guardó en el boletín.
        </p>
      </div>

      <AvisoPendientes pendientes={pendientes} hayMaterias={datos.materias.length > 0} />
      {observaciones?.recuperadas > 0 && (
        <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-5">
          <span className="font-bold">Recuperamos observaciones que no habías guardado</span>{" "}
          ({observaciones.recuperadas === 1 ? "1 estudiante" : `${observaciones.recuperadas} estudiantes`}).
          Revísalas y guárdalas para que salgan en el boletín.
        </p>
      )}

      {datos.estudiantes.length === 0 ? (
        <p className="px-4 py-10 text-center text-gray-500">
          Este curso no tiene estudiantes activos.
        </p>
      ) : (
        <>
          <TablaRanking datos={datos} observaciones={observaciones} />
          <TarjetasRanking datos={datos} observaciones={observaciones} />
          <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-5">
            Las notas en gris y cursiva todavía no están guardadas en el boletín: salen de
            la planilla y no cuentan para el puesto. «—» quiere decir sin nota.
          </p>
        </>
      )}
    </div>
  );
}

function AvisoPendientes({ pendientes, hayMaterias }) {
  if (!hayMaterias) return null;
  if (pendientes.length === 0) {
    return (
      <p className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 sm:px-5">
        Todas las materias están guardadas para este periodo: el puesto ya es el definitivo.
      </p>
    );
  }
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-5">
      <p className="text-sm font-semibold text-amber-900">
        Hay materias sin guardar: el puesto todavía puede cambiar.
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-900">
        {pendientes.map((materia) => (
          <li key={materia.asignacionId}>
            {textoMateriaPendiente(materia)}
            {materia.profesor && (
              <span className="text-amber-700"> ({materia.profesor})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const TONOS = {
  alta: "text-green-700",
  media: "text-purple-700",
  baja: "text-red-700",
  caritas: "text-gray-800",
  vacia: "text-gray-400",
};

function Nota({ definitiva, caritas, guardada = true, grande = false }) {
  const nota = presentarNota(definitiva, { caritas, guardada });
  const sinGuardar = !nota.guardada && nota.tono !== "vacia";
  // En las celdas pequeñas, la carita sola (su nombre queda en el título);
  // en el promedio, la carita con su nombre.
  const soloCarita = Boolean(nota.carita) && !grande;
  const titulo = [soloCarita ? nota.texto : null, sinGuardar ? "Todavía no guardada en el boletín" : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      className={`inline-flex items-center gap-1 ${grande ? "text-base font-bold" : "text-sm font-semibold"} ${
        sinGuardar ? "italic text-gray-400" : TONOS[nota.tono]
      }`}
      title={titulo || undefined}
    >
      {nota.carita && <span className="text-base leading-none">{nota.carita}</span>}
      {soloCarita ? <span className="sr-only">{nota.texto}</span> : <span>{nota.texto}</span>}
    </span>
  );
}

function Puesto({ puesto }) {
  if (puesto === null) {
    return <span className="text-sm text-gray-400" title="Sin notas guardadas">—</span>;
  }
  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-purple-600 px-2 text-sm font-bold text-white">
      {puesto}°
    </span>
  );
}

function TablaRanking({ datos, observaciones }) {
  const columnas = datos.materias.length + 4;
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <th scope="col" className="sticky left-0 z-10 bg-gray-50 px-3 py-2">Puesto</th>
            <th scope="col" className="sticky left-16 z-10 min-w-48 bg-gray-50 px-3 py-2">Estudiante</th>
            <th scope="col" className="px-3 py-2 text-center">Promedio</th>
            {datos.materias.map((materia) => (
              <th
                key={materia.asignacionId}
                scope="col"
                className="max-w-28 px-2 py-2 text-center align-bottom normal-case"
                title={materia.profesor ? `${materia.materia} · ${materia.profesor}` : materia.materia}
              >
                <span className="line-clamp-2">{materia.materia}</span>
              </th>
            ))}
            <th scope="col" className="px-3 py-2 text-center">Inasistencias</th>
          </tr>
        </thead>
        <tbody>
          {datos.estudiantes.map((estudiante) => (
            <FilasEstudiante
              key={estudiante.estudianteId}
              columnas={columnas}
              observaciones={observaciones}
              estudiante={estudiante}
            >
              <tr className="border-t border-gray-100 hover:bg-purple-50/40">
                <td className="sticky left-0 z-10 bg-white px-3 py-2">
                  <Puesto puesto={estudiante.puesto} />
                </td>
                <th scope="row" className="sticky left-16 z-10 bg-white px-3 py-2 text-left font-semibold text-gray-900">
                  {estudiante.nombre}
                </th>
                <td className="px-3 py-2 text-center">
                  <Nota definitiva={estudiante.promedio} caritas={datos.usaCaritas} grande />
                </td>
                {datos.materias.map((materia) => {
                  const celda = estudiante.notas[materia.asignacionId];
                  return (
                    <td key={materia.asignacionId} className="px-2 py-2 text-center">
                      <Nota
                        definitiva={celda.definitiva}
                        guardada={celda.guardada}
                        caritas={materia.tipoEvaluacion === "desarrollo"}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <Inasistencias inasistencias={estudiante.inasistencias} />
                </td>
              </tr>
            </FilasEstudiante>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Inasistencias({ inasistencias }) {
  return (
    <span className="inline-flex flex-col items-center leading-tight">
      <span className={`text-base font-bold ${inasistencias.periodo > 0 ? "text-gray-900" : "text-gray-400"}`}>
        {inasistencias.periodo}
      </span>
      <span className="text-[11px] text-gray-500">en el año: {inasistencias.anio}</span>
    </span>
  );
}

function TarjetasRanking({ datos, observaciones }) {
  return (
    <ul className="divide-y divide-gray-100 md:hidden">
      {datos.estudiantes.map((estudiante) => (
        <li key={estudiante.estudianteId} className="px-4 py-4">
          <div className="flex items-start gap-3">
            <Puesto puesto={estudiante.puesto} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">{estudiante.nombre}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>
                  Promedio:{" "}
                  <Nota definitiva={estudiante.promedio} caritas={datos.usaCaritas} grande />
                </span>
                <span>
                  Inasistencias: <strong className="text-gray-900">{estudiante.inasistencias.periodo}</strong>
                  <span className="text-xs text-gray-500"> (año: {estudiante.inasistencias.anio})</span>
                </span>
              </div>
            </div>
          </div>
          {/* Una columna en teléfonos angostos, para que el nombre de la
              materia se lea completo; dos desde 640 px. */}
          {datos.materias.length > 0 && (
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-md bg-gray-50 p-3 text-sm sm:grid-cols-2">
              {datos.materias.map((materia) => {
                const celda = estudiante.notas[materia.asignacionId];
                return (
                  <div key={materia.asignacionId} className="flex items-center justify-between gap-2">
                    <dt className="break-words text-xs text-gray-600">
                      {materia.materia}
                    </dt>
                    <dd>
                      <Nota
                        definitiva={celda.definitiva}
                        guardada={celda.guardada}
                        caritas={materia.tipoEvaluacion === "desarrollo"}
                      />
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
          {observaciones && (
            <div className="mt-3">
              <CajaObservacion estudiante={estudiante} observaciones={observaciones} variante="tarjeta" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// La fila del estudiante y, debajo, su observación general (si hay
// observaciones). La caja queda fija a la izquierda al desplazar la tabla.
function FilasEstudiante({ children, columnas, estudiante, observaciones }) {
  if (!observaciones) return children;
  return (
    <>
      {children}
      <tr className="bg-gray-50/60">
        <td colSpan={columnas} className="px-3 pb-4 pt-1">
          <div className="sticky left-3 max-w-3xl">
            <CajaObservacion estudiante={estudiante} observaciones={observaciones} variante="tabla" />
          </div>
        </td>
      </tr>
    </>
  );
}

// La observación general del boletín de un estudiante: un solo botón, que dice
// exactamente qué guarda.
// `variante` separa la caja de la tabla (PC) de la de la tarjeta (celular):
// las dos existen a la vez y cada etiqueta debe apuntar a la suya.
function CajaObservacion({ estudiante, observaciones, variante }) {
  const estado = observaciones.estadoDe(estudiante.estudianteId);
  const idCaja = `observacion-${variante}-${estudiante.estudianteId}`;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <label htmlFor={idCaja} className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
        Observación general del boletín · {estudiante.nombre}
      </label>
      <textarea
        id={idCaja}
        rows={3}
        maxLength={LARGO_MAXIMO_OBSERVACION}
        value={estado.texto}
        onChange={(event) => observaciones.onCambiar(estudiante.estudianteId, event.target.value)}
        placeholder="Escribe aquí la observación que saldrá en el boletín de este estudiante…"
        className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-purple-500"
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          <span className={estado.texto.length >= LARGO_MAXIMO_OBSERVACION ? "font-semibold text-red-700" : ""}>
            {estado.texto.length} / {LARGO_MAXIMO_OBSERVACION}
          </span>
          {" · "}
          {estado.error ? (
            <span className="font-semibold text-red-700">
              No se pudo guardar. Revisa la conexión e intenta de nuevo.
            </span>
          ) : estado.guardando ? (
            <span>Guardando…</span>
          ) : estado.sinGuardar ? (
            <span className="font-semibold text-amber-700">Sin guardar</span>
          ) : estado.guardadaEn ? (
            <span className="font-semibold text-emerald-700">Guardada a las {estado.guardadaEn}</span>
          ) : estado.texto ? (
            <span className="text-emerald-700">Guardada</span>
          ) : (
            <span>Vacía</span>
          )}
        </p>
        {/* Ya guardada y sin cambios: un botón gris que lo dice, en vez de un
            morado apagado que parece dañado. */}
        <button
          type="button"
          onClick={() => observaciones.onGuardar(estudiante.estudianteId)}
          disabled={estado.guardando || !estado.sinGuardar}
          className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed sm:w-auto ${
            estado.sinGuardar || estado.guardando
              ? "bg-purple-600 text-white shadow-sm hover:bg-purple-800 disabled:bg-purple-300"
              : "border border-gray-200 bg-gray-50 text-gray-500"
          }`}
        >
          {estado.guardando
            ? "Guardando…"
            : !estado.sinGuardar && estado.texto
              ? "Observación guardada"
              : `Guardar observación de ${estudiante.nombre}`}
        </button>
      </div>
    </div>
  );
}

