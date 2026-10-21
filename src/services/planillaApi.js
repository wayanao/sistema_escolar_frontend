import api from "../utils/api";

function getConSignal(url, signal) {
  return signal ? api.get(url, { signal }) : api.get(url);
}

function conSenal(signal) {
  return signal ? { signal } : undefined;
}

export async function listarClasesProfesorPlanilla(profesorId, { signal } = {}) {
  const { data } = await getConSignal(`/mis-clases/${profesorId}`, signal);
  return data;
}

/**
 * La planilla de una clase en un periodo.
 *
 * Con `conSubnotas` pide también las subnotas (`?con_subnotas=true`, ver
 * docs/funcionalidades/SUBNOTAS_PLANILLA.md). Sin esa opción manda exactamente
 * la misma petición de siempre.
 */
export async function obtenerPlanillaNotas(
  asignacionId,
  periodo,
  { signal, conSubnotas = false } = {},
) {
  const url = `/planilla-excel/${asignacionId}/${periodo}`;
  if (!conSubnotas) {
    const { data } = await getConSignal(url, signal);
    return data;
  }

  const { data } = await api.get(url, {
    ...conSenal(signal),
    params: { con_subnotas: true },
  });
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

// ---------------------------------------------------------------------------
// Subnotas (docs/funcionalidades/SUBNOTAS_PLANILLA.md). Los cuerpos los arma
// `utils/planilla/subnotas.js`; aquí viajan tal cual.
// ---------------------------------------------------------------------------

export async function crearSubnotaPlanilla(payload, { signal } = {}) {
  const { data } = await api.post("/planilla/subnotas", payload, conSenal(signal));
  return data;
}

export async function renombrarSubnotaPlanilla(subnotaId, payload, { signal } = {}) {
  const { data } = await api.put(`/planilla/subnotas/${subnotaId}`, payload, conSenal(signal));
  return data;
}

export async function eliminarSubnotaPlanilla({ subnotaId, asignacionId }, { signal } = {}) {
  const { data } = await api.delete(
    `/planilla/subnotas/${subnotaId}?asignacion_id=${asignacionId}`,
    conSenal(signal),
  );
  return data;
}

export async function guardarCalificacionesSubnotas(payload, { signal } = {}) {
  const { data } = await api.post("/planilla/subnotas/valores", payload, conSenal(signal));
  return data;
}
