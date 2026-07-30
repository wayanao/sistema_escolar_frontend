import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfiguracionPlanProfesor from "./ConfiguracionPlanProfesor";

const clases = [
  { id: 44, materia: "Matemáticas", curso: "5A" },
  { id: 45, materia: "Ciencias", curso: "6B" },
];

function crearPropiedades(overrides = {}) {
  return {
    asignacionId: "44",
    clases,
    cargandoClases: false,
    periodo: "2",
    fecha: "2026-07-29",
    onCambiarAsignacion: vi.fn(),
    onCambiarPeriodo: vi.fn(),
    onCambiarFecha: vi.fn(),
    ...overrides,
  };
}

describe("ConfiguracionPlanProfesor", () => {
  it("presenta la selección vigente y las clases disponibles", () => {
    render(<ConfiguracionPlanProfesor {...crearPropiedades()} />);

    expect(screen.getByLabelText("Clase asignada")).toHaveValue("44");
    expect(screen.getByRole("option", { name: "Ciencias - 6B" })).toHaveValue(
      "45",
    );
    expect(screen.getByLabelText("Periodo")).toHaveValue("2");
    expect(screen.getByLabelText("Fecha")).toHaveValue("2026-07-29");
  });

  it("entrega los cambios de clase, periodo y fecha", async () => {
    const user = userEvent.setup();
    const props = crearPropiedades();
    render(<ConfiguracionPlanProfesor {...props} />);

    await user.selectOptions(screen.getByLabelText("Clase asignada"), "45");
    await user.selectOptions(screen.getByLabelText("Periodo"), "3");
    fireEvent.change(screen.getByLabelText("Fecha"), {
      target: { value: "2026-08-03" },
    });

    expect(props.onCambiarAsignacion).toHaveBeenCalledWith("45");
    expect(props.onCambiarPeriodo).toHaveBeenCalledWith("3");
    expect(props.onCambiarFecha).toHaveBeenLastCalledWith("2026-08-03");
  });

  it("bloquea la clase y comunica su estado mientras carga", () => {
    render(
      <ConfiguracionPlanProfesor
        {...crearPropiedades({
          asignacionId: "",
          clases: [],
          cargandoClases: true,
        })}
      />,
    );

    expect(screen.getByLabelText("Clase asignada")).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Cargando clases..." }),
    ).toBeInTheDocument();
  });
});
