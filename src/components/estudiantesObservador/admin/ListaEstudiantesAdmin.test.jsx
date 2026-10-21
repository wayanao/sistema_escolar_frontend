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

  it("marca cada fila con su número y resalta la del estudiante recién guardado", () => {
    const { container } = render(
      <ListaEstudiantesAdmin
        estudiantes={[
          { id: 11, nombre: "Ana", apellido: "Rojas", curso_id: 4, estado: "activo" },
          { id: 12, nombre: "Luis", apellido: "Pardo", curso_id: 4, estado: "activo" },
        ]}
        cursos={[{ id: 4, nombre: "5A" }]}
        onVerDetalles={vi.fn()}
        onCambiarEstado={vi.fn()}
        onEditar={vi.fn()}
        resaltadoId={12}
      />,
    );

    expect(container.querySelector('[data-estudiante-id="12"]')).toHaveClass("bg-green-50");
    expect(container.querySelector('[data-estudiante-id="11"]')).not.toHaveClass("bg-green-50");
  });

  it("al actualizar la lista la conserva y lo avisa", () => {
    render(
      <ListaEstudiantesAdmin
        estudiantes={[{ id: 11, nombre: "Ana", apellido: "Rojas", curso_id: 4, estado: "activo" }]}
        cursos={[{ id: 4, nombre: "5A" }]}
        onVerDetalles={vi.fn()}
        onCambiarEstado={vi.fn()}
        onEditar={vi.fn()}
        actualizando
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Actualizando...");
    expect(screen.getByText(/Rojas Ana/)).toBeInTheDocument();
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

describe("ListaEstudiantesAdmin mirando otro año", () => {
  it("sin poder editar, no hay acciones, pero la ficha se sigue abriendo", async () => {
    const user = userEvent.setup();
    const estudiante = {
      id: 11,
      nombre: "Ana",
      apellido: "Rojas",
      curso_id: 4,
      estado: "retirado",
    };
    const props = {
      estudiantes: [estudiante],
      cursos: [{ id: 4, nombre: "5A" }],
      onVerDetalles: vi.fn(),
      onCambiarEstado: vi.fn(),
      onEditar: vi.fn(),
      puedeEditar: false,
    };
    render(<ListaEstudiantesAdmin {...props} />);

    // El estado se sigue viendo; lo que no aparece es cambiarlo ni editar.
    expect(screen.getByText("Retirado")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    await user.click(screen.getByText(/Rojas Ana/));
    expect(props.onVerDetalles).toHaveBeenCalledWith(estudiante);
  });
});
