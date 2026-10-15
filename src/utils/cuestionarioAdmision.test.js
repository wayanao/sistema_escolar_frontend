import { describe, expect, it } from "vitest";
import { entrevistaParaImprimir, respuestasLegibles } from "./cuestionarioAdmision";

const SI_NO = [
  { valor: "si", etiqueta: "Sí" },
  { valor: "no", etiqueta: "No" },
];

const CATALOGO = {
  secciones: [
    {
      clave: "familia",
      titulo: "Familia",
      preguntas: [
        { numero: 1, clave: "como_lo_llaman", texto: "¿Cómo lo llaman en casa?", tipo: "texto" },
        { numero: 2, clave: "numero_hermanos", texto: "Número de hermanos", tipo: "numero" },
        {
          numero: 9,
          clave: "con_quien_queda",
          texto: "¿Con quién queda el niño(a) cuando los padres trabajan?",
          tipo: "varias",
          opciones: [
            { valor: "empleada", etiqueta: "Empleada" },
            { valor: "hermanos", etiqueta: "Hermanos" },
            { valor: "otro", etiqueta: "Otro" },
          ],
        },
      ],
    },
    {
      clave: "salud",
      titulo: "Salud",
      preguntas: [
        { numero: 18, clave: "usa_panal", texto: "¿Usa pañal desechable?", tipo: "si_no", opciones: SI_NO },
        {
          numero: 19,
          clave: "dificultad_motora",
          texto: "¿Tiene alguna dificultad motora?",
          tipo: "si_no",
          opciones: SI_NO,
        },
        {
          numero: 22,
          clave: "lateralidad",
          texto: "¿Qué lado predomina más?",
          tipo: "una",
          opciones: [
            { valor: "izquierdo", etiqueta: "Izquierdo" },
            { valor: "otro", etiqueta: "Otro" },
          ],
        },
      ],
    },
    { clave: "escolar", titulo: "Escolar", preguntas: [] },
  ],
};

describe("respuestasLegibles", () => {
  it("solo las respondidas, por sección y en el orden de la lista", () => {
    const legibles = respuestasLegibles(CATALOGO, {
      usa_panal: { respuesta: "no" },
      numero_hermanos: 2,
      como_lo_llaman: "Juancho",
    });

    expect(legibles).toEqual([
      {
        clave: "familia",
        titulo: "Familia",
        respuestas: [
          { clave: "como_lo_llaman", pregunta: "1. ¿Cómo lo llaman en casa?", respuesta: "Juancho" },
          { clave: "numero_hermanos", pregunta: "2. Número de hermanos", respuesta: "2" },
        ],
      },
      {
        clave: "salud",
        titulo: "Salud",
        respuestas: [
          { clave: "usa_panal", pregunta: "18. ¿Usa pañal desechable?", respuesta: "No" },
        ],
      },
    ]);
  });

  it("el detalle y lo de Otro van después de una raya", () => {
    const legibles = respuestasLegibles(CATALOGO, {
      dificultad_motora: { respuesta: "si", detalle: "Usa plantillas" },
      lateralidad: { opcion: "otro", otro: "Cambia según la tarea" },
      con_quien_queda: { marcadas: ["empleada", "hermanos", "otro"], otro: "La vecina" },
    });
    const texto = (clave) =>
      legibles.flatMap((s) => s.respuestas).find((r) => r.clave === clave).respuesta;

    expect(texto("dificultad_motora")).toBe("Sí — Usa plantillas");
    expect(texto("lateralidad")).toBe("Otro — Cambia según la tarea");
    expect(texto("con_quien_queda")).toBe("Empleada, Hermanos, Otro — La vecina");
  });

  it("una opción que la lista ya no tiene se muestra tal cual se guardó", () => {
    const legibles = respuestasLegibles(CATALOGO, { lateralidad: { opcion: "derecho" } });

    expect(legibles[0].respuestas[0].respuesta).toBe("derecho");
  });

  it("sin respuestas, o sin lista, no hay nada que mostrar", () => {
    expect(respuestasLegibles(CATALOGO, {})).toEqual([]);
    expect(respuestasLegibles(CATALOGO, null)).toEqual([]);
    expect(respuestasLegibles(null, { usa_panal: { respuesta: "no" } })).toEqual([]);
    expect(respuestasLegibles({ secciones: "x" }, { usa_panal: { respuesta: "no" } })).toEqual([]);
  });

  it("una respuesta de una pregunta que no está en la lista no se muestra", () => {
    expect(respuestasLegibles(CATALOGO, { inventada: "x" })).toEqual([]);
  });

  it("una respuesta vacía no cuenta", () => {
    expect(
      respuestasLegibles(CATALOGO, {
        como_lo_llaman: "",
        con_quien_queda: { marcadas: [] },
        usa_panal: {},
      }),
    ).toEqual([]);
  });
});

