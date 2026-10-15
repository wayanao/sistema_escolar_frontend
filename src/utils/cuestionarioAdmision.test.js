import { describe, expect, it } from "vitest";
import { respuestasLegibles } from "./cuestionarioAdmision";

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
