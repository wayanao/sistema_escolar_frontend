import { useEffect } from "react";
import { createPortal } from "react-dom";
import { construirUrlIncrustadaYoutube } from "../../utils/planeaciones/enlaces";

/**
 * Muestra un video de YouTube solo, sobre la pantalla actual. Se abre encima de
 * la presentación de clase, por eso captura Escape antes que ella: cerrar el
 * video no debe cerrar también la presentación.
 */
export default function ReproductorVideoPlaneacion({ video, enlace, onCerrar }) {
  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onCerrar();
    };

    document.addEventListener("keydown", cerrarConEscape, true);
    return () => document.removeEventListener("keydown", cerrarConEscape, true);
  }, [onCerrar]);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor de video"
      onClick={onCerrar}
    >
      <div className="flex shrink-0 items-center justify-end gap-2 pb-3">
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="rounded-lg px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Abrir en YouTube
        </a>
        <button
          type="button"
          onClick={onCerrar}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-violet-100"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
          </svg>
          Cerrar video
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="aspect-video max-h-full w-full max-w-6xl overflow-hidden rounded-xl bg-black shadow-2xl">
          <iframe
            src={construirUrlIncrustadaYoutube(video)}
            title="Video de la planeación"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <p className="shrink-0 pt-3 text-center text-xs font-semibold text-slate-400">
        Presiona Escape o toca fuera del video para volver a la clase.
      </p>
    </div>,
    document.body,
  );
}
