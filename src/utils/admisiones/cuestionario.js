// Contrato puro de las preguntas del anexo de la entrevista (paso E11): leer
// la lista y las respuestas guardadas, qué pasa al chulear o escribir, qué se
// ve y qué se envía. Sin HTTP, sin React, sin DOM.
//
// La lista la manda el backend (`GET /admisiones/cuestionario`) y el backend
// revisa cada respuesta: lo de aquí solo evita mandar lo que rechazaría seguro.
// Contrato en sistema_escolar_api/docs/API_ENDPOINTS.md, "Preguntas del anexo
// (paso E10)".
//
// Mientras se edita, cada respuesta tiene la forma que se envía, salvo los
// números, que se guardan como el texto de su cuadro ("2") y se convierten al
// enviar.

import { primeraMayuscula } from "../nombres";

const esObjeto = (valor) => valor !== null && typeof valor === "object" && !Array.isArray(valor);

const valoresDe = (pregunta) => (pregunta.opciones ?? []).map((opcion) => opcion.valor);

// `GET /admisiones/cuestionario` → la lista de secciones. Ante algo raro,
// ninguna: la pantalla sigue sin el anexo.
export function normalizarCuestionario(respuesta) {
  if (!Array.isArray(respuesta?.secciones)) return [];
  return respuesta.secciones.map((seccion) => ({
    ...seccion,
    preguntas: Array.isArray(seccion?.preguntas) ? seccion.preguntas : [],
  }));
}

// Las respuestas guardadas de una admisión, listas para los cuadros.
export function respuestasDesdeAdmision(admision) {
  const bloque = admision?.cuestionario;
  if (!esObjeto(bloque)) return {};
  return Object.fromEntries(
    Object.entries(bloque).map(([clave, valor]) => [
      clave,
      typeof valor === "number" ? String(valor) : valor,
    ]),
  );
}

const sin = (respuestas, clave) => {
  const siguientes = { ...respuestas };
  delete siguientes[clave];
  return siguientes;
};

function elegir(respuestas, pregunta, valor) {
  const { clave } = pregunta;
  const actual = respuestas[clave];
  if (pregunta.tipo === "si_no") {
    // Volver a tocar la marcada la desmarca; cambiar de respuesta borra el
    // detalle, que era de la otra.
    if (actual?.respuesta === valor) return sin(respuestas, clave);
    return { ...respuestas, [clave]: { respuesta: valor } };
  }
  if (actual?.opcion === valor) return sin(respuestas, clave);
  return { ...respuestas, [clave]: { opcion: valor } };
}

function marcar(respuestas, pregunta, valor) {
  const { clave, exclusiva } = pregunta;
  const actual = respuestas[clave] ?? {};
  const marcadas = actual.marcadas ?? [];
  let siguientes;
  if (marcadas.includes(valor)) siguientes = marcadas.filter((v) => v !== valor);
  // "Ninguno" borra las demás; marcar otra quita "Ninguno".
  else if (valor === exclusiva) siguientes = [valor];
  else siguientes = [...marcadas.filter((v) => v !== exclusiva), valor];

  if (siguientes.length === 0) return sin(respuestas, clave);
  const ordenadas = valoresDe(pregunta).filter((v) => siguientes.includes(v));
  const respuesta = { marcadas: ordenadas };
  if (ordenadas.includes("otro") && actual.otro !== undefined) respuesta.otro = actual.otro;
  return { ...respuestas, [clave]: respuesta };
}

function escribirAparte(respuestas, pregunta, texto) {
  const { clave } = pregunta;
  const campo = pregunta.tipo === "si_no" ? "detalle" : "otro";
  return { ...respuestas, [clave]: { ...respuestas[clave], [campo]: texto } };
}

function escribir(respuestas, pregunta, texto) {
  if (texto === "") return sin(respuestas, pregunta.clave);
  return { ...respuestas, [pregunta.clave]: texto };
}

const ACCIONES = { elegir, marcar, aparte: escribirAparte, escribir };

