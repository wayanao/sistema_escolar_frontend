import api from "../utils/api";

function getConSignal(url, signal) {
  return signal ? api.get(url, { signal }) : api.get(url);
}

export async function listarClasesProfesorPlanilla(profesorId, { signal } = {}) {
  const { data } = await getConSignal(`/mis-clases/${profesorId}`, signal);
  return data;
}

export async function obtenerPlanillaNotas(asignacionId, periodo, { signal } = {}) {
  const { data } = await getConSignal(
    `/planilla-excel/${asignacionId}/${periodo}`,
    signal,
  );
  return data;
}

export async function guardarNotaPlanilla(payload, { signal } = {}) {
  const respuesta = signal
    ? await api.post("/planilla/nota", payload, { signal })
    : await api.post("/planilla/nota", payload);
  return respuesta.data;
}

export async function eliminarTipoEvaluacionPlanilla(
  { asignacionId, descripcion, periodo },
  { signal } = {},
) {
  const url = `/planilla/tipo?asignacion_id=${asignacionId}&descripcion=${encodeURIComponent(descripcion)}&periodo=${periodo}`;
  const respuesta = signal
    ? await api.delete(url, { signal })
    : await api.delete(url);
  return respuesta.data;
}
