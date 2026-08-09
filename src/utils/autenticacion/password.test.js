import { describe, expect, it } from "vitest";
import {
  construirPayloadCambioPassword,
  obtenerRequisitosPasswordFaltantes,
  validarCambioPassword,
} from "./password";

describe("validaciones puras de cambio de password", () => {
  it.each([
    ["", ["minimo 10 caracteres", "una mayuscula", "una minuscula", "un numero"]],
    ["abcdefghij", ["una mayuscula", "un numero"]],
    ["ABCDEFGHIJ", ["una minuscula", "un numero"]],
    ["Abcdefghij", ["un numero"]],
    ["Abcdefghi1", []],
    ["Ábcdefghi1", ["una mayuscula"]],
  ])("devuelve los requisitos faltantes en orden para %#", (password, esperado) => {
    expect(obtenerRequisitosPasswordFaltantes(password)).toEqual(esperado);
  });

  it("conserva la precedencia fortaleza, confirmacion y reutilizacion", () => {
    expect(validarCambioPassword({
      passwordActual: "abc",
      passwordNueva: "abc",
      confirmacion: "distinta",
    })).toEqual({
      tipo: "debil",
      requisitos: ["minimo 10 caracteres", "una mayuscula", "un numero"],
    });
    expect(validarCambioPassword({
      passwordActual: "Temporal123",
      passwordNueva: "NuevaClave123",
      confirmacion: "OtraClave123",
    })).toEqual({ tipo: "confirmacion" });
    expect(validarCambioPassword({
      passwordActual: "MismaClave123",
      passwordNueva: "MismaClave123",
      confirmacion: "MismaClave123",
    })).toEqual({ tipo: "reutilizada" });
    expect(validarCambioPassword({
      passwordActual: "Temporal123",
      passwordNueva: "NuevaClave123",
      confirmacion: "NuevaClave123",
    })).toBeNull();
  });

  it("construye el payload del backend sin transformar los valores", () => {
    expect(construirPayloadCambioPassword({
      passwordActual: " Temporal123 ",
      passwordNueva: " NuevaClave123 ",
    })).toEqual({
      password_actual: " Temporal123 ",
      password_nueva: " NuevaClave123 ",
    });
  });
});
