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
  // Caracterización antes de llevar esta lista a src/constants (entrevista
  // de admisión, paso E4): la ficha del aspirante usa la misma. La de paz y
  // salvo también se fijaba aquí hasta el E6, que la sacó del formulario.
  it("ofrece los mismos tipos de documento de siempre", () => {
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
  });

  // Paso E6 de la entrevista de admisión (decisiones 5 y 6): lo que solo
  // sirve para admitir pasó a la entrevista. El cuerpo no cambia (ver las
  // pruebas del hook y de la página).
  it("ya no pide estudios anteriores ni la ocupación de los padres", () => {
    render(<FormularioEstudianteAdmin {...crearPropiedades()} />);

    expect(screen.queryByText("Estudios Anteriores")).not.toBeInTheDocument();
    for (const etiqueta of [
      "Nombre Colegio Anterior",
      "Año Cursado",
      "Pre-escolar",
      "EBP",
      "Paz y Salvo",
      "Motivo del Retiro",
      "Ocupación (Padre)",
      "Ocupación (Madre)",
    ]) {
      expect(screen.queryByText(etiqueta)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("option", { name: "SI" })).not.toBeInTheDocument();
    // Lo demás de la familia sigue.
    expect(screen.getByText("Información Familiar")).toBeInTheDocument();
    expect(screen.getByText("Nombre del Padre")).toBeInTheDocument();
    expect(screen.getByText("Documento (Madre)")).toBeInTheDocument();
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

// SISBÉN y lugar de residencia, paso S3 (docs/funcionalidades/SISBEN_RESIDENCIA.md).
describe("FormularioEstudianteAdmin: SISBÉN y lugar de residencia", () => {
  const conSisben = (cambios = {}) => ({
    ...crearEstudianteInicial(),
    sisben: "si",
    sisben_grupo: "B",
    sisben_subgrupo: "B4",
    sisben_nivel: "2",
    ...cambios,
  });

  it("pide el lugar de residencia por partes", () => {
    render(<FormularioEstudianteAdmin {...crearPropiedades()} />);

    expect(screen.getByText("Lugar de residencia")).toBeInTheDocument();
    // La dirección sigue siendo un área de texto: lo ya escrito en varias
    // líneas no pierde sus saltos al guardar.
    expect(screen.getByLabelText("Dirección (calle o carrera y número)").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Barrio o vereda")).toHaveAttribute("maxLength", "150");
    expect(screen.getByLabelText("Municipio")).toHaveAttribute("maxLength", "100");
    expect(screen.getByLabelText("Punto de referencia")).toHaveAttribute("maxLength", "255");
    expect(opcionesDe(screen.getByLabelText("Zona"))).toEqual([
      ["", "Seleccione..."],
      ["urbana", "Urbana"],
      ["rural", "Rural"],
    ]);
    expect(screen.queryByText("Dirección")).not.toBeInTheDocument();
  });

  it("muestra lo ya guardado del lugar de residencia", () => {
    render(
      <FormularioEstudianteAdmin
        {...crearPropiedades({
          estudianteData: {
            ...crearEstudianteInicial(),
            direccion: "Calle 12 # 8-45",
            barrio: "El Carmen",
            municipio: "Galapa",
            zona_residencia: "rural",
            punto_referencia: "Frente a la tienda",
          },
        })}
      />,
    );

    expect(screen.getByLabelText("Dirección (calle o carrera y número)")).toHaveValue("Calle 12 # 8-45");
    expect(screen.getByLabelText("Barrio o vereda")).toHaveValue("El Carmen");
    expect(screen.getByLabelText("Municipio")).toHaveValue("Galapa");
    expect(screen.getByLabelText("Zona")).toHaveValue("rural");
    expect(screen.getByLabelText("Punto de referencia")).toHaveValue("Frente a la tienda");
  });

  it("sin dato de SISBÉN no pide la clasificación", () => {
    render(<FormularioEstudianteAdmin {...crearPropiedades()} />);

    expect(opcionesDe(screen.getByLabelText("¿Tiene SISBÉN?"))).toEqual([
      ["", "Sin dato"],
      ["si", "Sí"],
      ["no", "No"],
    ]);
    expect(screen.queryByLabelText("Grupo del SISBÉN IV")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Subgrupo del SISBÉN IV")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nivel del SISBÉN III (si aplica)")).not.toBeInTheDocument();
  });

  it("con SISBÉN, el subgrupo ofrece solo los de su grupo", () => {
    render(<FormularioEstudianteAdmin {...crearPropiedades({ estudianteData: conSisben() })} />);

    expect(opcionesDe(screen.getByLabelText("Grupo del SISBÉN IV"))).toEqual([
      ["", "Seleccione..."],
      ["A", "A: pobreza extrema"],
      ["B", "B: pobreza moderada"],
      ["C", "C: vulnerable"],
      ["D", "D: no pobre ni vulnerable"],
    ]);
    const subgrupo = screen.getByLabelText("Subgrupo del SISBÉN IV");
    expect(subgrupo).toBeEnabled();
    expect(subgrupo).toHaveValue("B4");
    expect(opcionesDe(subgrupo).map(([valor]) => valor)).toEqual([
      "",
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
    ]);
    expect(opcionesDe(screen.getByLabelText("Nivel del SISBÉN III (si aplica)"))).toEqual([
      ["", "Seleccione..."],
      ["1", "1"],
      ["2", "2"],
      ["3", "3"],
    ]);
  });

  it("sin grupo, el subgrupo espera a que se elija uno", () => {
    render(
      <FormularioEstudianteAdmin
        {...crearPropiedades({
          estudianteData: conSisben({ sisben_grupo: "", sisben_subgrupo: "" }),
        })}
      />,
    );

    const subgrupo = screen.getByLabelText("Subgrupo del SISBÉN IV");
    expect(subgrupo).toBeDisabled();
    expect(opcionesDe(subgrupo)).toEqual([["", "Primero elige el grupo"]]);
  });

  it("al marcar que no tiene SISBÉN, se vacía la clasificación", () => {
    const props = crearPropiedades({ estudianteData: conSisben() });
    render(<FormularioEstudianteAdmin {...props} />);

    fireEvent.change(screen.getByLabelText("¿Tiene SISBÉN?"), { target: { value: "no" } });

    expect(props.setEstudianteData).toHaveBeenCalledWith(
      expect.objectContaining({
        sisben: "no",
        sisben_grupo: "",
        sisben_subgrupo: "",
        sisben_nivel: "",
      }),
    );
  });

  it("al cambiar de grupo, se vacía el subgrupo que ya no es suyo", () => {
    const props = crearPropiedades({ estudianteData: conSisben() });
    render(<FormularioEstudianteAdmin {...props} />);

    fireEvent.change(screen.getByLabelText("Grupo del SISBÉN IV"), { target: { value: "C" } });

    expect(props.setEstudianteData).toHaveBeenCalledWith(
      expect.objectContaining({ sisben_grupo: "C", sisben_subgrupo: "", sisben_nivel: "2" }),
    );
  });
});
