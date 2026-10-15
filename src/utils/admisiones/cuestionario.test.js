import { describe, expect, it } from "vitest";
import {
  aplicarCambio,
  construirCuestionario,
  contarRespondidas,
  normalizarCuestionario,
  preguntaVisible,
  respuestasDesdeAdmision,
  validarCuestionario,
} from "./cuestionario";

// Una lista corta con la misma forma que manda `GET /admisiones/cuestionario`.
const SI_NO = [
  { valor: "si", etiqueta: "Sí" },
  { valor: "no", etiqueta: "No" },
];
const OTRO = { texto: "¿Cuál?", maximo: 250 };

const P = {
  como_lo_llaman: { numero: 1, clave: "como_lo_llaman", texto: "¿Cómo lo llaman en casa?", tipo: "texto", maximo: 150 },
  numero_hermanos: { numero: 2, clave: "numero_hermanos", texto: "Número de hermanos", tipo: "numero", minimo: 0, maximo: 20 },
  situaciones_familia: {
    numero: 5,
    clave: "situaciones_familia",
    texto: "En la familia, ¿hay algún caso de…?",
    tipo: "varias",
    opciones: [
      { valor: "alcoholismo", etiqueta: "Alcoholismo" },
      { valor: "violencia", etiqueta: "Violencia" },
      { valor: "ninguno", etiqueta: "Ninguno" },
      { valor: "otro", etiqueta: "Otro" },
    ],
    otro: OTRO,
    exclusiva: "ninguno",
  },
  tipo_vivienda: {
    numero: 7,
    clave: "tipo_vivienda",
    texto: "Tipo de vivienda",
    tipo: "una",
    opciones: [
      { valor: "casa", etiqueta: "Casa" },
      { valor: "apartamento", etiqueta: "Apartamento" },
      { valor: "otro", etiqueta: "Otro" },
    ],
    otro: OTRO,
  },
  usa_panal: { numero: 18, clave: "usa_panal", texto: "¿Usa pañal desechable?", tipo: "si_no", opciones: SI_NO },
  dificultad_motora: {
    numero: 19,
    clave: "dificultad_motora",
    texto: "¿Tiene alguna dificultad motora?",
    tipo: "si_no",
    opciones: SI_NO,
    detalle: { con: "si", texto: "¿Cuál?", maximo: 250 },
  },
  seguimiento_profesional: {
    numero: 25,
    clave: "seguimiento_profesional",
    texto: "¿Ha recibido seguimiento profesional?",
    tipo: "si_no",
    opciones: SI_NO,
  },
  profesionales: {
    numero: 26,
    clave: "profesionales",
    texto: "En caso afirmativo, indique cuál",
    tipo: "varias",
    opciones: [
      { valor: "psicologia", etiqueta: "Psicología" },
      { valor: "otro", etiqueta: "Otro" },
    ],
    otro: OTRO,
    depende_de: { pregunta: "seguimiento_profesional", respuesta: "si" },
  },
};

const SECCIONES_DE_PRUEBA = [
  {
    clave: "familia",
    titulo: "Familia",
    preguntas: [P.como_lo_llaman, P.numero_hermanos, P.situaciones_familia, P.tipo_vivienda],
  },
  {
    clave: "salud",
    titulo: "Salud",
    preguntas: [P.usa_panal, P.dificultad_motora, P.seguimiento_profesional, P.profesionales],
  },
];

describe("leer la lista y las respuestas guardadas", () => {
  it("la lista llega tal cual; algo que no es una lista queda vacía", () => {
    expect(normalizarCuestionario({ secciones: SECCIONES_DE_PRUEBA })).toEqual(SECCIONES_DE_PRUEBA);
    expect(normalizarCuestionario(null)).toEqual([]);
    expect(normalizarCuestionario({ secciones: "x" })).toEqual([]);
    expect(normalizarCuestionario({ secciones: [{ clave: "a", titulo: "A" }] })).toEqual([
      { clave: "a", titulo: "A", preguntas: [] },
    ]);
  });

  it("las respuestas de la admisión, con los números como texto para su cuadro", () => {
    const respuestas = respuestasDesdeAdmision({
      cuestionario: { numero_hermanos: 2, usa_panal: { respuesta: "no" } },
    });

    expect(respuestas).toEqual({ numero_hermanos: "2", usa_panal: { respuesta: "no" } });
  });

  it("sin admisión o sin bloque, ninguna respuesta", () => {
    expect(respuestasDesdeAdmision(null)).toEqual({});
    expect(respuestasDesdeAdmision({ cuestionario: null })).toEqual({});
    expect(respuestasDesdeAdmision({ cuestionario: [] })).toEqual({});
  });
});

