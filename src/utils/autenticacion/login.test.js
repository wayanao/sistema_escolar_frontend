import { describe, expect, it } from "vitest";
import {
  capitalizarNombreVisible,
  construirPayloadLogin,
  estanCompletasLasCredenciales,
  normalizarCodigoColegio,
  normalizarCodigoColegioRecordado,
  obtenerRutaDespuesDeLogin,
} from "./login";

describe("contratos puros de login", () => {
  it.each([
    ["  Colegio-Norte  ", "colegio-norte"],
    ["COLEGIO_2", "colegio_2"],
    ["", ""],
    [null, ""],
  ])("normaliza el codigo %# como %#", (valor, esperado) => {
    expect(normalizarCodigoColegio(valor)).toBe(esperado);
  });

  it("descarta solo el codigo legacy demo al precargarlo", () => {
    expect(normalizarCodigoColegioRecordado(" DEMO ")).toBe("");
    expect(normalizarCodigoColegioRecordado("demo-uno")).toBe("demo-uno");
  });

  it("valida presencia sin recortar email ni password", () => {
    expect(estanCompletasLasCredenciales({
      email: "persona@auligo.test",
      password: "Password123",
      codigoColegio: " colegio ",
    })).toBe(true);
    expect(estanCompletasLasCredenciales({
      email: " ",
      password: " ",
      codigoColegio: "colegio",
    })).toBe(true);
    expect(estanCompletasLasCredenciales({
      email: "persona@auligo.test",
      password: "Password123",
      codigoColegio: "   ",
    })).toBe(false);
  });

  it("construye el payload exacto sin transformar email ni password", () => {
    expect(construirPayloadLogin({
      email: " Persona@Auligo.test ",
      password: " Clave 123 ",
      codigoColegio: " COLEGIO-NORTE ",
    })).toEqual({
      email: " Persona@Auligo.test ",
      password: " Clave 123 ",
      codigo_colegio: "colegio-norte",
    });
  });

  it("permite enviar demo aunque no lo precargue como codigo recordado", () => {
    expect(construirPayloadLogin({
      email: "persona@auligo.test",
      password: "Password123",
      codigoColegio: " DEMO ",
    })).toEqual({
      email: "persona@auligo.test",
      password: "Password123",
      codigo_colegio: "demo",
    });
  });

  it.each([
    ["  mARÍA   DEL pILAR ", "María Del Pilar"],
    ["ÁNGEL", "Ángel"],
    [null, ""],
  ])("capitaliza el nombre visible sin cambiar su contrato", (valor, esperado) => {
    expect(capitalizarNombreVisible(valor)).toBe(esperado);
  });

  it.each([
    [{ rol: "super_admin" }, "/super-admin"],
    [{ rol: "admin", debe_cambiar_password: true }, "/cambiar-password"],
    [{ rol: "admin", debe_cambiar_password: false }, "/dashboard-admin"],
    [{ rol: "profesor" }, "/"],
    [{ rol: "desconocido" }, "/"],
    [{ rol: "admin", debe_cambiar_password: "false" }, "/cambiar-password"],
  ])("conserva el destino actual para %#", (respuesta, esperado) => {
    expect(obtenerRutaDespuesDeLogin(respuesta)).toBe(esperado);
  });
});
