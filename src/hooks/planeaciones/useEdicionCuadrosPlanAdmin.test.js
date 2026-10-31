import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { guardarCuadrosMock } = vi.hoisted(() => ({ guardarCuadrosMock: vi.fn() }));

vi.mock("../../services/planeacionesApi", () => ({
  guardarCuadrosPlan: guardarCuadrosMock,
}));

import { nombresCuadrosPlan, NOMBRES_CUADROS_ORIGINALES } from "../../utils/planeaciones/cuadros";
import useEdicionCuadrosPlanAdmin from "./useEdicionCuadrosPlanAdmin";

const DEL_COLEGIO = nombresCuadrosPlan([{ clave: "proposito", nombre: "Objetivo", ayuda: "" }]);

function montar({ cuadros = DEL_COLEGIO, disponible = true, onGuardados = vi.fn() } = {}) {
  const hook = renderHook((props) => useEdicionCuadrosPlanAdmin(props), {
    initialProps: { cuadros, disponible, onGuardados },
  });
  return { ...hook, onGuardados };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEdicionCuadrosPlanAdmin", () => {
  it("abre con los nombres actuales del colegio", () => {
    const { result } = montar();

    act(() => result.current.abrir());

    expect(result.current.abierta).toBe(true);
    expect(result.current.valores.proposito).toEqual({ nombre: "Objetivo", ayuda: "" });
    expect(result.current.valores.unidad.nombre).toBe("Unidad");
  });

  it("si abrió antes de terminar la lectura, muestra lo leído en cuanto llega", () => {
    const { result, rerender, onGuardados } = montar({
      cuadros: NOMBRES_CUADROS_ORIGINALES,
      disponible: false,
    });
    act(() => result.current.abrir());

    rerender({ cuadros: DEL_COLEGIO, disponible: true, onGuardados });

    expect(result.current.valores.proposito.nombre).toBe("Objetivo");
  });

  it("guarda solo los distintos del original y avisa", async () => {
    guardarCuadrosMock.mockResolvedValue({ cuadros: [{ clave: "tema", nombre: "Asunto", ayuda: "" }] });
    const { result, onGuardados } = montar();
    act(() => result.current.abrir());

    act(() => result.current.cambiar("tema", "nombre", " Asunto "));
    await act(() => result.current.guardar());

    expect(guardarCuadrosMock).toHaveBeenCalledWith({
      cuadros: [
        { clave: "tema", nombre: "Asunto", ayuda: "Tema central de la clase" },
        { clave: "proposito", nombre: "Objetivo", ayuda: "" },
      ],
    });
    expect(onGuardados).toHaveBeenCalledWith({ cuadros: [{ clave: "tema", nombre: "Asunto", ayuda: "" }] });
    expect(result.current.abierta).toBe(false);
    expect(result.current.aviso).toBe("Nombres guardados.");
  });

  it("con errores no llama al backend y marca cada cuadro", async () => {
    const { result } = montar();
    act(() => result.current.abrir());

    act(() => result.current.cambiar("tema", "nombre", ""));
    await act(() => result.current.guardar());

    expect(guardarCuadrosMock).not.toHaveBeenCalled();
    expect(result.current.errores).toEqual({ tema: { nombre: "Escribe un nombre." } });
    expect(result.current.error).toBe("Revisa los cuadros marcados.");
    expect(result.current.abierta).toBe(true);

    act(() => result.current.cambiar("tema", "nombre", "Asunto"));
    expect(result.current.errores).toEqual({});
  });

  it("sin haber leído los nombres no guarda, para no borrar los del colegio", async () => {
    const { result } = montar({ disponible: false });
    act(() => result.current.abrir());

    await act(() => result.current.guardar());

    expect(guardarCuadrosMock).not.toHaveBeenCalled();
  });

  it("volver a los originales cambia el borrador y se guarda como lista vacía", async () => {
    guardarCuadrosMock.mockResolvedValue({ cuadros: [] });
    const { result } = montar();
    act(() => result.current.abrir());

    act(() => result.current.volverAOriginales());
    expect(result.current.valores.proposito.nombre).toBe("Logro");
    expect(guardarCuadrosMock).not.toHaveBeenCalled();

    await act(() => result.current.guardar());
    expect(guardarCuadrosMock).toHaveBeenCalledWith({ cuadros: [] });
  });

  it("si el backend rechaza, muestra su mensaje y la ventana sigue abierta", async () => {
    guardarCuadrosMock.mockRejectedValue({
      response: { status: 422, data: { detail: "Un cuadro aparece dos veces." } },
    });
    const { result, onGuardados } = montar();
    act(() => result.current.abrir());

    await act(() => result.current.guardar());

    expect(result.current.error).toBe("Un cuadro aparece dos veces.");
    expect(result.current.abierta).toBe(true);
    expect(result.current.guardando).toBe(false);
    expect(onGuardados).not.toHaveBeenCalled();
  });

  it("cancelar descarta lo escrito: al volver a abrir están los del colegio", () => {
    const { result } = montar();
    act(() => result.current.abrir());
    act(() => result.current.cambiar("unidad", "nombre", "Eje"));

    act(() => result.current.cerrar());
    act(() => result.current.abrir());

    expect(result.current.valores.unidad.nombre).toBe("Unidad");
  });
});
