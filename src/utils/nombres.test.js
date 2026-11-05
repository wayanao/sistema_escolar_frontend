import { describe, expect, it } from "vitest";
import { capitalizarNombreVisible, capitalizarPalabras, primeraMayuscula } from "./nombres";

describe("capitalizarNombreVisible", () => {
  it.each([
    ["david rodriguez", "David Rodriguez"],
    ["  mARÍA   DEL pILAR ", "María Del Pilar"],
    ["ÁNGEL", "Ángel"],
    ["óscar núñez", "Óscar Núñez"],
    ["maría-josé pérez", "María-José Pérez"],
    ["o'neil", "O'Neil"],
    ["", ""],
    [null, ""],
    [undefined, ""],
  ])("%j se muestra como %j", (valor, esperado) => {
    expect(capitalizarNombreVisible(valor)).toBe(esperado);
  });
});

describe("primeraMayuscula", () => {
  it.each([
    ["  pensión mensual ", "Pensión mensual"],
    ["uniforme ICFES", "Uniforme ICFES"],
    ["Kit de útiles", "Kit de útiles"],
    ["ánfora", "Ánfora"],
    ["2 cuadernos", "2 cuadernos"],
    ["   ", ""],
    [null, ""],
  ])("%j queda %j", (valor, esperado) => {
    expect(primeraMayuscula(valor)).toBe(esperado);
  });
});

describe("capitalizarPalabras", () => {
  it.each([
    ["villa del rosario", "Villa Del Rosario"],
    ["  bogotá   D.C. ", "Bogotá D.C."],
    ["SAN JOSÉ", "SAN JOSÉ"],
    ["", ""],
    [undefined, ""],
  ])("%j queda %j", (valor, esperado) => {
    expect(capitalizarPalabras(valor)).toBe(esperado);
  });
});
