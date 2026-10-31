import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import CampoPesos from "./CampoPesos";

// Imita a un formulario real: guarda en su estado lo que entrega el campo.
function Formulario({ inicial = "", onCambiar = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return (
    <CampoPesos
      aria-label="Monto"
      valor={valor}
      onCambiar={(nuevo) => {
        setValor(nuevo);
        onCambiar(nuevo);
      }}
      {...props}
    />
  );
}

describe("CampoPesos", () => {
  it("pone los puntos de miles mientras se escribe y entrega solo los dígitos", async () => {
    const user = userEvent.setup();
    const onCambiar = vi.fn();
    render(<Formulario onCambiar={onCambiar} />);

    await user.type(screen.getByLabelText("Monto"), "1500000");

    expect(screen.getByLabelText("Monto")).toHaveValue("1.500.000");
    expect(onCambiar).toHaveBeenLastCalledWith("1500000");
  });

  it("si escriben el punto a mano, sigue siendo ciento cincuenta mil y no 150", async () => {
    const user = userEvent.setup();
    const onCambiar = vi.fn();
    render(<Formulario onCambiar={onCambiar} />);

    await user.type(screen.getByLabelText("Monto"), "150.000");

    expect(screen.getByLabelText("Monto")).toHaveValue("150.000");
    expect(onCambiar).toHaveBeenLastCalledWith("150000");
  });

  it("muestra con puntos el valor que ya traía el formulario", () => {
    render(<Formulario inicial="200000.00" />);

    expect(screen.getByLabelText("Monto")).toHaveValue("200.000");
  });

  it("al corregir en medio, el cursor no salta al final", async () => {
    const user = userEvent.setup();
    const onCambiar = vi.fn();
    render(<Formulario inicial="150000" onCambiar={onCambiar} />);
    const campo = screen.getByLabelText("Monto");

    // Cursor detrás del 5 de "150.000": se borra el 5 y se escribe un 2.
    await user.click(campo);
    campo.setSelectionRange(2, 2);
    await user.keyboard("{Backspace}2");

    expect(campo).toHaveValue("120.000");
    expect(onCambiar).toHaveBeenLastCalledWith("120000");
    expect(campo.selectionStart).toBe(2);
  });

  it("abre el teclado numérico en el celular", () => {
    render(<Formulario />);

    expect(screen.getByLabelText("Monto")).toHaveAttribute("inputmode", "numeric");
  });

  it("el navegador no deja enviar un valor fuera del mínimo o del máximo", () => {
    const { rerender } = render(<CampoPesos aria-label="Monto" valor="250000" onCambiar={() => {}} max={200000} />);
    const campo = screen.getByLabelText("Monto");

    expect(campo.checkValidity()).toBe(false);
    expect(campo.validationMessage.replace(/\s/g, " ")).toBe("El valor máximo es $ 200.000.");

    rerender(<CampoPesos aria-label="Monto" valor="150000" onCambiar={() => {}} max={200000} />);
    expect(campo.checkValidity()).toBe(true);

    rerender(<CampoPesos aria-label="Monto" valor="0" onCambiar={() => {}} min={1} />);
    expect(campo.checkValidity()).toBe(false);
  });
});
