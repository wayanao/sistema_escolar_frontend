import { useId, useState } from "react";
import {
  CURSOS_PUNTUALES_VISIBLES,
  detallePuntual,
  textoCuotasATiempo,
  textoCursoPuntual,
  textoDespuesDelRanking,
} from "../../../utils/dashboards/puntualidad";

const VISTAS = [
  { clave: "colegio", etiqueta: "Todo el colegio", subtitulo: "Los más puntuales del colegio" },
  { clave: "cursos", etiqueta: "Por curso", subtitulo: "Del curso que mejor paga al que menos" },
];

// Oro, plata y bronce para los tres primeros de cada curso.
const MEDALLAS = ["bg-amber-200 text-amber-900", "bg-slate-200 text-slate-700", "bg-orange-200 text-orange-900"];
const SIN_MEDALLA = "bg-slate-100 text-slate-600";

const SIN_NADIE_EN_LA_LISTA = "todos deben alguna cuota o nunca han pagado a tiempo.";

const ENFOQUE = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

// «✓ 10 de 10»: cuántas de sus cuotas vencidas pagó a tiempo.
function PildoraCuotas({ estudiante }) {
  const color = estudiante.siempreATiempo ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums ${color}`}>
      {estudiante.siempreATiempo && <span aria-hidden="true">✓ </span>}
      {textoCuotasATiempo(estudiante)}
      <span className="sr-only"> cuotas a tiempo</span>
    </span>
  );
}

function RankingColegio({ mejores, siempreATiempo }) {
  if (!mejores.length) {
    return (
      <p className="px-5 pb-5 pt-4 text-sm text-slate-600 sm:px-6">
        Por ahora nadie entra en la lista: {SIN_NADIE_EN_LA_LISTA}
      </p>
    );
  }

  const despues = textoDespuesDelRanking(siempreATiempo, mejores);
  return (
    <div className="px-5 pb-5 pt-3.5 sm:px-6">
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-2.5">
        {mejores.map((estudiante) => (
          <li key={estudiante.estudianteId} className="flex flex-col gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800" aria-hidden="true">
                {estudiante.iniciales}
              </span>
              <PildoraCuotas estudiante={estudiante} />
            </span>
            <span className="min-w-0">
              <span className="block break-words text-sm font-bold leading-snug text-slate-950" translate="no">
                {estudiante.nombre}
              </span>
              <span className="mt-0.5 block text-sm text-slate-600">{estudiante.curso}</span>
              <span className="mt-1 block text-xs font-semibold text-emerald-800">{detallePuntual(estudiante)}</span>
            </span>
          </li>
        ))}
      </ol>
      {despues && <p className="mt-3 text-sm text-slate-600">{despues}</p>}
    </div>
  );
}

function RankingDeUnCurso({ curso }) {
  if (!curso.mejores.length) {
    return <p className="py-1 text-sm text-slate-600">En este curso {SIN_NADIE_EN_LA_LISTA}</p>;
  }

  const cuantos = curso.mejores.length;
  const despues = textoDespuesDelRanking(curso.siempreATiempo, curso.mejores);
  return (
    <>
      <p className="text-sm font-extrabold text-emerald-800">
        {cuantos === 1 ? `Quien mejor paga en ${curso.nombre}` : `Los ${cuantos} que mejor pagan en ${curso.nombre}`}
      </p>
      <ol>
        {curso.mejores.map((estudiante, indice) => (
          <li key={estudiante.estudianteId} className="flex items-center gap-2.5 py-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold tabular-nums ${MEDALLAS[indice] || SIN_MEDALLA}`}>
              {estudiante.puesto}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-bold leading-snug text-slate-950" translate="no">
                {estudiante.nombre}
              </span>
              <span className="mt-px block text-sm leading-snug text-slate-600">{detallePuntual(estudiante)}</span>
            </span>
            <PildoraCuotas estudiante={estudiante} />
          </li>
        ))}
      </ol>
      {despues && <p className="mt-0.5 text-sm text-slate-600">{despues}</p>}
    </>
  );
}

