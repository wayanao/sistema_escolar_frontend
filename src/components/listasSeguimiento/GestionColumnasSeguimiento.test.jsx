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

    expect(onCrear).toHaveBeenCalledWith("Fue a la salida", {
      enTodosLosCursos: false,
    });
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

    expect(onCrear).toHaveBeenCalledWith("Con enter", { enTodosLosCursos: false });
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

describe("crear en todos los cursos", () => {
  const casilla = () => screen.getByRole("checkbox", { name: /todos los cursos/i });

  it("empieza desmarcada: el alta normal es la de un solo curso", () => {
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} />);

    expect(casilla()).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Agregar columna" }),
    ).toBeInTheDocument();
  });

  it("marcarla cambia el texto del botón", async () => {
    // El modo tiene que verse siempre: la casilla no se desmarca sola al
    // crear, así que nadie debe poder crear en 25 cursos creyendo que crea
    // en uno.
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} />);

    await user.click(casilla());

    expect(
      screen.getByRole("button", { name: "Agregar en todos los cursos" }),
    ).toBeInTheDocument();
  });

  it("avisa de antemano de que los que ya la tienen se saltan", async () => {
    // Así el "0 creadas" del resultado no parece un error.
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} />);

    expect(screen.queryByText(/se quedan como están/i)).not.toBeInTheDocument();
    await user.click(casilla());

    expect(screen.getByText(/aún no la tengan/i)).toBeInTheDocument();
  });

  it("pasa la opción a quien crea", async () => {
    const onCrear = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={onCrear} />);

    await user.click(casilla());
    await user.type(screen.getByLabelText("Nueva columna"), "Pagó la excursión");
    await user.click(
      screen.getByRole("button", { name: "Agregar en todos los cursos" }),
    );

    expect(onCrear).toHaveBeenCalledWith("Pagó la excursión", {
      enTodosLosCursos: true,
    });
  });

  it("sigue marcada después de crear, para poder dar de alta varias seguidas", async () => {
    const onCrear = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={onCrear} />);

    await user.click(casilla());
    await user.type(screen.getByLabelText("Nueva columna"), "Primera");
    await user.click(
      screen.getByRole("button", { name: "Agregar en todos los cursos" }),
    );

    expect(casilla()).toBeChecked();
    expect(screen.getByLabelText("Nueva columna")).toHaveValue("");
  });

  it("mientras crea, la casilla tampoco se puede tocar", () => {
    render(<GestionColumnasSeguimiento columnas={[]} onCrear={vi.fn()} creando />);

    expect(casilla()).toBeDisabled();
  });
});
