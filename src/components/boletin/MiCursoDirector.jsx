import {
  agruparPendientesPorProfesor,
  LARGO_MAXIMO_OBSERVACION,
  materiasPendientes,
  porcentajeGuardado,
  presentarNota,
  textoAvanceMateria,
} from "../../utils/boletines/miCurso";

/**
 * «Mi curso» del director de grupo: el ranking del curso en el periodo, con el
 * puesto, el promedio, la nota de cada materia y las inasistencias. En PC es
 * una tabla; en celular, una tarjeta por estudiante. Solo muestra: los datos
 * y las acciones llegan por props.
 *
 * El curso y el periodo se escogen en el encabezado, que se ve siempre (también
 * mientras carga o si hubo un error), para que nunca falte cómo cambiarlos.
 */
export default function MiCursoDirector({
  cursos = [],
  cursoId = null,
  datos,
  cargando,
  error,
  periodo,
  onCambiarCurso,
  onCambiarPeriodo,
  onReintentar,
  observaciones = null,
}) {
  const nombreCurso =
    datos?.curso?.nombre
    || cursos.find((curso) => String(curso.id) === String(cursoId))?.nombre
    || "";

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-slate-50/70 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
            Director de grupo
          </p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {nombreCurso} · Periodo {periodo}
          </h2>
          {datos && !cargando && !error && (
            <p className="mt-1 text-sm text-gray-600">
              {datos.estudiantes.length === 1 ? "1 estudiante" : `${datos.estudiantes.length} estudiantes`}.
              El puesto y el promedio salen de las notas que cada profesor ya guardó en el boletín.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:shrink-0 lg:justify-end">
          {cursos.length > 1 && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Curso
              <select
                className="rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm focus:border-purple-500 focus:ring-purple-500"
                value={cursoId ?? ""}
                onChange={(event) => onCambiarCurso(event.target.value)}
              >
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Periodo
            <select
              className="rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm focus:border-purple-500 focus:ring-purple-500"
              value={periodo}
              onChange={(event) => onCambiarPeriodo(event.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>
        </div>
      </div>

      {cargando ? (
        <p className="px-4 py-10 text-center text-gray-500">Cargando tu curso…</p>
      ) : error ? (
        <div
          role="alert"
          className="m-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
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
        <RankingDelCurso datos={datos} observaciones={observaciones} />
      ) : null}
    </div>
  );
}

function RankingDelCurso({ datos, observaciones }) {
  const pendientes = materiasPendientes(datos.materias);

  return (
    <>
      <AvisoPendientes pendientes={pendientes} hayMaterias={datos.materias.length > 0} />
      {observaciones && datos.estudiantes.length > 0 && (
        <ConteoObservaciones estudiantes={datos.estudiantes} observaciones={observaciones} />
      )}
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
    </>
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
  // Rediseño del 2026-11-07 (el usuario lo veía desordenado): antes era un
  // renglón corrido de «MATERIA: faltan N por guardar (PROFESOR)» que se
  // partía en cualquier parte y repetía el nombre del profesor. Ahora, una
  // tarjeta por profesor —a quién hay que recordarle— con sus materias en
  // filas alineadas y cuánto lleva guardado cada una. Las tarjetas van en
  // columnas para no empujar el ranking hacia abajo. Profesores y materias
  // siguen en MAYÚSCULAS, como los guarda el colegio (decidido el 2026-11-05).
  const grupos = agruparPendientesPorProfesor(pendientes);
  const profesores = grupos.filter((grupo) => grupo.profesor).length;

  return (
    <section
      aria-labelledby="titulo-materias-sin-guardar"
      className="border-b border-amber-200 bg-amber-50/70 px-4 py-4 sm:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <IconoReloj />
          <div>
            <h3 id="titulo-materias-sin-guardar" className="text-sm font-bold text-amber-900">
              Hay materias sin guardar: el puesto todavía puede cambiar.
            </h3>
            <p className="mt-0.5 text-sm text-amber-800">
              Esto le falta guardar en el boletín a cada profesor.
            </p>
          </div>
        </div>
        <p className="w-fit shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
          {pendientes.length === 1 ? "1 materia" : `${pendientes.length} materias`}
          {profesores > 0 && ` · ${profesores === 1 ? "1 profesor" : `${profesores} profesores`}`}
        </p>
      </div>

      {/* Dos columnas desde 1024 px (tres en pantallas muy anchas): más
          angostas, los nombres de las materias se partirían. */}
      <ul className="-mb-3 mt-4 gap-3 lg:columns-2 2xl:columns-3">
        {grupos.map((grupo) => (
          <li
            key={grupo.profesor || "sin-profesor"}
            className="mb-3 break-inside-avoid rounded-lg border border-amber-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-semibold leading-snug text-gray-900">
                {grupo.profesor || "Sin profesor asignado"}
              </p>
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {grupo.materias.length === 1 ? "1 materia" : `${grupo.materias.length} materias`}
              </span>
            </div>
            {/* Una tablita: los títulos dicen qué es cada número, así cada
                fila solo lleva «0 de 15». */}
            <div
              aria-hidden="true"
              className="mt-2 flex justify-between border-b border-gray-100 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400"
            >
              <span>Materia</span>
              <span>Guardados</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {grupo.materias.map((materia) => (
                <li key={materia.asignacionId} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 text-sm leading-snug text-gray-700">
                    {materia.materia}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="whitespace-nowrap text-xs font-medium tabular-nums text-gray-600">
                      {textoAvanceMateria(materia)}
                      <span className="sr-only"> guardados</span>
                    </span>
                    {/* En el celular no va: le deja el espacio al nombre. */}
                    <span
                      aria-hidden="true"
                      className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-amber-100 sm:block"
                    >
                      <span
                        className="block h-full rounded-full bg-amber-500"
                        style={{ width: `${porcentajeGuardado(materia)}%` }}
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Reloj dibujado a mano (sin librerías de íconos): algo que todavía falta.
function IconoReloj() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    </span>
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
  const aspecto = ASPECTO_CAJA[estadoDeLaCaja(estado)];

  return (
    <div className={`rounded-md border-2 p-3 ${aspecto.caja}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={idCaja} className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
          Observación general del boletín · {estudiante.nombre}
        </label>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${aspecto.etiqueta}`}>
          {aspecto.texto}
        </span>
      </div>
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

// Lista (verde), falta (amarillo), sin guardar (naranja), no se guardó (rojo).
// Color y palabra a la vez: la diferencia se ve aunque no se distingan colores.
const ASPECTO_CAJA = {
  lista: {
    caja: "border-emerald-300 bg-emerald-50/60",
    etiqueta: "bg-emerald-100 text-emerald-800",
    texto: "✓ Lista",
  },
  falta: {
    caja: "border-amber-300 bg-amber-50/70",
    etiqueta: "bg-amber-100 text-amber-800",
    texto: "Falta",
  },
  sinGuardar: {
    caja: "border-orange-400 bg-orange-50/70",
    etiqueta: "bg-orange-100 text-orange-800",
    texto: "Sin guardar",
  },
  error: {
    caja: "border-red-400 bg-red-50/70",
    etiqueta: "bg-red-100 text-red-800",
    texto: "No se guardó",
  },
};

function estadoDeLaCaja(estado) {
  if (estado.error) return "error";
  if (estado.sinGuardar || estado.guardando) return "sinGuardar";
  return estado.texto ? "lista" : "falta";
}

function ConteoObservaciones({ estudiantes, observaciones }) {
  const listas = estudiantes.filter(
    (estudiante) => estadoDeLaCaja(observaciones.estadoDe(estudiante.estudianteId)) === "lista",
  ).length;
  const total = estudiantes.length;
  const completas = listas === total;

  return (
    <p
      className={`border-b px-4 py-3 text-sm font-semibold sm:px-5 ${
        completas
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : "border-gray-100 bg-white text-gray-700"
      }`}
    >
      Observaciones del boletín listas: {listas} de {total}
      {completas ? " ✓" : ` · faltan ${total - listas}`}
    </p>
  );
}

