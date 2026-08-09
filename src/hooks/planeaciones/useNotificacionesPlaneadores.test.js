import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES } from "../../utils/planeaciones/notificacionesContratos";

const listarNotificacionesMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/planeacionesApi", () => ({
  listarNotificacionesPlaneadores: listarNotificacionesMock,
}));

import useNotificacionesPlaneadores from "./useNotificacionesPlaneadores";

beforeEach(() => {
  listarNotificacionesMock.mockReset();
  listarNotificacionesMock.mockResolvedValue({
    total_no_leidas: 0,
    total_profesores: 0,
    items: [],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useNotificacionesPlaneadores", () => {
  it("selecciona el límite por rol y normaliza la respuesta", async () => {
    listarNotificacionesMock.mockResolvedValueOnce({
      total_no_leidas: "3",
      total_profesores: "1",
      items: [{ id: 91 }],
    });

    const { result, rerender } = renderHook(
      ({ rol }) => useNotificacionesPlaneadores(rol),
      { initialProps: { rol: "admin" } },
    );

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(listarNotificacionesMock).toHaveBeenLastCalledWith(20);
    expect(result.current).toMatchObject({
      total: 3,
      totalProfesores: 1,
      items: [{ id: 91 }],
      error: "",
    });

    rerender({ rol: "profesor" });
    await waitFor(() => {
      expect(listarNotificacionesMock).toHaveBeenLastCalledWith(8);
    });
  });

  it("expone el error inicial y permite reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    listarNotificacionesMock
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce({
        total_no_leidas: 1,
        total_profesores: 0,
        items: [{ id: 13 }],
      });

    const { result } = renderHook(() =>
      useNotificacionesPlaneadores("profesor"),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBe(
      "No pudimos actualizar las notificaciones.",
    );

    await act(async () => {
      await result.current.cargar();
    });

    expect(result.current).toMatchObject({
      total: 1,
      items: [{ id: 13 }],
      error: "",
    });
  });

  it("recarga silenciosamente con foco, evento local y visibilidad activa", async () => {
    const visibilityState = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");

    renderHook(() => useNotificacionesPlaneadores("admin"));
    await waitFor(() => expect(listarNotificacionesMock).toHaveBeenCalledTimes(1));

    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(listarNotificacionesMock).toHaveBeenCalledTimes(2));

    act(() => window.dispatchEvent(
      new CustomEvent(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES),
    ));
    await waitFor(() => expect(listarNotificacionesMock).toHaveBeenCalledTimes(3));

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(listarNotificacionesMock).toHaveBeenCalledTimes(3);

    visibilityState.mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await waitFor(() => expect(listarNotificacionesMock).toHaveBeenCalledTimes(4));
  });

  it("mantiene el polling de sesenta segundos y lo limpia al desmontar", async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() =>
      useNotificacionesPlaneadores("admin"),
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(listarNotificacionesMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(listarNotificacionesMock).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(listarNotificacionesMock).toHaveBeenCalledTimes(2);
  });
});
