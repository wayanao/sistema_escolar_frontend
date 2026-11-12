import { describe, expect, it } from "vitest";

import {
  AVISO_SIN_FIRMA_RECTOR,
  avisosDeFirmas,
  CARGO_DIRECTOR_GRUPO,
  ETIQUETA_DIRECTOR_GRUPO,
  firmasDelBoletin,
} from "./firmasBoletin";

const CON_FIRMANTE = {
  configuracion_extra: { firmante_nombre: "  María Pérez Gómez ", firmante_cargo: "Rectora" },
};
const RECTOR = "data:image/png;base64,rector";
const DIRECTOR = "data:image/png;base64,director";

describe("firmasDelBoletin", () => {
  it("con todo configurado: nombre, cargo y la imagen de cada uno", () => {
    expect(
      firmasDelBoletin(
        { director_grupo: "Ana Gómez", firma_institucional: RECTOR, firma_director_grupo: DIRECTOR },
        CON_FIRMANTE,
      ),
    ).toEqual([
      { nombre: "María Pérez Gómez", cargo: "Rectora", imagen: RECTOR },
      { nombre: "Ana Gómez", cargo: CARGO_DIRECTOR_GRUPO, imagen: DIRECTOR },
    ]);
  });

  it("sin nada configurado sale lo de siempre: «Director(a)» y «Director de Grupo», sin imagen", () => {
    expect(firmasDelBoletin({}, null)).toEqual([
      { nombre: "Director(a)", imagen: null },
      { nombre: ETIQUETA_DIRECTOR_GRUPO, imagen: null },
    ]);
  });

  it("con cargo pero sin nombre, el cargo hace de etiqueta", () => {
    const [rector] = firmasDelBoletin(
      { firma_institucional: RECTOR },
      { configuracion_extra: { firmante_cargo: "Rectora" } },
    );
    expect(rector).toEqual({ nombre: "Rectora", imagen: RECTOR });
  });
});

describe("avisosDeFirmas", () => {
  it("con las dos firmas no hay nada que avisar", () => {
    expect(
      avisosDeFirmas({ director_grupo: "Ana", firma_institucional: RECTOR, firma_director_grupo: DIRECTOR }),
    ).toEqual([]);
  });

  it("dice cuál falta y dónde se pone", () => {
    const avisos = avisosDeFirmas({ director_grupo: "Ana Gómez" });
    expect(avisos).toHaveLength(2);
    expect(avisos[0]).toBe(AVISO_SIN_FIRMA_RECTOR);
    expect(avisos[0]).toContain("Identidad institucional");
    expect(avisos[1]).toContain("(Ana Gómez)");
    expect(avisos[1]).toContain("«Mi curso»");
  });

  it("sin director de grupo no hay a quién pedirle firma", () => {
    expect(avisosDeFirmas({ firma_institucional: RECTOR })).toEqual([]);
    expect(avisosDeFirmas({ director_grupo: "  " })).toEqual([AVISO_SIN_FIRMA_RECTOR]);
  });
});
