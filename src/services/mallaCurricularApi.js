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

// Año lectivo, fase 7 (paso 7.3): traer el planeador del año pasado. El
// backend encuentra el origen desde la clase de este año y decide si se puede
// (`puede_traer`); traer nunca sobrescribe lo ya escrito.
export const consultarPlaneadorAnioAnterior = async (asignacionId) => {
  const { data } = await api.get(`/planeador-anual/${asignacionId}/anio-anterior`);
  return data;
};

export const traerPlaneadorAnioAnterior = async (asignacionId) => {
  const { data } = await api.post(`/planeador-anual/${asignacionId}/anio-anterior`);
  return data;
};
