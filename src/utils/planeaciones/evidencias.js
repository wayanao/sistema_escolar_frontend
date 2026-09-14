// Contratos puros de las evidencias de una planeación: una imagen o un PDF.
export const TIPOS_IMAGEN_EVIDENCIA = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
export const TIPO_PDF_EVIDENCIA = "application/pdf";
export const MAX_BYTES_IMAGEN_EVIDENCIA = 5 * 1024 * 1024;
export const MAX_BYTES_PDF_EVIDENCIA = 15 * 1024 * 1024;

export const ACCEPT_EVIDENCIA = [...TIPOS_IMAGEN_EVIDENCIA, TIPO_PDF_EVIDENCIA]
  .concat(".pdf")
  .join(",");

const EXTENSION_PDF = /\.pdf(?:$|[?#])/i;

function aMegas(bytes) {
  return Math.round(bytes / (1024 * 1024));
}

/** Reconoce un PDF por su tipo (archivo elegido) o por su ruta (ya guardado). */
export function esEvidenciaPdf(valor) {
  if (!valor) return false;
  if (typeof valor === "object") {
    return valor.type === TIPO_PDF_EVIDENCIA || EXTENSION_PDF.test(valor.name || "");
  }
  return EXTENSION_PDF.test(String(valor));
}

/**
 * Valida el archivo antes de enviarlo. El backend vuelve a validar lo mismo:
 * esto solo evita el viaje y explica el problema de inmediato.
 */
export function validarArchivoEvidencia(archivo) {
  if (!archivo) return { valido: true, mensaje: "" };

  const esPdf = archivo.type === TIPO_PDF_EVIDENCIA;
  if (!esPdf && !TIPOS_IMAGEN_EVIDENCIA.includes(archivo.type)) {
    return {
      valido: false,
      mensaje: "Solo se permiten imagenes PNG, JPG, JPEG, WEBP o archivos PDF.",
    };
  }

  const maximo = esPdf ? MAX_BYTES_PDF_EVIDENCIA : MAX_BYTES_IMAGEN_EVIDENCIA;
  if (archivo.size > maximo) {
    return {
      valido: false,
      mensaje: esPdf
        ? `El PDF no puede superar ${aMegas(maximo)}MB.`
        : `La imagen no puede superar ${aMegas(maximo)}MB.`,
    };
  }

  return { valido: true, mensaje: "" };
}
