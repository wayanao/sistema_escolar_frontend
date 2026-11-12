import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_BYTES_FIRMA,
  MENSAJE_FIRMA_PESADA,
  MENSAJE_FOTO_ILEGIBLE,
  MENSAJE_SIN_FIRMA,
} from "../../utils/firmas/imagenFirma";
import { prepararFirma } from "./lienzoFirma";

// jsdom no dibuja: el canvas se cambia por uno falso que devuelve los píxeles
// que se le den y anota cada dibujo. `ImageData` tampoco existe en jsdom.

function pixelesConFirma(ancho, alto) {
  const pixeles = new Uint8ClampedArray(ancho * alto * 4).fill(255);
  for (let y = Math.floor(alto / 3); y < Math.floor(alto / 2); y += 1) {
    for (let x = Math.floor(ancho / 4); x < Math.floor((ancho * 3) / 4); x += 1) {
      const i = (y * ancho + x) * 4;
      pixeles[i] = 20;
      pixeles[i + 1] = 20;
      pixeles[i + 2] = 60;
    }
  }
  return pixeles;
}

let lienzos;
let pixelesDeLaFoto;
let pesoDeCadaSalida;

beforeEach(() => {
  lienzos = [];
  pesoDeCadaSalida = [];
  globalThis.ImageData = class {
    constructor(data, width, height) {
      Object.assign(this, { data, width, height });
    }
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function getContext() {
    const lienzo = this;
    lienzos.push(lienzo);
    return {
      drawImage: vi.fn((...args) => {
        lienzo.dibujado = args;
      }),
      getImageData: vi.fn(() => ({ data: pixelesDeLaFoto })),
      putImageData: vi.fn(),
    };
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(() => {
    const bytes = pesoDeCadaSalida.shift() ?? 300;
    return `data:image/png;base64,${"A".repeat(Math.ceil((bytes * 4) / 3))}`;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.ImageData;
});

const fotoDe = (ancho, alto) => async () => ({ naturalWidth: ancho, naturalHeight: alto });

describe("prepararFirma", () => {
  it("achica la foto grande antes de limpiarla y devuelve un PNG", async () => {
    pixelesDeLaFoto = pixelesConFirma(1600, 1200);

    const imagen = await prepararFirma("foto", { cargar: fotoDe(4000, 3000) });

    expect(imagen.startsWith("data:image/png;base64,")).toBe(true);
    const [lectura] = lienzos;
    expect([lectura.width, lectura.height]).toEqual([1600, 1200]);
  });

  it("el lienzo final es el recorte de la firma, no la foto entera", async () => {
    pixelesDeLaFoto = pixelesConFirma(800, 600);

    await prepararFirma("foto", { cargar: fotoDe(800, 600) });

    const salida = lienzos.at(-1);
    expect(salida.width).toBeLessThan(800);
    expect(salida.height).toBeLessThan(600);
  });

  it("si pesa más de 100 KB, la reintenta más pequeña", async () => {
    pixelesDeLaFoto = pixelesConFirma(1600, 1200);
    pesoDeCadaSalida = [MAX_BYTES_FIRMA + 1, 2000];

    const imagen = await prepararFirma("foto", { cargar: fotoDe(1600, 1200) });

    expect(imagen).toBeTruthy();
    const salidas = lienzos.slice(2);
    expect(salidas).toHaveLength(2);
    expect(salidas[1].width).toBeLessThan(salidas[0].width);
  });

  it("si nunca baja de 100 KB, lo dice", async () => {
    pixelesDeLaFoto = pixelesConFirma(1600, 1200);
    pesoDeCadaSalida = [MAX_BYTES_FIRMA + 1, MAX_BYTES_FIRMA + 1, MAX_BYTES_FIRMA + 1];

    await expect(prepararFirma("foto", { cargar: fotoDe(1600, 1200) })).rejects.toThrow(
      MENSAJE_FIRMA_PESADA,
    );
  });

  it("una hoja sin firma no se guarda", async () => {
    pixelesDeLaFoto = new Uint8ClampedArray(200 * 100 * 4).fill(255);

    await expect(prepararFirma("foto", { cargar: fotoDe(200, 100) })).rejects.toThrow(
      MENSAJE_SIN_FIRMA,
    );
  });

  it("una imagen que no abre da un mensaje claro", async () => {
    await expect(prepararFirma("foto", { cargar: fotoDe(0, 0) })).rejects.toThrow(
      MENSAJE_FOTO_ILEGIBLE,
    );
  });
});
