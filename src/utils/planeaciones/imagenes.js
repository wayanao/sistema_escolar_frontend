// Contratos y transformaciones puras de imágenes de planeaciones.
export function normalizarRutaImagen(path) {
  if (!path) return "";
  if (path.startsWith("blob:") || path.startsWith("data:")) return path;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return `${url.pathname}${url.search}`;
    } catch {
      return path;
    }
  }

  return `/${path.replaceAll("\\", "/").replace(/^\/+/, "")}`;
}
