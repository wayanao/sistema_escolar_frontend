import api from "../utils/api";

const getConSignal = (url, signal) =>
  signal ? api.get(url, { signal }) : api.get(url);

// Como `getConSignal`, con parámetros opcionales: sin ninguno de los dos, la
// llamada a `api` es la de siempre.
const getConOpciones = (url, { params, signal } = {}) => {
  const opciones = {};
  if (params) opciones.params = params;
  if (signal) opciones.signal = signal;
  return Object.keys(opciones).length > 0 ? api.get(url, opciones) : api.get(url);
};

// `parametrosAnio` solo llega mirando un año que no es el activo
// (`opcionesConAnio`); lo mandan el orden del boletín (paso 4.2) y Boletines y
// Certificados (paso 4.5).
export async function listarCursosBoletines({ signal, parametrosAnio } = {}) {
  const { data } = await getConOpciones("/cursos", { params: parametrosAnio, signal });
  return data;
}

// Con otro año, los matriculados de ese año, cada uno con su curso de ese año.
export async function listarEstudiantesBoletines({ signal, parametrosAnio } = {}) {
  const { data } = await getConOpciones("/estudiantes", { params: parametrosAnio, signal });
  return data;
}

export async function generarBoletinAdministrativo(
  estudianteId,
  periodo,
  { signal, parametrosAnio } = {},
) {
  const { data } = await getConOpciones(
    `/boletines/admin/generar/${estudianteId}/${periodo}`,
    { params: parametrosAnio, signal },
  );
  return data;
}

export async function listarClasesProfesorBoletines(profesorId, { signal } = {}) {
  const { data } = await getConSignal(`/mis-clases/${profesorId}`, signal);
  return data;
}

export async function obtenerReferenciaBoletin(
  asignacionId,
  periodo,
  { signal } = {},
) {
  const { data } = await getConSignal(
    `/boletines/referencia/${asignacionId}/${periodo}`,
    signal,
  );
  return data;
}

export async function guardarBoletinProfesor(payload) {
  const { data } = await api.post("/boletines/guardar", payload);
  return data;
}

/**
 * Porcentajes por tipo de nota de una clase en un periodo (paso B4c, PB11 de
 * docs/funcionalidades/SUBNOTAS_PLANILLA.md del backend), para avisar al
 * guardar el boletín si están incompletos. Usa la lectura de la planilla con
 * `con_porcentajes=true`, que ya existe, y devuelve solo eso.
 */
export async function obtenerEstadoPorcentajesBoletin(asignacionId, periodo, { signal } = {}) {
  const { data } = await api.get(`/planilla-excel/${asignacionId}/${periodo}`, {
    ...(signal ? { signal } : {}),
    params: { con_porcentajes: true },
  });
  return {
    porcentajes: data?.porcentajes || {},
    porcentajes_activos: Boolean(data?.porcentajes_activos),
  };
}

export async function obtenerOrdenBoletin(cursoId, { signal } = {}) {
  const { data } = await getConSignal(
    `/cursos/${cursoId}/orden-boletin`,
    signal,
  );
  return data;
}

export async function guardarOrdenBoletin(cursoId, payload) {
  const { data } = await api.put(`/cursos/${cursoId}/orden-boletin`, payload);
  return data;
}
