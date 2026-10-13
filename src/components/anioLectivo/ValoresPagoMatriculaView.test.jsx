import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ValoresPagoMatriculaView from "./ValoresPagoMatriculaView";

const FILAS = [
  {
    tipoPagoId: 12,
    nombre: "MENSUALIDAD",
    tipoCobro: "mensual",
    precioCurso: 200000,
    valorPersonalizado: 180000,
    personalizado: true,
    motivo: "Beca parcial",
    valorAPagar: 180000,
  },
  {
    tipoPagoId: 13,
    nombre: "MATRICULA",
    tipoCobro: "anual",
    precioCurso: 300000,
    valorPersonalizado: null,
    personalizado: false,
    motivo: "",
    valorAPagar: 300000,
  },
];
const BORRADORES = {
  12: { valor: "180000", motivo: "Beca parcial" },
  13: { valor: "", motivo: "" },
};

function renderVista(props = {}) {
  const funciones = {
    onCambiarBorrador: vi.fn(),
    onGuardar: vi.fn(),
    onVolverAlPrecio: vi.fn(),
    onCerrar: vi.fn(),
  };
  render(
    <ValoresPagoMatriculaView
      anio={2027}
      estudianteNombre="Ana Rojas"
      filas={FILAS}
      borradores={BORRADORES}
      cargando={false}
      guardandoTipoId={null}
      mensaje=""
      error=""
      {...funciones}
      {...props}
    />,
  );
  return funciones;
}

describe("ValoresPagoMatriculaView", () => {
  it("muestra cada concepto con el precio del curso y lo que paga", () => {
    renderVista();

    const recuadro = screen.getByRole("region", { name: "Valores de pago de Ana Rojas" });
    expect(within(recuadro).getByText(/Lo que se le cobrará en 2027/)).toBeInTheDocument();

    const mensualidad = screen.getByRole("listitem", { name: "MENSUALIDAD" });
    expect(within(mensualidad).getByText("Mensual")).toBeInTheDocument();
    expect(within(mensualidad).getByText(/Precio del curso:/)).toHaveTextContent(/200\.000/);
    expect(within(mensualidad).getByText(/Paga .*180\.000 \(personalizado\)/)).toBeInTheDocument();
    expect(within(mensualidad).getByText("Motivo: Beca parcial")).toBeInTheDocument();
    expect(
      within(mensualidad).getByRole("button", { name: "Volver al precio del curso en MENSUALIDAD" }),
    ).toBeInTheDocument();

    const matricula = screen.getByRole("listitem", { name: "MATRICULA" });
    expect(within(matricula).getByText(/Precio del curso:/)).toHaveTextContent(/300\.000/);
    expect(within(matricula).getByText("Paga el precio del curso")).toBeInTheDocument();
    expect(
      within(matricula).queryByRole("button", { name: /Volver al precio del curso/ }),
    ).not.toBeInTheDocument();
  });

  it("los campos y botones avisan qué concepto se toca", async () => {
    const user = userEvent.setup();
    const funciones = renderVista();

    expect(screen.getByRole("spinbutton", { name: "Valor personalizado de MENSUALIDAD" })).toHaveValue(180000);
    await user.type(screen.getByRole("spinbutton", { name: "Valor personalizado de MATRICULA" }), "2");
    expect(funciones.onCambiarBorrador).toHaveBeenCalledWith(13, "valor", "2");
    await user.type(screen.getByRole("textbox", { name: "Motivo de MATRICULA" }), "A");
    expect(funciones.onCambiarBorrador).toHaveBeenCalledWith(13, "motivo", "A");

    await user.click(screen.getByRole("button", { name: "Guardar el valor de MENSUALIDAD" }));
    expect(funciones.onGuardar).toHaveBeenCalledWith(12);
    await user.click(screen.getByRole("button", { name: "Volver al precio del curso en MENSUALIDAD" }));
    expect(funciones.onVolverAlPrecio).toHaveBeenCalledWith(12);
    await user.click(screen.getByRole("button", { name: "Cerrar valores de pago" }));
    expect(funciones.onCerrar).toHaveBeenCalled();
  });

  it("sin valor escrito no deja guardar ese concepto", () => {
    renderVista();

    expect(screen.getByRole("button", { name: "Guardar el valor de MATRICULA" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardar el valor de MENSUALIDAD" })).toBeEnabled();
  });

  it("mientras guarda un concepto, bloquea los botones de todos", () => {
    renderVista({ guardandoTipoId: 12, borradores: { ...BORRADORES, 13: { valor: "1", motivo: "" } } });

    const guardarMensualidad = screen.getByRole("button", { name: "Guardar el valor de MENSUALIDAD" });
    expect(guardarMensualidad).toBeDisabled();
    expect(guardarMensualidad).toHaveTextContent("Guardando...");
    expect(screen.getByRole("button", { name: "Guardar el valor de MATRICULA" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Volver al precio del curso en MENSUALIDAD" }),
    ).toBeDisabled();
  });

  it("muestra la carga, la lista vacía y los avisos", () => {
    const { rerender } = render(
      <ValoresPagoMatriculaView
        anio={2027}
        estudianteNombre="Ana Rojas"
        filas={[]}
        borradores={{}}
        cargando
        guardandoTipoId={null}
        mensaje=""
        error=""
        onCambiarBorrador={vi.fn()}
        onGuardar={vi.fn()}
        onVolverAlPrecio={vi.fn()}
        onCerrar={vi.fn()}
      />,
    );
    expect(screen.getByText("Cargando valores de pago...")).toBeInTheDocument();

    rerender(
      <ValoresPagoMatriculaView
        anio={2027}
        estudianteNombre="Ana Rojas"
        filas={[]}
        borradores={{}}
        cargando={false}
        guardandoTipoId={null}
        mensaje="Se guardó el valor de MATRICULA para Ana Rojas."
        error="Este concepto no esta asignado al curso del estudiante."
        onCambiarBorrador={vi.fn()}
        onGuardar={vi.fn()}
        onVolverAlPrecio={vi.fn()}
        onCerrar={vi.fn()}
      />,
    );
    expect(screen.getByText(/No hay conceptos que se le cobren en 2027/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Se guardó el valor de MATRICULA para Ana Rojas.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Este concepto no esta asignado al curso del estudiante.",
    );
  });

  it("en móvil los botones ocupan todo el ancho", () => {
    renderVista();

    expect(screen.getByRole("button", { name: "Guardar el valor de MENSUALIDAD" })).toHaveClass(
      "w-full",
      "sm:w-auto",
    );
    expect(screen.getByRole("button", { name: "Cerrar valores de pago" })).toHaveClass(
      "w-full",
      "sm:w-auto",
    );
  });
});
