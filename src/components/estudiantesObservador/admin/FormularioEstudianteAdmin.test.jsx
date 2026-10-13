import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { crearEstudianteInicial } from "../../../utils/estudiantesObservador/estudiantes";
import FormularioEstudianteAdmin from "./FormularioEstudianteAdmin";

function crearPropiedades(overrides = {}) {
  return {
    visible: true,
    editingId: null,
    estudianteData: crearEstudianteInicial(),
    setEstudianteData: vi.fn(),
    cursos: [{ id: 4, nombre: "5A" }],
    onSubmit: vi.fn((event) => event.preventDefault()),
    onCancelar: vi.fn(),
    ...overrides,
  };
}

const opcionesDe = (select) =>
  [...select.options].map((opcion) => [opcion.value, opcion.textContent]);

describe("FormularioEstudianteAdmin", () => {
  // Caracterización antes de llevar estas listas a src/constants (entrevista
  // de admisión, paso E4): la ficha del aspirante usa las mismas.
  it("ofrece los mismos tipos de documento y opciones de paz y salvo de siempre", () => {
    render(<FormularioEstudianteAdmin {...crearPropiedades()} />);

    const tipos = screen.getByRole("option", { name: "Registro Civil" }).closest("select");
    expect(opcionesDe(tipos)).toEqual([
      ["", "Seleccione..."],
      ["Registro Civil", "Registro Civil"],
      ["Tarjeta de Identidad", "Tarjeta de Identidad"],
      ["Cédula de Ciudadanía", "Cédula de Ciudadanía"],
      ["Cédula de Extranjería", "Cédula de Extranjería"],
      ["Otro", "Otro"],
    ]);
    const pazYSalvo = screen.getByRole("option", { name: "SI" }).closest("select");
    expect(opcionesDe(pazYSalvo)).toEqual([
      ["", "Seleccione..."],
      ["SI", "SI"],
      ["NO", "NO"],
    ]);
  });

  it("acepta otro título y otro texto de botón, como en Matricular (paso E5)", () => {
    render(
      <FormularioEstudianteAdmin
        {...crearPropiedades({ titulo: "Ficha del estudiante", textoBoton: "Matricular en 2027" })}
      />,
    );

    expect(screen.getByText("Ficha del estudiante")).toBeInTheDocument();
    expect(screen.queryByText("🎓 Crear Nuevo Estudiante")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Matricular en 2027" })).toBeInTheDocument();
  });

  it("conserva secciones, cursos y contrato controlado de creación", async () => {
    const user = userEvent.setup();
    const props = crearPropiedades();
    const { container } = render(<FormularioEstudianteAdmin {...props} />);

    expect(screen.getByText("🎓 Crear Nuevo Estudiante")).toBeInTheDocument();
    expect(screen.getByText("Datos Adicionales y Médicos")).toBeInTheDocument();
    expect(screen.getByText("Estudios Anteriores")).toBeInTheDocument();
    expect(screen.getByText("Información Familiar")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "5A" })).toBeInTheDocument();

    fireEvent.change(container.querySelector('input[type="text"]'), {
      target: { value: "Ana" },
    });
    expect(props.setEstudianteData).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Ana" }),
    );

    fireEvent.submit(container.querySelector("form"));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onCancelar).toHaveBeenCalledTimes(1);
  });

  it("presenta el modo de edición sin cambiar campos ni acciones", () => {
    render(
      <FormularioEstudianteAdmin
        {...crearPropiedades({
          editingId: 12,
          estudianteData: {
            ...crearEstudianteInicial(),
            nombre: "Luis",
            apellido: "Pardo",
          },
        })}
      />,
    );

    expect(screen.getByText("✏️ Editar Estudiante")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actualizar Estudiante" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Luis")).toBeInTheDocument();
  });

  it("no muestra los descuentos de matrícula y mensualidad, que ningún cobro usa", () => {
    const { rerender } = render(<FormularioEstudianteAdmin {...crearPropiedades()} />);
    expect(screen.queryByText("Descuento Matrícula")).not.toBeInTheDocument();
    expect(screen.queryByText("Descuento Mensualidad")).not.toBeInTheDocument();

    rerender(<FormularioEstudianteAdmin {...crearPropiedades({ editingId: 12 })} />);
    expect(screen.queryByText("Descuento Matrícula")).not.toBeInTheDocument();
    expect(screen.queryByText("Descuento Mensualidad")).not.toBeInTheDocument();
  });

  it("mientras guarda, el botón lo dice y no se puede pulsar otra vez", () => {
    const { rerender } = render(
      <FormularioEstudianteAdmin {...crearPropiedades({ editingId: 12 })} />,
    );
    expect(screen.getByRole("button", { name: "Actualizar Estudiante" })).toBeEnabled();

    rerender(
      <FormularioEstudianteAdmin {...crearPropiedades({ editingId: 12, guardando: true })} />,
    );

    const boton = screen.getByRole("button", { name: "Guardando..." });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("type", "submit");
  });
});
