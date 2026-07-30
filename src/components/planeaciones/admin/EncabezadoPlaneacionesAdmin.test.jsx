import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EncabezadoPlaneacionesAdmin from "./EncabezadoPlaneacionesAdmin";

describe("EncabezadoPlaneacionesAdmin", () => {
  it("presenta la vista seleccionada y su alcance temporal", () => {
    render(
      <EncabezadoPlaneacionesAdmin
        vista="programadas"
        onCambiarVista={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Planeaciones de clase" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Clases de hoy y futuras que todavía están por impartirse."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hoy y próximas" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("delega el cambio de vista sin administrar la selección", async () => {
    const user = userEvent.setup();
    const onCambiarVista = vi.fn();

    render(
      <EncabezadoPlaneacionesAdmin
        vista=""
        onCambiarVista={onCambiarVista}
      />,
    );

    expect(
      screen.getByText("Elige el periodo de clases que quieres consultar."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Anteriores" }));

    expect(onCambiarVista).toHaveBeenCalledWith("realizadas");
  });
});