describe("chulear y escribir", () => {
  it("Sí / No: chulear, cambiar y volver a tocar la marcada la desmarca", () => {
    let r = aplicarCambio({}, P.usa_panal, "elegir", "si");
    expect(r).toEqual({ usa_panal: { respuesta: "si" } });

    r = aplicarCambio(r, P.usa_panal, "elegir", "no");
    expect(r).toEqual({ usa_panal: { respuesta: "no" } });

    r = aplicarCambio(r, P.usa_panal, "elegir", "no");
    expect(r).toEqual({});
  });

  it("el detalle se escribe y se pierde al cambiar a la respuesta que no lo pide", () => {
    let r = aplicarCambio({}, P.dificultad_motora, "elegir", "si");
    r = aplicarCambio(r, P.dificultad_motora, "aparte", "Usa plantillas");
    expect(r).toEqual({ dificultad_motora: { respuesta: "si", detalle: "Usa plantillas" } });

    r = aplicarCambio(r, P.dificultad_motora, "elegir", "no");
    expect(r).toEqual({ dificultad_motora: { respuesta: "no" } });
  });

  it("una opción: elegir, cambiar, escribir en Otro y desmarcar", () => {
    let r = aplicarCambio({}, P.tipo_vivienda, "elegir", "otro");
    r = aplicarCambio(r, P.tipo_vivienda, "aparte", "Finca");
    expect(r).toEqual({ tipo_vivienda: { opcion: "otro", otro: "Finca" } });

    r = aplicarCambio(r, P.tipo_vivienda, "elegir", "casa");
    expect(r).toEqual({ tipo_vivienda: { opcion: "casa" } });

    r = aplicarCambio(r, P.tipo_vivienda, "elegir", "casa");
    expect(r).toEqual({});
  });

  it("varias: se marcan en el orden de las opciones y se desmarcan", () => {
    let r = aplicarCambio({}, P.situaciones_familia, "marcar", "violencia");
    r = aplicarCambio(r, P.situaciones_familia, "marcar", "alcoholismo");
    expect(r).toEqual({ situaciones_familia: { marcadas: ["alcoholismo", "violencia"] } });

    r = aplicarCambio(r, P.situaciones_familia, "marcar", "violencia");
    r = aplicarCambio(r, P.situaciones_familia, "marcar", "alcoholismo");
    expect(r).toEqual({});
  });

  it("Ninguno borra las demás, y marcar otra quita Ninguno", () => {
    let r = aplicarCambio({}, P.situaciones_familia, "marcar", "violencia");
    r = aplicarCambio(r, P.situaciones_familia, "marcar", "ninguno");
    expect(r).toEqual({ situaciones_familia: { marcadas: ["ninguno"] } });

    r = aplicarCambio(r, P.situaciones_familia, "marcar", "alcoholismo");
    expect(r).toEqual({ situaciones_familia: { marcadas: ["alcoholismo"] } });
  });

  it("desmarcar Otro borra lo escrito en Otro", () => {
    let r = aplicarCambio({}, P.situaciones_familia, "marcar", "otro");
    r = aplicarCambio(r, P.situaciones_familia, "aparte", "Ludopatía");
    r = aplicarCambio(r, P.situaciones_familia, "marcar", "violencia");
    expect(r.situaciones_familia).toEqual({ marcadas: ["violencia", "otro"], otro: "Ludopatía" });

    r = aplicarCambio(r, P.situaciones_familia, "marcar", "otro");
    expect(r).toEqual({ situaciones_familia: { marcadas: ["violencia"] } });
  });

  it("números y textos se guardan como se escriben; vacío es sin responder", () => {
    let r = aplicarCambio({}, P.numero_hermanos, "escribir", "3");
    r = aplicarCambio(r, P.como_lo_llaman, "escribir", " Juancho ");
    expect(r).toEqual({ numero_hermanos: "3", como_lo_llaman: " Juancho " });

    r = aplicarCambio(r, P.numero_hermanos, "escribir", "");
    expect(r).toEqual({ como_lo_llaman: " Juancho " });
  });

  it("no cambia el objeto anterior", () => {
    const antes = { usa_panal: { respuesta: "si" } };

    aplicarCambio(antes, P.usa_panal, "elegir", "no");

    expect(antes).toEqual({ usa_panal: { respuesta: "si" } });
  });
});

