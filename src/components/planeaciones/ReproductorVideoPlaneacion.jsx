import { construirUrlIncrustadaYoutube } from "../../utils/planeaciones/enlaces";
import CapaVisorPlaneacion from "./CapaVisorPlaneacion";

/** Muestra un video de YouTube solo, sobre la pantalla actual. */
export default function ReproductorVideoPlaneacion({ video, enlace, onCerrar }) {
  return (
    <CapaVisorPlaneacion
      titulo="Reproductor de video"
      enlaceExterno={{ href: enlace, texto: "Abrir en YouTube" }}
      pie="Presiona Escape o toca fuera del video para volver a la clase."
      textoCerrar="Cerrar video"
      onCerrar={onCerrar}
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
    </CapaVisorPlaneacion>
  );
}
