import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useImagenProtegida } from "./useImagenProtegida";

const descargarImagenMock = vi.hoisted(() => vi.fn());

vi.mock("../../services/planeacionesApi", () => ({
  descargarImagenPlaneacion: descargarImagenMock,
}));

const URLNativa = globalThis.URL;
let crearObjectUrl;
let revocarObjectUrl;

describe("useImagenProtegida", () => {
  beforeEach(() => {
    descargarImagenMock.mockReset();
    crearObjectUrl = vi.fn(() => "blob:imagen-protegida");
    revocarObjectUrl = vi.fn();

    class URLConBlob extends URLNativa {}
    URLConBlob.createObjectURL = crearObjectUrl;
    URLConBlob.revokeObjectURL = revocarObjectUrl;
    vi.stubGlobal("URL", URLConBlob);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("normaliza una URL absoluta y libera el blob al desmontar", async () => {
    const blob = new Blob(["imagen"], { type: "image/webp" });
    descargarImagenMock.mockResolvedValue(blob);

    const { result, unmount } = renderHook(() =>
      useImagenProtegida(
        "https://api.auligo.test/evidencias/plan-91.webp?version=3",
      ),
    );

    expect(result.current).toEqual({
      url: "",
      cargando: true,
      error: "",
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        url: "blob:imagen-protegida",
        cargando: false,
        error: "",
      });
    });

    expect(descargarImagenMock).toHaveBeenCalledWith(
      "/evidencias/plan-91.webp?version=3",
    );
    expect(crearObjectUrl).toHaveBeenCalledWith(blob);

    unmount();
    expect(revocarObjectUrl).toHaveBeenCalledWith("blob:imagen-protegida");
  });

  it("normaliza barras relativas y limpia el estado al desaparecer la ruta", async () => {
    descargarImagenMock.mockResolvedValue(new Blob(["imagen"]));

    const { result, rerender } = renderHook(
      ({ path }) => useImagenProtegida(path),
      { initialProps: { path: "evidencias\\plan-92.png" } },
    );

    await waitFor(() => {
      expect(result.current.url).toBe("blob:imagen-protegida");
    });
    expect(descargarImagenMock).toHaveBeenCalledWith(
      "/evidencias/plan-92.png",
    );

    rerender({ path: "" });

    expect(result.current).toEqual({ url: "", cargando: false, error: "" });
    expect(revocarObjectUrl).toHaveBeenCalledWith("blob:imagen-protegida");
    expect(descargarImagenMock).toHaveBeenCalledTimes(1);
  });

  it("conserva el mensaje de error sin crear un object URL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    descargarImagenMock.mockRejectedValue(new Error("sin autorización"));

    const { result } = renderHook(() =>
      useImagenProtegida("/evidencias/plan-93.png"),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        url: "",
        cargando: false,
        error: "No se pudo cargar la imagen.",
      });
    });

    expect(crearObjectUrl).not.toHaveBeenCalled();
    expect(revocarObjectUrl).not.toHaveBeenCalled();
  });

  it("descarta una respuesta que termina después del desmontaje", async () => {
    let resolver;
    descargarImagenMock.mockReturnValue(new Promise((resolve) => {
      resolver = resolve;
    }));

    const { unmount } = renderHook(() =>
      useImagenProtegida("/evidencias/plan-94.png"),
    );
    unmount();

    await act(async () => {
      resolver(new Blob(["imagen"]));
      await Promise.resolve();
    });

    expect(crearObjectUrl).not.toHaveBeenCalled();
    expect(revocarObjectUrl).not.toHaveBeenCalled();
  });
});
