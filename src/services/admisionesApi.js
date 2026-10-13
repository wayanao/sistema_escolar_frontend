import api from "../utils/api";

// Único punto HTTP de admisiones (entrevista de admisión, pasos E4 y E5). Ver
// docs/funcionalidades/ENTREVISTA_ADMISION.md y, para el contrato,
// sistema_escolar_api/docs/API_ENDPOINTS.md ("Admisiones").
//
// Devuelve los datos tal cual o lanza el error original: quien decide
// mensajes son los hooks. Todas las rutas son solo del admin; el tenant no
// viaja aquí, lo resuelve el backend desde la cookie o el JWT.

const getConSignal = (url, signal) => (signal ? api.get(url, { signal }) : api.get(url));

// `{ anio_lectivo, editable, conteos, admisiones }`. Sin `?resultado=` a
// propósito: se filtra en el navegador y cambiar de filtro no cuesta otra
// petición.
export async function listarAdmisiones(anioLectivoId, { signal } = {}) {
  const { data } = await getConSignal(`/anios-lectivos/${anioLectivoId}/admisiones`, signal);
  return data;
}

// Responde la admisión completa, ya `pendiente`.
export async function registrarAdmision(anioLectivoId, aspirante) {
  const { data } = await api.post(`/anios-lectivos/${anioLectivoId}/admisiones`, aspirante);
  return data;
}

export async function obtenerAdmision(admisionId, { signal } = {}) {
  const { data } = await getConSignal(`/admisiones/${admisionId}`, signal);
  return data;
}

// Aspirante y entrevista; reemplaza todo. No cambia el resultado.
export async function actualizarAdmision(admisionId, datos) {
  const { data } = await api.put(`/admisiones/${admisionId}`, datos);
  return data;
}

// `{ resultado, motivo_resultado }`; "no_aprobado" exige el motivo.
export async function cambiarResultadoAdmision(admisionId, resultado) {
  const { data } = await api.put(`/admisiones/${admisionId}/resultado`, resultado);
  return data;
}

export async function borrarAdmision(admisionId) {
  const { data } = await api.delete(`/admisiones/${admisionId}`);
  return data;
}

// Paso E5: la ficha del estudiante, el mismo cuerpo de `POST /estudiantes`.
// Solo un aprobado, una vez. Responde `{ mensaje, estudiante_id,
// matricula_id, anio_lectivo_id, curso_id, estudiante_existente, admision }`.
export async function matricularAdmision(admisionId, ficha) {
  const { data } = await api.post(`/admisiones/${admisionId}/matricular`, ficha);
  return data;
}
