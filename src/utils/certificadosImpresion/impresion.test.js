import { describe, expect, it } from "vitest";

import { API_BASE_URL } from "../../config/env";
import { normalizarCampoIdentidad, resolveAssetUrl } from "./impresion";

describe("utilidades puras de impresión", () => {
  it("conserva URLs absolutas y normaliza activos relativos del backend", () => {
    expect(resolveAssetUrl(null)).toBeNull();
    expect(resolveAssetUrl("https://cdn.test/logo.png")).toBe(
      "https://cdn.test/logo.png",
    );
    expect(resolveAssetUrl("HTTP://cdn.test/logo.png")).toBe(
      "HTTP://cdn.test/logo.png",
    );
    expect(resolveAssetUrl("/uploads/logo.png")).toBe(
      `${API_BASE_URL}/uploads/logo.png`,
    );
    expect(resolveAssetUrl("uploads/logo.png")).toBe(
      `${API_BASE_URL}/uploads/logo.png`,
    );
  });

  it("normaliza únicamente Código DANE al contrato numérico de 20 caracteres", () => {
    expect(normalizarCampoIdentidad("codigo_dane", "12a-34")).toBe("1234");
    expect(
      normalizarCampoIdentidad("codigo_dane", "123456789012345678901234"),
    ).toBe("12345678901234567890");
    expect(normalizarCampoIdentidad("nombre_institucion", " Colegio ")).toBe(
      " Colegio ",
    );
  });
});
