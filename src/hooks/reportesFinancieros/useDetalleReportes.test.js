import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerEgresosRango, obtenerIngresosMes, obtenerIngresosRango } from "../../services/reportesFinancierosApi";
import { finDeMesISO, hoyISO, nombreMes } from "../../utils/reportesFinancieros/formatos";
import useDetalleReportes from "./useDetalleReportes";

vi.mock("../../services/reportesFinancierosApi", () => ({
  obtenerEgresosRango: vi.fn(),
  obtenerIngresosMes: vi.fn(),
  obtenerIngresosRango: vi.fn(),
}));

beforeEach(() => {
  obtenerEgresosRango.mockReset();
  obtenerIngresosMes.mockReset();
  obtenerIngresosRango.mockReset();
  window.alert = vi.fn();
  window.requestAnimationFrame = vi.fn((callback) => {
    callback();
    return 1;
  });
});

describe("useDetalleReportes — estado inicial", () => {
  it("inicia con el rango de hoy, sin detalle y filtro 'todos'", () => {
    const { result } = renderHook(() => useDetalleReportes());

    expect(result.current.fechaInicio).toBe(hoyISO());
    expect(result.current.fechaFin).toBe(hoyISO());
    expect(result.current.rangoActivo).toEqual({ inicio: hoyISO(), fin: hoyISO() });
    expect(result.current.filtroMedioIngreso).toBe("todos");
    expect(result.current.detalle).toBeNull();
    expect(result.current.loadingDetalle).toBe(false);
  });
});

describe("useDetalleReportes — cargarDetalle", () => {
  it("valida que inicio y fin estén presentes antes de consultar", async () => {
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "ingresos", inicio: "", fin: "2026-08-08" });
    });

    expect(window.alert).toHaveBeenCalledWith("Selecciona fecha de inicio y fin");
    expect(obtenerIngresosRango).not.toHaveBeenCalled();
  });

  it("valida que la fecha de inicio no sea mayor que la de fin", async () => {
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "ingresos", inicio: "2026-08-20", fin: "2026-08-01" });
    });

    expect(window.alert).toHaveBeenCalledWith("La fecha de inicio no puede ser mayor a la fecha de fin");
    expect(obtenerIngresosRango).not.toHaveBeenCalled();
  });

  it("consulta ingresos por rango y reinicia el filtro de medio de pago", async () => {
    const ingresos = [{ id: 1, monto: 100000 }];
    obtenerIngresosRango.mockResolvedValue(ingresos);
    const { result } = renderHook(() => useDetalleReportes());

    act(() => result.current.setFiltroMedioIngreso("tarjeta"));
    expect(result.current.filtroMedioIngreso).toBe("tarjeta");

    await act(async () => {
      await result.current.cargarDetalle({
        tipo: "ingresos",
        inicio: "2026-08-01",
        fin: "2026-08-08",
        titulo: "Rango",
      });
    });

    expect(obtenerIngresosRango).toHaveBeenCalledWith("2026-08-01", "2026-08-08");
    expect(result.current.detalle).toEqual(ingresos);
    expect(result.current.detalleTipo).toBe("ingresos");
    expect(result.current.detalleTitulo).toBe("Rango");
    expect(result.current.rangoActivo).toEqual({ inicio: "2026-08-01", fin: "2026-08-08" });
    expect(result.current.filtroMedioIngreso).toBe("todos");
  });

  it("consulta egresos por rango sin tocar el filtro de medio de pago", async () => {
    const egresos = [{ id: 9, monto: 30000 }];
    obtenerEgresosRango.mockResolvedValue(egresos);
    const { result } = renderHook(() => useDetalleReportes());

    act(() => result.current.setFiltroMedioIngreso("tarjeta"));

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "egresos", inicio: "2026-08-01", fin: "2026-08-08" });
    });

    expect(obtenerEgresosRango).toHaveBeenCalledWith("2026-08-01", "2026-08-08");
    expect(result.current.detalle).toEqual(egresos);
    expect(result.current.detalleTipo).toBe("egresos");
    expect(result.current.detalleTitulo).toBe("2026-08-01 a 2026-08-08");
    expect(result.current.filtroMedioIngreso).toBe("tarjeta");
  });

  it("ante un error conserva el detalle previo y avisa sin romper loadingDetalle", async () => {
    const error = new Error("sin conexión");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    obtenerIngresosRango.mockRejectedValue(error);
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "ingresos", inicio: "2026-08-01", fin: "2026-08-08" });
    });

    expect(result.current.detalle).toBeNull();
    expect(result.current.loadingDetalle).toBe(false);
    expect(window.alert).toHaveBeenCalledWith("Error al cargar el detalle seleccionado");
    expect(consoleError).toHaveBeenCalledWith("Error cargando detalle:", error);
  });
});

