import { describe, expect, it } from "vitest";
import {
  ERRORES_NOMBRE_COLUMNA,
  LIMITE_NOMBRE_COLUMNA,
  normalizarNombreColumna,
  validarNombreColumna,
} from "./columnas";

const columnas = [
  { id: 5, nombre: "Asistió a la cumbre" },
  { id: 6, nombre: "Compró el libro" },
];

describe("normalizarNombreColumna", () => {
  it("quita los espacios de los extremos y sube a mayúsculas", () => {
    expect(normalizarNombreColumna("  Compró el libro  ")).toBe("COMPRÓ EL LIBRO");
  });

  it("colapsa los espacios interiores repetidos", () => {
    expect(normalizarNombreColumna("Compró   el    libro")).toBe("COMPRÓ EL LIBRO");
  });

  it("trata saltos y tabuladores como espacios, igual que el índice", () => {
    expect(normalizarNombreColumna("Compró\tel\nlibro")).toBe("COMPRÓ EL LIBRO");
  });

  it("no revienta con nulo ni indefinido", () => {
    expect(normalizarNombreColumna(null)).toBe("");
    expect(normalizarNombreColumna(undefined)).toBe("");
  });
});

describe("validarNombreColumna", () => {
  it("acepta un nombre nuevo y lo devuelve recortado", () => {
    expect(validarNombreColumna("  Fue a la salida  ", columnas)).toEqual({
      valido: true,
      nombre: "Fue a la salida",
      error: null,
    });
  });

  it("rechaza el vacío y el que solo tiene espacios", () => {
    for (const vacio of ["", "   ", "\t\n"]) {
      expect(validarNombreColumna(vacio, columnas)).toMatchObject({
        valido: false,
        error: ERRORES_NOMBRE_COLUMNA.VACIO,
      });
    }
  });

  it("acepta exactamente el límite y rechaza uno más", () => {
    const justo = "A".repeat(LIMITE_NOMBRE_COLUMNA);
    const pasado = "A".repeat(LIMITE_NOMBRE_COLUMNA + 1);

    expect(validarNombreColumna(justo, [])).toMatchObject({ valido: true });
    expect(validarNombreColumna(pasado, [])).toMatchObject({
      valido: false,
      error: ERRORES_NOMBRE_COLUMNA.LARGO,
    });
  });

  it("mide después de recortar, igual que el backend", () => {
    const justo = `   ${"A".repeat(LIMITE_NOMBRE_COLUMNA)}   `;

    expect(validarNombreColumna(justo, [])).toMatchObject({ valido: true });
  });

  it("detecta el duplicado exacto", () => {
    expect(validarNombreColumna("Compró el libro", columnas)).toMatchObject({
      valido: false,
      error: ERRORES_NOMBRE_COLUMNA.DUPLICADO,
    });
  });

  it("detecta el duplicado con otras mayúsculas", () => {
    expect(validarNombreColumna("compró EL libro", columnas)).toMatchObject({
      valido: false,
      error: ERRORES_NOMBRE_COLUMNA.DUPLICADO,
    });
  });

  it("detecta el duplicado con espacios interiores de sobra", () => {
    // El caso que la regla de la planilla dejaría pasar: ahí se compara con
    // trim().toLowerCase() y "Compró  el libro" parecería libre, hasta que el
    // servidor respondiera 409.
    expect(validarNombreColumna("Compró  el  libro", columnas)).toMatchObject({
      valido: false,
      error: ERRORES_NOMBRE_COLUMNA.DUPLICADO,
    });
  });

  it("no se confunde con una columna de nombre parecido", () => {
    expect(validarNombreColumna("Compró el libro 2", columnas)).toMatchObject({
      valido: true,
    });
  });

  it("funciona sin columnas cargadas todavía", () => {
    expect(validarNombreColumna("Primera")).toMatchObject({ valido: true });
  });

  it("aguanta una columna sin nombre en la lista", () => {
    expect(validarNombreColumna("Nueva", [{ id: 1 }, null])).toMatchObject({
      valido: true,
    });
  });
});
