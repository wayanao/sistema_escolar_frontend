import api from "../utils/api";

export async function listarEstudiantes(estado) {
  const { data } = await api.get("/estudiantes", { params: { estado } });
  return data;
}

export async function listarCursosEstudiantes() {
  const { data } = await api.get("/cursos");
  return data;
}

export async function crearEstudiante(payload) {
  const { data } = await api.post("/estudiantes", payload);
  return data;
}

export async function actualizarEstudiante(estudianteId, payload) {
  const { data } = await api.put(`/estudiantes/${estudianteId}`, payload);
  return data;
}

export async function obtenerEstudiante(estudianteId) {
  const { data } = await api.get(`/estudiantes/${estudianteId}`);
  return data;
}

export async function cambiarEstadoEstudiante(estudianteId, estado) {
  const { data } = await api.patch(`/estudiantes/${estudianteId}/estado`, {
    estado,
  });
  return data;
}

export async function obtenerDetalleEstudiante(estudianteId) {
  const { data } = await api.get(`/estudiantes/${estudianteId}/detalles`);
  return data;
}

export async function obtenerDeudasEstudiante(estudianteId) {
  const { data } = await api.get(`/estudiantes/${estudianteId}/deudas`);
  return data;
}

export async function listarPlanillaObservador(asignacionId) {
  const { data } = await api.get(`/planilla/${asignacionId}`);
  return data;
}

export async function obtenerObservacion(
  estudianteId,
  asignacionId,
  periodo,
  { signal } = {},
) {
  const opciones = signal ? { signal } : undefined;
  const respuesta = opciones
    ? await api.get(
        `/observaciones/${estudianteId}/${asignacionId}/${periodo}`,
        opciones,
      )
    : await api.get(
        `/observaciones/${estudianteId}/${asignacionId}/${periodo}`,
      );
  return respuesta.data;
}

export async function guardarObservacion(payload) {
  const { data } = await api.post("/observaciones", payload);
  return data;
}
