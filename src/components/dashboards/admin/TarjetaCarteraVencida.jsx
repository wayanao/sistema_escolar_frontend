import {
  esTeclaDeActivacion,
  formatearMoneda,
  hayMoraEnCartera,
  textoResumenMora,
} from "../../../utils/dashboards/admin";

// Tres estados excluyentes: error de carga, mora y cartera al día. El error se
// pinta con su propia paleta para que un fallo de red no se lea como una
// cartera sana.
function TarjetaCarteraVencida({ resumen, error = "", onAbrir }) {
  const hayMora = hayMoraEnCartera(resumen);

  const manejarTecla = (event) => {
    if (esTeclaDeActivacion(event.key)) {
      event.preventDefault();
      onAbrir();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Abrir cartera vencida"
      onClick={onAbrir}
      onKeyDown={manejarTecla}
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-pointer mb-6 transition-transform hover:scale-[1.01] focus-visible:ring-4 focus-visible:ring-rose-200 outline-none ${
        error
          ? "bg-gradient-to-r from-slate-600 to-slate-700"
          : hayMora
            ? "bg-gradient-to-r from-rose-600 via-red-600 to-orange-600"
            : "bg-gradient-to-r from-emerald-600 to-teal-600"
      }`}
    >
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -right-4 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
      <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-xl w-14 h-14 flex items-center justify-center text-3xl">
            {error ? "⛔" : hayMora ? "⚠️" : "✅"}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold opacity-90">
              Cartera vencida
            </p>
            <h3 className="text-xl sm:text-2xl font-bold">
              {error
                ? "Sin datos"
                : hayMora
                  ? formatearMoneda(resumen.total_deuda)
                  : "Cartera al día"}
            </h3>
            <p className="text-sm opacity-90 mt-1">
              {error
                ? error
                : hayMora
                  ? textoResumenMora(resumen)
                  : "No hay estudiantes en mora actualmente."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!error && hayMora && (
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              {resumen.total_estudiantes} en mora
            </span>
          )}
          <span className="bg-white text-rose-700 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap">
            Ver reporte →
          </span>
        </div>
      </div>
    </div>
  );
}

export default TarjetaCarteraVencida;
