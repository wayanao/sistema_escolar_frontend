import { describe, expect, it } from "vitest";

import {
  ALTO_MAXIMO_FIRMA,
  ANCHO_MAXIMO_FIRMA,
  brilloDelPapel,
  bytesDeDataUrl,
  COLOR_TINTA,
  formatearFechaFirma,
  limpiarPixelesFirma,
  luminancia,
  MARGEN_FIRMA,
  medidasDelRecorte,
  MENSAJE_FOTO_OSCURA,
  MENSAJE_SIN_FIRMA,
  mensajeErrorFirmaGuardada,
} from "./imagenFirma";

/** Una imagen RGBA de un solo color. */
function imagen(ancho, alto, [r, g, b, a = 255]) {
  const pixeles = new Uint8ClampedArray(ancho * alto * 4);
  for (let i = 0; i < pixeles.length; i += 4) {
    pixeles[i] = r;
    pixeles[i + 1] = g;
    pixeles[i + 2] = b;
    pixeles[i + 3] = a;
  }
  return pixeles;
}

function pintar(pixeles, ancho, x, y, [r, g, b, a = 255]) {
  const i = (y * ancho + x) * 4;
  pixeles[i] = r;
  pixeles[i + 1] = g;
  pixeles[i + 2] = b;
  pixeles[i + 3] = a;
}

function rectangulo(pixeles, ancho, { x, y, w, h }, color) {
  for (let fila = y; fila < y + h; fila += 1) {
    for (let col = x; col < x + w; col += 1) pintar(pixeles, ancho, col, fila, color);
  }
}

function opacidad(pixeles, ancho, x, y) {
  return pixeles[(y * ancho + x) * 4 + 3];
}

const PAPEL = [230, 230, 225];
const TINTA_AZUL = [30, 40, 120];

describe("brillo", () => {
  it("el negro es 0 y el blanco 255", () => {
    expect(luminancia(0, 0, 0)).toBe(0);
    expect(Math.round(luminancia(255, 255, 255))).toBe(255);
  });

  it("el papel es la mediana: la firma, que ocupa poco, no lo cambia", () => {
    const pixeles = imagen(10, 10, PAPEL);
    rectangulo(pixeles, 10, { x: 0, y: 0, w: 10, h: 2 }, [0, 0, 0]);
    expect(brilloDelPapel(pixeles)).toBe(Math.round(luminancia(...PAPEL)));
  });

  it("lo transparente cuenta como papel blanco", () => {
    expect(brilloDelPapel(imagen(4, 4, [0, 0, 0, 0]))).toBe(255);
  });
});

