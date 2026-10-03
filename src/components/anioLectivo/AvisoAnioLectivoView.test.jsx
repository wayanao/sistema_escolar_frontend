import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AvisoAnioLectivoView from "./AvisoAnioLectivoView";

describe("AvisoAnioLectivoView", () => {
  it("no agrega contenido cuando no recibe aviso", () => {
    const { container } = render(<AvisoAnioLectivoView aviso={null} onVolver={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el mensaje y vuelve al año activo con su botón", async () => {
    const user = userEvent.setup();
    const onVolver = vi.fn();
    render(
      <AvisoAnioLectivoView
        aviso={{
          mensaje: "Estás viendo el año 2025 (cerrado). Solo consulta.",
          textoVolver: "Volver a 2026",
        }}
        onVolver={onVolver}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Estás viendo el año 2025 (cerrado). Solo consulta.",
    );
    await user.click(screen.getByRole("button", { name: "Volver a 2026" }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });
});
