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

  it("avisa mientras consulta lo que debe y cuando la consulta falla", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let resolverDeudas;
    pagosApi.obtenerDeudasEstudiante.mockImplementation(
      () => new Promise((resolve) => { resolverDeudas = resolve; })
    );
    const { result } = renderHook(() => useConsultasEstudiantePagos());

    act(() => {
      void result.current.cargarDeudasEstudiante(7);
    });
    expect(result.current.cargandoDeudas).toBe(true);
    expect(result.current.errorDeudas).toBe("");

    await act(async () => {
      resolverDeudas({ deudas: [{ concepto: "Pensión", deuda: 100000 }] });
    });
    expect(result.current.cargandoDeudas).toBe(false);
    expect(result.current.deudasEstudiante).toEqual([{ concepto: "Pensión", deuda: 100000 }]);

    pagosApi.obtenerDeudasEstudiante.mockRejectedValue(new Error("sin red"));
    await act(async () => {
      await result.current.cargarDeudasEstudiante(7);
    });
    expect(result.current.cargandoDeudas).toBe(false);
    expect(result.current.deudasEstudiante).toEqual([]);
    expect(result.current.errorDeudas).toBe("No se pudo consultar lo que debe el estudiante.");
    consoleError.mockRestore();
  });

  it("limpia los cargos del estudiante anterior y avisa si no se pudieron consultar", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    pagosApi.obtenerHistorialPagos.mockResolvedValue([]);
    pagosApi.obtenerDeudasEstudiante.mockResolvedValue({ deudas: [] });
    pagosApi.obtenerOpcionesVencidas.mockResolvedValue({ opciones: [] });
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([]);
    pagosApi.obtenerVentasPendientes.mockResolvedValueOnce([{ id: 20, total: 90000 }]);
    const { result } = renderHook(() => useConsultasEstudiantePagos());

    act(() => result.current.seleccionarEstudiante(estudiante));
    await waitFor(() => expect(result.current.ventasPendientes).toHaveLength(1));

    pagosApi.obtenerVentasPendientes.mockRejectedValueOnce(new Error("sin red"));
    act(() => result.current.seleccionarEstudiante({ id: 8, nombre: "Luis" }));

    expect(result.current.ventasPendientes).toEqual([]);
    await waitFor(() => {
      expect(result.current.errorVentas).toBe("No se pudieron consultar los cargos de inventario.");
    });
    expect(result.current.cargandoVentas).toBe(false);
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

  it("consulta el año del pago y conserva aparte la deuda anterior", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    const deudaAnterior = [{
      anio_lectivo_id: 1,
      anio: 2026,
      total_deuda: 400000,
      deudas: [{ concepto: "Pensión", deuda: 400000 }],
    }];
    pagosApi.obtenerHistorialPagos.mockResolvedValue([]);
    pagosApi.obtenerDeudasEstudiante.mockResolvedValue({
      deudas: [{ concepto: "Matrícula", deuda: 300000 }],
      deuda_anios_anteriores: deudaAnterior,
    });
    pagosApi.obtenerVentasPendientes.mockResolvedValue([]);
    pagosApi.obtenerOpcionesVencidas.mockResolvedValue({ opciones: [] });
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useConsultasEstudiantePagos({ parametrosAnio })
    );
    act(() => result.current.seleccionarEstudiante(estudiante));

    await waitFor(() => expect(result.current.loadingOpcionesVencidas).toBe(false));
    expect(result.current.deudaAniosAnteriores).toBe(deudaAnterior);
    expect(pagosApi.obtenerDeudasEstudiante).toHaveBeenCalledWith(7, {
      parametrosAnio,
    });
    expect(pagosApi.obtenerOpcionesVencidas).toHaveBeenCalledWith(7, {
      parametrosAnio,
    });
    expect(pagosApi.obtenerValoresPersonalizados).toHaveBeenCalledWith(7, {
      parametrosAnio,
    });
    expect(pagosApi.obtenerHistorialPagos).toHaveBeenCalledWith(7);
    expect(pagosApi.obtenerVentasPendientes).toHaveBeenCalledWith(7);
  });

  it("descarta una respuesta tardía del año que ya dejó de estar seleccionado", async () => {
    let resolverAnioAnterior;
    pagosApi.obtenerDeudasEstudiante.mockImplementation((_id, opciones) => {
      if (opciones?.parametrosAnio?.anio_lectivo_id === 2) {
        return Promise.resolve({ deudas: [{ concepto: "Matrícula 2027" }] });
      }
      return new Promise((resolve) => {
        resolverAnioAnterior = resolve;
      });
    });
    pagosApi.obtenerOpcionesVencidas.mockResolvedValue({ opciones: [] });
    pagosApi.obtenerValoresPersonalizados.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ parametrosAnio }) => useConsultasEstudiantePagos({ parametrosAnio }),
      { initialProps: { parametrosAnio: {} } },
    );
    act(() => {
      void result.current.cargarDeudasEstudiante(7);
    });

    const parametros2027 = { anio_lectivo_id: 2 };
    rerender({ parametrosAnio: parametros2027 });
    await act(async () => {
      await result.current.cargarDeudasEstudiante(7);
    });
    expect(result.current.deudasEstudiante).toEqual([
      { concepto: "Matrícula 2027" },
    ]);

    await act(async () => {
      resolverAnioAnterior({ deudas: [{ concepto: "Pensión 2026" }] });
    });
    expect(result.current.deudasEstudiante).toEqual([
      { concepto: "Matrícula 2027" },
    ]);
  });
});
