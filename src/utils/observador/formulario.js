/**
 * Contratos puros del formulario de anotación del observador.
 *
 * Sin HTTP, sin React y sin DOM. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 */

import { normalizarTextoObservador } from "./texto";

/** Los tres campos que la profesora escribe, en el orden en que se muestran. */
export const CAMPOS_ANOTACION = ["conductual", "cognitivo", "lenguaje"];

/**
 * El formulario vacío, o precargado con una anotación para corregirla.
 *
 * Solo los tres campos de texto. La marca de positiva o negativa se quitó el
 * 2026-09-09: ya no se pide, no se muestra y no se guarda.
 */
export function crearFormularioAnotacion(anotacion = null) {
  return {
    conductual: anotacion?.conductual || "",
    cognitivo: anotacion?.cognitivo || "",
    lenguaje: anotacion?.lenguaje || "",
  };
}

/** `true` si al menos una de las tres dimensiones trae contenido. Es la misma
 * validación que ya tenía la pantalla vieja, y la que el servidor devuelve como
 * 422: una anotación vacía no dice nada y ensuciaría la bitácora. */
export function tieneContenidoAnotacion(formulario) {
  return CAMPOS_ANOTACION.some(
    (campo) => String(formulario?.[campo] || "").trim().length > 0,
  );
}

/**
 * `true` si el formulario se puede enviar: basta con que haya algo escrito.
 *
 * Es la única condición que queda desde que se quitó la marca de positiva o
 * negativa. El servidor la exige igual, así que comprobarla aquí solo evita un
 * viaje inútil y un mensaje de error feo.
 */
export function puedeGuardarAnotacion(formulario) {
  return tieneContenidoAnotacion(formulario);
}

function textosNormalizados(formulario) {
  return Object.fromEntries(
    CAMPOS_ANOTACION.map((campo) => [
      campo,
      normalizarTextoObservador(formulario?.[campo]),
    ]),
  );
}

/**
 * El cuerpo del `POST` que crea una anotación.
 *
 * **No lleva `profesor_id`**: el autor sale del token del profesor, nunca del
 * cliente. Si viajara desde aquí, un profesor podría firmar una anotación con
 * el nombre de otro. Tampoco lleva `asignacion_id`, `materia` ni `positiva`:
 * ninguna de las tres se rellena.
 */
export function construirPayloadAnotacionNueva(formulario, { estudianteId, periodo }) {
  return {
    estudiante_id: Number(estudianteId),
    periodo: Number(periodo),
    ...textosNormalizados(formulario),
  };
}

/**
 * El cuerpo del `PUT` que corrige una anotación propia.
 *
 * **No lleva `estudiante_id` ni `periodo`.** El periodo es la etiqueta del
 * momento en que se escribió: moverla de periodo sería reescribir cuándo pasó,
 * no corregir cómo se contó. Tampoco lleva `positiva`: el servidor conserva la
 * que la fila tuviera, así que corregir una heredada ya no obliga a marcarla.
 */
export function construirPayloadEdicionAnotacion(formulario) {
  return textosNormalizados(formulario);
}

/** `true` si la anotación la escribió el profesor de la sesión, que es lo único
 * que decide si se pinta `[Editar]`. Es **cosmético**: la regla de verdad la
 * impone el servidor, y el frontend no puede ser la única defensa. */
export function esAnotacionPropia(anotacion, profesorId) {
  if (profesorId === null || profesorId === undefined || profesorId === "") return false;
  return Number(anotacion?.profesor_id) === Number(profesorId);
}
