import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ListaEstudiantesPagos from "./ListaEstudiantesPagos";

const propsBase = {
  estudiantes: [],
  loading: false,
  searchTerm: "",
  selectedEstudianteId: null,
  obtenerNombreCurso: vi.fn(() => "Quinto"),
  onSearchTermChange: vi.fn(),
  onSelectEstudiante: vi.fn(),
};

describe("ListaEstudiantesPagos", () => {
  it("presenta los estados de carga y lista vacía", () => {
    const { rerender } = render(<ListaEstudiantesPagos {...propsBase} loading />);
    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    rerender(<ListaEstudiantesPagos {...propsBase} />);
    expect(screen.getByText("No se encontraron estudiantes.")).toBeInTheDocument();
  });

  it("delega la búsqueda y selección conservando los datos visibles", () => {
    const onSearchTermChange = vi.fn();
    const onSelectEstudiante = vi.fn();
    const estudiante = {
      id: 7,
      nombre: "Ana",
      apellido: "Pérez",
      documento: "1007",
    };
    render(
      <ListaEstudiantesPagos
        {...propsBase}
        estudiantes={[estudiante]}
        selectedEstudianteId={7}
        onSearchTermChange={onSearchTermChange}
        onSelectEstudiante={onSelectEstudiante}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Buscar estudiante..."), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByText("Pérez Ana"));

    expect(onSearchTermChange).toHaveBeenCalledWith("Ana");
    expect(onSelectEstudiante).toHaveBeenCalledWith(estudiante);
    expect(screen.getByText("Doc: 1007")).toBeInTheDocument();
    expect(screen.getByText("Quinto")).toBeInTheDocument();
  });
});
