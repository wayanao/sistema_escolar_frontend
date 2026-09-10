import { describe, expect, it } from "vitest";
import {
  agruparAnotacionesPorDimension,
  DIMENSIONES_OBSERVADOR,
  etiquetaNivelObservador,
  formatearFechaAnotacion,
  formatearPeriodoAnotacion,
  OPCIONES_PERIODO_OBSERVADOR,
  PERIODO_TODOS,
  periodoParaConsulta,
  SIN_FECHA,
  titularObservador,
} from "./anotaciones";

function anotacion(extra = {}) {
  return {
    id: 1,
    profesor_id: 7,
    profesor: "Ana Gómez",
    periodo: 1,
    conductual: "",
    cognitivo: "",
    lenguaje: "",
    creada_en: "2026-03-20T15:30:00+00:00",
    editada_en: null,
    editada_por: null,
    ...extra,
  };
}

describe("selector de periodo", () => {
  it("ofrece «Todos» de primero y los cuatro periodos", () => {
    expect(OPCIONES_PERIODO_OBSERVADOR).toStrictEqual([
      { value: PERIODO_TODOS, label: "Todos" },
      { value: "1", label: "Periodo 1" },
      { value: "2", label: "Periodo 2" },
      { value: "3", label: "Periodo 3" },
      { value: "4", label: "Periodo 4" },
    ]);
  });

  it("convierte a número solo los cuatro periodos reales", () => {
    expect(periodoParaConsulta("1")).toBe(1);
    expect(periodoParaConsulta(4)).toBe(4);
  });

  it.each([PERIODO_TODOS, "", null, undefined, "hola", 0, 5, -1])(
    "pide el año entero ante %s",
    (valor) => {
      // Nunca puede quedarse sin bitácora por una etiqueta rota: el servidor
      // rechaza con 422 lo que se salga de 1-4.
      expect(periodoParaConsulta(valor)).toBeNull();
    },
  );

  it("nombra el periodo de una anotación en corto", () => {
    expect(formatearPeriodoAnotacion(3)).toBe("P3");
    expect(formatearPeriodoAnotacion(null)).toBe("");
  });
});

describe("agrupación por dimensión", () => {
  it("conserva las tres dimensiones de siempre y su orden", () => {
    expect(DIMENSIONES_OBSERVADOR.map((dimension) => dimension.campo))
      .toStrictEqual(["conductual", "cognitivo", "lenguaje"]);
  });

  it("pone la misma anotación bajo cada dimensión que tenga texto", () => {
    const doble = anotacion({
      id: 9,
      conductual: "Se para mucho.",
      cognitivo: "Mejoró en las tablas.",
    });

    const grupos = agruparAnotacionesPorDimension([doble]);

    expect(grupos.map((grupo) => grupo.campo)).toStrictEqual([
      "conductual",
      "cognitivo",
    ]);
    expect(grupos[0].entradas[0].texto).toBe("Se para mucho.");
    expect(grupos[1].entradas[0].texto).toBe("Mejoró en las tablas.");
  });

  it("omite los bloques sin nada, para no pintar títulos huecos", () => {
    const grupos = agruparAnotacionesPorDimension([
      anotacion({ conductual: "Hace desorden." }),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].titulo).toBe("Conductual");
  });

  it("descarta el texto que solo trae espacios", () => {
    expect(agruparAnotacionesPorDimension([anotacion({ lenguaje: "   " })]))
      .toStrictEqual([]);
  });

  it("conserva el orden en que llegan, que es de la más nueva a la más vieja", () => {
    const grupos = agruparAnotacionesPorDimension([
      anotacion({ id: 2, conductual: "La nueva." }),
      anotacion({ id: 1, conductual: "La vieja." }),
    ]);

    expect(grupos[0].entradas.map((entrada) => entrada.anotacion.id))
      .toStrictEqual([2, 1]);
  });

  it("aguanta una lista vacía o ausente", () => {
    expect(agruparAnotacionesPorDimension([])).toStrictEqual([]);
    expect(agruparAnotacionesPorDimension(null)).toStrictEqual([]);
  });
});

describe("fecha de la anotación", () => {
  it("la escribe corta, en día y mes", () => {
    // Mediodía UTC a propósito: así el día no cambia según la zona horaria en
    // la que corran las pruebas.
    expect(formatearFechaAnotacion("2026-03-20T12:00:00Z")).toBe("20/mar");
    expect(formatearFechaAnotacion("2026-01-05T12:00:00Z")).toBe("5/ene");
  });

  it("dice «Sin fecha» en las heredadas, que no la tienen", () => {
    expect(formatearFechaAnotacion(null)).toBe(SIN_FECHA);
    expect(formatearFechaAnotacion("")).toBe(SIN_FECHA);
  });

  it("no revienta con una fecha ilegible", () => {
    expect(formatearFechaAnotacion("no es una fecha")).toBe(SIN_FECHA);
  });
});

describe("título de la bitácora", () => {
  it("pone el nivel del curso tras el nombre", () => {
    expect(titularObservador({
      nombre: "Pepito",
      apellido: "Pérez",
      nivel: "primaria",
    })).toBe("Pepito Pérez · Primaria");

    expect(titularObservador({
      nombre: "Juanito",
      apellido: "",
      nivel: "preescolar",
    })).toBe("Juanito · Preescolar");
  });

  it("no pone nada tras el nombre cuando el curso no tiene nivel", () => {
    // Tercer caso real, no teórico: al decidirlo había 20 cursos sin nivel en
    // un solo colegio.
    expect(titularObservador({ nombre: "Sofía", apellido: "Ruiz", nivel: null }))
      .toBe("Sofía Ruiz");
    expect(etiquetaNivelObservador(null)).toBe("");
    expect(etiquetaNivelObservador("bachillerato")).toBe("");
  });

  it("aguanta que no llegue el estudiante todavía", () => {
    expect(titularObservador()).toBe("");
    expect(titularObservador({ nivel: "primaria" })).toBe("Primaria");
  });
});
