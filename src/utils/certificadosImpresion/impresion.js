import { API_BASE_URL } from "../../config/env";

export function resolveAssetUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function normalizarCampoIdentidad(campo, valor) {
  if (campo !== "codigo_dane") return valor;
  return valor.replace(/\D/g, "").slice(0, 20);
}
