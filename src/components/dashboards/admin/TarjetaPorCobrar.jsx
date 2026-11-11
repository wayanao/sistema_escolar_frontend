import { composicionDeuda, montoVisible, textoEstudiantes } from "../../../utils/dashboards/admin";

// Las tres partes de la deuda del año, en el orden en que se pintan.
const PARTES = [
  { clave: "academico", etiqueta: "Mensualidades y cobros", color: "bg-purple-600" },
  { clave: "ventas", etiqueta: "Ventas sin pagar", color: "bg-amber-500" },
  { clave: "mora", etiqueta: "Mora por pagar tarde", color: "bg-rose-600" },
];

/**
 * «Por cobrar este año»: el total, entre cuántos estudiantes, y de dónde sale
 * (mensualidades y cobros, ventas, mora). La deuda de años anteriores va en una
 * línea aparte porque no hace parte del total del año. Cargando, error y
 * cartera al día son estados distintos: un fallo nunca se lee como «al día».
 */
function TarjetaPorCobrar({ resumen, cargando = false, error = "", valoresOcultos = false, className = "" }) {
  const datos = composicionDeuda(resumen);
  const sinDeudaDelAnio = datos.total <= 0;

  return (
    <section
      aria-labelledby="titulo-por-cobrar"
      className={`flex min-w-0 flex-col gap-5 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 7.5v5.5M12 16.5h.01" />
          </svg>
        </span>
        <h2 id="titulo-por-cobrar" className="text-base font-extrabold text-slate-950">
          Por cobrar este año
        </h2>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando la cartera…</p>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {error}
        </p>
      ) : sinDeudaDelAnio ? (
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-emerald-700">
            {datos.aniosAnteriores > 0 ? "Este año nadie debe" : "Cartera al día"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {datos.aniosAnteriores > 0 ? (
              <>
                Solo queda deuda de años anteriores:{" "}
                <strong className="text-slate-900">{montoVisible(datos.aniosAnteriores, valoresOcultos)}</strong>
              </>
            ) : (
              "Ningún estudiante debe por ahora."
            )}
          </p>
        </div>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
            <span className="text-4xl font-extrabold tracking-tight tabular-nums text-slate-950 sm:text-5xl">
              {montoVisible(datos.total, valoresOcultos)}
            </span>
            <span className="text-sm text-slate-600 sm:text-base">
              entre <strong className="text-rose-700">{textoEstudiantes(datos.estudiantes)}</strong> que deben
            </span>
          </p>

          <div>
            <p className="mb-2.5 text-sm font-bold text-slate-600">¿De dónde sale esa deuda?</p>
            <div className="flex h-3.5 gap-[3px] overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              {PARTES.filter((parte) => datos[parte.clave] > 0).map((parte) => (
                <span key={parte.clave} className={parte.color} style={{ flexGrow: datos[parte.clave], flexBasis: 0 }} />
              ))}
            </div>
            <ul className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PARTES.map((parte) => (
                <li key={parte.clave} className="flex items-start gap-2">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-sm ${parte.color}`} aria-hidden="true" />
                  <span>
                    <span className="block text-sm text-slate-600">{parte.etiqueta}</span>
                    <span className="block text-base font-extrabold tabular-nums text-slate-950">
                      {montoVisible(datos[parte.clave], valoresOcultos)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {datos.aniosAnteriores > 0 && (
            <p className="text-sm text-slate-600">
              Aparte, de años anteriores:{" "}
              <strong className="text-slate-900">{montoVisible(datos.aniosAnteriores, valoresOcultos)}</strong>
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default TarjetaPorCobrar;
