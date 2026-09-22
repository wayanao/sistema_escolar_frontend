import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import VistaListasSeguimiento from "./VistaListasSeguimiento";

const CURSOS = [
  { id: 12, nombre: "1A" },
  { id: 13, nombre: "2B" },
];

const LISTA = {
  cursoId: 12,
  columnas: [{ id: 5, nombre: "Asistió a la cumbre" }],
  estudiantes: [{ estudianteId: 101, nombre: "Juan", apellido: "Pérez" }],
};

function renderVista(props = {}) {
  return render(
    <VistaListasSeguimiento
      cursos={CURSOS}
      cursoId={12}
      lista={LISTA}
      valorDeCelda={() => ({ marcado: false, nota: "" })}
      onSeleccionarCurso={vi.fn()}
      onCrearColumna={vi.fn()}
      onEliminarColumna={vi.fn()}
      onAlternarMarca={vi.fn()}
      onEscribirNota={vi.fn()}
      onGuardar={vi.fn()}
      onDescartar={vi.fn()}
      {...props}
    />,
  );
}

describe("VistaListasSeguimiento", () => {
  it("arma su propio selector de curso", () => {
    // Este módulo pide su propio GET /cursos y arma su propio selector, como
    // ya hacen Boletín y Tipos de Pago. No se extrae uno común todavía.
    renderVista();

    expect(screen.getByLabelText("Curso")).toHaveValue("12");
    expect(screen.getByRole("option", { name: "2B" })).toBeInTheDocument();
  });

  it("avisa del cambio de curso con el valor elegido", async () => {
    const onSeleccionarCurso = vi.fn();
    const user = userEvent.setup();
    renderVista({ onSeleccionarCurso });

    await user.selectOptions(screen.getByLabelText("Curso"), "13");

    expect(onSeleccionarCurso).toHaveBeenCalledWith("13");
  });

  it("sin curso elegido invita a elegir uno y no pinta la grilla", () => {
    renderVista({ cursoId: null });

    expect(screen.getByText(/Elige un curso/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("mientras carga no pinta la grilla vieja", () => {
    renderVista({ cargando: true });

    expect(screen.getByText("Cargando la lista...")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("un error se anuncia y reemplaza a la grilla", () => {
    renderVista({ error: "Ese curso no existe." });

    expect(screen.getByRole("alert")).toHaveTextContent("Ese curso no existe.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("con datos muestra columnas, alumnos y la barra de guardado", () => {
    renderVista({ cantidadCambios: 2 });

    // El nombre de la columna sale en tres sitios a la vez -la etiqueta de
    // gestión, la cabecera de la tabla y la tarjeta móvil-, así que se busca
    // el sitio concreto en vez del texto suelto.
    expect(
      screen.getByRole("columnheader", { name: "Asistió a la cumbre" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Pérez Juan").length).toBeGreaterThan(0);
    expect(screen.getByText("2 cambios sin guardar.")).toBeInTheDocument();
  });

  it("sin columnas esconde la barra de guardado", () => {
    // Sin columnas no hay celdas que marcar, y una barra que nunca se puede
    // usar solo estorba.
    renderVista({ lista: { ...LISTA, columnas: [] } });

    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/todavía no tiene columnas/i)).toBeInTheDocument();
  });

  it("sin estudiantes también esconde la barra", () => {
    renderVista({ lista: { ...LISTA, estudiantes: [] } });

    expect(
      screen.queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
  });

  it("no importa nada de services: todo llega por props", async () => {
    const onGuardar = vi.fn();
    const user = userEvent.setup();
    renderVista({ cantidadCambios: 1, onGuardar });

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onGuardar).toHaveBeenCalledTimes(1);
  });
});
