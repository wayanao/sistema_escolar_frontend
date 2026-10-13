import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AvisoTrabajandoView from "./AvisoTrabajandoView";
import SpinnerView from "./SpinnerView";

describe("SpinnerView y AvisoTrabajandoView", () => {
  it("el spinner es decorativo: gira y los lectores de pantalla lo ignoran", () => {
    render(<SpinnerView />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).toHaveClass("animate-spin");
  });

  it("el aviso dice qué está pasando, con su spinner", () => {
    render(
      <AvisoTrabajandoView
        titulo="Copiando la configuración de 2026 a 2027..."
        detalle="Puede tardar unos segundos."
      />,
    );

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("Copiando la configuración de 2026 a 2027...");
    expect(aviso).toHaveTextContent("Puede tardar unos segundos.");
    expect(within(aviso).getByTestId("spinner")).toBeInTheDocument();
  });
});
