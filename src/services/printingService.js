import api from "../utils/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Convierte URL relativa del backend ('/uploads/...') a URL absoluta servible.
export function resolveAssetUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ── Branding ───────────────────────────────────────────────────────────────
export async function getBranding() {
  const { data } = await api.get("/branding");
  return {
    ...data,
    logo_principal_url: resolveAssetUrl(data.logo_principal_url),
    logo_secundario_url: resolveAssetUrl(data.logo_secundario_url),
  };
}

export async function updateBranding(payload) {
  const { data } = await api.put("/branding", payload);
  return {
    ...data,
    logo_principal_url: resolveAssetUrl(data.logo_principal_url),
    logo_secundario_url: resolveAssetUrl(data.logo_secundario_url),
  };
}

export async function uploadLogo(file, slot = "principal") {
  const form = new FormData();
  form.append("archivo", file);
  const { data } = await api.post(`/branding/logo?slot=${slot}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { ...data, url: resolveAssetUrl(data.url) };
}

export async function deleteLogo(slot = "principal") {
  const { data } = await api.delete(`/branding/logo?slot=${slot}`);
  return data;
}

// ── Plantillas ─────────────────────────────────────────────────────────────
export async function listarPlantillas(tipo) {
  const params = tipo ? { tipo } : {};
  const { data } = await api.get("/plantillas", { params });
  return data;
}

export async function getPlantillaActiva(tipo) {
  const { data } = await api.get(`/plantillas/activa/${tipo}`);
  return data;
}

export async function activarPlantilla(plantillaId) {
  const { data } = await api.post(`/plantillas/${plantillaId}/activar`);
  return data;
}

export async function duplicarPlantilla(plantillaId, nuevoNombre) {
  const params = nuevoNombre ? { nuevo_nombre: nuevoNombre } : {};
  const { data } = await api.post(`/plantillas/${plantillaId}/duplicar`, null, { params });
  return data;
}

export async function actualizarPlantilla(plantillaId, payload) {
  const { data } = await api.put(`/plantillas/${plantillaId}`, payload);
  return data;
}

export async function eliminarPlantilla(plantillaId) {
  const { data } = await api.delete(`/plantillas/${plantillaId}`);
  return data;
}

export async function crearPlantilla(payload) {
  const { data } = await api.post("/plantillas", payload);
  return data;
}
