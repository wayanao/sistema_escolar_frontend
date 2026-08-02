import { describe, expect, it } from "vitest";

import {
  calcularPromedioGeneral,
  consolidarMateriasBoletin,
  documentoEstudiante,
  filtrarEstudiantes,
  formatearValoracionPeriodo,
  obtenerDesempeno,
  usaDesarrolloInfantil,
} from "./generacionBoletin";

describe("utilidades de generación de boletines", () => {
  it("normaliza los alias de documento y conserva el fallback", () => {
    expect(documentoEstudiante({ identificacion: " TI-7 " })).toBe("TI-7");
    expect(documentoEstudiante({ cedula: "CC-8" })).toBe("CC-8");
    expect(documentoEstudiante({})).toBe("N/A");
  });

  it("filtra conjuntamente por curso y texto de nombre o documento", () => {
    const estudiantes = [
      { id: 1, nombre: "Ana", apellido: "López", documento: "100", curso_id: 3 },
      { id: 2, nombre: "Bruno", apellido: "Díaz", cedula: "200", curso_id: 4 },
    ];

    expect(filtrarEstudiantes(estudiantes, "3", "100")).toEqual([estudiantes[0]]);
    expect(filtrarEstudiantes(estudiantes, "", "díaz")).toEqual([estudiantes[1]]);
  });

  it("calcula el promedio solo con definitivas no nulas y conserva sus umbrales", () => {
    expect(calcularPromedioGeneral([{ definitiva: 4.6 }, { definitiva: null }, { definitiva: 3.4 }])).toBe("4.0");
    expect(calcularPromedioGeneral([{ definitiva: null }])).toBe(0);
    expect(obtenerDesempeno(null)).toBe("PENDIENTE");
    expect(obtenerDesempeno(4.6)).toBe("SUPERIOR");
    expect(obtenerDesempeno(4)).toBe("ALTO");
    expect(obtenerDesempeno(3)).toBe("BÁSICO");
    expect(obtenerDesempeno(2.9)).toBe("BAJO");
  });

  it("formatea valoraciones de desarrollo y notas numéricas por periodo", () => {
    expect(
      formatearValoracionPeriodo({ valoraciones_por_periodo: { 1: "destacado" } }, "1"),
    ).toBe("⭐");
    expect(
      formatearValoracionPeriodo({ valoraciones_por_periodo: { 1: "personalizada" } }, "1"),
    ).toBe("personalizada");
    expect(formatearValoracionPeriodo({ notas_por_periodo: { 2: 3.45 } }, "2")).toBe("3.5");
  });

  it("detecta desarrollo y consolida detalles repetidos por materia", () => {
    const materias = [
      {
        materia_id: 9,
        materia: "Lenguaje",
        detalles: [{ observacion: "Uno", tipo_evaluacion: "desarrollo" }],
      },
      { materia_id: 9, materia: "Lenguaje", detalles: [{ observacion: "Dos" }] },
    ];

    expect(usaDesarrolloInfantil(materias)).toBe(true);
    expect(consolidarMateriasBoletin(materias)).toEqual([
      {
        materia_id: 9,
        materia: "Lenguaje",
        detalles: [
          { observacion: "Uno", tipo_evaluacion: "desarrollo" },
          { observacion: "Dos" },
        ],
      },
    ]);
    expect(consolidarMateriasBoletin(null)).toEqual([]);
  });
});
