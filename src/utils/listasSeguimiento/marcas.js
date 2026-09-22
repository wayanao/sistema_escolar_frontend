// Contrato puro de las celdas. Sin HTTP, sin React, sin DOM.
// Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.

// El CHECK chk_listas_seguimiento_marcas_nota_longitud de la tabla. El backend
// lo repite en MarcaSeguimientoItem y responde 422 si se pasa; aqui sirve para
// poner el maxLength del campo y avisar antes de gastar una peticion.
export const LIMITE_NOTA_SEGUIMIENTO = 240;

// Lo que vale una celda de la que el backend no manda fila. Congelado a
// proposito: se devuelve siempre el mismo objeto y nadie debe escribirle
// encima. Quien necesite modificarlo, que lo copie.
export const MARCA_VACIA = Object.freeze({ marcado: false, nota: "" });

// Cuidado con el atajo `Number(valor)`: en JavaScript `Number(null)`, `Number("")`
// y `Number(false)` valen **0**, no NaN. Con ese atajo una celda sin columna
// viajaria como `columna_id: 0`, un id que parece valido, y el backend la
// rechazaria con un 422 dificil de entender. Por eso solo pasan los numeros
// finitos y las cadenas que de verdad traen un numero.
const numeroONulo = (valor) => {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;

  if (typeof valor === "string" && valor.trim() !== "") {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  return null;
};

/**
 * La respuesta de `GET /listas-seguimiento/{cursoId}`, en la forma que consume
 * la pantalla.
 *
 * Tolera que falte cualquier cosa: una respuesta a medias deja la grilla
 * vacia, no rompe el render. Las claves de `marcas` se dejan como texto,
 * que es como las manda el backend y como JSON obliga a que sean.
 */
export function normalizarListaSeguimiento(data) {
  const columnas = Array.isArray(data?.columnas) ? data.columnas : [];
  const estudiantes = Array.isArray(data?.estudiantes) ? data.estudiantes : [];

  return {
    cursoId: numeroONulo(data?.curso_id),
    columnas: columnas.map((columna) => ({
      id: numeroONulo(columna?.id),
      nombre: String(columna?.nombre ?? ""),
    })),
    estudiantes: estudiantes.map((estudiante) => ({
      estudianteId: numeroONulo(estudiante?.estudiante_id),
      nombre: String(estudiante?.nombre ?? ""),
      apellido: String(estudiante?.apellido ?? ""),
      marcas:
        estudiante?.marcas && typeof estudiante.marcas === "object"
          ? estudiante.marcas
          : {},
    })),
  };
}

/**
 * La marca guardada de una celda, o `MARCA_VACIA` si no hay fila.
 *
 * El backend no manda las celdas sin marcar -seria mandar el curso entero en
 * blanco-, asi que el default lo pone el cliente, igual que ya hace la
 * planilla con las notas ausentes.
 */
export function obtenerMarcaCelda(estudiante, columnaId) {
  const marca = estudiante?.marcas?.[String(columnaId)];
  if (!marca || typeof marca !== "object") return MARCA_VACIA;

  return {
    marcado: Boolean(marca.marcado),
    nota: String(marca.nota ?? ""),
  };
}

/**
 * La clave de una celda dentro de los cambios pendientes.
 *
 * No estaba en el plan del documento y se agrega por un motivo concreto: es lo
 * que hace **imposible** que el lote lleve la misma celda dos veces. Si eso
 * pasara, el backend rechaza el lote entero con 422, porque escribe todo en
 * una sola sentencia y PostgreSQL aborta con "ON CONFLICT DO UPDATE command
 * cannot affect row a second time". Guardando los cambios en un mapa con esta
 * clave, el segundo cambio a una celda pisa al primero en vez de sumarse.
 */
export function claveCelda(estudianteId, columnaId) {
  return `${estudianteId}:${columnaId}`;
}

/**
 * El cuerpo de `POST /listas-seguimiento/{cursoId}/marcas` a partir de los
 * cambios pendientes.
 *
 * `cambios` es un `Map` o un objeto plano indexado por `claveCelda`, con
 * valores `{ columnaId, estudianteId, marcado, nota }`. Se aceptan las dos
 * formas porque un hook puede guardar el estado de cualquiera de ellas.
 *
 * La nota se manda recortada, que es como la guarda el backend: asi lo que se
 * envia y lo que queda escrito son lo mismo. No se recorta a 240 caracteres a
 * la fuerza -cortar texto sin avisar es peor que el 422-; de avisar se encarga
 * la pantalla con LIMITE_NOTA_SEGUIMIENTO.
 *
 * Una celda sin `columnaId` o sin `estudianteId` se descarta: mandarla daria
 * un 422 del backend por referenciar algo que no es del curso.
 */
export function construirPayloadMarcas(cambios) {
  const entradas =
    cambios instanceof Map ? [...cambios.values()] : Object.values(cambios ?? {});

  return entradas
    .map((cambio) => ({
      columna_id: numeroONulo(cambio?.columnaId),
      estudiante_id: numeroONulo(cambio?.estudianteId),
      marcado: Boolean(cambio?.marcado),
      nota: String(cambio?.nota ?? "").trim(),
    }))
    .filter((celda) => celda.columna_id !== null && celda.estudiante_id !== null);
}