describe("limpiarPixelesFirma", () => {
  it("deja la tinta del color parejo y el papel transparente", () => {
    const pixeles = imagen(40, 20, PAPEL);
    rectangulo(pixeles, 40, { x: 10, y: 5, w: 20, h: 6 }, TINTA_AZUL);

    const { pixeles: limpios, caja, error } = limpiarPixelesFirma(pixeles, 40, 20);

    expect(error).toBeNull();
    expect(caja).toEqual({ x: 10, y: 5, ancho: 20, alto: 6 });
    const i = (5 * 40 + 10) * 4;
    expect([limpios[i], limpios[i + 1], limpios[i + 2], limpios[i + 3]]).toEqual([...COLOR_TINTA, 255]);
    expect(opacidad(limpios, 40, 0, 0)).toBe(0);
    expect(opacidad(limpios, 40, 39, 19)).toBe(0);
  });

  it("una sombra suave del papel no es tinta", () => {
    const pixeles = imagen(40, 20, PAPEL);
    rectangulo(pixeles, 40, { x: 0, y: 0, w: 40, h: 8 }, [175, 175, 170]);
    rectangulo(pixeles, 40, { x: 10, y: 12, w: 20, h: 4 }, TINTA_AZUL);

    const { caja } = limpiarPixelesFirma(pixeles, 40, 20);

    expect(caja).toEqual({ x: 10, y: 12, ancho: 20, alto: 4 });
  });

  it("con luz desigual y una sombra fuerte en una esquina, solo la firma es tinta", () => {
    // Visto el 2026-11-12 con una foto de prueba: medida contra el papel de
    // toda la foto, la sombra de la esquina pasaba por tinta y el recorte se
    // estiraba hasta ella.
    const ancho = 160;
    const alto = 96;
    const pixeles = imagen(ancho, alto, PAPEL);
    for (let y = 0; y < alto; y += 1) {
      for (let x = 0; x < ancho; x += 1) {
        const luz = 230 - (x / ancho) * 70; // de 230 a 160, de izquierda a derecha
        const sombra = x > 120 && y > 64 ? 55 : 0; // esquina abajo a la derecha
        const brillo = luz - sombra;
        pintar(pixeles, ancho, x, y, [brillo, brillo, brillo - 5]);
      }
    }
    rectangulo(pixeles, ancho, { x: 20, y: 20, w: 90, h: 8 }, TINTA_AZUL);

    expect(limpiarPixelesFirma(pixeles, ancho, alto).caja).toEqual({ x: 20, y: 20, ancho: 90, alto: 8 });
  });

  it("una foto oscura de lado a lado no sirve", () => {
    const { caja, error } = limpiarPixelesFirma(imagen(40, 40, [40, 40, 40]), 40, 40);

    expect(caja).toBeNull();
    expect(error).toBe(MENSAJE_FOTO_OSCURA);
  });

  it("los bordes grises quedan a medio transparentar, sin dientes", () => {
    const pixeles = imagen(40, 20, [255, 255, 255]);
    rectangulo(pixeles, 40, { x: 10, y: 5, w: 20, h: 6 }, [0, 0, 0]);
    pintar(pixeles, 40, 9, 7, [150, 150, 150]);

    const { pixeles: limpios } = limpiarPixelesFirma(pixeles, 40, 20);

    const borde = opacidad(limpios, 40, 9, 7);
    expect(borde).toBeGreaterThan(0);
    expect(borde).toBeLessThan(255);
  });

  it("un punto suelto (polvo, grano del papel) no agranda el recorte", () => {
    const pixeles = imagen(40, 20, PAPEL);
    rectangulo(pixeles, 40, { x: 10, y: 5, w: 20, h: 6 }, TINTA_AZUL);
    pintar(pixeles, 40, 38, 18, [0, 0, 0]);

    expect(limpiarPixelesFirma(pixeles, 40, 20).caja).toEqual({ x: 10, y: 5, ancho: 20, alto: 6 });
  });

  it("el polvo junto a la firma también se borra de la imagen", () => {
    const pixeles = imagen(40, 20, PAPEL);
    rectangulo(pixeles, 40, { x: 10, y: 5, w: 20, h: 6 }, TINTA_AZUL);
    rectangulo(pixeles, 40, { x: 33, y: 2, w: 2, h: 2 }, [0, 0, 0]);

    const { pixeles: limpios } = limpiarPixelesFirma(pixeles, 40, 20);

    expect(opacidad(limpios, 40, 33, 2)).toBe(0);
  });

  it("una mancha del tamaño del punto de una «i» se queda", () => {
    const pixeles = imagen(60, 30, PAPEL);
    rectangulo(pixeles, 60, { x: 5, y: 15, w: 40, h: 4 }, TINTA_AZUL);
    rectangulo(pixeles, 60, { x: 50, y: 3, w: 5, h: 5 }, TINTA_AZUL);

    expect(limpiarPixelesFirma(pixeles, 60, 30).caja).toEqual({ x: 5, y: 3, ancho: 50, alto: 16 });
  });

  it("con el trazo del dedo (sin quitar motas) un toque corto se conserva", () => {
    const pixeles = imagen(60, 30, [255, 255, 255]);
    rectangulo(pixeles, 60, { x: 5, y: 15, w: 40, h: 4 }, [15, 23, 42]);
    rectangulo(pixeles, 60, { x: 50, y: 3, w: 2, h: 2 }, [15, 23, 42]);

    const { caja } = limpiarPixelesFirma(pixeles, 60, 30, { areaMinimaMota: 0 });

    expect(caja).toEqual({ x: 5, y: 3, ancho: 47, alto: 16 });
  });

  it("una hoja en blanco no tiene firma", () => {
    const { caja, error } = limpiarPixelesFirma(imagen(30, 10, PAPEL), 30, 10);
    expect(caja).toBeNull();
    expect(error).toBe(MENSAJE_SIN_FIRMA);
  });

  it("si casi todo es oscuro, la foto no sirve", () => {
    const pixeles = imagen(20, 20, PAPEL);
    rectangulo(pixeles, 20, { x: 0, y: 0, w: 20, h: 9 }, [10, 10, 10]);

    const { caja, error } = limpiarPixelesFirma(pixeles, 20, 20);

    expect(caja).toBeNull();
    expect(error).toBe(MENSAJE_FOTO_OSCURA);
  });

  it("el trazo del recuadro (oscuro sobre blanco) sale entero", () => {
    const pixeles = imagen(90, 30, [255, 255, 255]);
    rectangulo(pixeles, 90, { x: 5, y: 10, w: 80, h: 3 }, [15, 23, 42]);

    expect(limpiarPixelesFirma(pixeles, 90, 30).caja).toEqual({ x: 5, y: 10, ancho: 80, alto: 3 });
  });
});

