import { afterEach, describe, expect, it, vi } from "vitest";
import { finDeMesISO, formatoMoneda, hoyISO, nombreMes } from "./formatos";

// Normaliza el NBSP que Intl inserta entre el símbolo de moneda y el número,
// igual que hace el normalizador por defecto de Testing Library con el DOM.
const sinEspaciosRaros = (texto) => texto.replace(/\s+/g, " ");

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("formatoMoneda", () => {
  it("formatea un valor positivo como pesos colombianos sin decimales", () => {
    expect(sinEspaciosRaros(formatoMoneda(1234567))).toBe("$ 1.234.567");
  });

  it("trata undefined, null y '' como cero", () => {
    expect(sinEspaciosRaros(formatoMoneda(undefined))).toBe("$ 0");
    expect(sinEspaciosRaros(formatoMoneda(null))).toBe("$ 0");
    expect(sinEspaciosRaros(formatoMoneda(""))).toBe("$ 0");
  });

  it("conserva el signo de un valor negativo", () => {
    expect(sinEspaciosRaros(formatoMoneda(-5000))).toBe("-$ 5.000");
  });
});

describe("finDeMesISO", () => {
  it("calcula el último día de un mes de 31 días", () => {
    expect(finDeMesISO("2026-08")).toBe("2026-08-31");
  });

  it("calcula el último día de un mes de 30 días", () => {
    expect(finDeMesISO("2026-04")).toBe("2026-04-30");
  });

  it("calcula el 28 de febrero en un año no bisiesto", () => {
    expect(finDeMesISO("2026-02")).toBe("2026-02-28");
  });

  it("calcula el 29 de febrero en un año bisiesto", () => {
    expect(finDeMesISO("2024-02")).toBe("2024-02-29");
  });
});

describe("hoyISO", () => {
  it("devuelve la fecha del instante actual en formato ISO (YYYY-MM-DD, en UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));

    expect(hoyISO()).toBe("2026-08-08");
  });

  it("riesgo caracterizado: toma la fecha en UTC, no la fecha local, y puede adelantarse un día", () => {
    // El backend ya asume America/Bogota (ver reportes_controller.py) y es la
    // zona horaria real de despliegue. hoyISO() no compensa el desfase antes
    // de llamar a toISOString(), a diferencia de PAGOS
    // (docs/modularizacion/PAGOS.md: "la fecha inicial ... compensa el
    // desfase horario antes de convertir a ISO"). Con la hora local de
    // Bogotá (UTC-5) a las 11:30 p.m. del 8 de agosto, el instante UTC ya es
    // 9 de agosto: hoyISO() devuelve "2026-08-09" aunque para el usuario
    // local todavía es "hoy" 8 de agosto. Esto es comportamiento vigente,
    // no se corrige en esta migración.
    vi.stubEnv("TZ", "America/Bogota");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T23:30:00-05:00"));

    expect(hoyISO()).toBe("2026-08-09");
  });
});

describe("nombreMes", () => {
  it("con reloj en UTC, devuelve el nombre del mes solicitado", () => {
    vi.stubEnv("TZ", "UTC");
    expect(nombreMes("2026-08")).toBe("agosto de 2026");
  });

  it("riesgo caracterizado: en America/Bogota (zona real de despliegue) muestra el mes anterior", () => {
    // nombreMes() construye `new Date("2026-08-01")`, que Date interpreta
    // como medianoche UTC. Al formatear en America/Bogota (UTC-5) esa
    // medianoche UTC todavía es 31 de julio a las 7:00 p.m., por lo que el
    // mes mostrado retrocede uno. Es un defecto real y preexistente del
    // encabezado "Movimiento mensual"; se documenta y protege tal cual está,
    // sin corregirlo en esta migración (ver documento del módulo).
    vi.stubEnv("TZ", "America/Bogota");
    expect(nombreMes("2026-08")).toBe("julio de 2026");
  });

  it("capitaliza el resultado con la clase visual 'capitalize' de la página, no aquí", () => {
    // La función devuelve el nombre en minúscula ("julio de 2026" /
    // "agosto de 2026"); la página aplica la clase Tailwind `capitalize`
    // para mostrarlo con mayúscula inicial. No se debe capitalizar dentro
    // de esta utilidad pura porque cambiaría el contrato consumido por la
    // página.
    vi.stubEnv("TZ", "UTC");
    expect(nombreMes("2026-01")).toBe("enero de 2026");
  });
});
