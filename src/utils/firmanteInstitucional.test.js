import { describe, expect, it } from "vitest";

import { CARGO_FIRMANTE_POR_DEFECTO, firmanteInstitucional } from "./firmanteInstitucional";

describe("firmanteInstitucional", () => {
  it("lee nombre, documento y cargo de la identidad, sin espacios sobrantes", () => {
    expect(
      firmanteInstitucional({
        configuracion_extra: {
          firmante_nombre: " Ana Ruiz ",
          firmante_documento: "C.C. 1",
          firmante_cargo: "Rectora ",
        },
      }),
    ).toEqual({ nombre: "Ana Ruiz", documento: "C.C. 1", cargo: "Rectora" });
  });

  it("sin configurar, todo vacío menos el cargo, que dice «Director(a)» como siempre", () => {
    expect(CARGO_FIRMANTE_POR_DEFECTO).toBe("Director(a)");
    expect(firmanteInstitucional(null)).toEqual({ nombre: "", documento: "", cargo: "Director(a)" });
    expect(firmanteInstitucional({ configuracion_extra: { firmante_nombre: 5 } }).nombre).toBe("");
  });
});