describe("useDetalleReportes — cargarDetalleMes", () => {
  it("consulta ingresos del mes con el endpoint dedicado y el título del mes", async () => {
    const ingresosMes = [{ id: 2, monto: 200000 }];
    obtenerIngresosMes.mockResolvedValue(ingresosMes);
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalleMes("ingresos", "2026-07");
    });

    expect(obtenerIngresosMes).toHaveBeenCalledWith("2026-07");
    expect(result.current.detalle).toEqual(ingresosMes);
    expect(result.current.detalleTipo).toBe("ingresos");
    expect(result.current.detalleTitulo).toBe(nombreMes("2026-07"));
    expect(result.current.rangoActivo).toEqual({ inicio: "2026-07-01", fin: finDeMesISO("2026-07") });
  });

  it("consulta egresos del mes delegando en el rango calculado del mes", async () => {
    const egresosMes = [{ id: 5, monto: 40000 }];
    obtenerEgresosRango.mockResolvedValue(egresosMes);
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalleMes("egresos", "2026-07");
    });

    expect(obtenerEgresosRango).toHaveBeenCalledWith("2026-07-01", finDeMesISO("2026-07"));
    expect(result.current.detalle).toEqual(egresosMes);
    expect(result.current.detalleTipo).toBe("egresos");
    expect(result.current.detalleTitulo).toBe(nombreMes("2026-07"));
  });
});

describe("useDetalleReportes — derivados de ingresos/egresos filtrados", () => {
  it("expone arreglos y totales vacíos sin detalle cargado", () => {
    const { result } = renderHook(() => useDetalleReportes());

    expect(result.current.detalleEgresos).toEqual([]);
    expect(result.current.detalleIngresosFiltrados).toEqual([]);
    expect(result.current.totalDetalleIngresos).toBe(0);
    expect(result.current.totalDetalleEgresos).toBe(0);
  });

  it("calcula detalleEgresos y su total tras cargar egresos por rango", async () => {
    obtenerEgresosRango.mockResolvedValue([{ id: 1, monto: 30000 }, { id: 2, monto: 20000 }]);
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "egresos", inicio: "2026-08-01", fin: "2026-08-08" });
    });

    expect(result.current.detalleEgresos).toHaveLength(2);
    expect(result.current.totalDetalleEgresos).toBe(50000);
    expect(result.current.detalleIngresosFiltrados).toEqual([]);
  });

  it("filtra los ingresos por medio de pago y recalcula el total mostrado", async () => {
    obtenerIngresosRango.mockResolvedValue([
      { id: 1, monto: 100000, monto_valido: 100000, tipo_pago: "Efectivo", anulado: false },
      { id: 2, monto: 50000, monto_valido: 50000, tipo_pago: "Tarjeta", anulado: false },
    ]);
    const { result } = renderHook(() => useDetalleReportes());

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "ingresos", inicio: "2026-08-01", fin: "2026-08-08" });
    });

    expect(result.current.detalleIngresosFiltrados).toHaveLength(2);
    expect(result.current.totalDetalleIngresos).toBe(150000);

    act(() => result.current.setFiltroMedioIngreso("tarjeta"));

    expect(result.current.detalleIngresosFiltrados).toHaveLength(1);
    expect(result.current.totalDetalleIngresos).toBe(50000);
  });
});

describe("useDetalleReportes — scroll automático", () => {
  it("programa un scroll con requestAnimationFrame cuando aparece un detalle nuevo", async () => {
    obtenerIngresosRango.mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => useDetalleReportes());

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.cargarDetalle({ tipo: "ingresos", inicio: "2026-08-01", fin: "2026-08-08" });
    });

    await waitFor(() => expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1));
  });
});
