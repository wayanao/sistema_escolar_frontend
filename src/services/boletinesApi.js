import api from "../utils/api";

const getConSignal = (url, signal) =>
  signal ? api.get(url, { signal }) : api.get(url);

export async function listarCursosBoletines({ signal } = {}) {
  const { data } = await getConSignal("/cursos", signal);
  return data;
}

export async function listarEstudiantesBoletines({ signal } = {}) {
  const { data } = await getConSignal("/estudiantes", signal);
  return data;
}

export async function generarBoletinAdministrativo(
  estudianteId,
  periodo,
  { signal } = {},
) {
  const { data } = await getConSignal(
    `/boletines/admin/generar/${estudianteId}/${periodo}`,
    signal,
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
