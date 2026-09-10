import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COLOR_SIN_PROFESOR,
  COLORES_PROFESOR,
  colorDeProfesor,
} from "./coloresProfesor";

describe("color por profesor", () => {
  it("el mismo profesor sale siempre del mismo color", () => {
    // Es lo que hace que el color signifique algo: en la bitácora de cualquier
    // alumno, esa profesora es del mismo tono.
    expect(colorDeProfesor(39)).toBe(colorDeProfesor(39));
    expect(colorDeProfesor("39")).toBe(colorDeProfesor(39));
  });

  it("sale del id y no del nombre", () => {
    // Dos profesoras que se llamen igual no comparten color, y cambiarle el
    // nombre a una no le cambia el suyo.
    expect(colorDeProfesor(7)).not.toBe(colorDeProfesor(8));
  });

  it("separa a los profesores de un curso real, que llevan ids seguidos", () => {
    // Los cinco de TERCERO en tenant_2005, el curso con más docentes. Medido:
    // con estos ids el reparto por resto no junta a ninguno.
    const tercero = [39, 42, 44, 45, 48].map(colorDeProfesor);

    expect(new Set(tercero).size).toBe(5);
  });

  it("separa también ids consecutivos, que es el caso normal", () => {
    const seguidos = [39, 40, 41, 42, 43].map(colorDeProfesor);

    expect(new Set(seguidos).size).toBe(5);
  });

  it("ofrece más colores que docentes caben en un curso", () => {
    // El curso con más profesores tiene 5, medido contra la base real.
    expect(COLORES_PROFESOR.length).toBeGreaterThanOrEqual(8);
    expect(new Set(COLORES_PROFESOR).size).toBe(COLORES_PROFESOR.length);
  });

  it("las clases van literales en el CODIGO, o Tailwind no genera el CSS", () => {
    // Tailwind lee el codigo fuente para decidir que CSS genera, asi que esto
    // hay que comprobarlo en el archivo y no en el valor: componerlas
    // -`text-${color}-700`- da exactamente la misma cadena en memoria y aun asi
    // deja el nombre sin color, sin ningun error que lo avise.
    const fuente = readFileSync(
      resolve(process.cwd(), "src/utils/observador/coloresProfesor.js"),
      "utf8",
    );
    const paleta = fuente.slice(
      fuente.indexOf("COLORES_PROFESOR = ["),
      fuente.indexOf("];", fuente.indexOf("COLORES_PROFESOR = [")),
    );

    expect(paleta).not.toContain("`");
    expect(paleta).not.toContain("${");
    COLORES_PROFESOR.forEach((clase) => {
      expect(paleta).toContain(`"${clase}"`);
    });
  });

  it("nunca se queda sin clase, pase lo que pase", () => {
    expect(colorDeProfesor(null)).toBe(COLOR_SIN_PROFESOR);
    expect(colorDeProfesor(undefined)).toBe(COLOR_SIN_PROFESOR);
    expect(colorDeProfesor("")).toBe(COLOR_SIN_PROFESOR);
    expect(colorDeProfesor("hola")).toBe(COLOR_SIN_PROFESOR);
    expect(COLORES_PROFESOR).toContain(colorDeProfesor(-5));
  });
});
