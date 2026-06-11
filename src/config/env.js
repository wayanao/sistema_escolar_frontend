const LOCAL_API_URL = "http://localhost:8000";

function normalizeUrl(value) {
  return value.replace(/\/+$/, "");
}

function readApiUrl() {
  const rawValue = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? LOCAL_API_URL : "");
  const apiUrl = normalizeUrl(rawValue.trim());

  if (!apiUrl) {
    throw new Error("Falta configurar VITE_API_URL para este entorno.");
  }

  try {
    return new URL(apiUrl).toString().replace(/\/+$/, "");
  } catch {
    throw new Error(`VITE_API_URL no es una URL valida: ${apiUrl}`);
  }
}

export const API_BASE_URL = readApiUrl();
