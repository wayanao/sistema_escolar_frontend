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

  it("no lanza una segunda consulta mientras la primera sigue en vuelo", async () => {
    let resolverPrimera;
    listarNotificacionesMock.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolverPrimera = resolve;
      }),
    );

    const { result } = renderHook(() => useNotificacionesPlaneadores("admin"));
    await waitFor(() => expect(listarNotificacionesMock).toHaveBeenCalledTimes(1));

    act(() => window.dispatchEvent(new Event("focus")));
    expect(listarNotificacionesMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolverPrimera({ total_no_leidas: 2, total_profesores: 0, items: [] });
    });
    await waitFor(() => expect(result.current.total).toBe(2));

    // Terminada la primera, un regreso posterior sí vuelve a consultar.
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(listarNotificacionesMock).toHaveBeenCalledTimes(2));
  });

  it("medición de peticiones: volver a la pestaña y estar oculta cinco minutos", async () => {
    // Antes: 2 peticiones al volver (el navegador dispara `visibilitychange` y
    // `focus`, y cada uno cargaba por su cuenta) y 5 con la pestaña oculta.
    vi.useFakeTimers();
    const visibilityState = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible");

    renderHook(() => useNotificacionesPlaneadores("profesor"));
    await act(async () => {
      await Promise.resolve();
    });

    const alAbrir = listarNotificacionesMock.mock.calls.length;
    const medicion = {};

    // El profesor vuelve a la pestaña: el navegador dispara los dos eventos.
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
    });
    medicion.alVolverALaPestana = listarNotificacionesMock.mock.calls.length - alAbrir;

    // Cinco minutos con la pestaña de fondo: nadie está mirando el contador.
    visibilityState.mockReturnValue("hidden");
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000);
      await Promise.resolve();
    });
    medicion.enCincoMinutosOculta =
      listarNotificacionesMock.mock.calls.length - alAbrir - medicion.alVolverALaPestana;

    expect(alAbrir).toBe(1);
    expect(medicion).toEqual({
      alVolverALaPestana: 1,
      enCincoMinutosOculta: 0,
    });
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
