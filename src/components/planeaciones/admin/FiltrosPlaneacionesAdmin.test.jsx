import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FiltrosPlaneacionesAdmin from "./FiltrosPlaneacionesAdmin";

const profesores = [
  { id: 7, nombre: "Ana", apellido: "Ruiz" },
  { id: 9, nombre: "Luis", apellido: "Díaz" },
];

describe("FiltrosPlaneacionesAdmin", () => {
  it("presenta la selección actual y delega el cambio de profesor", async () => {
    const user = userEvent.setup();
    const onCambiarProfesor = vi.fn();

    render(
      <FiltrosPlaneacionesAdmin
        profesores={profesores}
        profesorId="7"
        estado="pendiente"
        conteoPendientes={4}
        onCambiarProfesor={onCambiarProfesor}
        onCambiarEstado={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Profesor" })).toHaveValue("7");
    expect(screen.getByRole("option", { name: "Luis Díaz" })).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Profesor" }),
      "9",
    );

    expect(onCambiarProfesor).toHaveBeenCalledWith("9");
  });

  it("limita el contador y permite activar o desactivar un estado", async () => {
    const user = userEvent.setup();
    const onCambiarEstado = vi.fn();

    render(
      <FiltrosPlaneacionesAdmin
        profesores={profesores}
        profesorId=""
        estado="pendiente"
        conteoPendientes={145}
        onCambiarProfesor={vi.fn()}
        onCambiarEstado={onCambiarEstado}
      />,
    );

    const pendiente = screen.getByRole("button", {
      name: "Pendiente: 145 planeaciones",
    });
    expect(pendiente).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("99+")).toBeInTheDocument();

    await user.click(pendiente);
    await user.click(screen.getByRole("button", { name: "Revisado" }));

    expect(onCambiarEstado).toHaveBeenNthCalledWith(1, "");
    expect(onCambiarEstado).toHaveBeenNthCalledWith(2, "revisado");
  });
});
