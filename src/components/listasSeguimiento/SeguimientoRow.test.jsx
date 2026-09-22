import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SeguimientoRow from "./SeguimientoRow";

const ESTUDIANTE = { estudianteId: 101, nombre: "Juan", apellido: "Pérez" };
const COLUMNAS = [
  { id: 5, nombre: "Asistió a la cumbre" },
  { id: 6, nombre: "Compró el libro" },
];

function renderFila(props = {}) {
  const valorDeCelda = props.valorDeCelda ?? (() => ({ marcado: false, nota: "" }));
  return render(
    <table>
      <tbody>
        <SeguimientoRow
          estudiante={ESTUDIANTE}
          numero={1}
          columnas={COLUMNAS}
          {...props}
          valorDeCelda={valorDeCelda}
        />
      </tbody>
    </table>,
  );
}

describe("SeguimientoRow", () => {
  it("muestra el número y el nombre del estudiante", () => {
    renderFila();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Pérez Juan")).toBeInTheDocument();
  });

  it("pinta una celda por columna, con su check y su nota", () => {
    renderFila({
      valorDeCelda: (_estudianteId, columnaId) =>
        columnaId === 5
          ? { marcado: true, nota: "Llegó tarde" }
          : { marcado: false, nota: "" },
    });

    expect(
      screen.getByRole("checkbox", { name: "Asistió a la cumbre: Pérez Juan" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Compró el libro: Pérez Juan" }),
    ).not.toBeChecked();
    expect(
      screen.getByLabelText("Nota de Asistió a la cumbre para Pérez Juan"),
    ).toHaveValue("Llegó tarde");
  });

  it("marcar avisa con el estudiante y la columna", async () => {
    const onAlternarMarca = vi.fn();
    const user = userEvent.setup();
    renderFila({ onAlternarMarca });

    await user.click(
      screen.getByRole("checkbox", { name: "Compró el libro: Pérez Juan" }),
    );

    expect(onAlternarMarca).toHaveBeenCalledWith(101, 6);
  });

  it("escribir una nota avisa con el texto", async () => {
    const onEscribirNota = vi.fn();
    const user = userEvent.setup();
    renderFila({ onEscribirNota });

    await user.type(
      screen.getByLabelText("Nota de Asistió a la cumbre para Pérez Juan"),
      "x",
    );

    expect(onEscribirNota).toHaveBeenCalledWith(101, 5, "x");
  });

  it("la nota se corta al escribir, no al enviar", () => {
    // Cortar el texto al enviarlo lo perdería sin avisar; cortarlo al escribir
    // lo ve el usuario. 240 es el límite real de la tabla.
    renderFila();

    expect(
      screen.getByLabelText("Nota de Asistió a la cumbre para Pérez Juan"),
    ).toHaveAttribute("maxlength", "240");
  });

  it("sin columnas deja la fila con solo número y nombre", () => {
    renderFila({ columnas: [] });

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByText("Pérez Juan")).toBeInTheDocument();
  });
});
