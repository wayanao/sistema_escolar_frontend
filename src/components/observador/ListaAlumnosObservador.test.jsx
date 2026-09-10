import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ListaAlumnosObservador from "./ListaAlumnosObservador";

const ESTUDIANTES = [
  { estudiante_id: 11, nombre: "Ana", apellido: "Gómez", curso: "PRIMERO-A" },
  { estudiante_id: 12, nombre: "Luis", apellido: "Díaz", curso: "PRIMERO-A" },
  { estudiante_id: 21, nombre: "Sofía", apellido: "Ruiz", curso: "SEGUNDO" },
];

function pintar(props = {}) {
  return render(
    <ListaAlumnosObservador
      busqueda=""
      onCambiarBusqueda={vi.fn()}
      estudiantes={ESTUDIANTES}
      cargando={false}
      error={null}
      onReintentar={vi.fn()}
      onAbrir={vi.fn()}
      {...props}
    />,
  );
}

describe("ListaAlumnosObservador", () => {
  it("lista solo los nombres y abre el alumno al pulsarlo", async () => {
    const user = userEvent.setup();
    const onAbrir = vi.fn();
    pintar({ onAbrir });

    await user.click(screen.getByRole("button", { name: "Ana Gómez" }));

    expect(onAbrir).toHaveBeenCalledWith(ESTUDIANTES[0]);
    expect(screen.getByRole("button", { name: "Luis Díaz" })).toBeInTheDocument();
  });

  it("agrupa por curso y dice cuántos hay en cada uno", () => {
    // Un profesor puede tener 81 alumnos en seis cursos -medido-, y una lista
    // plana de 81 nombres no se lee.
    pintar();

    const encabezados = screen.getAllByRole("heading");
    expect(encabezados.map((h) => h.textContent)).toStrictEqual([
      "PRIMERO-A2",
      "SEGUNDO1",
    ]);
  });

  it("no repite un alumno en dos cursos", () => {
    pintar();

    expect(screen.getAllByRole("button", { name: "Ana Gómez" })).toHaveLength(1);
  });

  it("filtra escribiendo, sin obligar a pulsar un botón de buscar", async () => {
    const user = userEvent.setup();
    const onCambiarBusqueda = vi.fn();
    pintar({ onCambiarBusqueda });

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "a");

    expect(onCambiarBusqueda).toHaveBeenCalledWith("a");
    expect(screen.queryByRole("button", { name: "Buscar" })).not.toBeInTheDocument();
  });

  it("avisa mientras carga", () => {
    pintar({ cargando: true, estudiantes: [] });

    expect(screen.getByText("Cargando estudiantes...")).toBeInTheDocument();
  });

  it("enseña el fallo y deja reintentar", async () => {
    const user = userEvent.setup();
    const onReintentar = vi.fn();
    pintar({
      estudiantes: [],
      error: "No se pudo cargar tu lista de estudiantes. Intenta de nuevo.",
      onReintentar,
    });

    expect(
      screen.getByText("No se pudo cargar tu lista de estudiantes. Intenta de nuevo."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("distingue «no coincide nadie» de «no tienes alumnos»", () => {
    const { rerender } = pintar({ estudiantes: [], busqueda: "zzz" });
    expect(screen.getByText("No hay estudiantes que coincidan.")).toBeInTheDocument();

    rerender(
      <ListaAlumnosObservador
        busqueda=""
        onCambiarBusqueda={vi.fn()}
        estudiantes={[]}
        cargando={false}
        error={null}
        onReintentar={vi.fn()}
        onAbrir={vi.fn()}
      />,
    );
    expect(
      screen.getByText("No tienes estudiantes asignados todavía."),
    ).toBeInTheDocument();
  });

  it("pone a los alumnos sin curso bajo su propio encabezado", () => {
    pintar({
      estudiantes: [{ estudiante_id: 30, nombre: "Eva", apellido: "Sol", curso: null }],
    });

    const bloque = screen.getByRole("heading", { name: /Sin curso/ }).parentElement;
    expect(within(bloque).getByRole("button", { name: "Eva Sol" })).toBeInTheDocument();
  });
});
