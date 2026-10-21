/**
 * Botón pequeño `▤` de una celda de la planilla: abre el modal de subnotas
 * de ese estudiante en ese tipo de nota (docs/funcionalidades/SUBNOTAS_PLANILLA.md).
 *
 * Solo presenta. Va en las celdas que se escriben a mano; una celda calculada
 * entera ya es el botón (`CeldaCalculadaPlanilla`).
 */
function BotonSubnotasPlanilla({ etiqueta, nombreEstudiante, onAbrir, className = "" }) {
    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={`Subnotas de ${etiqueta} de ${nombreEstudiante}`}
            title="Subnotas"
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-violet-200 bg-white text-violet-600 transition-colors hover:border-violet-400 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
        >
            <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h11.25M8.25 12h11.25M8.25 17.25h11.25M4.5 6.75h.01M4.5 12h.01M4.5 17.25h.01" />
            </svg>
        </button>
    );
}

export default BotonSubnotasPlanilla;
