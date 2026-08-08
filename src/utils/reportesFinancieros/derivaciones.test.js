import { describe, expect, it } from "vitest";
import { construirMesesFinancieros } from "./derivaciones";

describe("construirMesesFinancieros", () => {
  it("combina ingresos y egresos del mismo mes y calcula balance y máximo", () => {
    const resultado = construirMesesFinancieros(
      [{ mes: "2026-08", total: 4000000 }],
      [{ mes: "2026-08", total: 900000 }]
    );

    expect(resultado).toEqual([
      { mes: "2026-08", ingreso: 4000000, egreso: 900000, balance: 3100000, maximo: 4000000 },
    ]);
  });

  it("incluye un mes que solo tiene ingresos, con egreso en cero", () => {
    const resultado = construirMesesFinancieros([{ mes: "2026-07", total: 500000 }], []);

    expect(resultado).toEqual([
      { mes: "2026-07", ingreso: 500000, egreso: 0, balance: 500000, maximo: 500000 },
    ]);
  });

  it("incluye un mes que solo tiene egresos, con ingreso en cero", () => {
    const resultado = construirMesesFinancieros([], [{ mes: "2026-07", total: 200000 }]);

    expect(resultado).toEqual([
      { mes: "2026-07", ingreso: 0, egreso: 200000, balance: -200000, maximo: 200000 },
    ]);
  });

  it("ordena los meses del más reciente al más antiguo", () => {
    const resultado = construirMesesFinancieros(
      [
        { mes: "2026-06", total: 100000 },
        { mes: "2026-08", total: 300000 },
        { mes: "2026-07", total: 200000 },
      ],
      []
    );

    expect(resultado.map((item) => item.mes)).toEqual(["2026-08", "2026-07", "2026-06"]);
  });

  it("usa 1 como máximo cuando un mes no tiene ingresos ni egresos", () => {
    const resultado = construirMesesFinancieros([{ mes: "2026-08", total: 0 }], []);

    expect(resultado[0].maximo).toBe(1);
  });

  it("devuelve un arreglo vacío cuando no hay movimientos", () => {
    expect(construirMesesFinancieros([], [])).toEqual([]);
  });
});
