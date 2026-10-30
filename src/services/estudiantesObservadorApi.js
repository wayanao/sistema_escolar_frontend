import api from "../utils/api";

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); sin él, cada petición es la de siempre.
const getConAnio = (url, parametrosAnio) =>
  parametrosAnio ? api.get(url, { params: parametrosAnio }) : api.get(url);

// Con otro año, el backend devuelve los matriculados de ese año, cada uno con
// su curso de ese año. La señal viaja solo si la pasan (la usa la sección
// "Activar" del año lectivo).
export async function listarEstudiantes(estado, { parametrosAnio, signal } = {}) {
  const opciones = { params: { estado, ...parametrosAnio } };
  if (signal) opciones.signal = signal;
  const { data } = await api.get("/estudiantes", opciones);
  return data;
}

export async function listarCursosEstudiantes({ parametrosAnio } = {}) {
  const { data } = await getConAnio("/cursos", parametrosAnio);
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

// Entrevista de admisión, paso E11b: `{ admision_id, anio, fecha_entrevista,
// cuestionario }`, todo `null` y `{}` si el estudiante no entró por una
// admisión. Solo admin.
export async function obtenerAdmisionDeEstudiante(estudianteId) {
  const { data } = await api.get(`/estudiantes/${estudianteId}/admision`);
  return data;
}

export async function cambiarEstadoEstudiante(estudianteId, estado) {
  const { data } = await api.patch(`/estudiantes/${estudianteId}/estado`, {
    estado,
  });
  return data;
}

// La ficha del admin: notas, faltas y observaciones, y las deudas, del año
// que mira (sin año, del activo).
export async function obtenerDetalleEstudiante(estudianteId, { parametrosAnio } = {}) {
  const { data } = await getConAnio(`/estudiantes/${estudianteId}/detalles`, parametrosAnio);
  return data;
}

export async function obtenerDeudasEstudiante(estudianteId, { parametrosAnio } = {}) {
  const { data } = await getConAnio(`/estudiantes/${estudianteId}/deudas`, parametrosAnio);
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
