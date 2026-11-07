import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { crearAnotacionMock, editarAnotacionMock, sweet } = vi.hoisted(() => ({
  crearAnotacionMock: vi.fn(),
  editarAnotacionMock: vi.fn(),
  sweet: {
    fire: vi.fn(),
    update: vi.fn(),
    getFooter: vi.fn(),
    getPopup: vi.fn(),
    isVisible: vi.fn(),
    close: vi.fn(),
  },
}));

vi.mock("../../services/observadorApi", () => ({
  crearAnotacion: crearAnotacionMock,
  editarAnotacion: editarAnotacionMock,
}));

// La tarjeta de espera y la de éxito (ventanaExito.js).
vi.mock("sweetalert2", () => ({ default: sweet }));

import useComandosObservador, {
  TITULOS_CORRECCION,
  TITULOS_NUEVA,
} from "./useComandosObservador";
import { opcionesExitoTrasEspera, opcionesVentanaEspera } from "../ventanaExito";

const COMPLETO = {
  conductual: "se para mucho",
  cognitivo: "",
  lenguaje: "",
};

beforeEach(() => {
  crearAnotacionMock.mockReset().mockResolvedValue({ id: 31 });
  editarAnotacionMock.mockReset().mockResolvedValue({ id: 31 });
  Object.values(sweet).forEach((simulada) => simulada.mockReset());
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
      conductual: "Se para mucho",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("una sola espera: la tarjeta sale al guardar y pasa a éxito sin cerrarse", async () => {
    const { result } = renderHook(() => useComandosObservador());

    await act(async () => {
      await result.current.guardarNueva(COMPLETO, { estudianteId: 42, periodo: 3 });
    });
    expect(sweet.fire).toHaveBeenCalledWith(opcionesVentanaEspera({ title: "Guardando anotación…" }));
    expect(sweet.update).toHaveBeenCalledWith(opcionesExitoTrasEspera({ title: "Anotación guardada" }));

    await act(async () => {
      await result.current.guardarCorreccion(COMPLETO, 31);
    });
    expect(sweet.fire).toHaveBeenLastCalledWith(
      opcionesVentanaEspera({ title: TITULOS_CORRECCION.espera }),
    );
    expect(sweet.update).toHaveBeenLastCalledWith(
      opcionesExitoTrasEspera({ title: TITULOS_CORRECCION.exito }),
    );
    expect(TITULOS_NUEVA.exito).toBe("Anotación guardada");
  });

  it("si falla, quita la tarjeta y el error queda para el formulario", async () => {
    const tarjeta = { la: "tarjeta" };
    sweet.getPopup.mockReturnValue(tarjeta);
    sweet.isVisible.mockReturnValue(true);
    crearAnotacionMock.mockRejectedValue(new Error("sin red"));
    const { result } = renderHook(() => useComandosObservador());

    let resultado;
    await act(async () => {
      resultado = await result.current.guardarNueva(COMPLETO, { estudianteId: 42, periodo: 3 });
    });

    expect(resultado.estado).toBe("error");
    expect(sweet.close).toHaveBeenCalledTimes(1);
    expect(sweet.update).not.toHaveBeenCalled();
  });

  it("corrige una anotación sin mandar periodo ni estudiante", async () => {
    const { result } = renderHook(() => useComandosObservador());

    await act(async () => {
      await result.current.guardarCorreccion(COMPLETO, 31);
    });

    expect(editarAnotacionMock).toHaveBeenCalledWith(31, {
      conductual: "Se para mucho",
      cognitivo: "",
      lenguaje: "",
    });
  });

  it("no viaja al servidor si no hay nada escrito", async () => {
    const { result } = renderHook(() => useComandosObservador());

    let sinTexto;
    await act(async () => {
      sinTexto = await result.current.guardarNueva(
        { conductual: "", cognitivo: "", lenguaje: "" },
        { estudianteId: 42, periodo: 3 },
      );
    });

    expect(sinTexto.estado).toBe("incompleta");
    expect(crearAnotacionMock).not.toHaveBeenCalled();
    // Sin nada escrito no sale la tarjeta: el aviso va en el formulario.
    expect(sweet.fire).not.toHaveBeenCalled();
  });

  it("sí viaja aunque no lleve marca de positiva o negativa", async () => {
    // Antes esto era un "incompleta" que ni salia de la pantalla.
    const { result } = renderHook(() => useComandosObservador());

    let resultado;
    await act(async () => {
      resultado = await result.current.guardarNueva(
        { conductual: "Algo", cognitivo: "", lenguaje: "" },
        { estudianteId: 42, periodo: 3 },
      );
    });

    expect(resultado.estado).toBe("exito");
    expect(crearAnotacionMock.mock.calls[0][0]).not.toHaveProperty("positiva");
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
