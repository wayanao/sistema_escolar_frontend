import {
  AREA_MINIMA_MOTA,
  bytesDeDataUrl,
  LADO_MAXIMO_PROCESO,
  limpiarPixelesFirma,
  MAX_BYTES_FIRMA,
  medidasDelRecorte,
  MENSAJE_FIRMA_PESADA,
  MENSAJE_FOTO_ILEGIBLE,
} from "../../utils/firmas/imagenFirma";

// Firmas guardadas para el boletín (docs/funcionalidades/FIRMAS_BOLETIN.md):
// la parte que necesita el navegador -abrir la foto y dibujar en un canvas-.
// Las reglas (qué es tinta, el recorte, el tamaño) son puras y viven en
// `utils/firmas/imagenFirma.js`; aquí solo se mueven píxeles.

// Si la firma queda por encima de 100 KB, se reintenta más pequeña.
const ESCALAS = [1, 0.7, 0.5];

/** Abre una foto (`File`) o una imagen `data:` y la deja lista para dibujar. */
export function cargarImagen(fuente) {
  return new Promise((resolve, reject) => {
    const esTexto = typeof fuente === "string";
    const url = esTexto ? fuente : URL.createObjectURL(fuente);
    const imagen = new Image();
    const liberar = () => {
      if (!esTexto) URL.revokeObjectURL(url);
    };
    imagen.onload = () => {
      liberar();
      resolve(imagen);
    };
    imagen.onerror = () => {
      liberar();
      reject(new Error(MENSAJE_FOTO_ILEGIBLE));
    };
    imagen.src = url;
  });
}

function crearLienzo(ancho, alto) {
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  return lienzo;
}

/**
 * Convierte una foto (`File`) o el trazo del recuadro (`data:`) en la imagen
 * que se guarda: PNG con solo la tinta, fondo transparente, recortado y de
 * menos de 100 KB. Devuelve el `data:image/png;base64,...`.
 *
 * Si no sirve, lanza un `Error` con un mensaje para enseñar tal cual.
 * `quitarMotas`: borrar polvo y motas del papel (fotos); el trazo con el dedo
 * pasa `false`. `cargar` se cambia en las pruebas (jsdom no abre imágenes).
 */
export async function prepararFirma(fuente, { quitarMotas = true, cargar = cargarImagen } = {}) {
  const imagen = await cargar(fuente);
  const anchoOriginal = imagen.naturalWidth || imagen.width;
  const altoOriginal = imagen.naturalHeight || imagen.height;
  if (!anchoOriginal || !altoOriginal) throw new Error(MENSAJE_FOTO_ILEGIBLE);

  // 1) Achicar la foto y leer sus píxeles.
  const achique = Math.min(1, LADO_MAXIMO_PROCESO / Math.max(anchoOriginal, altoOriginal));
  const ancho = Math.max(1, Math.round(anchoOriginal * achique));
  const alto = Math.max(1, Math.round(altoOriginal * achique));
  const lectura = crearLienzo(ancho, alto);
  const contextoLectura = lectura.getContext("2d");
  if (!contextoLectura) throw new Error(MENSAJE_FOTO_ILEGIBLE);
  contextoLectura.drawImage(imagen, 0, 0, ancho, alto);
  const { data } = contextoLectura.getImageData(0, 0, ancho, alto);

  // 2) Dejar solo la tinta.
  const { pixeles, caja, error } = limpiarPixelesFirma(data, ancho, alto, {
    areaMinimaMota: quitarMotas ? AREA_MINIMA_MOTA : 0,
  });
  if (error) throw new Error(error);
  const limpia = crearLienzo(ancho, alto);
  limpia.getContext("2d").putImageData(new ImageData(pixeles, ancho, alto), 0, 0);

  // 3) Recortar a la firma y achicar hasta que pese menos de 100 KB.
  for (const escala of ESCALAS) {
    const { origen, final } = medidasDelRecorte(caja, ancho, alto, escala);
    const salida = crearLienzo(final.ancho, final.alto);
    salida
      .getContext("2d")
      .drawImage(limpia, origen.x, origen.y, origen.ancho, origen.alto, 0, 0, final.ancho, final.alto);
    const dataUrl = salida.toDataURL("image/png");
    if (bytesDeDataUrl(dataUrl) <= MAX_BYTES_FIRMA) return dataUrl;
  }
  throw new Error(MENSAJE_FIRMA_PESADA);
}
