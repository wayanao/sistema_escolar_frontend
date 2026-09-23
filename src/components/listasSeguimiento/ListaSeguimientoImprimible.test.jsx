import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ListaSeguimientoImprimible from "./ListaSeguimientoImprimible";

const COLUMNAS = [
  { id: 5, nombre: "Asistió a la cumbre" },
  { id: 6, nombre: "Compró el libro" },
];

const ESTUDIANTES = [
  { estudianteId: 101, nombre: "Juan", apellido: "Pérez" },
  { estudianteId: 102, nombre: "Ana", apellido: "Rojas" },
];

const filasDeDatos = () => screen.getAllByRole("row").slice(1);

describe("ListaSeguimientoImprimible", () => {
  it("pone una columna por cada columna creada, más el número y el nombre", () => {
    render(
      <ListaSeguimientoImprimible columnas={COLUMNAS} estudiantes={ESTUDIANTES} />,
    );

    const cabeceras = screen.getAllByRole("columnheader").map((c) => c.textContent);
    expect(cabeceras).toEqual([
      "#",
      "Estudiante",
      "Asistió a la cumbre",
      "Compró el libro",
    ]);
  });

  it("numera las filas y pone apellido y nombre", () => {
    render(
      <ListaSeguimientoImprimible columnas={COLUMNAS} estudiantes={ESTUDIANTES} />,
    );

    const filas = filasDeDatos();
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent("1");
    expect(filas[0]).toHaveTextContent("Pérez Juan");
    expect(filas[1]).toHaveTextContent("2");
    expect(filas[1]).toHaveTextContent("Rojas Ana");
  });

  it("las celdas de las columnas van VACÍAS", () => {
    // Es el punto de todo el impreso: es una plantilla en blanco para marcar
    // a mano, no un informe de lo registrado.
    render(
      <ListaSeguimientoImprimible columnas={COLUMNAS} estudiantes={ESTUDIANTES} />,
    );

    const celdas = within(filasDeDatos()[0]).getAllByRole("cell");
    expect(celdas).toHaveLength(4);
    expect(celdas[2]).toHaveTextContent("");
    expect(celdas[3]).toHaveTextContent("");
  });

  it("no imprime marcas aunque el estudiante las traiga", () => {
    // Ni siquiera puede: no recibe las marcas. Esta prueba fija que la forma
    // del componente no deje colarlas por la puerta de atrás.
    const conMarcas = [
      {
        ...ESTUDIANTES[0],
        marcas: { 5: { marcado: true, nota: "Llegó tarde" } },
      },
    ];

    render(
      <ListaSeguimientoImprimible columnas={COLUMNAS} estudiantes={conMarcas} />,
    );

    expect(screen.queryByText("Llegó tarde")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("no pinta el título ni el escudo: eso es del documento imprimible", () => {
    render(
      <ListaSeguimientoImprimible columnas={COLUMNAS} estudiantes={ESTUDIANTES} />,
    );

    expect(screen.queryByText(/Listas de control/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("sin columnas deja solo número y nombre", () => {
    render(<ListaSeguimientoImprimible columnas={[]} estudiantes={ESTUDIANTES} />);

    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(within(filasDeDatos()[0]).getAllByRole("cell")).toHaveLength(2);
  });

  it("sin estudiantes lo dice en vez de imprimir una tabla vacía", () => {
    render(<ListaSeguimientoImprimible columnas={COLUMNAS} estudiantes={[]} />);

    expect(screen.getByText("Este curso no tiene estudiantes.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("aguanta que no le pasen nada", () => {
    render(<ListaSeguimientoImprimible />);

    expect(screen.getByText("Este curso no tiene estudiantes.")).toBeInTheDocument();
  });
});
