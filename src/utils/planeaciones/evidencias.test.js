import { describe, expect, it } from "vitest";
import {
  ACCEPT_EVIDENCIA,
  esEvidenciaPdf,
  MAX_BYTES_IMAGEN_EVIDENCIA,
  MAX_BYTES_PDF_EVIDENCIA,
  validarArchivoEvidencia,
} from "./evidencias";

function crearArchivo({ type, size, name = "evidencia" }) {
  return { type, size, name };
}

describe("contratos de evidencias de planeaciones", () => {
  it("ofrece imagenes y PDF en el selector de archivos", () => {
    expect(ACCEPT_EVIDENCIA).toContain("image/png");
    expect(ACCEPT_EVIDENCIA).toContain("application/pdf");
    expect(ACCEPT_EVIDENCIA).toContain(".pdf");
  });

  it("reconoce un PDF por la ruta guardada", () => {
    expect(esEvidenciaPdf("uploads/tenant/plan_de_clases/abc.pdf")).toBe(true);
    expect(esEvidenciaPdf("uploads/tenant/plan_de_clases/abc.PDF")).toBe(true);
    expect(esEvidenciaPdf("uploads/tenant/plan_de_clases/abc.pdf?v=2")).toBe(true);
    expect(esEvidenciaPdf("uploads/tenant/plan_de_clases/abc.webp")).toBe(false);
    expect(esEvidenciaPdf("uploads/tenant/pdf-taller/abc.png")).toBe(false);
    expect(esEvidenciaPdf("")).toBe(false);
    expect(esEvidenciaPdf(null)).toBe(false);
  });

  it("reconoce un PDF por el archivo elegido", () => {
    expect(esEvidenciaPdf(crearArchivo({ type: "application/pdf", size: 10 }))).toBe(
      true,
    );
    expect(
      esEvidenciaPdf(crearArchivo({ type: "image/png", size: 10, name: "a.png" })),
    ).toBe(false);
  });

  it("acepta imagen hasta 5MB y PDF hasta 15MB", () => {
    expect(
      validarArchivoEvidencia(
        crearArchivo({ type: "image/png", size: MAX_BYTES_IMAGEN_EVIDENCIA }),
      ).valido,
    ).toBe(true);
    expect(
      validarArchivoEvidencia(
        crearArchivo({ type: "application/pdf", size: MAX_BYTES_PDF_EVIDENCIA }),
      ).valido,
    ).toBe(true);
    expect(validarArchivoEvidencia(null).valido).toBe(true);
  });

  it("rechaza la imagen que pasa de 5MB sin confundirla con el tope del PDF", () => {
    const resultado = validarArchivoEvidencia(
      crearArchivo({ type: "image/png", size: MAX_BYTES_IMAGEN_EVIDENCIA + 1 }),
    );

    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toBe("La imagen no puede superar 5MB.");
  });

  it("rechaza el PDF que pasa de 15MB", () => {
    const resultado = validarArchivoEvidencia(
      crearArchivo({ type: "application/pdf", size: MAX_BYTES_PDF_EVIDENCIA + 1 }),
    );

    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toBe("El PDF no puede superar 15MB.");
  });

  it("rechaza cualquier otro tipo de archivo", () => {
    const resultado = validarArchivoEvidencia(
      crearArchivo({ type: "application/msword", size: 10, name: "taller.doc" }),
    );

    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toContain("PDF");
  });
});
