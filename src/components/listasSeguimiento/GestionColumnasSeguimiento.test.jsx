import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GestionColumnasSeguimiento from "./GestionColumnasSeguimiento";

const COLUMNAS = [
  { id: 5, nombre: "Asistió a la cumbre" },
  { id: 6, nombre: "Compró el libro" },
];

describe("GestionColumnasSeguimiento", () => {
  it("sin columnas invita a crear la primera", () => {
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} />);

    expect(screen.getByText(/todavía no tiene columnas/i)).toBeInTheDocument();
  });

  it("lista las columnas existentes", () => {
    render(<GestionColumnasSeguimiento columnas={COLUMNAS} onCrear={vi.fn()} />);

    expect(screen.getByText("Asistió a la cumbre")).toBeInTheDocument();
    expect(screen.getByText("Compró el libro")).toBeInTheDocument();
  });

  it("crea con lo escrito y limpia el campo si salió bien", async () => {
    const onCrear = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={onCrear} />);

    const campo = screen.getByLabelText("Nueva columna");
    await user.type(campo, "Fue a la salida");
    await user.click(screen.getByRole("button", { name: "Agregar columna" }));

    expect(onCrear).toHaveBeenCalledWith("Fue a la salida");
    expect(campo).toHaveValue("");
  });

  it("si la creación falla conserva lo escrito para no obligar a repetirlo", async () => {
    const onCrear = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={onCrear} />);

    const campo = screen.getByLabelText("Nueva columna");
    await user.type(campo, "Repetida");
    await user.click(screen.getByRole("button", { name: "Agregar columna" }));

    expect(campo).toHaveValue("Repetida");
  });

  it("Enter en el campo también crea", async () => {
    const onCrear = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={onCrear} />);

    await user.type(screen.getByLabelText("Nueva columna"), "Con enter{Enter}");

    expect(onCrear).toHaveBeenCalledWith("Con enter");
  });

  it("el campo no deja escribir más del límite de la tabla", () => {
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} />);

    expect(screen.getByLabelText("Nueva columna")).toHaveAttribute(
      "maxlength",
      "100",
    );
  });

  it("mientras crea, bloquea el campo y el botón", () => {
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} creando />);

    expect(screen.getByLabelText("Nueva columna")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Agregando..." })).toBeDisabled();
  });

  it("cada columna trae su propio botón de borrar", async () => {
    const onEliminar = vi.fn();
    const user = userEvent.setup();
    render(
      <GestionColumnasSeguimiento
        columnas={COLUMNAS}
        onCrear={vi.fn()}
        onEliminar={onEliminar}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Borrar columna Compró el libro" }),
    );

    expect(onEliminar).toHaveBeenCalledWith(COLUMNAS[1]);
  });

  it("solo se bloquea el botón de la columna que se está borrando", () => {
    render(
      <GestionColumnasSeguimiento
        columnas={COLUMNAS}
        onCrear={vi.fn()}
        onEliminar={vi.fn()}
        eliminandoColumnaId={5}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Borrar columna Asistió a la cumbre" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Borrar columna Compró el libro" }),
    ).toBeEnabled();
  });
});
