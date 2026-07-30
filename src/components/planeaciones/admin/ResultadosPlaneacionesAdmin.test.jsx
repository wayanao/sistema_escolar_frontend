import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ResultadosPlaneacionesAdmin from "./ResultadosPlaneacionesAdmin";

function crearProps(overrides = {}) {
  return {
    planes: [],
    total: 0,
    vista: "",
    estado: "",
    pagina: 1,
    busqueda: "",
    busquedaAplicada: "",
    cargando: false,
    error: "",
    seleccionCompleta: false,
    totalPaginas: 1,
    desde: 0,
    hasta: 0,
    onCambiarBusqueda: vi.fn(),
    onLimpiarBusqueda: vi.fn(),
    onLimpiarFiltros: vi.fn(),
    onCambiarPagina: vi.fn(),
    onAbrirPlan: vi.fn(),
    ...overrides,
  };
}

describe("ResultadosPlaneacionesAdmin", () => {
  it("guía la selección antes de consultar la bandeja", () => {
    render(
      <ResultadosPlaneacionesAdmin
        {...crearProps({ vista: "programadas" })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Consulta de planeaciones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Elige fecha y estado para comenzar"),
    ).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.queryByText(/Página 1 de 1/)).not.toBeInTheDocument();
  });

  it("delega la búsqueda y su limpieza con la ayuda correspondiente", async () => {
    const user = userEvent.setup();
    const props = crearProps({
      busqueda: "m",
      onCambiarBusqueda: vi.fn(),
      onLimpiarBusqueda: vi.fn(),
    });

    render(<ResultadosPlaneacionesAdmin {...props} />);

    const buscador = screen.getByRole("searchbox", {
      name: "Buscar dentro del historial",
    });
    expect(buscador).toHaveAccessibleDescription(
      "Escribe al menos 2 caracteres para comenzar a filtrar.",
    );

    await user.type(buscador, "a");
    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(props.onCambiarBusqueda).toHaveBeenCalledWith("ma");
    expect(props.onLimpiarBusqueda).toHaveBeenCalledTimes(1);
  });

  it("presenta error, carga y vacío respetando la prioridad visual", async () => {
    const user = userEvent.setup();
    const props = crearProps({
      seleccionCompleta: true,
      vista: "todas",
      estado: "revisado",
      error: "No fue posible cargar las planeaciones.",
      onLimpiarFiltros: vi.fn(),
    });
    const { rerender } = render(
      <ResultadosPlaneacionesAdmin {...props} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No fue posible cargar las planeaciones.",
    );

    rerender(
      <ResultadosPlaneacionesAdmin
        {...props}
        error=""
        cargando
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Actualizando planeaciones revisadas...",
    );

    rerender(
      <ResultadosPlaneacionesAdmin
        {...props}
        error=""
        cargando={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No encontramos planeaciones" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(props.onLimpiarFiltros).toHaveBeenCalledTimes(1);
  });

  it("renderiza resultados responsive y delega la apertura del plan", async () => {
    const user = userEvent.setup();
    const onAbrirPlan = vi.fn();
    const plan = {
      id: 91,
      fecha: "2026-07-29",
      periodo: 3,
      tema: "Fracciones equivalentes",
      materia: "Matemáticas",
      curso: "Tercero A",
      profesor: "Ana Ruiz",
      estado_revision: "pendiente",
      version_revision: 4,
      imagen1: "/evidencias/91.jpg",
    };

    render(
      <ResultadosPlaneacionesAdmin
        {...crearProps({
          planes: [plan],
          total: 1,
          vista: "programadas",
          estado: "pendiente",
          seleccionCompleta: true,
          desde: 1,
          hasta: 1,
          onAbrirPlan,
        })}
      />,
    );

    expect(screen.getByText("Mostrando 1–1 de 1")).toBeInTheDocument();
    expect(screen.getAllByText("Fracciones equivalentes")).toHaveLength(2);
    expect(screen.getAllByText("Revisión 4")).toHaveLength(2);
    expect(screen.getByText("Con evidencia")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir" }));

    expect(onAbrirPlan).toHaveBeenCalledWith(91);
  });

  it("delega la paginación mediante actualizadores acotados", async () => {
    const user = userEvent.setup();
    const onCambiarPagina = vi.fn();

    render(
      <ResultadosPlaneacionesAdmin
        {...crearProps({
          seleccionCompleta: true,
          vista: "todas",
          estado: "revisado",
          pagina: 2,
          totalPaginas: 3,
          onCambiarPagina,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onCambiarPagina).toHaveBeenCalledTimes(2);
    expect(onCambiarPagina.mock.calls[0][0](2)).toBe(1);
    expect(onCambiarPagina.mock.calls[1][0](2)).toBe(3);
  });
});
