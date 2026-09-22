import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BarraGuardadoSeguimiento from "./BarraGuardadoSeguimiento";

describe("BarraGuardadoSeguimiento", () => {
  it("sin cambios deja los dos botones apagados", () => {
    render(<BarraGuardadoSeguimiento cantidadCambios={0} onGuardar={vi.fn()} />);

    expect(screen.getByText("No hay cambios sin guardar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Descartar" })).toBeDisabled();
  });

  it("un solo cambio ya habilita guardar", async () => {
    // Aquí lo normal es que casi todas las celdas queden sin marcar: exigir la
    // grilla completa, como hace Asistencia, dejaría el botón inservible.
    const onGuardar = vi.fn();
    const user = userEvent.setup();
    render(<BarraGuardadoSeguimiento cantidadCambios={1} onGuardar={onGuardar} />);

    expect(screen.getByText("1 cambio sin guardar.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onGuardar).toHaveBeenCalledTimes(1);
  });

  it("cuenta en plural cuando hay varios", () => {
    render(<BarraGuardadoSeguimiento cantidadCambios={4} onGuardar={vi.fn()} />);

    expect(screen.getByText("4 cambios sin guardar.")).toBeInTheDocument();
  });

  it("mientras guarda no se puede volver a pulsar", () => {
    render(
      <BarraGuardadoSeguimiento cantidadCambios={2} guardando onGuardar={vi.fn()} />,
    );

    const boton = screen.getByRole("button", { name: "Guardando..." });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");
  });

  it("descartar avisa a quien lo maneja", async () => {
    const onDescartar = vi.fn();
    const user = userEvent.setup();
    render(
      <BarraGuardadoSeguimiento
        cantidadCambios={2}
        onGuardar={vi.fn()}
        onDescartar={onDescartar}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(onDescartar).toHaveBeenCalledTimes(1);
  });
});
