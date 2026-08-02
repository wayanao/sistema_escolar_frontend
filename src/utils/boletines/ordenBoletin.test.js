import { describe, expect, it } from "vitest";

import {
  construirPayloadOrden,
  moverMateriaAPosicion,
  moverMateriaPorDelta,
  ordenarMateriasAlfabeticamente,
  ordenarPorBoletin,
} from "./ordenBoletin";

const materias = [
  { materia_id: 1, materia_nombre: "Matemáticas", orden_boletin: 2 },
  { materia_id: 2, materia_nombre: "Biología", orden_boletin: 1 },
  { materia_id: 3, materia_nombre: "Arte", orden_boletin: null },
];

describe("utilidades de orden del boletín", () => {
  it("ordena por posición, usa 100 como respaldo y desempata alfabéticamente", () => {
    const entrada = [
      ...materias,
      { materia_id: 4, materia_nombre: "Ciencias", orden_boletin: null },
    ];
    expect(ordenarPorBoletin(entrada).map((materia) => materia.materia_id)).toEqual([
      2,
      1,
      3,
      4,
    ]);
    expect(entrada.map((materia) => materia.materia_id)).toEqual([1, 2, 3, 4]);
  });

  it("mueve por delta o posición sin mutar y conserva límites inválidos", () => {
    const movidas = moverMateriaPorDelta(materias, 0, 1);
    expect(movidas.map((materia) => materia.materia_id)).toEqual([2, 1, 3]);
    expect(materias.map((materia) => materia.materia_id)).toEqual([1, 2, 3]);
    expect(moverMateriaPorDelta(materias, 0, -1)).toBe(materias);
    expect(moverMateriaAPosicion(materias, 2, "1").map((materia) => materia.materia_id)).toEqual([
      3,
      1,
      2,
    ]);
  });

  it("ordena alfabéticamente y construye el payload visible", () => {
    const ordenadas = ordenarMateriasAlfabeticamente(materias);
    expect(ordenadas.map((materia) => materia.materia_nombre)).toEqual([
      "Arte",
      "Biología",
      "Matemáticas",
    ]);
    expect(construirPayloadOrden(ordenadas)).toEqual({
      materias: [{ materia_id: 3 }, { materia_id: 2 }, { materia_id: 1 }],
    });
  });
});