// Lo que pasa al chulear o escribir. `accion`: "elegir" (Sí / No y una
// opción), "marcar" (varias), "aparte" (el detalle o lo de "Otro") o
// "escribir" (número y texto). Devuelve un objeto nuevo.
export function aplicarCambio(respuestas, pregunta, accion, valor) {
  return ACCIONES[accion](respuestas, pregunta, valor);
}

// La 26 solo se ve si la 25 es "Sí" (`depende_de`).
export function preguntaVisible(pregunta, respuestas) {
  const condicion = pregunta.depende_de;
  if (!condicion) return true;
  return respuestas[condicion.pregunta]?.respuesta === condicion.respuesta;
}

const tieneRespuesta = (valor) => {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  if (Array.isArray(valor.marcadas)) return valor.marcadas.length > 0;
  return Boolean(valor.respuesta ?? valor.opcion);
};

// Para el título de cada sección: "2 de 5".
export function contarRespondidas(seccion, respuestas) {
  const visibles = seccion.preguntas.filter((pregunta) => preguntaVisible(pregunta, respuestas));
  return {
    respondidas: visibles.filter((pregunta) => tieneRespuesta(respuestas[pregunta.clave])).length,
    total: visibles.length,
  };
}

const textoLimpio = (valor) => (typeof valor === "string" ? valor.trim() : "");

// Lo escrito (un detalle, un "Otro", una respuesta de texto) va con la primera
// letra en mayúscula. Pedido del usuario el 2026-11-05.
const textoEscrito = (valor) => (typeof valor === "string" ? primeraMayuscula(valor) : "");

function paraEnviar(pregunta, valor) {
  switch (pregunta.tipo) {
    case "si_no": {
      if (!valor?.respuesta) return undefined;
      const limpia = { respuesta: valor.respuesta };
      const detalle = textoEscrito(valor.detalle);
      if (detalle && pregunta.detalle?.con === valor.respuesta) limpia.detalle = detalle;
      return limpia;
    }
    case "una": {
      if (!valor?.opcion) return undefined;
      const limpia = { opcion: valor.opcion };
      const otro = textoEscrito(valor.otro);
      if (otro && pregunta.otro && valor.opcion === "otro") limpia.otro = otro;
      return limpia;
    }
    case "varias": {
      if (!valor?.marcadas?.length) return undefined;
      const limpia = { marcadas: valor.marcadas };
      const otro = textoEscrito(valor.otro);
      if (otro && pregunta.otro && valor.marcadas.includes("otro")) limpia.otro = otro;
      return limpia;
    }
    case "numero": {
      const texto = textoLimpio(String(valor ?? ""));
      return texto === "" ? undefined : Number(texto);
    }
    default: {
      const texto = textoEscrito(valor);
      return texto === "" ? undefined : texto;
    }
  }
}

const preguntasDe = (secciones) => secciones.flatMap((seccion) => seccion.preguntas);

// `cuestionario` del `PUT /admisiones/{id}`: el bloque entero, en el orden de
// la lista, sin lo que no se ve, sin lo vacío y sin un detalle o un "Otro"
// que ya no corresponden.
export function construirCuestionario(respuestas, secciones) {
  const bloque = {};
  for (const pregunta of preguntasDe(secciones)) {
    if (!preguntaVisible(pregunta, respuestas)) continue;
    const valor = paraEnviar(pregunta, respuestas[pregunta.clave]);
    if (valor !== undefined) bloque[pregunta.clave] = valor;
  }
  return bloque;
}

// Lo único que se revisa aquí son los números (un cuadro de número deja
// escribir "2.5" o "-1"); lo demás lo limitan los propios cuadros.
export function validarCuestionario(respuestas, secciones) {
  const errores = {};
  for (const pregunta of preguntasDe(secciones)) {
    if (pregunta.tipo !== "numero" || !preguntaVisible(pregunta, respuestas)) continue;
    const texto = textoLimpio(String(respuestas[pregunta.clave] ?? ""));
    if (texto === "") continue;
    const numero = Number(texto);
    if (!Number.isInteger(numero) || numero < pregunta.minimo || numero > pregunta.maximo) {
      errores[pregunta.clave] =
        `Pregunta ${pregunta.numero}: escribe un número entero entre ${pregunta.minimo} y ${pregunta.maximo}.`;
    }
  }
  return errores;
}