describe("qué se ve", () => {
  it("la 26 solo aparece si la 25 es Sí", () => {
    expect(preguntaVisible(P.profesionales, {})).toBe(false);
    expect(
      preguntaVisible(P.profesionales, { seguimiento_profesional: { respuesta: "no" } }),
    ).toBe(false);
    expect(
      preguntaVisible(P.profesionales, { seguimiento_profesional: { respuesta: "si" } }),
    ).toBe(true);
    expect(preguntaVisible(P.usa_panal, {})).toBe(true);
  });

  it("cuenta las respondidas de una sección entre las que se ven", () => {
    const seccion = SECCIONES_DE_PRUEBA[1];

    expect(contarRespondidas(seccion, {})).toEqual({ respondidas: 0, total: 3 });
    expect(
      contarRespondidas(seccion, {
        usa_panal: { respuesta: "no" },
        seguimiento_profesional: { respuesta: "si" },
        profesionales: { marcadas: ["psicologia"] },
      }),
    ).toEqual({ respondidas: 3, total: 4 });
  });
});

describe("lo que se envía", () => {
  it("recorta textos, convierte números y va en el orden de la lista", () => {
    const bloque = construirCuestionario(
      {
        usa_panal: { respuesta: "no" },
        numero_hermanos: " 2 ",
        como_lo_llaman: " Juancho ",
        tipo_vivienda: { opcion: "otro", otro: " Finca " },
        situaciones_familia: { marcadas: ["otro"], otro: "  " },
      },
      SECCIONES_DE_PRUEBA,
    );

    expect(bloque).toEqual({
      como_lo_llaman: "Juancho",
      numero_hermanos: 2,
      situaciones_familia: { marcadas: ["otro"] },
      tipo_vivienda: { opcion: "otro", otro: "Finca" },
      usa_panal: { respuesta: "no" },
    });
    expect(Object.keys(bloque)).toEqual([
      "como_lo_llaman",
      "numero_hermanos",
      "situaciones_familia",
      "tipo_vivienda",
      "usa_panal",
    ]);
  });

  it("un texto en blanco no se envía", () => {
    expect(construirCuestionario({ como_lo_llaman: "   " }, SECCIONES_DE_PRUEBA)).toEqual({});
  });

  it("la 26 no se envía si la 25 no es Sí", () => {
    const respuestas = {
      seguimiento_profesional: { respuesta: "no" },
      profesionales: { marcadas: ["psicologia"] },
    };

    expect(construirCuestionario(respuestas, SECCIONES_DE_PRUEBA)).toEqual({
      seguimiento_profesional: { respuesta: "no" },
    });
  });

  it("no envía un detalle ni un Otro que ya no corresponden", () => {
    const respuestas = {
      dificultad_motora: { respuesta: "no", detalle: "viejo" },
      tipo_vivienda: { opcion: "casa", otro: "viejo" },
    };

    expect(construirCuestionario(respuestas, SECCIONES_DE_PRUEBA)).toEqual({
      dificultad_motora: { respuesta: "no" },
      tipo_vivienda: { opcion: "casa" },
    });
  });

  it("no envía respuestas de preguntas que no están en la lista", () => {
    expect(construirCuestionario({ inventada: "x" }, SECCIONES_DE_PRUEBA)).toEqual({});
  });
});

describe("revisión antes de enviar", () => {
  it("un número que no es entero o está fuera de su rango", () => {
    for (const valor of ["2.5", "-1", "21", "dos"]) {
      expect(validarCuestionario({ numero_hermanos: valor }, SECCIONES_DE_PRUEBA)).toEqual({
        numero_hermanos: "Pregunta 2: escribe un número entero entre 0 y 20.",
      });
    }
  });

  it("lo demás, y lo que no se ve, no se revisa aquí", () => {
    expect(validarCuestionario({ numero_hermanos: "20" }, SECCIONES_DE_PRUEBA)).toEqual({});
    expect(validarCuestionario({}, SECCIONES_DE_PRUEBA)).toEqual({});
  });
});
