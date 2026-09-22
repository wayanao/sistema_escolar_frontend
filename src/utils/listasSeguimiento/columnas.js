// Contrato puro del nombre de una columna. Sin HTTP, sin React, sin DOM.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.

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

/**
 * Valida el nombre antes de pedirle nada al servidor.
 *
 * Devuelve `{ valido, nombre, error }`, donde `nombre` es el texto ya
 * recortado: es lo que hay que enviar, y coincide con lo que el backend
 * guardaria.
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

  return { valido: true, nombre: recortado, error: null };
}