describe("entrevistaParaImprimir (paso E12)", () => {
  const CATALOGO_IMPRESO = {
    secciones: [
      {
        clave: "familia",
        titulo: "Familia",
        preguntas: [
          { numero: 1, clave: "como_lo_llaman", texto: "¿Cómo lo llaman en casa?", tipo: "texto" },
          { numero: 6, clave: "solucion_conflictos", texto: "¿Cómo solucionan sus conflictos?", tipo: "texto_largo" },
          {
            numero: 9,
            clave: "con_quien_queda",
            texto: "¿Con quién queda?",
            tipo: "varias",
            opciones: [
              { valor: "hermanos", etiqueta: "Hermanos" },
              { valor: "otro", etiqueta: "Otro" },
            ],
            otro: { texto: "¿Quién?", maximo: 250 },
          },
        ],
      },
      {
        clave: "salud",
        titulo: "Salud",
        preguntas: [
          {
            numero: 19,
            clave: "dificultad_motora",
            texto: "¿Tiene alguna dificultad motora?",
            tipo: "si_no",
            opciones: SI_NO,
            detalle: { con: "si", texto: "¿Cuál?", maximo: 250 },
          },
          { numero: 25, clave: "seguimiento_profesional", texto: "¿Seguimiento profesional?", tipo: "si_no", opciones: SI_NO },
          {
            numero: 26,
            clave: "profesionales",
            texto: "En caso afirmativo, indique cuál",
            tipo: "varias",
            opciones: [{ valor: "psicologia", etiqueta: "Psicología" }],
            depende_de: { pregunta: "seguimiento_profesional", respuesta: "si" },
          },
        ],
      },
    ],
  };

  const pregunta = (impreso, clave) =>
    impreso.flatMap((s) => s.preguntas).find((p) => p.clave === clave);

  it("salen todas las secciones y todas las preguntas, aunque no haya respuestas", () => {
    const impreso = entrevistaParaImprimir(CATALOGO_IMPRESO, {});

    expect(impreso.map((s) => s.titulo)).toEqual(["Familia", "Salud"]);
    expect(impreso.flatMap((s) => s.preguntas).map((p) => p.texto)).toEqual([
      "1. ¿Cómo lo llaman en casa?",
      "6. ¿Cómo solucionan sus conflictos?",
      "9. ¿Con quién queda?",
      "19. ¿Tiene alguna dificultad motora?",
      "25. ¿Seguimiento profesional?",
      "26. En caso afirmativo, indique cuál",
    ]);
  });

  it("sin respuesta: casillas sin marcar y renglón para escribir", () => {
    const impreso = entrevistaParaImprimir(CATALOGO_IMPRESO, {});

    expect(pregunta(impreso, "dificultad_motora")).toMatchObject({
      opciones: [
        { etiqueta: "Sí", marcada: false },
        { etiqueta: "No", marcada: false },
      ],
      aparte: { texto: "¿Cuál?", valor: "" },
    });
    expect(pregunta(impreso, "con_quien_queda").aparte).toEqual({ texto: "¿Quién?", valor: "" });
    expect(pregunta(impreso, "como_lo_llaman")).toMatchObject({ valor: "", largo: false });
    expect(pregunta(impreso, "solucion_conflictos")).toMatchObject({ valor: "", largo: true });
  });

  it("con respuesta: la casilla marcada y lo escrito", () => {
    const impreso = entrevistaParaImprimir(CATALOGO_IMPRESO, {
      como_lo_llaman: "Juancho",
      dificultad_motora: { respuesta: "si", detalle: "Usa plantillas" },
      con_quien_queda: { marcadas: ["hermanos", "otro"], otro: "La vecina" },
    });

    expect(pregunta(impreso, "como_lo_llaman").valor).toBe("Juancho");
    expect(pregunta(impreso, "dificultad_motora")).toMatchObject({
      opciones: [
        { etiqueta: "Sí", marcada: true },
        { etiqueta: "No", marcada: false },
      ],
      aparte: { texto: "¿Cuál?", valor: "Usa plantillas" },
    });
    expect(pregunta(impreso, "con_quien_queda")).toMatchObject({
      opciones: [
        { etiqueta: "Hermanos", marcada: true },
        { etiqueta: "Otro", marcada: true },
      ],
      aparte: { texto: "¿Quién?", valor: "La vecina" },
    });
  });

  it("si la respuesta no pide el detalle o el Otro, ese renglón no sale", () => {
    const impreso = entrevistaParaImprimir(CATALOGO_IMPRESO, {
      dificultad_motora: { respuesta: "no" },
      con_quien_queda: { marcadas: ["hermanos"] },
    });

    expect(pregunta(impreso, "dificultad_motora").aparte).toBeNull();
    expect(pregunta(impreso, "con_quien_queda").aparte).toBeNull();
  });

  it("la 26 lleva su nota y no marca nada si la 25 no es Sí", () => {
    const impreso = entrevistaParaImprimir(CATALOGO_IMPRESO, {
      seguimiento_profesional: { respuesta: "no" },
      profesionales: { marcadas: ["psicologia"] },
    });

    expect(pregunta(impreso, "profesionales")).toMatchObject({
      nota: "Solo si la pregunta 25 es «Sí».",
      opciones: [{ etiqueta: "Psicología", marcada: false }],
    });
    expect(pregunta(impreso, "como_lo_llaman").nota).toBeUndefined();
  });

  it("sin lista no hay preguntas que imprimir", () => {
    expect(entrevistaParaImprimir(null, {})).toEqual([]);
    expect(entrevistaParaImprimir({ secciones: [] }, null)).toEqual([]);
  });
});
