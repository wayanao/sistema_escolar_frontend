// Leer las respuestas del anexo de la entrevista de admisión: de lo guardado a
// frases cortas, por sección, para mostrarlas de solo lectura (paso E11b), y
// todas las preguntas con sus casillas para el papel (paso E12).
// Sin HTTP, sin React, sin DOM.
//
// Vive en la raíz de `utils/` y no en un módulo porque la lectura de una
// entrevista le sirve a más de una pantalla (hoy la ficha del estudiante;
// después, si se hace, la entrevista impresa del paso E12). Ver
// docs/funcionalidades/ENTREVISTA_ADMISION.md.
//
// `catalogo` es la respuesta de `GET /admisiones/cuestionario`; `cuestionario`
// es el bloque guardado (`GET /estudiantes/{id}/admision`). Contrato en
// sistema_escolar_api/docs/API_ENDPOINTS.md, "Preguntas del anexo (paso E10)".

const SEPARADOR = " — ";

const etiquetaDe = (pregunta, valor) =>
  (pregunta.opciones ?? []).find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;

const conAparte = (texto, aparte) =>
  typeof aparte === "string" && aparte.trim() ? `${texto}${SEPARADOR}${aparte.trim()}` : texto;

// La respuesta como frase, o `null` si está vacía.
function aTexto(pregunta, valor) {
  if (valor === null || valor === undefined) return null;
  switch (pregunta.tipo) {
    case "si_no":
      return valor.respuesta ? conAparte(etiquetaDe(pregunta, valor.respuesta), valor.detalle) : null;
    case "una":
      return valor.opcion ? conAparte(etiquetaDe(pregunta, valor.opcion), valor.otro) : null;
    case "varias": {
      const marcadas = Array.isArray(valor.marcadas) ? valor.marcadas : [];
      if (marcadas.length === 0) return null;
      return conAparte(marcadas.map((marca) => etiquetaDe(pregunta, marca)).join(", "), valor.otro);
    }
    default: {
      const texto = String(valor).trim();
      return texto === "" ? null : texto;
    }
  }
}

// --- Impreso de la entrevista (paso E12) -----------------------------------

const valoresMarcados = (pregunta, valor) => {
  if (!valor) return [];
  if (pregunta.tipo === "varias") return Array.isArray(valor.marcadas) ? valor.marcadas : [];
  if (pregunta.tipo === "si_no") return valor.respuesta ? [valor.respuesta] : [];
  return valor.opcion ? [valor.opcion] : [];
};

// El renglón para escribir que abre una respuesta (el detalle o lo de
// "Otro"). Sin respuesta sale en blanco, para llenarlo a mano; con una
// respuesta que no lo pide, no sale.
function renglonAparte(pregunta, valor, marcadas) {
  const configuracion = pregunta.tipo === "si_no" ? pregunta.detalle : pregunta.otro;
  if (!configuracion) return null;
  const textoAparte = pregunta.tipo === "si_no" ? valor?.detalle : valor?.otro;
  if (marcadas.length === 0) return { texto: configuracion.texto, valor: "" };
  const loPide =
    pregunta.tipo === "si_no" ? marcadas.includes(configuracion.con) : marcadas.includes("otro");
  if (!loPide) return null;
  return {
    texto: configuracion.texto,
    valor: typeof textoAparte === "string" ? textoAparte.trim() : "",
  };
}

// `numeros`: clave → número de pregunta, para la nota de la que depende de
// otra ("Solo si la pregunta 25 es «Sí»").
function preguntaParaImprimir(pregunta, cuestionario, numeros) {
  const item = {
    clave: pregunta.clave,
    texto: `${pregunta.numero}. ${pregunta.texto}`,
    tipo: pregunta.tipo,
  };
  let valor = cuestionario[pregunta.clave];
  const condicion = pregunta.depende_de;
  if (condicion) {
    item.nota = `Solo si la pregunta ${numeros[condicion.pregunta]} es «Sí».`;
    // Una respuesta guardada que ya no corresponde no se marca.
    if (cuestionario[condicion.pregunta]?.respuesta !== condicion.respuesta) valor = undefined;
  }
  if (Array.isArray(pregunta.opciones)) {
    const marcadas = valoresMarcados(pregunta, valor);
    item.opciones = pregunta.opciones.map((opcion) => ({
      etiqueta: opcion.etiqueta,
      marcada: marcadas.includes(opcion.valor),
    }));
    item.aparte = renglonAparte(pregunta, valor, marcadas);
  } else {
    item.valor = valor === undefined || valor === null ? "" : String(valor).trim();
    item.largo = pregunta.tipo === "texto_largo";
  }
  return item;
}

// `[{ clave, titulo, preguntas: [...] }]` con **todas** las preguntas, para el
// papel: las casillas con su marca y los renglones con lo escrito o en blanco.
// Así el impreso sirve también para llenarlo a mano.
export function entrevistaParaImprimir(catalogo, cuestionario) {
  if (!Array.isArray(catalogo?.secciones)) return [];
  const respuestas = cuestionario && typeof cuestionario === "object" ? cuestionario : {};
  const preguntasDe = (seccion) => (Array.isArray(seccion.preguntas) ? seccion.preguntas : []);
  const numeros = Object.fromEntries(
    catalogo.secciones.flatMap(preguntasDe).map((pregunta) => [pregunta.clave, pregunta.numero]),
  );
  return catalogo.secciones.map((seccion) => ({
    clave: seccion.clave,
    titulo: seccion.titulo,
    preguntas: preguntasDe(seccion).map((pregunta) =>
      preguntaParaImprimir(pregunta, respuestas, numeros),
    ),
  }));
}

// `[{ clave, titulo, respuestas: [{ clave, pregunta, respuesta }] }]`: solo
// las secciones con algo respondido, en el orden de la lista. Una respuesta
// de una pregunta que la lista ya no tiene no se muestra.
export function respuestasLegibles(catalogo, cuestionario) {
  if (!Array.isArray(catalogo?.secciones) || !cuestionario || typeof cuestionario !== "object") {
    return [];
  }
  return catalogo.secciones
    .map((seccion) => ({
      clave: seccion.clave,
      titulo: seccion.titulo,
      respuestas: (Array.isArray(seccion.preguntas) ? seccion.preguntas : [])
        .map((pregunta) => ({
          clave: pregunta.clave,
          pregunta: `${pregunta.numero}. ${pregunta.texto}`,
          respuesta: aTexto(pregunta, cuestionario[pregunta.clave]),
        }))
        .filter((fila) => fila.respuesta !== null),
    }))
    .filter((seccion) => seccion.respuestas.length > 0);
}
