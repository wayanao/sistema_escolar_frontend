import { API_BASE_URL } from "../../config/env";

export function resolveAssetUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

// Datos de la identidad que el backend guarda dentro de `configuracion_extra`
// (un campo libre) y no como columnas propias del branding. Los cinco últimos
// son de los certificados (ver docs/funcionalidades/CERTIFICADOS_NUEVOS.md).
export const CAMPOS_IDENTIDAD_EXTRA = [
  "membrete",
  "aprobacion_resolucion",
  "color_texto",
  "certificado_encabezado",
  "firmante_nombre",
  "firmante_documento",
  "firmante_cargo",
  "ciudad_expedicion",
];

export function normalizarCampoIdentidad(campo, valor) {
  if (campo !== "codigo_dane") return valor;
  return valor.replace(/\D/g, "").slice(0, 20);
}
