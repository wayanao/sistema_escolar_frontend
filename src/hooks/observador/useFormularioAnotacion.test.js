import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useFormularioAnotacion from "./useFormularioAnotacion";

describe("useFormularioAnotacion", () => {
  it("corrige las mayúsculas al salir del campo, no al teclear", () => {
    const { result } = renderHook(() => useFormularioAnotacion());

    act(() => result.current.cambiarTexto("conductual", "se para mucho.hace desorden"));

    // Mientras escribe, el texto se queda tal cual: corregir letra por letra
    // hace saltar el cursor y el usuario siente que la pantalla pelea con él.
    expect(result.current.valores.conductual).toBe("se para mucho.hace desorden");

    act(() => result.current.corregirAlSalir("conductual"));

    expect(result.current.valores.conductual).toBe("Se para mucho. Hace desorden");
  });

  it("no reescribe un campo que la profesora no tocó", () => {
    // Al abrir una anotación vieja para corregir otra cosa, pasar por encima de
    // este campo no debe cambiarle el texto que ya estaba guardado.
    const { result } = renderHook(() =>
      useFormularioAnotacion({ conductual: "texto viejo sin corregir" }),
    );

    act(() => result.current.corregirAlSalir("conductual"));

    expect(result.current.valores.conductual).toBe("texto viejo sin corregir");
  });

  it("corrige solo el campo del que se sale", () => {
    const { result } = renderHook(() => useFormularioAnotacion());

    act(() => {
      result.current.cambiarTexto("conductual", "se para");
      result.current.cambiarTexto("cognitivo", "muy creativo");
    });
    act(() => result.current.corregirAlSalir("conductual"));

    expect(result.current.valores.conductual).toBe("Se para");
    expect(result.current.valores.cognitivo).toBe("muy creativo");
  });

  it("no deja guardar sin texto, y no pide nada más", () => {
    // La marca de positiva o negativa se quito el 2026-09-09: escribir algo es
    // la unica condicion que queda.
    const { result } = renderHook(() => useFormularioAnotacion());

    expect(result.current.puedeGuardar).toBe(false);

    act(() => result.current.cambiarTexto("conductual", "Se para mucho."));
    expect(result.current.puedeGuardar).toBe(true);
    expect(result.current).not.toHaveProperty("cambiarPositiva");
  });

  it("reiniciar lo deja como al abrirlo, y olvida lo que se había tocado", () => {
    const { result } = renderHook(() => useFormularioAnotacion());

    act(() => result.current.cambiarTexto("conductual", "algo"));
    act(() => result.current.reiniciar(null));

    expect(result.current.valores).toStrictEqual({
      conductual: "",
      cognitivo: "",
      lenguaje: "",
    });

    // Si siguiera recordando el campo como tocado, abrir después una anotación
    // vieja y salir del campo se lo reescribiría.
    act(() => result.current.reiniciar({ conductual: "texto viejo" }));
    act(() => result.current.corregirAlSalir("conductual"));
    expect(result.current.valores.conductual).toBe("texto viejo");
  });

  it("se precarga con la anotación que se va a corregir", () => {
    const { result } = renderHook(() =>
      useFormularioAnotacion({
        conductual: "Se para mucho.",
        cognitivo: "",
        lenguaje: "",
        positiva: false,
      }),
    );

    expect(result.current.valores.conductual).toBe("Se para mucho.");
    // La marca que la fila tuviera no entra en el formulario ni sale de el.
    expect(result.current.valores).not.toHaveProperty("positiva");
    expect(result.current.puedeGuardar).toBe(true);
  });
});
