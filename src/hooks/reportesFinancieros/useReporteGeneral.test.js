import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerReporteGeneral } from "../../services/reportesFinancierosApi";
import useReporteGeneral from "./useReporteGeneral";

vi.mock("../../services/reportesFinancierosApi", () => ({
  obtenerReporteGeneral: vi.fn(),
}));

describe("useReporteGeneral", () => {
  beforeEach(() => {
    obtenerReporteGeneral.mockReset();
    window.alert = vi.fn();
  });

  it("carga el reporte general al montarse", async () => {
    const reporte = { estadisticas_generales: { total_ingresos: 500000 } };
    obtenerReporteGeneral.mockResolvedValue(reporte);

    const { result } = renderHook(() => useReporteGeneral());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reporteGeneral).toBe(reporte);
    expect(obtenerReporteGeneral).toHaveBeenCalledTimes(1);
  });

  it("conserva el mismo mensaje de error y deja loading en false ante un fallo", async () => {
    const error = new Error("sin conexión");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    obtenerReporteGeneral.mockRejectedValue(error);

    const { result } = renderHook(() => useReporteGeneral());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reporteGeneral).toBeNull();
    expect(window.alert).toHaveBeenCalledWith("Error al cargar datos del reporte");
    expect(consoleError).toHaveBeenCalledWith("Error cargando datos:", error);
  });

  it("cargarDatosIniciales permite recargar manualmente (botón Actualizar)", async () => {
    obtenerReporteGeneral.mockResolvedValue({ estadisticas_generales: {} });

    const { result } = renderHook(() => useReporteGeneral());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.cargarDatosIniciales();

    expect(obtenerReporteGeneral).toHaveBeenCalledTimes(2);
  });

  it("recarga el reporte cuando la pestaña vuelve a estar visible", async () => {
    obtenerReporteGeneral.mockResolvedValue({ estadisticas_generales: {} });

    renderHook(() => useReporteGeneral());
    await waitFor(() => expect(obtenerReporteGeneral).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => expect(obtenerReporteGeneral).toHaveBeenCalledTimes(2));
  });

  it("no recarga si la pestaña se oculta", async () => {
    obtenerReporteGeneral.mockResolvedValue({ estadisticas_generales: {} });

    renderHook(() => useReporteGeneral());
    await waitFor(() => expect(obtenerReporteGeneral).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(obtenerReporteGeneral).toHaveBeenCalledTimes(1);
  });

  it("expone stats, estudiantesPorCurso y mesesFinancieros vacíos antes de cargar", () => {
    obtenerReporteGeneral.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useReporteGeneral());

    expect(result.current.stats).toEqual({});
    expect(result.current.estudiantesPorCurso).toEqual([]);
    expect(result.current.mesesFinancieros).toEqual([]);
  });

  it("deriva stats, estudiantesPorCurso y mesesFinancieros del reporte cargado", async () => {
    obtenerReporteGeneral.mockResolvedValue({
      estadisticas_generales: { total_ingresos: 500000 },
      estudiantes_por_curso: [{ curso: "5A", cantidad: 30 }],
      ingresos_mensuales: [{ mes: "2026-08", total: 4000000 }],
      egresos_mensuales: [{ mes: "2026-08", total: 900000 }],
    });

    const { result } = renderHook(() => useReporteGeneral());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({ total_ingresos: 500000 });
    expect(result.current.estudiantesPorCurso).toEqual([{ curso: "5A", cantidad: 30 }]);
    expect(result.current.mesesFinancieros).toEqual([
      { mes: "2026-08", ingreso: 4000000, egreso: 900000, balance: 3100000, maximo: 4000000 },
    ]);
  });
});
