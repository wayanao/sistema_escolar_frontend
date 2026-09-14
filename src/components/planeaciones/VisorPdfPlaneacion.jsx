import CapaVisorPlaneacion from "./CapaVisorPlaneacion";

/**
 * Muestra un PDF solo, sobre la pantalla actual. Recibe una URL `blob:` ya
 * descargada con la sesión del usuario, nunca una ruta del servidor.
 */
export default function VisorPdfPlaneacion({ url, nombre, onCerrar }) {
  return (
    <CapaVisorPlaneacion
      titulo={`Documento: ${nombre}`}
      enlaceExterno={{ href: url, texto: "Abrir en otra pestaña" }}
      pie="Presiona Escape o toca fuera del documento para volver a la clase."
      textoCerrar="Cerrar documento"
      onCerrar={onCerrar}
    >
      <div className="h-full max-h-full w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <iframe src={url} title={nombre} className="h-full w-full" />
      </div>
    </CapaVisorPlaneacion>
  );
}
