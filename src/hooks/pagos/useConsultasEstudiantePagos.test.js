import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pagosApi from "../../services/pagosApi";
import useConsultasEstudiantePagos from "./useConsultasEstudiantePagos";

vi.mock("../../services/pagosApi", () => ({
  default: {
    obtenerHistorialPagos: vi.fn(),
    obtenerDeudasEstudiante: vi.fn(),
    obtenerVentasPendientes: vi.fn(),
    obtenerOpcionesVencidas: vi.fn(),
    obtenerValoresPersonalizados: vi.fn(),
  },
}));

const estudiante = { id: 7, nombre: "Ana" };

describe("useConsultasEstudiantePagos", () => {
  beforeEach(() => {
    pagosApi.obtenerHistorialPagos.mockReset();
    pagosApi.obtenerDeudasEstudiante.mockReset();
    pagosApi.obtenerVentasPendientes.mockReset();
    pagosApi.obtenerOpcionesVencidas.mockReset();
    pagosApi.obtenerValoresPersonalizados.mockReset();
  });

  it("selecciona el estudiante y carga sus cinco consultas", async () => {
    const historial = [{ pago_id: 1 }];
    const deudas = [{ concepto_id: 11 }];
    const ventas = [{ id: 20 }];
    const opciones = [{ tipo_pago_id: 11, cuotas: [] }];
    const valores = [{ id: 30 }];
    pagosApi.obtenerHistorialPagos.mockResolvedValue(historial);
    pagosApi.obtenerDeudasEstudiante.mockResolvedValue({ deudas });
    pagosApi.obtenerVentasPendientes.mockResolvedValue(ventas);
    pagosApi.obtenerOpcionesVencidas.mockResolvedValue({ opciones });
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue(valores);

    const { result } = renderHook(() => useConsultasEstudiantePagos());

    act(() => result.current.seleccionarEstudiante(estudiante));

    expect(result.current.selectedEstudiante).toBe(estudiante);
    await waitFor(() => expect(result.current.loadingOpcionesVencidas).toBe(false));
    expect(result.current.pagos).toBe(historial);
    expect(result.current.deudasEstudiante).toBe(deudas);
    expect(result.current.ventasPendientes).toBe(ventas);
    expect(result.current.opcionesVencidas).toBe(opciones);
    expect(result.current.valoresPersonalizados).toBe(valores);
    expect(pagosApi.obtenerHistorialPagos).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerDeudasEstudiante).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerVentasPendientes).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerValoresPersonalizados).toHaveBeenCalledWith(7);
  });

  it("expone el detalle vigente cuando falla la consulta de cuotas", async () => {
    const error = { response: { data: { detail: "Cuotas no disponibles" } } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    pagosApi.obtenerHistorialPagos.mockResolvedValue([]);
    pagosApi.obtenerDeudasEstudiante.mockResolvedValue({ deudas: [] });
    pagosApi.obtenerVentasPendientes.mockResolvedValue([]);
    pagosApi.obtenerOpcionesVencidas.mockRejectedValue(error);
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([]);

    const { result } = renderHook(() => useConsultasEstudiantePagos());
    act(() => result.current.seleccionarEstudiante(estudiante));

    await waitFor(() => {
      expect(result.current.errorOpcionesVencidas).toBe("Cuotas no disponibles");
    });
    expect(result.current.opcionesVencidas).toEqual([]);
    expect(result.current.loadingOpcionesVencidas).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("Error cargando cuotas vencidas:", error);
    consoleError.mockRestore();
  });

  it("permite actualizar la lista consultada después de un comando", () => {
    const { result } = renderHook(() => useConsultasEstudiantePagos());

    act(() => {
      result.current.actualizarValoresPersonalizados([{ id: 1 }, { id: 2 }]);
      result.current.actualizarValoresPersonalizados((actuales) =>
        actuales.filter((item) => item.id !== 1)
      );
    });

    expect(result.current.valoresPersonalizados).toEqual([{ id: 2 }]);
  });
});
