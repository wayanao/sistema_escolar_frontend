import { describe, expect, it } from "vitest";
import { fechaIsoColombia } from "./fechaColombia";

describe("fechaIsoColombia", () => {
  it("a las 11 p. m. del 30 de septiembre sigue siendo 30, aunque en UTC ya sea 1", () => {
    expect(fechaIsoColombia(new Date("2026-10-01T04:00:00Z"))).toBe("2026-09-30");
  });

  it("cambia de dia a la medianoche de Colombia", () => {
    expect(fechaIsoColombia(new Date("2026-10-01T05:00:00Z"))).toBe("2026-10-01");
  });

  it("el 31 de diciembre en la noche todavia no es el año siguiente", () => {
    expect(fechaIsoColombia(new Date("2027-01-01T04:30:00Z"))).toBe("2026-12-31");
  });

  it("de dia coincide con la fecha UTC", () => {
    expect(fechaIsoColombia(new Date("2026-08-07T15:20:00Z"))).toBe("2026-08-07");
  });

  it("sin argumento usa la hora actual y devuelve AAAA-MM-DD", () => {
    expect(fechaIsoColombia()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
