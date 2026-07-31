import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PanelAsistenciaProfesor from "./PanelAsistenciaProfesor";

const estudiantes = [
  { estudiante_id: 101, nombre: "Ana", apellido: "Ruiz" },
  { estudiante_id: 102, nombre: "Luis", apellido: "Pérez" },
];

function propiedades(overrides = {}) {
  return {
    estudiantes,
    historialPorEstudiante: new Map([
      [101, [{ fecha: "2026-07-30", estado: "ausente" }]],
      [102, []],
    ]),
    asistencia: { 101: "presente" },
    cargandoHistorial: false,
    historialListo: true,
    errorHistorial: "",
    puedeInteractuar: true,
    hayCambiosSinGuardar: true,
    asistenciaDelDiaTomada: false,
    resumenAsistencia: { presentes: 1, ausentes: 0, pendientes: 1 },
    onReintentarHistorial: vi.fn(),
    onMarcarTodosPresentes: vi.fn(),
    onRestaurarSeleccion: vi.fn(),
    onMarcar: vi.fn(),
    ...overrides,
  };
}

describe("PanelAsistenciaProfesor", () => {
  it("presenta resumen, estudiantes y comunica todas las acciones", async () => {
    const props = propiedades();
    const user = userEvent.setup();

    render(<PanelAsistenciaProfesor {...props} />);

    expect(screen.getByText("Historial actualizado")).toBeInTheDocument();
    expect(screen.getByText("Ruiz Ana")).toBeInTheDocument();
    expect(screen.getByText("Inasistencias: 1")).toBeInTheDocument();
    const resumen = within(screen.getByLabelText("Resumen de asistencia"));
    expect(resumen.getAllByText("1")).toHaveLength(2);
    expect(resumen.getByText("0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "✔ Marcar todos presentes" }));
    await user.click(screen.getByRole("button", { name: "Limpiar selección" }));
    await user.click(screen.getByRole("button", { name: "Marcar ausente a Ruiz Ana" }));

    expect(props.onMarcarTodosPresentes).toHaveBeenCalledTimes(1);
    expect(props.onRestaurarSeleccion).toHaveBeenCalledTimes(1);
    expect(props.onMarcar).toHaveBeenCalledWith(101, "ausente");
  });

  it("muestra carga y error recuperable, y comunica el reintento", async () => {
    const onReintentarHistorial = vi.fn();
    const user = userEvent.setup();

    render(
      <PanelAsistenciaProfesor
        {...propiedades({
          cargandoHistorial: true,
          historialListo: false,
          errorHistorial: "No se pudo cargar el historial.",
          puedeInteractuar: false,
          onReintentarHistorial,
        })}
      />,
    );

    expect(screen.getByText("Cargando historial de inasistencias...")).toBeInTheDocument();
    expect(screen.getByText("No se pudo cargar el historial.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✔ Marcar todos presentes" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentarHistorial).toHaveBeenCalledTimes(1);
  });

  it("muestra el estado vacío solo cuando el historial está listo", () => {
    render(
      <PanelAsistenciaProfesor
        {...propiedades({
          estudiantes: [],
          historialListo: true,
          puedeInteractuar: false,
          resumenAsistencia: { presentes: 0, ausentes: 0, pendientes: 0 },
        })}
      />,
    );

    expect(screen.getByText("No hay estudiantes activos en esta clase.")).toBeInTheDocument();
  });
});