function RankingPorCurso({ cursos, cursoAbierto, onAlternar, idBase }) {
  return (
    <div>
      <p className="flex items-center gap-2 px-5 pb-0.5 pt-3.5 text-sm text-slate-700 sm:px-6">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 11v5.5M12 7.5h.01" />
        </svg>
        Toca un curso para ver quiénes pagan mejor.
      </p>
      <ol className="flex flex-col gap-2 px-3 pb-4 pt-2.5 sm:px-4">
        {cursos.map((curso) => {
          const abierto = curso.cursoId === cursoAbierto;
          const idPanel = `${idBase}-curso-${curso.puesto}`;
          return (
            <li key={curso.cursoId}>
              <button
                type="button"
                onClick={() => onAlternar(curso.cursoId)}
                aria-expanded={abierto}
                aria-controls={abierto ? idPanel : undefined}
                className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${ENFOQUE} ${
                  abierto ? "border-green-300 bg-green-50" : "border-purple-100 bg-white hover:bg-purple-50/60"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-extrabold tabular-nums text-emerald-700">
                  {curso.puesto}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 break-words text-[15px] font-extrabold text-slate-950">{curso.nombre}</span>
                    <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-emerald-700">{curso.porcentaje} %</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">{textoCursoPuntual(curso)}</span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-emerald-100" aria-hidden="true">
                    <span className="block h-1.5 rounded-full bg-emerald-600" style={{ width: `${curso.porcentaje}%` }} />
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 shrink-0 text-slate-600 transition-transform motion-reduce:transition-none ${abierto ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {abierto && (
                <div id={idPanel} className="mb-1.5 ml-3.5 mt-2 border-l-[3px] border-emerald-200 pl-3">
                  <RankingDeUnCurso curso={curso} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * «Los que mejor pagan»: el ranking del colegio y, en «Por curso», los cursos
 * de mayor a menor porcentaje que paga siempre a tiempo; al tocar uno se abren
 * ahí mismo sus mejores (oro, plata y bronce). Quién entra y en qué orden lo
 * decide el backend (`GET /cartera/puntualidad`); aquí solo se pinta.
 */
function TarjetaMejoresPagadores({ puntualidad, cargando = false, error = "", className = "" }) {
  const idBase = useId();
  const [vista, setVista] = useState(VISTAS[0].clave);
  const [cursoAbierto, setCursoAbierto] = useState(null);
  const [verTodos, setVerTodos] = useState(false);

  const total = puntualidad?.totalEstudiantes ?? 0;
  const cursos = puntualidad?.cursos ?? [];
  const hayDatos = !cargando && !error && total > 0;
  const hayMasCursos = cursos.length > CURSOS_PUNTUALES_VISIBLES;
  const cursosVisibles = verTodos ? cursos : cursos.slice(0, CURSOS_PUNTUALES_VISIBLES);
  const subtitulo = VISTAS.find((opcion) => opcion.clave === vista).subtitulo;

  const alternarCurso = (cursoId) => setCursoAbierto((abierto) => (abierto === cursoId ? null : cursoId));

  const alternarTodos = () => {
    // Al volver a los primeros, se cierra el curso abierto si queda escondido.
    if (verTodos && cursos.findIndex((curso) => curso.cursoId === cursoAbierto) >= CURSOS_PUNTUALES_VISIBLES) {
      setCursoAbierto(null);
    }
    setVerTodos(!verTodos);
  };

  return (
    <section
      aria-labelledby="titulo-mejores-pagadores"
      className={`flex min-w-0 flex-col rounded-3xl border border-purple-100 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 px-5 pb-2 pt-5 sm:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="9" r="5.5" />
            <path d="M8.6 13.4L7 21.5l5-2.6 5 2.6-1.6-8.1" />
          </svg>
        </span>
        <div>
          <h2 id="titulo-mejores-pagadores" className="text-base font-extrabold text-slate-950">
            Los que mejor pagan
          </h2>
          <p className="text-sm text-slate-600">{subtitulo}</p>
        </div>
      </div>

      {cargando ? (
        <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">Calculando quién paga a tiempo…</p>
      ) : error ? (
        <p role="alert" className="mx-5 my-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 sm:mx-6">
          {error}
        </p>
      ) : !hayDatos ? (
        <p className="px-5 py-4 text-sm text-slate-600 sm:px-6">Todavía no se ha vencido ninguna mensualidad este año.</p>
      ) : (
        <>
          <div className="px-5 pt-2 sm:px-6">
            <div role="group" aria-label="Cómo ver a los que mejor pagan" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-purple-50 p-1.5">
              {VISTAS.map((opcion) => {
                const activa = opcion.clave === vista;
                return (
                  <button
                    key={opcion.clave}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => setVista(opcion.clave)}
                    className={`min-h-[48px] rounded-xl px-3 py-2 text-[15px] transition ${ENFOQUE} ${
                      activa ? "bg-purple-600 font-extrabold text-white shadow-md" : "font-bold text-purple-900 hover:bg-white/70"
                    }`}
                  >
                    {opcion.etiqueta}
                  </button>
                );
              })}
            </div>
          </div>

          {vista === "colegio" ? (
            <RankingColegio mejores={puntualidad.mejores} siempreATiempo={puntualidad.siempreATiempo} />
          ) : (
            <RankingPorCurso cursos={cursosVisibles} cursoAbierto={cursoAbierto} onAlternar={alternarCurso} idBase={idBase} />
          )}

          {vista === "cursos" && hayMasCursos && (
            <div className="mt-auto border-t border-purple-50 px-5 py-1.5 sm:px-6">
              <button
                type="button"
                onClick={alternarTodos}
                aria-expanded={verTodos}
                className={`inline-flex min-h-[44px] items-center gap-1.5 text-sm font-extrabold text-purple-700 transition hover:text-purple-900 ${ENFOQUE}`}
              >
                {verTodos ? `Ver solo los ${CURSOS_PUNTUALES_VISIBLES} primeros` : `Ver los ${cursos.length} cursos`}
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 transition-transform motion-reduce:transition-none ${verTodos ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default TarjetaMejoresPagadores;
