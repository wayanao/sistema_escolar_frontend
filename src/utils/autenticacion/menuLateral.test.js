import { describe, expect, it } from "vitest";
import {
  MODOS_MENU,
  calcularModoMenu,
  leerPreferenciaMenu,
  obtenerIniciales,
} from "./menuLateral";

const CELULAR = { desdeTablet: false, desdePortatil: false, desdePc: false, conAlto: true };
const CELULAR_ACOSTADO = { desdeTablet: true, desdePortatil: false, desdePc: false, conAlto: false };
const TABLET = { desdeTablet: true, desdePortatil: false, desdePc: false, conAlto: true };
const PORTATIL = { desdeTablet: true, desdePortatil: true, desdePc: false, conAlto: true };
const PC = { desdeTablet: true, desdePortatil: true, desdePc: true, conAlto: true };

describe("modo del menú lateral", () => {
  it.each([
    ["celular", CELULAR, null, MODOS_MENU.CELULAR],
    ["celular aunque haya elegido abierto", CELULAR, "abierto", MODOS_MENU.CELULAR],
    ["celular acostado: ancho de tablet, sin alto para el riel", CELULAR_ACOSTADO, null, MODOS_MENU.CELULAR],
    ["tablet vertical", TABLET, null, MODOS_MENU.RIEL],
    ["tablet vertical aunque haya elegido abierto", TABLET, "abierto", MODOS_MENU.RIEL],
    ["portátil pequeño", PORTATIL, null, MODOS_MENU.RIEL],
    ["portátil pequeño con el menú abierto", PORTATIL, "abierto", MODOS_MENU.ABIERTO],
    ["PC", PC, null, MODOS_MENU.ABIERTO],
    ["PC con el menú encogido", PC, "riel", MODOS_MENU.RIEL],
    ["PC con una preferencia que no existe", PC, "flotante", MODOS_MENU.ABIERTO],
  ])("%s", (_caso, pantalla, preferencia, esperado) => {
    expect(calcularModoMenu({ ...pantalla, preferencia })).toBe(esperado);
  });

  it("solo acepta como preferencia guardada el riel o el menú abierto", () => {
    expect(leerPreferenciaMenu("riel")).toBe("riel");
    expect(leerPreferenciaMenu("abierto")).toBe("abierto");
    expect(leerPreferenciaMenu("celular")).toBeNull();
    expect(leerPreferenciaMenu(null)).toBeNull();
    expect(leerPreferenciaMenu("")).toBeNull();
  });
});

describe("iniciales de la tarjeta del usuario", () => {
  it.each([
    ["María Gómez", "MG"],
    ["  ana  maría   pérez ", "AP"],
    ["Rector", "R"],
    ["óscar díaz", "ÓD"],
    ["", ""],
    [null, ""],
    [undefined, ""],
  ])("%j da %j", (nombre, esperado) => {
    expect(obtenerIniciales(nombre)).toBe(esperado);
  });
});
