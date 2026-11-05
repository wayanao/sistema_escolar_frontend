// Contrato puro del nombre de una columna. Sin HTTP, sin React, sin DOM.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.

import { primeraMayuscula } from "../nombres";

// El VARCHAR(100) de listas_seguimiento_columnas. El backend lo repite en
// ColumnaSeguimientoCreate y responde 422 si se pasa; aqui se comprueba antes
// para avisar sin gastar una peticion.
export const LIMITE_NOMBRE_COLUMNA = 100;

export const ERRORES_NOMBRE_COLUMNA = {
  VACIO: "Escribe un nombre para la columna.",
  LARGO: `El nombre no puede pasar de ${LIMITE_NOMBRE_COLUMNA} caracteres.`,
  DUPLICADO: "Ya existe una columna con ese nombre en este curso.",
};

/**
 * La misma regla que el indice unico del backend
 * (`idx_listas_seguimiento_columnas_nombre_unico`): quita los espacios de los
 * extremos, colapsa los interiores repetidos a uno, y sube a mayusculas.
 *
 * **Colapsar los espacios interiores no es un detalle.** La planilla del
 * profesor compara con `trim().toLowerCase()` y ahi basta, pero aqui no:
 * escribir "Compro  el libro" con "Compro el libro" ya creada pasaria el
 * filtro del navegador y el servidor respondaria 409. Esta funcion existe para
 * que las dos reglas digan lo mismo.
 *
 * Solo sirve para COMPARAR. Lo que se guarda es el nombre recortado, no este.
 */
export function normalizarNombreColumna(nombre) {
  return String(nombre ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

const cursos = (cantidad) => `${cantidad} ${cantidad === 1 ? "curso" : "cursos"}`;

/**
 * Lo que se le dice al usuario después de crear una columna en todos los cursos.
 *
 * Recibe la respuesta del backend, `{creadas, omitidas, total}`.
 *
 * **Que no se cree ninguna no es un fallo**, y el mensaje no debe sonar a
 * fallo: pasa siempre que todos los cursos ya la tenían, que es el caso normal
 * al volver a pulsar el botón. Por eso hay un texto propio para ese caso en
 * vez de un "0 columnas creadas" que parece un error.
 */
export function mensajeAltaMasiva({ creadas = 0, omitidas = 0, total = 0 } = {}) {
  if (total === 0) return "No hay cursos activos donde crearla.";
  if (creadas === 0) return `Todos los cursos ya la tenían (${cursos(total)}).`;
  if (omitidas === 0) return `Creada en los ${cursos(total)}.`;

  return `Creada en ${cursos(creadas)}. ${omitidas} ya la ${
    omitidas === 1 ? "tenía" : "tenían"
  }.`;
}

/**
 * Valida el nombre antes de pedirle nada al servidor.
 *
 * Devuelve `{ valido, nombre, error }`, donde `nombre` es el texto ya
 * recortado y con la primera letra en mayúscula: es lo que hay que enviar, y
 * coincide con lo que el backend guardaria.
 *
 * **Esto es comodidad, no la regla.** La verdad la tiene el backend: entre
 * este chequeo y la peticion otra pestaña puede crear la misma columna, y ahi
 * responde 409. Quien llame tiene que seguir tratando ese error.
 *
 * `columnasExistentes` son las columnas ya cargadas del curso, tal como
 * llegan de la API (`[{ id, nombre }]`).
 */
export function validarNombreColumna(nombre, columnasExistentes = []) {
  const recortado = String(nombre ?? "").trim();

  if (!recortado) {
    return { valido: false, nombre: "", error: ERRORES_NOMBRE_COLUMNA.VACIO };
  }

  if (recortado.length > LIMITE_NOMBRE_COLUMNA) {
    return { valido: false, nombre: recortado, error: ERRORES_NOMBRE_COLUMNA.LARGO };
  }

  const buscado = normalizarNombreColumna(recortado);
  const duplicado = columnasExistentes.some(
    (columna) => normalizarNombreColumna(columna?.nombre) === buscado,
  );

  if (duplicado) {
    return { valido: false, nombre: recortado, error: ERRORES_NOMBRE_COLUMNA.DUPLICADO };
  }

  // Se guarda con la primera letra en mayúscula (pedido del usuario el
  // 2026-11-05). El duplicado ya se comparó en mayúsculas, así que no cambia.
  return { valido: true, nombre: primeraMayuscula(recortado), error: null };
}
