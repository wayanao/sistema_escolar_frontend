import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarPlanillaMock } = vi.hoisted(() => ({
  listarPlanillaMock: vi.fn(),
}));

vi.mock("../../services/estudiantesObservadorApi", () => ({
  listarPlanillaObservador: listarPlanillaMock,
}));

import usePlanillaObservador from "./usePlanillaObservador";

function crearPendiente() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePlanillaObservador", () => {
  it("carga la planilla y conserva la búsqueda explícita por nombre completo", async () => {
    listarPlanillaMock.mockResolvedValue([
      { estudiante_id: 11, nombre: "Ana", apellido: "Rojas" },
      { estudiante_id: 12, nombre: "Luis", apellido: "Pardo" },
    ]);
    const { result } = renderHook(() => usePlanillaObservador("44"));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.filtrados).toHaveLength(2);

    act(() => result.current.setBusqueda("luis par"));
    act(() => expect(result.current.buscarEstudiantes()).toBe(true));

    expect(result.current.filtrados).toEqual([
      { estudiante_id: 12, nombre: "Luis", apellido: "Pardo" },
    ]);
  });

  it("indica que la búsqueda no puede ejecutarse sin estudiantes", () => {
    const { result } = renderHook(() => usePlanillaObservador(null));

    expect(result.current.buscarEstudiantes()).toBe(false);
    expect(listarPlanillaMock).not.toHaveBeenCalled();
  });

  it("descarta una planilla anterior si cambia la asignación", async () => {
    const primera = crearPendiente();
    const segunda = crearPendiente();
    listarPlanillaMock
      .mockImplementationOnce(() => primera.promise)
      .mockImplementationOnce(() => segunda.promise);
    const { result, rerender } = renderHook(
      ({ asignacionId }) => usePlanillaObservador(asignacionId),
      { initialProps: { asignacionId: "44" } },
    );

    rerender({ asignacionId: "45" });

    await act(async () => {
      segunda.resolve([{ estudiante_id: 20, nombre: "Sara", apellido: "Díaz" }]);
      await segunda.promise;
    });
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      primera.resolve([{ estudiante_id: 11, nombre: "Ana", apellido: "Rojas" }]);
      await primera.promise;
    });

    expect(result.current.estudiantes).toEqual([
      { estudiante_id: 20, nombre: "Sara", apellido: "Díaz" },
    ]);
  });

  it("expone el error original de la consulta", async () => {
    const error = new Error("Planilla no disponible");
    listarPlanillaMock.mockRejectedValue(error);
    const { result } = renderHook(() => usePlanillaObservador("44"));

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.estudiantes).toEqual([]);
  });
});
