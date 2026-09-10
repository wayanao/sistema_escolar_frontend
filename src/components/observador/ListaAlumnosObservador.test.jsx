import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ListaAlumnosObservador from "./ListaAlumnosObservador";

const ESTUDIANTES = [
  { estudiante_id: 101, nombre: "Ana", apellido: "Gómez" },
  { estudiante_id: 102, nombre: "Luis", apellido: "Díaz" },
];

function pintar(props = {}) {
  return render(
    <ListaAlumnosObservador
      busqueda=""
      onCambiarBusqueda={vi.fn()}
      estudiantes={ESTUDIANTES}
      cargando={false}
      error={null}
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

  it("filtra escribiendo, sin obligar a pulsar un botón de buscar", async () => {
    const user = userEvent.setup();
    const onCambiarBusqueda = vi.fn();
    pintar({ onCambiarBusqueda });

    await user.type(screen.getByPlaceholderText("Buscar estudiante..."), "a");

    expect(onCambiarBusqueda).toHaveBeenCalledWith("a");
    expect(screen.queryByRole("button", { name: "Buscar" })).not.toBeInTheDocument();
  });

  it("avisa mientras carga, si falla y si no queda nadie", () => {
    const { rerender } = pintar({ cargando: true, estudiantes: [] });
    expect(screen.getByText("Cargando estudiantes...")).toBeInTheDocument();

    rerender(
      <ListaAlumnosObservador
        busqueda=""
        onCambiarBusqueda={vi.fn()}
        estudiantes={[]}
        cargando={false}
        error={new Error("fallo")}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.getByText(/No se pudo cargar la lista/)).toBeInTheDocument();

    rerender(
      <ListaAlumnosObservador
        busqueda="zzz"
        onCambiarBusqueda={vi.fn()}
        estudiantes={[]}
        cargando={false}
        error={null}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.getByText("No hay estudiantes que coincidan.")).toBeInTheDocument();
  });
});
