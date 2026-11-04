import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SelectorAnioPago from "./SelectorAnioPago";

const ANIOS = [
  { id: 2, anio: 2027, estado: "preparacion" },
  { id: 1, anio: 2026, estado: "activo" },
];

describe("SelectorAnioPago", () => {
  it("muestra cada año como una pestaña pequeña y marca el elegido", () => {
    const onCambiar = vi.fn();
    render(
      <SelectorAnioPago
        anios={ANIOS}
        anioSeleccionado={ANIOS[1]}
        esAnioActivo
        onCambiar={onCambiar}
      />
    );

    const grupo = screen.getByRole("group", { name: "Año del pago" });
    expect(within(grupo).getByRole("button", { name: "2026 activo" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const preparacion = within(grupo).getByRole("button", { name: "2027 en preparación" });
    expect(preparacion).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/ventas de inventario/)).not.toBeInTheDocument();

    fireEvent.click(preparacion);

    expect(onCambiar).toHaveBeenCalledWith(2);
  });

  it("en otro año avisa que las ventas son del año activo", () => {
    render(
      <SelectorAnioPago
        anios={ANIOS}
        anioSeleccionado={ANIOS[0]}
        esAnioActivo={false}
        onCambiar={vi.fn()}
      />
    );

    expect(
      screen.getByText("Las ventas de inventario pertenecen al año activo y no se incluyen aquí.")
    ).toBeInTheDocument();
  });

  it("con un solo año no se muestra", () => {
    const { container } = render(
      <SelectorAnioPago
        anios={[ANIOS[1]]}
        anioSeleccionado={ANIOS[1]}
        esAnioActivo
        onCambiar={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
