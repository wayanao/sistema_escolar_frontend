import { describe, expect, it } from "vitest";
import { normalizarRutaImagen } from "./imagenes";

describe("utilidades de imágenes de planeaciones", () => {
  it("conserva rutas vacías, blobs y datos embebidos", () => {
    expect(normalizarRutaImagen("")).toBe("");
    expect(normalizarRutaImagen(null)).toBe("");
    expect(normalizarRutaImagen("blob:imagen-protegida")).toBe(
      "blob:imagen-protegida",
    );
    expect(normalizarRutaImagen("data:image/png;base64,AA==")).toBe(
      "data:image/png;base64,AA==",
    );
  });

  it("elimina el origen y el hash de URLs HTTP sin perder path ni query", () => {
    expect(normalizarRutaImagen(
      "https://api.auligo.test/evidencias/plan-91.webp?version=3#detalle",
    )).toBe("/evidencias/plan-91.webp?version=3");
    expect(normalizarRutaImagen(
      "http://api.auligo.test/evidencias/plan-92.png",
    )).toBe("/evidencias/plan-92.png");
  });

  it("normaliza barras y conserva un único slash inicial en rutas relativas", () => {
    expect(normalizarRutaImagen("evidencias\\plan-93.png")).toBe(
      "/evidencias/plan-93.png",
    );
    expect(normalizarRutaImagen("///evidencias/plan-94.png")).toBe(
      "/evidencias/plan-94.png",
    );
  });

  it("conserva una URL HTTP inválida para mantener el fallback actual", () => {
    expect(normalizarRutaImagen("https://")).toBe("https://");
  });
});
