import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  actualizarNotificacionesMock,
  listarObservacionesMock,
  marcarObservacionVistaMock,
} = vi.hoisted(() => ({
  actualizarNotificacionesMock: vi.fn(),
  listarObservacionesMock: vi.fn(),
  marcarObservacionVistaMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  listarObservacionesPlan: listarObservacionesMock,
  marcarObservacionVista: marcarObservacionVistaMock,
}));

vi.mock("../../utils/notificacionesPlaneadores", () => ({
  actualizarNotificacionesPlaneadores: actualizarNotificacionesMock,
}));

import useObservacionesPlaneacionProfesor from "./useObservacionesPlaneacionProfesor";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useObservacionesPlaneacionProfesor", () => {
  it("carga comentarios, confirma los nuevos y comunica el conteo pendiente", async () => {
    const onLecturasActualizadas = vi.fn();
    listarObservacionesMock.mockResolvedValue([
      { id: 1, vista_por_profesor_at: "2026-07-27T10:00:00Z" },
      { id: 2, vista_por_profesor_at: null },
    ]);
    marcarObservacionVistaMock.mockResolvedValue({
      vista_por_profesor_at: "2026-07-28T10:00:00Z",
    });

    const { result } = renderHook(() =>
      useObservacionesPlaneacionProfesor({
        planId: 91,
        onLecturasActualizadas,
      }),
    );

    await act(async () => {
      await result.current.alternarObservaciones();
    });

    expect(listarObservacionesMock).toHaveBeenCalledWith(91);
    expect(marcarObservacionVistaMock).toHaveBeenCalledWith(91, 2);
    expect(result.current.observaciones).toHaveLength(2);
    expect(result.current.observaciones[1].vista_por_profesor_at).toBe(
      "2026-07-28T10:00:00Z",
    );
    expect(onLecturasActualizadas).toHaveBeenCalledWith({
      planId: 91,
      pendientes: 0,
    });
    expect(actualizarNotificacionesMock).toHaveBeenCalledTimes(1);
  });

  it("muestra los comentarios aunque una confirmación de lectura falle", async () => {
    const onLecturasActualizadas = vi.fn();
    listarObservacionesMock.mockResolvedValue([
      { id: 2, vista_por_profesor_at: null },
    ]);
    marcarObservacionVistaMock.mockRejectedValue(new Error("Sin conexión"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useObservacionesPlaneacionProfesor({
        planId: 91,
        onLecturasActualizadas,
      }),
    );

    await act(async () => {
      await result.current.alternarObservaciones();
    });

    expect(result.current.observaciones).toHaveLength(1);
    expect(result.current.error).toContain("alguna lectura");
    expect(onLecturasActualizadas).toHaveBeenCalledWith({
      planId: 91,
      pendientes: 1,
    });
    consoleError.mockRestore();
  });

  it("reinicia la presentación al cambiar de plan", async () => {
    listarObservacionesMock.mockResolvedValue([{ id: 1 }]);
    marcarObservacionVistaMock.mockResolvedValue({
      vista_por_profesor_at: "2026-07-28T10:00:00Z",
    });

    const { result, rerender } = renderHook(
      ({ planId }) =>
        useObservacionesPlaneacionProfesor({ planId }),
      { initialProps: { planId: 91 } },
    );

    await act(async () => {
      await result.current.alternarObservaciones();
    });
    expect(result.current.abiertas).toBe(true);

    rerender({ planId: 92 });
    await waitFor(() => expect(result.current.abiertas).toBe(false));

    expect(result.current.observaciones).toEqual([]);
    expect(result.current.error).toBe("");
  });
});
