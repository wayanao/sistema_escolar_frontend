import { describe, expect, it } from "vitest";
import { capitalizarNombreVisible } from "./nombres";

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
