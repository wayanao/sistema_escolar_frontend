import { describe, expect, it } from "vitest";
import {
  calcularTotalPeriodos,
  crearAplicacionesCuotas,
  crearPeriodosAdelantoPorCantidad,
  distribuirMontoEnPeriodos,
} from "./calculos";

describe("cálculos de pagos", () => {
  it("distribuye en centavos, conserva el orden y reporta el excedente", () => {
    const periodos = [
      { periodo: "2026-08", saldo: 100.005, etiqueta: "Agosto" },
      { periodo: "2026-09", saldo: "50.25", etiqueta: "Septiembre" },
    ];

    expect(distribuirMontoEnPeriodos(periodos, 175.5)).toEqual({
      distribucion: [
        {
          periodo: "2026-08",
          saldo: 100.005,
          etiqueta: "Agosto",
          monto_aplicado: 100.01,
          saldo_restante: 0,
        },
        {
          periodo: "2026-09",
          saldo: "50.25",
          etiqueta: "Septiembre",
          monto_aplicado: 50.25,
          saldo_restante: 0,
        },
      ],
      sinDistribuir: 25.24,
    });
    expect(periodos).toEqual([
      { periodo: "2026-08", saldo: 100.005, etiqueta: "Agosto" },
      { periodo: "2026-09", saldo: "50.25", etiqueta: "Septiembre" },
    ]);
  });

  it("ignora saldos no positivos y limita montos negativos a cero", () => {
    expect(distribuirMontoEnPeriodos([{ saldo: -10 }, { saldo: 0 }], -20)).toEqual({
      distribucion: [],
      sinDistribuir: 0,
    });
  });

  it("crea aplicaciones en el orden de las cuotas y suma sus saldos", () => {
    const resultado = crearAplicacionesCuotas(
      {
        tipo_pago_id: "11",
        cuotas: [
          { periodo: "2026-06", saldo: "100000" },
          { periodo: "2026-07", saldo: 75000 },
        ],
      },
      ["2026-07", "2026-06"]
    );

    expect(resultado).toEqual({
      aplicaciones: [
        { tipo_pago_id: 11, periodo: "2026-06", monto: 100000 },
        { tipo_pago_id: 11, periodo: "2026-07", monto: 75000 },
      ],
      total: 175000,
    });
  });

  it("calcula y proyecta solo la cantidad solicitada de periodos", () => {
    const periodos = [
      { periodo: "2026-08", saldo: "100000" },
      { periodo: "2026-09", saldo: 80000 },
      { periodo: "2026-10", saldo: 90000 },
    ];

    expect(calcularTotalPeriodos(periodos, "2")).toBe(180000);
    expect(crearPeriodosAdelantoPorCantidad(periodos, "2")).toEqual([
      {
        periodo: "2026-08",
        saldo: "100000",
        monto_aplicado: 100000,
        saldo_restante: 0,
      },
      {
        periodo: "2026-09",
        saldo: 80000,
        monto_aplicado: 80000,
        saldo_restante: 0,
      },
    ]);
  });
});
