// Leer las respuestas del anexo de la entrevista de admisión (paso E11b): de
// lo guardado a frases cortas, por sección, para mostrarlas de solo lectura.
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
