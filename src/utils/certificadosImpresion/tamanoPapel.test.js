import { describe, expect, it } from "vitest";

import { obtenerTamanoPapel, reglaTamanoPapel, TAMANOS_PAPEL } from "./tamanoPapel";

describe("tamanoPapel", () => {
  it("el oficio es el colombiano de 21,6 × 33 cm, no el Legal de 35,6 cm", () => {
    expect(obtenerTamanoPapel({ tamano_papel: "oficio" })).toMatchObject({
      anchoMm: 215.9,
      altoMm: 330.2,
    });
    expect(obtenerTamanoPapel({ tamano_papel: "legal" }).altoMm).toBe(355.6);
  });

  it("sin tamaño, o con uno desconocido, deja el papel a la ventana de imprimir", () => {
    expect(obtenerTamanoPapel({})).toBeNull();
    expect(obtenerTamanoPapel({ tamano_papel: "" })).toBeNull();
    expect(obtenerTamanoPapel({ tamano_papel: "tabloide" })).toBeNull();
    expect(obtenerTamanoPapel()).toBeNull();
    expect(reglaTamanoPapel(null)).toBe("");
  });

  it("traduce el tamaño a la regla @page que usa el navegador al imprimir", () => {
    expect(reglaTamanoPapel(obtenerTamanoPapel({ tamano_papel: "oficio" }))).toBe(
      "@media print { @page { size: 215.9mm 330.2mm; } }",
    );
  });

  it("cada opción tiene un valor único", () => {
    const valores = TAMANOS_PAPEL.map((tamano) => tamano.valor);
    expect(new Set(valores).size).toBe(valores.length);
  });
});
