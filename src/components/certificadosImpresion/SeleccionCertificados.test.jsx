import { fireEvent, render, screen, within } from "@testing-library/react";
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
    const tipoDocumento = screen.getByRole("combobox", { name: "Tipo de documento" });
    expect(tipoDocumento).toHaveValue("reporte-parcial");
    await user.selectOptions(tipoDocumento, "notas");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Sara" },
    });
    await user.selectOptions(screen.getAllByRole("combobox")[4], "12");
    await user.click(screen.getByRole("button", { name: "Generar reporte del curso" }));
    await user.click(screen.getByRole("button", { name: "Ver reporte" }));

    expect(props.onCambiarTab).toHaveBeenCalledWith("notas");
    expect(props.onCambiarBusqueda).toHaveBeenLastCalledWith("Sara");
    expect(props.onCambiarMateriaReporte).toHaveBeenCalledWith("12");
    expect(props.onGenerarCurso).toHaveBeenCalledTimes(1);
    expect(props.onGenerarEstudiante).toHaveBeenCalledWith(8);
  });

  it("elige el documento en un menú y no en pestañas", () => {
    render(<SeleccionCertificados {...crearProps()} />);

    const opciones = within(
      screen.getByRole("combobox", { name: "Tipo de documento" }),
    ).getAllByRole("option");
    expect(opciones.map((opcion) => opcion.value)).toEqual([
      "notas",
      "matricula",
      "reporte-parcial",
      "conducta",
      "aprobado",
      "paz-salvo",
      "costos",
    ]);
    expect(screen.queryByRole("button", { name: "Certificado de notas" })).not.toBeInTheDocument();
  });

  it("conducta y aprobado no piden periodo ni año, y su botón dice qué genera", async () => {
    const user = userEvent.setup();
    const props = crearProps({ tabActiva: "conducta" });
    render(<SeleccionCertificados {...props} />);

    // Curso, tipo de documento y estado; sin periodo ni año.
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Generar conducta" }));
    expect(props.onGenerarEstudiante).toHaveBeenCalledWith(8);
  });

  it("muestra lo que debe en vez del paz y salvo, y se puede cerrar", async () => {
    const user = userEvent.setup();
    const onCerrarDeudaPazSalvo = vi.fn();
    render(
      <SeleccionCertificados
        {...crearProps({
          tabActiva: "paz-salvo",
          deudaPazSalvo: {
            estudiante: "Sara López",
            items: [{ etiqueta: "Pensión", valor: 130000 }],
            total: 130000,
          },
          onCerrarDeudaPazSalvo,
        })}
      />,
    );

    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("No se puede expedir el paz y salvo: Sara López debe $ 130.000.");
    expect(aviso).toHaveTextContent("Solo cuenta lo vencido a hoy.");
    expect(aviso).toHaveTextContent("Pensión");
    await user.click(within(aviso).getByRole("button", { name: "Cerrar" }));
    expect(onCerrarDeudaPazSalvo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Generar paz y salvo" })).toBeInTheDocument();
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
