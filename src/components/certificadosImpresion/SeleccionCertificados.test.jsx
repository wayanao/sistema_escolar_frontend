import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SeleccionCertificados from "./SeleccionCertificados";

function crearProps(overrides = {}) {
  return {
    anioLectivo: "2026",
    busqueda: "",
    cursoSeleccionado: "3",
    cursos: [{ id: 3, nombre: "Quinto", jornada: "Mañana" }],
    cursosPorId: new Map([[3, { id: 3, nombre: "Quinto" }]]),
    error: "",
    estadoFiltro: "activo",
    estudiantes: [{
      id: 8,
      nombre: "Sara",
      apellido: "López",
      documento_identidad: "TI-123",
      curso_id: 3,
      estado: "activo",
    }],
    generandoCurso: false,
    generandoId: null,
    loading: false,
    materiaReporte: "todas",
    materias: [{ id: 12, nombre: "Historia" }],
    periodo: "1",
    periodoReporte: "1",
    tabActiva: "reporte-parcial",
    onCambiarAnioLectivo: vi.fn(),
    onCambiarBusqueda: vi.fn(),
    onCambiarCurso: vi.fn(),
    onCambiarEstado: vi.fn(),
    onCambiarMateriaReporte: vi.fn(),
    onCambiarPeriodo: vi.fn(),
    onCambiarPeriodoReporte: vi.fn(),
    onCambiarTab: vi.fn(),
    onGenerarCurso: vi.fn(),
    onGenerarEstudiante: vi.fn(),
    ...overrides,
  };
}

describe("SeleccionCertificados", () => {
  it("mantiene filtros, acciones y selección del reporte parcial", async () => {
    const user = userEvent.setup();
    const props = crearProps();
    render(<SeleccionCertificados {...props} />);

    expect(screen.getByText("TI-123")).toBeInTheDocument();
    expect(screen.getByText("Sara López")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Certificado de notas" }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Sara" },
    });
    await user.selectOptions(screen.getAllByRole("combobox")[3], "12");
    await user.click(screen.getByRole("button", { name: "Generar reporte del curso" }));
    await user.click(screen.getByRole("button", { name: "Ver reporte" }));

    expect(props.onCambiarTab).toHaveBeenCalledWith("notas");
    expect(props.onCambiarBusqueda).toHaveBeenLastCalledWith("Sara");
    expect(props.onCambiarMateriaReporte).toHaveBeenCalledWith("12");
    expect(props.onGenerarCurso).toHaveBeenCalledTimes(1);
    expect(props.onGenerarEstudiante).toHaveBeenCalledWith(8);
  });

  it("conserva estados de carga, error y lista vacía", () => {
    const { rerender } = render(
      <SeleccionCertificados {...crearProps({ error: "No fue posible cargar", loading: true })} />,
    );
    expect(screen.getByText("No fue posible cargar")).toBeInTheDocument();
    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    rerender(<SeleccionCertificados {...crearProps({ estudiantes: [] })} />);
    expect(screen.getByText("No hay estudiantes para los filtros seleccionados.")).toBeInTheDocument();
  });
});
