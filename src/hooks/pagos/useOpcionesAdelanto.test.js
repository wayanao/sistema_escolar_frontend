import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pagosApi from "../../services/pagosApi";
import useOpcionesAdelanto from "./useOpcionesAdelanto";

vi.mock("../../services/pagosApi", () => ({
  default: {
    obtenerOpcionesAdelanto: vi.fn(),
  },
}));

describe("useOpcionesAdelanto", () => {
  beforeEach(() => {
    pagosApi.obtenerOpcionesAdelanto.mockReset();
  });

  it("consulta y normaliza las opciones del estudiante", async () => {
    pagosApi.obtenerOpcionesAdelanto.mockResolvedValue({
      opciones: [
        {
          tipo_pago_id: 11,
          valor_unitario: "100000",
          mes_final: 11,
          periodos_disponibles: [{ periodo: "2026-08" }],
        },
      ],
    });
    const { result } = renderHook(() => useOpcionesAdelanto());

    await act(async () => {
      await result.current.cargarOpcionesAdelanto(7);
    });

    await waitFor(() => expect(result.current.loadingOpcionesAdelanto).toBe(false));
    expect(result.current.opcionesAdelanto).toEqual([
      {
        tipo_pago_id: 11,
        valor_unitario: "100000",
        mes_final: 11,
        periodos_disponibles: [
          { periodo: "2026-08", saldo: 100000, estado: "disponible" },
        ],
        total_disponible: 100000,
      },
    ]);
    expect(pagosApi.obtenerOpcionesAdelanto).toHaveBeenCalledWith(7);
  });

  it("conserva el detalle de error y permite reiniciar la consulta", async () => {
    const error = { response: { data: { detail: "Sin meses disponibles" } } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    pagosApi.obtenerOpcionesAdelanto.mockRejectedValue(error);
    const { result } = renderHook(() => useOpcionesAdelanto());

    await act(async () => {
      await result.current.cargarOpcionesAdelanto(7);
    });
    await waitFor(() => {
      expect(result.current.errorOpcionesAdelanto).toBe("Sin meses disponibles");
    });
    expect(result.current.opcionesAdelanto).toEqual([]);

    act(() => result.current.limpiarOpcionesAdelanto());
    expect(result.current.errorOpcionesAdelanto).toBe("Sin meses disponibles");

    act(() => result.current.reiniciarOpcionesAdelanto());
    expect(result.current.errorOpcionesAdelanto).toBe("");
    expect(result.current.opcionesAdelanto).toEqual([]);
    consoleError.mockRestore();
  });

  it("no consulta sin estudiante", async () => {
    const { result } = renderHook(() => useOpcionesAdelanto());

    await act(async () => {
      await result.current.cargarOpcionesAdelanto();
    });

    expect(pagosApi.obtenerOpcionesAdelanto).not.toHaveBeenCalled();
    expect(result.current.loadingOpcionesAdelanto).toBe(false);
  });

  it("consulta los adelantos del año del pago", async () => {
    pagosApi.obtenerOpcionesAdelanto.mockResolvedValue({ opciones: [] });
    const parametrosAnio = { anio_lectivo_id: 2 };
    const { result } = renderHook(() => useOpcionesAdelanto({ parametrosAnio }));

    await act(async () => {
      await result.current.cargarOpcionesAdelanto(7);
    });

    expect(pagosApi.obtenerOpcionesAdelanto).toHaveBeenCalledWith(7, {
      parametrosAnio,
    });
  });

  it("ignora opciones tardías del año anterior", async () => {
    let resolverAnioAnterior;
    pagosApi.obtenerOpcionesAdelanto.mockImplementation((_id, opciones) => {
      if (opciones?.parametrosAnio?.anio_lectivo_id === 2) {
        return Promise.resolve({
          opciones: [{ tipo_pago_id: 22, periodos_disponibles: [] }],
        });
      }
      return new Promise((resolve) => {
        resolverAnioAnterior = resolve;
      });
    });

    const { result, rerender } = renderHook(
      ({ parametrosAnio }) => useOpcionesAdelanto({ parametrosAnio }),
      { initialProps: { parametrosAnio: {} } },
    );
    act(() => {
      void result.current.cargarOpcionesAdelanto(7);
    });

    const parametros2027 = { anio_lectivo_id: 2 };
    rerender({ parametrosAnio: parametros2027 });
    await act(async () => {
      await result.current.cargarOpcionesAdelanto(7);
    });
    expect(result.current.opcionesAdelanto[0]?.tipo_pago_id).toBe(22);

    await act(async () => {
      resolverAnioAnterior({
        opciones: [{ tipo_pago_id: 11, periodos_disponibles: [] }],
      });
    });
    expect(result.current.opcionesAdelanto[0]?.tipo_pago_id).toBe(22);
  });
});
