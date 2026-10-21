import { obtenerValoracion } from "../../utils/valoracionesDesarrollo";
import { formatearNotaCalculada } from "../../utils/planilla/subnotas";

/**
 * Celda calculada de la planilla (P1 de docs/funcionalidades/SUBNOTAS_PLANILLA.md):
 * el estudiante tiene subnotas calificadas en ese tipo, así que la celda es su
 * promedio y no se escribe a mano. Toda la celda es un botón que abre el
 * modal de subnotas.
 *
 * Solo presenta: el valor llega en `est`, tal como lo guardó el servidor.
 * `conEtiqueta` muestra además el nombre de la carita (tarjeta de celular).
 */
function CeldaCalculadaPlanilla({
    est,
    columna,
    etiqueta,
    nombreEstudiante,
    tipoEvaluacion,
    cantidad,
    onAbrir,
    conEtiqueta = false,
    className = "",
}) {
    const carita = tipoEvaluacion === "desarrollo"
        ? obtenerValoracion(est?.valoraciones?.[columna])
        : null;
    const valor = tipoEvaluacion === "desarrollo"
        ? carita?.label || "Sin calificar"
        : formatearNotaCalculada(est?.notas?.[columna]);
    const ayuda = `Calculada con ${cantidad} ${cantidad === 1 ? "subnota" : "subnotas"}`;

    return (
        <button
            type="button"
            onClick={onAbrir}
            title={ayuda}
            aria-label={`${etiqueta} de ${nombreEstudiante}: ${valor}. ${ayuda}. Abrir subnotas`}
            translate="no"
            className={`inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 font-semibold text-violet-900 transition-colors hover:border-violet-400 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
        >
            {tipoEvaluacion === "desarrollo" ? (
                <span className="inline-flex items-center gap-1">
                    <span className="text-lg leading-none" aria-hidden="true">{carita?.emoji || "—"}</span>
                    {conEtiqueta && carita && <span className="text-sm">{carita.label}</span>}
                </span>
            ) : (
                <span className="text-sm tabular-nums">{valor}</span>
            )}
            <span
                className="inline-flex items-center gap-0.5 rounded bg-white/70 px-1 text-xs font-bold text-violet-600"
                aria-hidden="true"
            >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h11.25M8.25 12h11.25M8.25 17.25h11.25M4.5 6.75h.01M4.5 12h.01M4.5 17.25h.01" />
                </svg>
                {cantidad}
            </span>
        </button>
    );
}

export default CeldaCalculadaPlanilla;
