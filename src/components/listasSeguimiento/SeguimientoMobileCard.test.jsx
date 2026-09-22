import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SeguimientoMobileCard from "./SeguimientoMobileCard";

const ESTUDIANTE = { estudianteId: 101, nombre: "Juan", apellido: "Pérez" };
const COLUMNAS = [{ id: 5, nombre: "Asistió a la cumbre" }];

function renderTarjeta(props = {}) {
  const valorDeCelda = props.valorDeCelda ?? (() => ({ marcado: false, nota: "" }));
  return render(
    <SeguimientoMobileCard
      estudiante={ESTUDIANTE}
      numero={3}
      columnas={COLUMNAS}
      {...props}
      valorDeCelda={valorDeCelda}
    />,
  );
}

describe("SeguimientoMobileCard", () => {
  it("encabeza con el número y el nombre", () => {
    renderTarjeta();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Pérez Juan" }),
    ).toBeInTheDocument();
  });

  it("ofrece las mismas etiquetas que la fila de escritorio", () => {
    // Las dos vistas comparten nombres accesibles a propósito: lo que se
    // prueba en una vale para la otra, y un lector de pantalla oye lo mismo.
    renderTarjeta({ valorDeCelda: () => ({ marcado: true, nota: "Llegó tarde" }) });

    expect(
      screen.getByRole("checkbox", { name: "Asistió a la cumbre: Pérez Juan" }),
    ).toBeChecked();
    expect(
      screen.getByLabelText("Nota de Asistió a la cumbre para Pérez Juan"),
    ).toHaveValue("Llegó tarde");
  });

  it("marcar y escribir avisan con estudiante y columna", async () => {
    const onAlternarMarca = vi.fn();
    const onEscribirNota = vi.fn();
    const user = userEvent.setup();
    renderTarjeta({ onAlternarMarca, onEscribirNota });

    await user.click(screen.getByRole("checkbox"));
    await user.type(screen.getByRole("textbox"), "y");

    expect(onAlternarMarca).toHaveBeenCalledWith(101, 5);
    expect(onEscribirNota).toHaveBeenCalledWith(101, 5, "y");
  });

  it("sin columnas lo dice en vez de quedarse en blanco", () => {
    renderTarjeta({ columnas: [] });

    expect(screen.getByText("Sin columnas todavía.")).toBeInTheDocument();
  });
});
