import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CambiarPasswordView from "./CambiarPasswordView";

function crearProps(overrides = {}) {
  return {
    passwordActual: "Temporal123",
    passwordNueva: "NuevaClave123",
    confirmacion: "NuevaClave123",
    guardando: false,
    onCambiarPasswordActual: vi.fn(),
    onCambiarPasswordNueva: vi.fn(),
    onCambiarConfirmacion: vi.fn(),
    onGuardar: vi.fn((event) => event.preventDefault()),
    ...overrides,
  };
}

describe("CambiarPasswordView", () => {
  it("presenta los tres campos y entrega valores sin transformarlos", () => {
    const props = crearProps();
    const { container } = render(<CambiarPasswordView {...props} />);

    expect(screen.getByLabelText("Password temporal")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByLabelText("Nueva password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirmar nueva password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );

    fireEvent.change(screen.getByLabelText("Password temporal"), {
      target: { value: " Temporal cruda " },
    });
    fireEvent.change(screen.getByLabelText("Nueva password"), {
      target: { value: " Nueva cruda " },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva password"), {
      target: { value: " Confirmacion cruda " },
    });
    fireEvent.submit(container.querySelector("form"));

    expect(props.onCambiarPasswordActual).toHaveBeenCalledWith(" Temporal cruda ");
    expect(props.onCambiarPasswordNueva).toHaveBeenCalledWith(" Nueva cruda ");
    expect(props.onCambiarConfirmacion).toHaveBeenCalledWith(" Confirmacion cruda ");
    expect(props.onGuardar).toHaveBeenCalledTimes(1);
  });

  it("representa literalmente el estado de guardado", () => {
    const props = crearProps();
    const { rerender } = render(<CambiarPasswordView {...props} />);

    expect(screen.getByRole("button", { name: "Guardar password" })).toBeEnabled();

    rerender(<CambiarPasswordView {...props} guardando />);

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  });
});
