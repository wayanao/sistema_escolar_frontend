import api from "../utils/api";

/**
 * Frontera HTTP del observador del estudiante unificado.
 *
 * Vive aparte de `estudiantesObservadorApi.js` -que sirve la pantalla vieja-
 * a propósito: cuando el usuario ordene retirar la vieja, sus contratos se van
 * con ella sin arrastrar a estos. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 *
 * **No existe un contrato de borrado, y no debe añadirse**: nadie borra una
 * anotación. Es el invariante 2 del documento y el servidor tampoco expone
 * `DELETE`.
 */

/**
 * La bitácora completa de un estudiante, la anotación más nueva primero.
 *
 * `periodo` es opcional y es solo una etiqueta: sin él el servidor devuelve el
 * año entero, que es el caso por defecto. El `nivel` del curso llega **fuera**
 * de las anotaciones y también cuando no hay ninguna, así que la pantalla
 * siempre puede escribir su título.
 *
 * Un `404` significa que el estudiante no existe, y es distinto de una lista
 * vacía, que significa que todavía nadie le ha escrito nada.
 */
export async function obtenerObservador(estudianteId, { periodo, signal } = {}) {
  const config = {};
  if (periodo) config.params = { periodo };
  if (signal) config.signal = signal;

  const { data } = await api.get(`/observador/${estudianteId}`, config);
  return data;
}

/**
 * Los alumnos del profesor de la sesión, de **todos** los cursos donde tiene
 * clase, con el curso de cada uno.
 *
 * Existe para que la pantalla no dependa de una asignación elegida: el
 * observador es del niño, no de la materia. El profesor sale del token, así que
 * nadie puede pedir la lista de otro. Un `403` significa que quien pide no es
 * profesor —el admin entra por la ficha del alumno, no por esta lista—.
 *
 * **Una sola petición**, también para un profesor con seis cursos. Pedir sus
 * clases y luego los alumnos de cada una serían siete, y sería reconstruir el
 * N+1 en la pantalla que existe para matarlo.
 */
export async function listarMisEstudiantes({ signal } = {}) {
  const { data } = await api.get(
    "/observador/mis-estudiantes",
    signal ? { signal } : undefined,
  );
  return data;
}

/**
 * Añade una anotación a la bitácora. Devuelve `{ id }`.
 *
 * **Nunca actualiza una existente**: es una bitácora y todas quedan. Un
 * profesor puede anotar cuantas veces quiera en el mismo periodo, que es justo
 * lo que la tabla vieja impedía.
 *
 * El `profesor_id` **no viaja en el cuerpo**: el servidor lo saca del token e
 * ignora el que le manden. Un `403` significa que quien pide no es profesor del
 * alumno -el admin tampoco escribe-.
 */
export async function crearAnotacion(payload) {
  const { data } = await api.post("/observador", payload);
  return data;
}

/**
 * Corrige una anotación **propia**. El servidor deja rastro de la edición.
 *
 * `403` si la anotación no es tuya y `404` si no existe: son mensajes distintos
 * y el servidor los distingue a propósito. No cambia de estudiante ni de
 * periodo.
 */
export async function editarAnotacion(anotacionId, payload) {
  const { data } = await api.put(`/observador/${anotacionId}`, payload);
  return data;
}
