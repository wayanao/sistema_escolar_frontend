import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ListaEstudiantesAdmin from "./ListaEstudiantesAdmin";

describe("ListaEstudiantesAdmin", () => {
  it("presenta estudiante, curso y estado y separa detalle de acciones", async () => {
    const user = userEvent.setup();
    const estudiante = {
      id: 11,
      nombre: "Ana",
      apellido: "Rojas",
      curso_id: 4,
      estado: "activo",
    };
    const props = {
      estudiantes: [estudiante],
      cursos: [{ id: 4, nombre: "5A" }],
      onVerDetalles: vi.fn(),
      onCambiarEstado: vi.fn(),
      onEditar: vi.fn(),
    };
    render(<ListaEstudiantesAdmin {...props} />);

    expect(screen.getByText(/Rojas Ana/)).toBeInTheDocument();
    expect(screen.getByText("5A")).toBeInTheDocument();
    expect(screen.getAllByText("Activo")).toHaveLength(2);

    await user.click(screen.getByText(/Rojas Ana/));
    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.selectOptions(screen.getByRole("combobox"), "retirado");

    expect(props.onVerDetalles).toHaveBeenCalledWith(estudiante);
    expect(props.onEditar).toHaveBeenCalledWith(11);
    expect(props.onCambiarEstado).toHaveBeenCalledWith(estudiante, "retirado");
    expect(props.onVerDetalles).toHaveBeenCalledTimes(1);
  });

  it("conserva el estado vacío", () => {
    render(
      <ListaEstudiantesAdmin
        estudiantes={[]}
        cursos={[]}
        onVerDetalles={vi.fn()}
        onCambiarEstado={vi.fn()}
        onEditar={vi.fn()}
      />,
    );

    expect(screen.getByText("No se encontraron estudiantes")).toBeInTheDocument();
  });
});
