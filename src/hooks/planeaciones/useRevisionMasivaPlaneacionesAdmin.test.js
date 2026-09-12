import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { actualizarRevisionMock } = vi.hoisted(() => ({
  actualizarRevisionMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  actualizarRevisionPlaneacionAdmin: actualizarRevisionMock,
}));

import useRevisionMasivaPlaneacionesAdmin from "./useRevisionMasivaPlaneacionesAdmin";

function crearPlan(overrides = {}) {
  return {
    id: 1,
    estado_revision: "pendiente",
    version_revision: 3,
    fecha: "2026-09-10",
    profesor: "Juan Pérez",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  actualizarRevisionMock.mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRevisionMasivaPlaneacionesAdmin", () => {
  it("solo considera marcables los planes pendientes", () => {
    const planes = [
      crearPlan({ id: 1 }),
      crearPlan({ id: 2, estado_revision: "visto" }),
      crearPlan({ id: 3, estado_revision: "revisado" }),
      crearPlan({ id: 4, estado_revision: "con_observaciones" }),
    ];

    const { result } = renderHook(() =>
      useRevisionMasivaPlaneacionesAdmin({ planes, onMarcados: vi.fn() }),
    );

    expect(result.current.idsMarcables).toEqual(["1"]);
  });

  it("marca los seleccionados enviando la versión de cada plan y recarga", async () => {
    const planes = [
      crearPlan({ id: 7, version_revision: 2 }),
      crearPlan({ id: 8, version_revision: 5 }),
    ];
    const onMarcados = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useRevisionMasivaPlaneacionesAdmin({ planes, onMarcados }),
    );

    act(() => result.current.alternarTodos());
    expect(result.current.seleccionados).toEqual(["7", "8"]);

    await act(async () => {
      await result.current.marcarComoVistos();
    });

    expect(actualizarRevisionMock).toHaveBeenCalledTimes(2);
    expect(actualizarRevisionMock).toHaveBeenCalledWith(7, {
      estado: "visto",
      version: 2,
    });
    expect(actualizarRevisionMock).toHaveBeenCalledWith(8, {
      estado: "visto",
      version: 5,
    });
    expect(result.current.resumen).toEqual({ exitosos: 2, fallidos: 0 });
    expect(result.current.seleccionados).toEqual([]);
    expect(onMarcados).toHaveBeenCalledTimes(1);
  });

  it("conserva seleccionados los que fallaron para poder reintentarlos", async () => {
    const planes = [crearPlan({ id: 10 }), crearPlan({ id: 11 })];
    actualizarRevisionMock.mockImplementation((planId) =>
      planId === 11
        ? Promise.reject(new Error("version desactualizada"))
        : Promise.resolve({}),
    );

    const { result } = renderHook(() =>
      useRevisionMasivaPlaneacionesAdmin({ planes, onMarcados: vi.fn() }),
    );

    act(() => result.current.alternarTodos());
    await act(async () => {
      await result.current.marcarComoVistos();
    });

    expect(result.current.resumen).toEqual({ exitosos: 1, fallidos: 1 });
    expect(result.current.seleccionados).toEqual(["11"]);
  });

  it("no llama al servicio cuando no hay nada seleccionado", async () => {
    const { result } = renderHook(() =>
      useRevisionMasivaPlaneacionesAdmin({
        planes: [crearPlan()],
        onMarcados: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.marcarComoVistos();
    });

    expect(actualizarRevisionMock).not.toHaveBeenCalled();
  });

  it("descarta la selección cuando cambia la página de resultados", () => {
    const { result, rerender } = renderHook(
      ({ planes }) =>
        useRevisionMasivaPlaneacionesAdmin({ planes, onMarcados: vi.fn() }),
      { initialProps: { planes: [crearPlan({ id: 20 })] } },
    );

    act(() => result.current.alternar(20));
    expect(result.current.seleccionados).toEqual(["20"]);

    rerender({ planes: [crearPlan({ id: 31 })] });

    expect(result.current.seleccionados).toEqual([]);
  });
});
