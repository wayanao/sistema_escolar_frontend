import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SelloFirma from "./SelloFirma";

const FIRMA = {
  firmante_nombre: "Maria Lopez",
  firmante_parentesco: "Madre",
  firmante_tipo_documento: "Cédula",
  firmante_documento_enmascarado: "****3456",
  firmada_en: new Date(2026, 9, 27, 10, 5).toISOString(),
  tomada_por_nombre: "Ana Gómez",
  integra: true,
};

describe("SelloFirma", () => {
  it("dice quién firmó, con el documento enmascarado, cuándo y ante quién", () => {
    render(<SelloFirma firma={FIRMA} />);

    expect(
      screen.getByText(
        "Firmada por Maria Lopez (Madre) · Cédula ****3456 · 27/oct/2026, 10:05 · ante Ana Gómez",
        { exact: false },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/no coincide/)).not.toBeInTheDocument();
  });

  it("si el texto cambió después de firmar, lo advierte en vez de darla por buena", () => {
    render(<SelloFirma firma={{ ...FIRMA, integra: false }} />);

    expect(
      screen.getByText("El texto ya no coincide con lo que se firmó. Avisa al administrador."),
    ).toBeInTheDocument();
  });

  it("sin firma no pinta nada", () => {
    const { container } = render(<SelloFirma firma={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
