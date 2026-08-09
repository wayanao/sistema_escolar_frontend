import api from "../utils/api";

export async function iniciarSesion(payload) {
  const { data } = await api.post("/login", payload);
  return data;
}

export async function cambiarPassword(payload) {
  const { data } = await api.post("/auth/cambiar-password", payload);
  return data;
}

export async function cerrarSesion() {
  const { data } = await api.post("/logout");
  return data;
}

export async function obtenerEstadoTenant() {
  const { data } = await api.get("/tenant/status");
  return data;
}
