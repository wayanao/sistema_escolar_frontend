import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DeudasAniosAnterioresView from "./DeudasAniosAnterioresView";

describe("DeudasAniosAnterioresView", () => {
  it("separa cada año y sus conceptos sin mezclarlos con el total actual", () => {
    render(
      <DeudasAniosAnterioresView
        deudasAnios={[
          {
            anio_lectivo_id: 1,
            anio: 2026,
            total_deuda: 400000,
            deudas: [
              { concepto: "Pensión", deuda: 400000 },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Deudas de años anteriores" })).toBeInTheDocument();
    expect(screen.getByText("Año 2026")).toBeInTheDocument();
    expect(screen.getByText("Pensión")).toBeInTheDocument();
    expect(screen.getAllByText("$400.000")).toHaveLength(2);
  });

  it("no ocupa espacio cuando no hay deuda anterior", () => {
    const { container } = render(<DeudasAniosAnterioresView deudasAnios={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
