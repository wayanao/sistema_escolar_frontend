import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TablaSeguimiento from "./TablaSeguimiento";

const COLUMNAS = [
  { id: 5, nombre: "Asistió a la cumbre" },
  { id: 6, nombre: "Compró el libro" },
];
const ESTUDIANTES = [
  { estudianteId: 101, nombre: "Juan", apellido: "Pérez" },
  { estudianteId: 102, nombre: "Ana", apellido: "Rojas" },
];

const sinMarcas = () => ({ marcado: false, nota: "" });

function renderTabla(props = {}) {
  return render(
    <TablaSeguimiento
      columnas={COLUMNAS}
      estudiantes={ESTUDIANTES}
      valorDeCelda={sinMarcas}
      onAlternarMarca={vi.fn()}
      onEscribirNota={vi.fn()}
      {...props}
    />,
  );
}

describe("TablaSeguimiento", () => {
  it("pone cada columna en la cabecera", () => {
    renderTabla();

    expect(
      screen.getByRole("columnheader", { name: "Asistió a la cumbre" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Compró el libro" }),
    ).toBeInTheDocument();
  });

  it("numera a los estudiantes en el orden que llegan", () => {
    renderTabla();

    const filas = screen.getAllByRole("row").slice(1);
    expect(filas[0]).toHaveTextContent("1");
    expect(filas[0]).toHaveTextContent("Pérez Juan");
    expect(filas[1]).toHaveTextContent("2");
    expect(filas[1]).toHaveTextContent("Rojas Ana");
  });

  it("pinta las dos vistas a la vez y esconde una con CSS", () => {
    // Se pintan las dos y se elige con clases, en vez de medir la ventana en
    // JavaScript: en la primera pintada todavía no se sabe el ancho real.
    renderTabla();

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("un curso sin columnas muestra a los alumnos igual, no es un error", () => {
    // Es la pantalla recién estrenada: el documento lo fija como invariante.
    renderTabla({ columnas: [] });

    // Dos veces: una en la tabla y otra en la tarjeta, que se pintan siempre
    // las dos y se esconde una con CSS.
    expect(screen.getAllByText("Pérez Juan")).toHaveLength(2);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("un curso sin estudiantes lo dice en vez de mostrar una tabla vacía", () => {
    renderTabla({ estudiantes: [] });

    expect(screen.getByText("Este curso no tiene estudiantes.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
