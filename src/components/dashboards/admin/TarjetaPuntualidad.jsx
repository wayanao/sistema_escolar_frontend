import { porcentajeVisible, textoSinAtrasos } from "../../../utils/dashboards/puntualidad";

// Largo del anillo (radio 50 en un lienzo de 120).
const CIRCUNFERENCIA = 2 * Math.PI * 50;

/**
 * «Pagan siempre a tiempo»: qué parte de los estudiantes no se ha atrasado en
 * ninguna mensualidad vencida del año, con un anillo. Cuentan solo quienes ya
 * tienen mensualidades vencidas (el backend deja fuera a los becados en $0).
 * Cargando, error y «todavía no vence nada» son estados distintos.
 */
function TarjetaPuntualidad({ puntualidad, cargando = false, error = "", className = "" }) {
  const total = puntualidad?.totalEstudiantes ?? 0;
  const siempre = puntualidad?.siempreATiempo ?? 0;
  const porcentaje = porcentajeVisible(siempre, total);

  return (
    <section
      aria-labelledby="titulo-puntualidad"
      className={`flex min-w-0 flex-col gap-4 rounded-3xl border border-green-200 bg-emerald-50 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M8 12.5l2.7 2.7L16.5 9.5" />
          </svg>
        </span>
        <h2 id="titulo-puntualidad" className="text-base font-extrabold text-emerald-950">
          Pagan siempre a tiempo
        </h2>
      </div>

      {cargando ? (
        <p className="text-sm text-emerald-900">Calculando quién paga a tiempo…</p>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {error}
        </p>
      ) : total === 0 ? (
        <p className="text-sm text-emerald-950">Todavía no se ha vencido ninguna mensualidad este año.</p>
      ) : (
        <div className="flex flex-1 flex-wrap items-center justify-center gap-x-5 gap-y-4">
          <span className="relative h-[140px] w-[140px] shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="13" className="stroke-green-200" />
              {/* Con 0 % no se pinta: el borde redondo dejaría un punto. */}
              {porcentaje > 0 && (
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={`${(porcentaje / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                  transform="rotate(-90 60 60)"
                  className="stroke-emerald-600"
                  data-testid="anillo-puntualidad"
                />
              )}
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold tabular-nums text-emerald-800">{porcentaje} %</span>
              <span className="text-xs font-bold text-emerald-800">del colegio</span>
            </span>
          </span>
          <p className="min-w-0 flex-[1_1_140px] text-[15px] leading-snug text-emerald-950">
            <strong className="block text-[26px] leading-tight tabular-nums">{`${siempre} de ${total}`}</strong>
            {textoSinAtrasos(total)}
          </p>
        </div>
      )}
    </section>
  );
}

export default TarjetaPuntualidad;
