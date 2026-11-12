import { montoVisible, textoEstudiantes } from "../../../utils/dashboards/admin";
import CaminitoCargando from "../CaminitoCargando";

/**
 * «Deuda por curso»: los cursos que más deben, con cuántos estudiantes deben en
 * cada uno y una barrita frente al que más debe. Llega armado (`deudaPorCurso`).
 */
function TarjetaDeudaPorCurso({ cursos = [], cargando = false, error = "", valoresOcultos = false, className = "" }) {
  return (
    <section
      aria-labelledby="titulo-deuda-por-curso"
      className={`min-w-0 rounded-3xl border border-purple-100 bg-purple-50 p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h10M4 12h16M4 18h7" />
          </svg>
        </span>
        <div>
          <h2 id="titulo-deuda-por-curso" className="text-base font-extrabold text-slate-950">
            Deuda por curso
          </h2>
          <p className="text-sm text-slate-600">Los cursos que más deben</p>
        </div>
      </div>

      {cargando ? (
        <CaminitoCargando etiqueta="Cargando la cartera" className="mt-5" />
      ) : error ? (
        <p role="alert" className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {error}
        </p>
      ) : !cursos.length ? (
        <p className="mt-4 text-sm text-slate-600">Ningún curso debe este año.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {cursos.map((curso) => (
            <li key={curso.cursoId}>
              <span className="flex justify-between gap-3 text-sm">
                <span className="font-bold text-slate-950">
                  {curso.nombre} <span className="font-semibold text-slate-600">· {textoEstudiantes(curso.estudiantes)}</span>
                </span>
                <span className="shrink-0 font-extrabold tabular-nums text-purple-900">
                  {montoVisible(curso.total, valoresOcultos)}
                </span>
              </span>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-purple-100" aria-hidden="true">
                <span className="block h-2 rounded-full bg-purple-600" style={{ width: `${curso.porcentaje}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TarjetaDeudaPorCurso;
