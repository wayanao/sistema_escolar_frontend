import { describe, expect, it } from "vitest";
import { normalizarTextoObservador } from "./texto";

describe("corrección de mayúsculas del observador", () => {
  it("es el ejemplo que el usuario describió", () => {
    expect(normalizarTextoObservador("se para mucho.hace desorden.es muy ruidoso"))
      .toBe("Se para mucho. Hace desorden. Es muy ruidoso");
  });

  it("pone mayúscula en la primera letra y después de punto, interrogación y exclamación", () => {
    expect(normalizarTextoObservador("hoy mejoró. ¿seguirá así? ojalá! sigue"))
      .toBe("Hoy mejoró. ¿Seguirá así? Ojalá! Sigue");
  });

  it("NO pone mayúscula después de coma, punto y coma ni dos puntos", () => {
    // Pondría «Se para, Hace desorden», que es justo lo que no se quiere.
    expect(normalizarTextoObservador("se para, hace desorden; es ruidoso: mucho"))
      .toBe("Se para, hace desorden; es ruidoso: mucho");
  });

  it("reconoce letras con acento y la eñe", () => {
    // Con `[a-zA-Z]` en vez de «una letra» de verdad, «ávila» se quedaría en
    // minúscula.
    expect(normalizarTextoObservador("ávila trabajó bien. ñoño también"))
      .toBe("Ávila trabajó bien. Ñoño también");
  });

  it("abre bien una frase que empieza por signo de interrogación", () => {
    expect(normalizarTextoObservador("¿por qué se para?")).toBe("¿Por qué se para?");
    expect(normalizarTextoObservador("¡excelente trabajo!")).toBe("¡Excelente trabajo!");
  });

  it("no parte un número decimal", () => {
    // «mide 1.75 metros» no debe convertirse en «mide 1. 75 metros».
    expect(normalizarTextoObservador("mide 1.75 metros")).toBe("Mide 1.75 metros");
  });

  it("colapsa los espacios sobrantes y recorta los de los bordes", () => {
    expect(normalizarTextoObservador("   se   para    mucho   ")).toBe("Se para mucho");
  });

  it("devuelve cadena vacía para lo vacío y para lo que no es texto", () => {
    // Los tres campos son opcionales por separado; que el conjunto no esté
    // vacío lo valida otra cosa.
    expect(normalizarTextoObservador("")).toBe("");
    expect(normalizarTextoObservador("   ")).toBe("");
    expect(normalizarTextoObservador(null)).toBe("");
    expect(normalizarTextoObservador(undefined)).toBe("");
  });

  it("no toca un texto que ya está bien escrito", () => {
    const correcto = "Se para mucho. Hace desorden.";
    expect(normalizarTextoObservador(correcto)).toBe(correcto);
  });

  it("se pasa de listo con las abreviaturas, y está aceptado", () => {
    // Defecto conocido: todos los sistemas que hacen esto lo tienen, es raro en
    // una observación, y la profesora lo ve antes de guardar.
    expect(normalizarTextoObservador("etc. y luego se calmó"))
      .toBe("Etc. Y luego se calmó");
  });
});
