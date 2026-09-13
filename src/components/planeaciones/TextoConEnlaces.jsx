import { Fragment, useState } from "react";
import {
  obtenerVideoYoutube,
  partirTextoConEnlaces,
} from "../../utils/planeaciones/enlaces";
import ReproductorVideoPlaneacion from "./ReproductorVideoPlaneacion";

const CLASE_ENLACE_BASE =
  "break-words font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 transition hover:text-violet-900 hover:decoration-violet-500";

/**
 * Pinta texto libre de una planeación reconociendo los enlaces http/https.
 *
 * Un video de YouTube se convierte en un botón que lo reproduce sobre la
 * pantalla, sin salir de la clase. Cualquier otro enlace se muestra con la URL
 * completa como etiqueta y abre en otra pestaña, para que quien lee vea a dónde
 * va antes de hacer clic. En ningún caso se inyecta HTML.
 */
export default function TextoConEnlaces({ texto, claseEnlace = "" }) {
  const [videoActivo, setVideoActivo] = useState(null);
  const partes = partirTextoConEnlaces(texto);

  return (
    <>
      {partes.map((parte, indice) => {
        if (parte.tipo !== "enlace") {
          return <Fragment key={`texto-${indice}`}>{parte.valor}</Fragment>;
        }

        const video = obtenerVideoYoutube(parte.valor);
        if (video) {
          return (
            <BotonReproducirVideo
              key={`video-${indice}`}
              onReproducir={() => setVideoActivo({ video, enlace: parte.valor })}
            />
          );
        }

        return (
          <a
            key={`enlace-${indice}`}
            href={parte.valor}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CLASE_ENLACE_BASE} ${claseEnlace}`.trim()}
          >
            {parte.valor}
          </a>
        );
      })}

      {videoActivo && (
        <ReproductorVideoPlaneacion
          video={videoActivo.video}
          enlace={videoActivo.enlace}
          onCerrar={() => setVideoActivo(null)}
        />
      )}
    </>
  );
}

function BotonReproducirVideo({ onReproducir }) {
  return (
    <button
      type="button"
      onClick={onReproducir}
      className="mx-0.5 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 align-middle text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M6 4.5v11l9-5.5-9-5.5Z" />
      </svg>
      Reproducir video
    </button>
  );
}
