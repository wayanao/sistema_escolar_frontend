import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarHistorialMock } = vi.hoisted(() => ({
  listarHistorialMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  listarHistorialPlanesProfesor: listarHistorialMock,
}));

import useHistorialPlaneacionesProfesor from "./useHistorialPlaneacionesProfesor";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useHistorialPlaneacionesProfesor", () => {
  it("carga tres planes y conserva un cuarto como indicador de continuación", async () => {
    listarHistorialMock.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]);

    const { result } = renderHook(() =>
      useHistorialPlaneacionesProfesor("44"),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(listarHistorialMock).toHaveBeenCalledWith("44", {
      limit: 4,
      offset: 0,
    });
    expect(result.current.historial.map((plan) => plan.id)).toEqual([1, 2, 3]);
    expect(result.current.hayMas).toBe(true);
    expect(result.current.pagina).toBe(0);
  });

  it("pagina con el mismo contrato y permite actualizar un plan cargado", async () => {
    listarHistorialMock
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 7, observaciones_no_vistas: 2 }]);

    const { result } = renderHook(() =>
      useHistorialPlaneacionesProfesor("44"),
    );
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      await result.current.cargarHistorial(1);
    });
    act(() => {
      result.current.actualizarPlanHistorial(7, {
        observaciones_no_vistas: 0,
      });
    });

    expect(listarHistorialMock).toHaveBeenLastCalledWith("44", {
      limit: 4,
      offset: 3,
    });
    expect(result.current.pagina).toBe(1);
    expect(result.current.historial[0].observaciones_no_vistas).toBe(0);
  });

  it("limpia el historial al retirar la asignación", async () => {
    listarHistorialMock.mockResolvedValue([{ id: 1 }]);

    const { result, rerender } = renderHook(
      ({ asignacionId }) =>
        useHistorialPlaneacionesProfesor(asignacionId),
      { initialProps: { asignacionId: "44" } },
    );
    await waitFor(() => expect(result.current.historial).toHaveLength(1));

    rerender({ asignacionId: "" });

    expect(result.current.historial).toEqual([]);
    expect(result.current.pagina).toBe(0);
    expect(result.current.hayMas).toBe(false);
    expect(result.current.cargando).toBe(false);
  });
});
