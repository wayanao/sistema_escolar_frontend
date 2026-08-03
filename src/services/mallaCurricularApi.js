import api from "../utils/api";

export const obtenerAsignacionesProfesor = async (profesorId) => {
  const { data } = await api.get(`/mis-clases/${profesorId}`);
  return data;
};

export const obtenerPlaneadoresAnuales = async (asignacionId, periodo) => {
  const { data } = await api.get(`/planeador-anual/${asignacionId}/${periodo}`);
  return data;
};

export const guardarPlaneadoresAnuales = (asignacionId, periodo, payload) => api.put(
  `/planeador-anual/${asignacionId}/${periodo}`,
  payload
);
