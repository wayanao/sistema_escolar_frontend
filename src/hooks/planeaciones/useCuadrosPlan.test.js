import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerCuadrosMock } = vi.hoisted(() => ({ obtenerCuadrosMock: vi.fn() }));

vi.mock("../../services/planeacionesApi", () => ({
  obtenerCuadrosPlan: obtenerCuadrosMock,
}));

import useCuadrosPlan from "./useCuadrosPlan";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCuadrosPlan", () => {
  it("mientras carga muestra los originales y luego los del colegio, con una sola petición", async () => {
    obtenerCuadrosMock.mockResolvedValue({
      cuadros: [{ clave: "proposito", nombre: "Objetivo", ayuda: "Meta" }],
    });

    const { result, rerender } = renderHook(() => useCuadrosPlan());

    expect(result.current.cargando).toBe(true);
    expect(result.current.cuadros.proposito.nombre).toBe("Logro");
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.cuadros.proposito).toMatchObject({ nombre: "Objetivo", ayuda: "Meta" });
    expect(result.current.error).toBe("");

    rerender();
    expect(obtenerCuadrosMock).toHaveBeenCalledTimes(1);
  });

  it("si la lectura falla, sigue con los originales y avisa el error", async () => {
    obtenerCuadrosMock.mockRejectedValue(new Error("sin red"));

    const { result } = renderHook(() => useCuadrosPlan());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBe("No se pudieron leer los nombres de los cuadros.");
    expect(result.current.cuadros.unidad.nombre).toBe("Unidad");
  });

  it("reintentar vuelve a pedir y limpia el error", async () => {
    obtenerCuadrosMock
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce({ cuadros: [{ clave: "tema", nombre: "Asunto", ayuda: "" }] });

    const { result } = renderHook(() => useCuadrosPlan());
    await waitFor(() => expect(result.current.error).not.toBe(""));

    await act(() => result.current.recargar());

    expect(result.current.error).toBe("");
    expect(result.current.cuadros.tema.nombre).toBe("Asunto");
    expect(obtenerCuadrosMock).toHaveBeenCalledTimes(2);
  });

  it("reemplazar usa lo guardado sin volver a pedir", async () => {
    obtenerCuadrosMock.mockResolvedValue({ cuadros: [] });
    const { result } = renderHook(() => useCuadrosPlan());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      result.current.reemplazar({ cuadros: [{ clave: "imagen1", nombre: "Guía", ayuda: "" }] });
    });

    expect(result.current.cuadros.imagen1.nombre).toBe("Guía");
    expect(obtenerCuadrosMock).toHaveBeenCalledTimes(1);
  });

  it("una respuesta que llega después de reemplazar no pisa lo guardado", async () => {
    let responder;
    obtenerCuadrosMock.mockReturnValue(new Promise((resolve) => { responder = resolve; }));
    const { result } = renderHook(() => useCuadrosPlan());

    act(() => {
      result.current.reemplazar({ cuadros: [{ clave: "tema", nombre: "Nuevo", ayuda: "" }] });
    });
    await act(async () => {
      responder({ cuadros: [{ clave: "tema", nombre: "Viejo", ayuda: "" }] });
    });

    expect(result.current.cuadros.tema.nombre).toBe("Nuevo");
    expect(result.current.cargando).toBe(false);
  });
});
