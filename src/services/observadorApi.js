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
