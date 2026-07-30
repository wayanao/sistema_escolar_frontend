import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerPlanMock } = vi.hoisted(() => ({
  obtenerPlanMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  obtenerPlanProfesor: obtenerPlanMock,
}));

import useCargaPlanDiarioProfesor from "./useCargaPlanDiarioProfesor";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCargaPlanDiarioProfesor", () => {
  it("consulta automáticamente la fecha y entrega el plan cargado", async () => {
    const onInicio = vi.fn();
    const onCargado = vi.fn();
    const onError = vi.fn();
    obtenerPlanMock.mockResolvedValue({ id: 91 });

    const { result } = renderHook(() =>
      useCargaPlanDiarioProfesor({
        asignacionId: 44,
        fecha: "2026-07-28",
        onInicio,
        onCargado,
        onError,
      }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(obtenerPlanMock).toHaveBeenCalledWith(44, "2026-07-28");
    expect(onInicio).toHaveBeenCalledTimes(1);
    expect(onCargado).toHaveBeenCalledWith({ id: 91 });
    expect(onError).not.toHaveBeenCalled();
  });

  it("entrega el error original sin dejar la carga activa", async () => {
    const requestError = { response: { status: 503 } };
    const onInicio = vi.fn();
    const onCargado = vi.fn();
    const onError = vi.fn();
    obtenerPlanMock.mockRejectedValue(requestError);

    const { result } = renderHook(() =>
      useCargaPlanDiarioProfesor({
        asignacionId: 44,
        fecha: "2026-07-28",
        onInicio,
        onCargado,
        onError,
      }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(onError).toHaveBeenCalledWith(requestError);
    expect(onCargado).not.toHaveBeenCalled();
  });

  it("ignora la respuesta anterior cuando cambia la asignación", async () => {
    let resolverPrimera;
    obtenerPlanMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverPrimera = resolve;
          }),
      )
      .mockResolvedValueOnce({ id: 92 });
    const onInicio = vi.fn();
    const onCargado = vi.fn();
    const onError = vi.fn();

    const { rerender } = renderHook(
      ({ asignacionId }) =>
        useCargaPlanDiarioProfesor({
          asignacionId,
          fecha: "2026-07-28",
          onInicio,
          onCargado,
          onError,
        }),
      { initialProps: { asignacionId: 44 } },
    );

    rerender({ asignacionId: 45 });
    await waitFor(() => expect(onCargado).toHaveBeenCalledWith({ id: 92 }));
    resolverPrimera({ id: 91 });
    await Promise.resolve();

    expect(onCargado).not.toHaveBeenCalledWith({ id: 91 });
  });
});
