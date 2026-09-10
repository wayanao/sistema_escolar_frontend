import { describe, expect, it } from "vitest";
import {
  formatearMoneda,
  formatearNombreMes,
  formatearPeriodo,
  obtenerFechaLocal,
} from "./formatos";

describe("formatos de pagos", () => {
  it("obtiene la fecha local compensando el desfase horario", () => {
    const fecha = {
      getTime: () => Date.parse("2026-08-05T02:30:00.000Z"),
      getTimezoneOffset: () => 300,
    };

    expect(obtenerFechaLocal(fecha)).toBe("2026-08-04");
  });

  it("mantiene el formato monetario actual y convierte valores vacíos en cero", () => {
    expect(formatearMoneda("123456.5")).toBe(`$${Number("123456.5").toLocaleString()}`);
    expect(formatearMoneda(null)).toBe("$0");
  });

  it("formatea el mes límite y usa diciembre para contratos anteriores", () => {
    expect(formatearNombreMes(11)).toBe("noviembre");
    expect(formatearNombreMes(null)).toBe("diciembre");
    expect(formatearNombreMes(13)).toBe("diciembre");
  });

  it("formatea periodos en español usando el mes UTC", () => {
    expect(formatearPeriodo("2026-08")).toBe("Agosto de 2026");
    expect(formatearPeriodo("")).toBe("");
  });
});