describe("medidasDelRecorte", () => {
  it("agrega el margen sin salirse de la imagen y no agranda lo pequeño", () => {
    const { origen, final } = medidasDelRecorte({ x: 2, y: 20, ancho: 100, alto: 30 }, 200, 55);

    expect(origen).toEqual({ x: 0, y: 20 - MARGEN_FIRMA, ancho: 102 + MARGEN_FIRMA, alto: 55 - 12 });
    expect(final).toEqual({ ancho: origen.ancho, alto: origen.alto });
  });

  it("achica lo grande para que quepa en 900 × 300, sin deformar", () => {
    const { origen, final } = medidasDelRecorte({ x: 100, y: 100, ancho: 1400, alto: 300 }, 1600, 600);

    expect(final.ancho).toBeLessThanOrEqual(ANCHO_MAXIMO_FIRMA);
    expect(final.alto).toBeLessThanOrEqual(ALTO_MAXIMO_FIRMA);
    expect(final.ancho / final.alto).toBeCloseTo(origen.ancho / origen.alto, 1);
  });

  it("con una escala menor, sale más pequeña (para reintentar si pesa mucho)", () => {
    const caja = { x: 100, y: 100, ancho: 1400, alto: 300 };
    const normal = medidasDelRecorte(caja, 1600, 600).final;
    const menor = medidasDelRecorte(caja, 1600, 600, 0.5).final;

    expect(menor.ancho).toBeLessThan(normal.ancho);
  });
});

describe("bytesDeDataUrl", () => {
  it("cuenta los bytes de verdad, sin el prefijo ni el relleno", () => {
    expect(bytesDeDataUrl(`data:image/png;base64,${btoa("abc")}`)).toBe(3);
    expect(bytesDeDataUrl(`data:image/png;base64,${btoa("abcd")}`)).toBe(4);
    expect(bytesDeDataUrl(`data:image/png;base64,${btoa("abcde")}`)).toBe(5);
    expect(bytesDeDataUrl("")).toBe(0);
  });
});

describe("formatearFechaFirma", () => {
  it("dice el día en palabras", () => {
    expect(formatearFechaFirma("2026-11-12T15:30:00+00:00")).toBe("12 de noviembre de 2026");
  });

  it("sin fecha o con una mala, no dice nada", () => {
    expect(formatearFechaFirma(null)).toBe("");
    expect(formatearFechaFirma("ayer")).toBe("");
  });
});

describe("mensajeErrorFirmaGuardada", () => {
  it("usa el texto del servidor tal cual", () => {
    const error = { response: { data: { detail: "No tienes los permisos necesarios" } } };
    expect(mensajeErrorFirmaGuardada(error, "otro")).toBe("No tienes los permisos necesarios");
  });

  it("de un 422 toma el mensaje de la imagen, sin el «Value error»", () => {
    const error = {
      response: {
        status: 422,
        data: {
          detail: [
            { msg: "Value error, La firma pesa demasiado. Vuelve a firmar o sube otra foto." },
          ],
        },
      },
    };
    expect(mensajeErrorFirmaGuardada(error, "otro")).toBe(
      "La firma pesa demasiado. Vuelve a firmar o sube otra foto.",
    );
  });

  it("sin respuesta del servidor, el mensaje por defecto", () => {
    expect(mensajeErrorFirmaGuardada(new Error("Network Error"), "No se pudo.")).toBe("No se pudo.");
  });
});
