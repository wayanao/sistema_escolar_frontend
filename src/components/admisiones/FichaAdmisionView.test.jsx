import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formularioDesdeAdmision, resultadoDesdeAdmision } from "../../utils/admisiones/formularios";
import FichaAdmisionView from "./FichaAdmisionView";

const ADMISION = {
  id: 7,
  nombre: "Lina",
  apellido: "Díaz",
  curso_id: 20,
  autoriza_datos: true,
  autoriza_nombre: "Marta Díaz",
  resultado: "pendiente",
  motivo_resultado: null,
  editable: true,
  matriculada: false,
  aviso_documento: null,
};

function pintar(cambios = {}, props = {}) {
  const admision = { ...ADMISION, ...cambios };
  const propiedades = {
    admision,
    formulario: formularioDesdeAdmision(admision),
    errores: {},
    cursos: [{ id: 20, nombre: "PRIMERO A", jornada: "Mañana" }],
    resultado: resultadoDesdeAdmision(admision),
    erroresResultado: {},
    guardando: false,
    guardandoResultado: false,
    borrando: false,
    onCambiar: vi.fn(),
    onGuardar: vi.fn((event) => event?.preventDefault?.()),
    onCambiarResultado: vi.fn(),
    onGuardarResultado: vi.fn(),
    onBorrar: vi.fn(),
    onCerrar: vi.fn(),
    ...props,
  };
  render(<FichaAdmisionView {...propiedades} />);
  return propiedades;
}

describe("FichaAdmisionView", () => {
  it("muestra aspirante, entrevista y resultado, y deja guardar", async () => {
    const user = userEvent.setup();
    const props = pintar();

    expect(screen.getByRole("heading", { name: "Lina Díaz" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toHaveValue("Lina");
    expect(screen.getByLabelText("Quién entrevistó")).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Pendiente" })).toBeChecked();

    await user.type(screen.getByLabelText("Quién entrevistó"), "R");
    expect(props.onCambiar).toHaveBeenCalledWith("entrevistador", "R");

    await user.click(screen.getByRole("button", { name: "Guardar datos y entrevista" }));
    expect(props.onGuardar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("radio", { name: "No aprobado" }));
    expect(props.onCambiarResultado).toHaveBeenCalledWith("resultado", "no_aprobado");

    await user.click(screen.getByRole("button", { name: "Guardar resultado" }));
    expect(props.onGuardarResultado).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Borrar aspirante" }));
    expect(props.onBorrar).toHaveBeenCalledTimes(1);
  });

  it("pide un motivo objetivo para no aprobar y muestra el error", () => {
    pintar({}, { erroresResultado: { motivo_resultado: 'Para marcar "No aprobado" escribe el motivo.' } });

    expect(screen.getByText('Para marcar "No aprobado" escribe el motivo.')).toBeInTheDocument();
    expect(
      screen.getByText(/no puede negarse por religión, origen o composición de la familia/),
    ).toBeInTheDocument();
  });

  it("una matriculada es de solo consulta", () => {
    pintar({ resultado: "aprobado", matriculada: true, editable: false });

    expect(screen.getByText("Matriculado. Esta admisión es de solo consulta.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Aprobado" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Guardar datos y entrevista" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar resultado" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Borrar aspirante" })).not.toBeInTheDocument();
  });

  it("de un año que ya no está en preparación, también solo consulta", () => {
    pintar({ editable: false });

    expect(
      screen.getByText("El año ya no está en preparación. Esta admisión es de solo consulta."),
    ).toBeInTheDocument();
  });

  it("avisa si el documento ya es de un estudiante del colegio", () => {
    pintar({
      aviso_documento: {
        estudiante_id: 55,
        mensaje: "El documento 2001 ya es de un estudiante del colegio: Lina Díaz (retirado).",
      },
    });

    expect(screen.getByRole("note")).toHaveTextContent(
      "El documento 2001 ya es de un estudiante del colegio: Lina Díaz (retirado).",
    );
  });

  it("mientras guarda, los botones lo dicen", () => {
    pintar({}, { guardando: true, guardandoResultado: true, borrando: true });

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando resultado..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Borrando..." })).toBeDisabled();
  });
});
