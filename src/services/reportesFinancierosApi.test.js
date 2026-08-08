import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import {
  obtenerEgresosRango,
  obtenerIngresosMes,
  obtenerIngresosRango,
  obtenerReporteGeneral,
} from "./reportesFinancierosApi";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("reportesFinancierosApi", () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it("consulta el reporte general sin parámetros y devuelve sus datos", async () => {
    const reporte = { estadisticas_generales: { total_ingresos: 500000 } };
    api.get.mockResolvedValue({ data: reporte });

    await expect(obtenerReporteGeneral()).resolves.toBe(reporte);
    expect(api.get).toHaveBeenCalledWith("/reportes/general");
  });

  it("consulta ingresos por rango con inicio y fin como params", async () => {
    const ingresos = [{ id: 1, monto: 100000 }];
    api.get.mockResolvedValue({ data: ingresos });

    await expect(obtenerIngresosRango("2026-08-01", "2026-08-08")).resolves.toBe(ingresos);
    expect(api.get).toHaveBeenCalledWith("/reportes/ingresos-rango", {
      params: { inicio: "2026-08-01", fin: "2026-08-08" },
    });
  });

  it("consulta egresos por rango con inicio y fin como params", async () => {
    const egresos = [{ id: 9, monto: 30000 }];
    api.get.mockResolvedValue({ data: egresos });

    await expect(obtenerEgresosRango("2026-08-01", "2026-08-08")).resolves.toBe(egresos);
    expect(api.get).toHaveBeenCalledWith("/reportes/egresos-rango", {
      params: { inicio: "2026-08-01", fin: "2026-08-08" },
    });
  });

  it("consulta ingresos de un mes completo interpolando el mes en la ruta", async () => {
    const ingresosMes = [{ id: 2, monto: 200000 }];
    api.get.mockResolvedValue({ data: ingresosMes });

    await expect(obtenerIngresosMes("2026-07")).resolves.toBe(ingresosMes);
    expect(api.get).toHaveBeenCalledWith("/reportes/ingresos-mes/2026-07");
  });

  it("propaga sin reinterpretar los errores del transporte", async () => {
    const error = new Error("Sin conexión");
    api.get.mockRejectedValue(error);

    await expect(obtenerReporteGeneral()).rejects.toBe(error);
  });
});
