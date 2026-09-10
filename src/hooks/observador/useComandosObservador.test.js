import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { crearAnotacionMock, editarAnotacionMock } = vi.hoisted(() => ({
  crearAnotacionMock: vi.fn(),
  editarAnotacionMock: vi.fn(),
}));

vi.mock("../../services/observadorApi", () => ({
  crearAnotacion: crearAnotacionMock,
  editarAnotacion: editarAnotacionMock,
}));

import useComandosObservador from "./useComandosObservador";

const COMPLETO = {
  conductual: "se para mucho",
  cognitivo: "",
  lenguaje: "",
  positiva: false,
};

beforeEach(() => {
  crearAnotacionMock.mockReset().mockResolvedValue({ id: 31 });
  editarAnotacionMock.mockReset().mockResolvedValue({ id: 31 });
});

describe("useComandosObservador", () => {
  it("crea la anotación con el texto ya corregido", async () => {
    const { result } = renderHook(() => useComandosObservador());

    let resultado;
    await act(async () => {
      resultado = await result.current.guardarNueva(COMPLETO, {
        estudianteId: 42,
        periodo: 3,
      });
    });

    expect(resultado).toStrictEqual({ estado: "exito" });
    expect(crearAnotacionMock).toHaveBeenCalledWith({
      estudiante_id: 42,
      periodo: 3,
      positiva: false,
      conductual: "Se para mucho",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("corrige una anotación sin mandar periodo ni estudiante", async () => {
    const { result } = renderHook(() => useComandosObservador());

    await act(async () => {
      await result.current.guardarCorreccion(COMPLETO, 31);
    });

    expect(editarAnotacionMock).toHaveBeenCalledWith(31, {
      positiva: false,
      conductual: "Se para mucho",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("no viaja al servidor si falta texto o falta la marca", async () => {
    const { result } = renderHook(() => useComandosObservador());

    let sinTexto;
    let sinMarca;
    await act(async () => {
      sinTexto = await result.current.guardarNueva(
        { conductual: "", cognitivo: "", lenguaje: "", positiva: true },
        { estudianteId: 42, periodo: 3 },
      );
      sinMarca = await result.current.guardarNueva(
        { conductual: "Algo", cognitivo: "", lenguaje: "", positiva: null },
        { estudianteId: 42, periodo: 3 },
      );
    });

    expect(sinTexto.estado).toBe("incompleta");
    expect(sinMarca.estado).toBe("incompleta");
    expect(crearAnotacionMock).not.toHaveBeenCalled();
  });

  it("enseña el mensaje del servidor cuando la anotación no es tuya", async () => {
    editarAnotacionMock.mockRejectedValue({
      response: {
        status: 403,
        data: { detail: "Solo quien escribio una anotacion puede editarla." },
      },
    });
    const { result } = renderHook(() => useComandosObservador());

    let resultado;
    await act(async () => {
      resultado = await result.current.guardarCorreccion(COMPLETO, 31);
    });

    expect(resultado).toStrictEqual({
      estado: "error",
      mensaje: "Solo quien escribio una anotacion puede editarla.",
    });
  });

  it("no le enseña a nadie el 422 crudo de FastAPI", async () => {
    // Un 422 de validación llega como lista de objetos con nombres internos.
    crearAnotacionMock.mockRejectedValue({
      response: { status: 422, data: { detail: [{ loc: ["body", "positiva"] }] } },
    });
    const { result } = renderHook(() => useComandosObservador());

    let resultado;
    await act(async () => {
      resultado = await result.current.guardarNueva(COMPLETO, {
        estudianteId: 42,
        periodo: 3,
      });
    });

    expect(resultado.estado).toBe("error");
    expect(resultado.mensaje).toBe("No se pudo guardar la anotación. Intenta de nuevo.");
  });

  it("marca que está guardando y lo deja de marcar al terminar, aunque falle", async () => {
    crearAnotacionMock.mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() => useComandosObservador());

    expect(result.current.guardando).toBe(false);

    await act(async () => {
      await result.current.guardarNueva(COMPLETO, { estudianteId: 42, periodo: 3 });
    });

    expect(result.current.guardando).toBe(false);
  });

  it("no expone ningún comando de borrado", () => {
    const { result } = renderHook(() => useComandosObservador());

    // Nadie borra una anotación, y no debe añadirse sin una orden explícita.
    expect(Object.keys(result.current).sort()).toStrictEqual([
      "guardando",
      "guardarCorreccion",
      "guardarNueva",
    ]);
  });
});
