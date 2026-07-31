import api from "../utils/api";

function getConSignal(url, signal) {
  return signal ? api.get(url, { signal }) : api.get(url);
}

export async function obtenerPlanillaAsistencia(asignacionId, periodo, { signal } = {}) {
  const { data } = await getConSignal(
    `/planilla-excel/${asignacionId}/${periodo}`,
    signal,
  );
  return data;
}

export async function listarClasesProfesorAsistencia(profesorId, { signal } = {}) {
  const { data } = await getConSignal(`/mis-clases/${profesorId}`, signal);
  return data;
}

export async function listarHistorialAsistencia(asignacionId, periodo, { signal } = {}) {
  const { data } = await getConSignal(
    `/asistencia/historial/${asignacionId}/${periodo}`,
    signal,
  );
  return data;
}

export async function guardarAsistenciaProfesor(payload, { signal } = {}) {
  const respuesta = signal
    ? await api.post("/asistencia", payload, { signal })
    : await api.post("/asistencia", payload);
  return respuesta.data;
}
