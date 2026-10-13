import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ListaAdmisionesView from "./ListaAdmisionesView";

const CONTEOS = { pendiente: 1, aprobado: 2, no_aprobado: 0, matriculado: 1, total: 3 };
const ADMISIONES = [
  {
    id: 7,
    nombre: "Lina",
    apellido: "Díaz",
    tipo_documento: "Registro Civil",
    documento_identidad: "2001",
    curso_nombre: "PRIMERO A",
    curso_jornada: "Mañana",
    resultado: "pendiente",
    matriculada: false,
  },
  {
    id: 8,
    nombre: "Juan",
    apellido: "Ríos",
    tipo_documento: null,
    documento_identidad: null,
    curso_nombre: null,
    resultado: "aprobado",
    matriculada: true,
  },
];

function pintar(props = {}) {
  const propiedades = {
    anio: 2027,
    editable: true,
    conteos: CONTEOS,
    filtro: "todos",
    onCambiarFiltro: vi.fn(),
    admisiones: ADMISIONES,
    cargando: false,
    seleccionadaId: null,
    onNuevo: vi.fn(),
    onAbrir: vi.fn(),
    ...props,
  };
  render(<ListaAdmisionesView {...propiedades} />);
  return propiedades;
}

describe("ListaAdmisionesView", () => {
  it("muestra cada aspirante con su documento, curso y resultado", () => {
    pintar();

    const lina = screen.getByRole("listitem", { name: "Lina Díaz" });
    expect(within(lina).getByText("Registro Civil 2001")).toBeInTheDocument();
    expect(within(lina).getByText("PRIMERO A · Mañana")).toBeInTheDocument();
    expect(within(lina).getByText("Pendiente")).toBeInTheDocument();

    const juan = screen.getByRole("listitem", { name: "Juan Ríos" });
    expect(within(juan).getByText("Sin documento")).toBeInTheDocument();
    expect(within(juan).getByText("Sin curso")).toBeInTheDocument();
    expect(within(juan).getByText("Matriculado")).toBeInTheDocument();
  });

  it("los filtros llevan su conteo y avisan el elegido", async () => {
    const user = userEvent.setup();
    const props = pintar({ filtro: "aprobado" });

    expect(screen.getByRole("button", { name: "Todos (3)" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Aprobados (2)" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Pendientes (1)" }));

    expect(props.onCambiarFiltro).toHaveBeenCalledWith("pendiente");
  });

  it("abrir y nuevo llaman a la página", async () => {
    const user = userEvent.setup();
    const props = pintar();

    await user.click(screen.getByRole("button", { name: "Abrir Lina Díaz" }));
    await user.click(screen.getByRole("button", { name: "Nuevo aspirante" }));

    expect(props.onAbrir).toHaveBeenCalledWith(7);
    expect(props.onNuevo).toHaveBeenCalledTimes(1);
  });

  it("si el año ya no está en preparación no ofrece registrar", () => {
    pintar({ editable: false });

    expect(screen.queryByRole("button", { name: "Nuevo aspirante" })).not.toBeInTheDocument();
  });

  it("dice cuando no hay nadie, con y sin filtro", () => {
    const { rerender } = render(
      <ListaAdmisionesView
        anio={2027}
        editable
        conteos={CONTEOS}
        filtro="todos"
        onCambiarFiltro={vi.fn()}
        admisiones={[]}
        cargando={false}
        seleccionadaId={null}
        onNuevo={vi.fn()}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.getByText("Todavía no hay aspirantes para 2027.")).toBeInTheDocument();

    rerender(
      <ListaAdmisionesView
        anio={2027}
        editable
        conteos={CONTEOS}
        filtro="no_aprobado"
        onCambiarFiltro={vi.fn()}
        admisiones={[]}
        cargando={false}
        seleccionadaId={null}
        onNuevo={vi.fn()}
        onAbrir={vi.fn()}
      />,
    );
    expect(screen.getByText("No hay aspirantes con este resultado.")).toBeInTheDocument();
  });
});
