import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prepararFirmaMock } = vi.hoisted(() => ({ prepararFirmaMock: vi.fn() }));

vi.mock("./lienzoFirma", () => ({ prepararFirma: prepararFirmaMock }));

import useEditorFirma from "./useEditorFirma";

const LIMPIA = "data:image/png;base64,limpia";

/** Una preparación que termina cuando la prueba quiera. */
function preparacionPendiente() {
  let terminar;
  let fallar;
  const promesa = new Promise((resolve, reject) => {
    terminar = resolve;
    fallar = reject;
  });
  return { promesa, terminar, fallar };
}

beforeEach(() => {
  prepararFirmaMock.mockReset().mockResolvedValue(LIMPIA);
});

describe("useEditorFirma", () => {
  it("empieza cerrado y sin nada que guardar", () => {
    const { result } = renderHook(() => useEditorFirma());

    expect(result.current.modo).toBeNull();
    expect(result.current.imagen).toBeNull();
    expect(result.current.preparando).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("una foto se prepara y queda lista para guardar", async () => {
    const archivo = new File(["x"], "firma.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useEditorFirma());

    await act(async () => {
      result.current.elegirFoto(archivo);
    });

    expect(prepararFirmaMock).toHaveBeenCalledWith(archivo, undefined);
    expect(result.current.modo).toBe("foto");
    expect(result.current.imagen).toBe(LIMPIA);
    expect(result.current.preparando).toBe(false);
  });

  it("mientras prepara la foto lo dice, y no hay nada que guardar", async () => {
    const pendiente = preparacionPendiente();
    prepararFirmaMock.mockReturnValue(pendiente.promesa);
    const { result } = renderHook(() => useEditorFirma());

    act(() => {
      result.current.elegirFoto(new File(["x"], "firma.jpg"));
    });
    expect(result.current.preparando).toBe(true);
    expect(result.current.imagen).toBeNull();

    await act(async () => {
      pendiente.terminar(LIMPIA);
    });
    expect(result.current.preparando).toBe(false);
    expect(result.current.imagen).toBe(LIMPIA);
  });

  it("si la foto no sirve, queda el mensaje y nada que guardar", async () => {
    prepararFirmaMock.mockRejectedValue(new Error("No se ve ninguna firma en la foto."));
    const { result } = renderHook(() => useEditorFirma());

    await act(async () => {
      result.current.elegirFoto(new File(["x"], "hoja.jpg"));
    });

    expect(result.current.imagen).toBeNull();
    expect(result.current.error).toBe("No se ve ninguna firma en la foto.");
  });

  it("cada trazo del recuadro se limpia igual; borrar deja nada que guardar", async () => {
    const { result } = renderHook(() => useEditorFirma());

    act(() => {
      result.current.abrirDibujo();
    });
    expect(result.current.modo).toBe("dibujo");

    await act(async () => {
      result.current.cambiarDibujo("data:image/png;base64,trazo");
    });
    // Sin quitar motas: un toque corto con el dedo es parte de la firma.
    expect(prepararFirmaMock).toHaveBeenCalledWith("data:image/png;base64,trazo", {
      quitarMotas: false,
    });
    expect(result.current.imagen).toBe(LIMPIA);

    act(() => {
      result.current.cambiarDibujo(null);
    });
    expect(result.current.imagen).toBeNull();
  });

  it("una preparación que llega tarde no pisa la nueva", async () => {
    const vieja = preparacionPendiente();
    const nueva = preparacionPendiente();
    prepararFirmaMock.mockReturnValueOnce(vieja.promesa).mockReturnValueOnce(nueva.promesa);
    const { result } = renderHook(() => useEditorFirma());

    act(() => {
      result.current.elegirFoto(new File(["1"], "una.jpg"));
    });
    act(() => {
      result.current.elegirFoto(new File(["2"], "otra.jpg"));
    });
    await act(async () => {
      nueva.terminar("data:image/png;base64,nueva");
    });
    await act(async () => {
      vieja.terminar("data:image/png;base64,vieja");
    });

    expect(result.current.imagen).toBe("data:image/png;base64,nueva");
  });

  it("cerrar descarta todo, también lo que estaba preparando", async () => {
    const pendiente = preparacionPendiente();
    prepararFirmaMock.mockReturnValue(pendiente.promesa);
    const { result } = renderHook(() => useEditorFirma());

    act(() => {
      result.current.elegirFoto(new File(["x"], "firma.jpg"));
    });
    act(() => {
      result.current.cerrar();
    });
    await act(async () => {
      pendiente.terminar(LIMPIA);
    });

    expect(result.current.modo).toBeNull();
    expect(result.current.imagen).toBeNull();
    expect(result.current.preparando).toBe(false);
  });
});
