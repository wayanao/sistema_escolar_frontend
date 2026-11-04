import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NotificacionesPlaneadoresVista from "./NotificacionesPlaneadoresVista";

function renderVista(overrides = {}) {
  const props = {
    rol: "admin",
    abierto: true,
    total: 0,
    totalProfesores: 0,
    items: [],
    gruposAdmin: [],
    cargando: false,
    error: "",
    contenedorRef: { current: null },
    onAlternar: vi.fn(),
    onReintentar: vi.fn(),
    onAbrirGrupo: vi.fn(),
    onAbrirNotificacion: vi.fn(),
    onVerTodos: vi.fn(),
    ...overrides,
  };
  return { ...render(<NotificacionesPlaneadoresVista {...props} />), props };
}

describe("NotificacionesPlaneadoresVista", () => {
  it("presenta la campana cerrada, limita el contador y delega su apertura", async () => {
    const user = userEvent.setup();
    const { props } = renderVista({ abierto: false, total: 125 });

    const campana = screen.getByRole("button", {
      name: "Notificaciones de planeadores: 125 sin leer",
    });
    expect(campana).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.queryByText("Notificaciones")).not.toBeInTheDocument();

    await user.click(campana);
    expect(props.onAlternar).toHaveBeenCalledTimes(1);
  });

  it("se pinta según la barra donde va: morada por defecto, blanca desde tablet", () => {
    const { unmount } = renderVista({ abierto: false, total: 3 });
    const morada = screen.getByRole("button", { name: "Notificaciones de planeadores: 3 sin leer" });
    expect(morada).toHaveClass("bg-white/10", "text-white");
    expect(screen.getByText("3")).toHaveClass("border-purple-700");
    unmount();

    renderVista({ abierto: false, total: 3, tono: "claro" });
    const blanca = screen.getByRole("button", { name: "Notificaciones de planeadores: 3 sin leer" });
    expect(blanca).toHaveClass("bg-white", "text-slate-600");
    expect(blanca).not.toHaveClass("text-white");
    expect(screen.getByText("3")).toHaveClass("border-white");
  });

  it("presenta grupos administrativos y delega ambas navegaciones", async () => {
    const user = userEvent.setup();
    const grupo = {
      id: "profesor-7",
      profesor: "Ana Torres",
      profesorId: "7",
      cantidad: 3,
      ultimaFecha: "2026-08-09T10:00:00Z",
    };
    const { props } = renderVista({
      total: 3,
      totalProfesores: 2,
      items: [{ id: 91 }],
      gruposAdmin: [grupo],
    });

    expect(screen.getByText("Nuevas planeaciones docentes")).toBeInTheDocument();
    expect(screen.getByText("3 planeaciones")).toBeInTheDocument();
    expect(screen.getByText(
      "Se muestran 1 de 2 profesores con envíos pendientes.",
    )).toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: "Abrir 3 planeaciónes pendientes de Ana Torres",
    }));
    expect(props.onAbrirGrupo).toHaveBeenCalledWith(grupo);

    await user.click(screen.getByRole("button", {
      name: "Abrir bandeja de planeaciones",
    }));
    expect(props.onVerTodos).toHaveBeenCalledTimes(1);
  });

  it("presenta notificaciones del profesor y delega la selección", async () => {
    const user = userEvent.setup();
    const item = {
      tipo: "observacion",
      id: 13,
      admin: "Coordinación",
      tema: "Fracciones",
      materia: "Matemáticas",
      curso: "5A",
      observacion: "Ajustar el propósito de la clase.",
      creada_at: "2026-08-09T10:00:00Z",
    };
    const { props } = renderVista({
      rol: "profesor",
      total: 1,
      items: [item],
    });

    expect(screen.getByText("Comentarios de administración")).toBeInTheDocument();
    expect(screen.getByText("1 nueva")).toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: /Ajustar el propósito de la clase/,
    }));
    expect(props.onAbrirNotificacion).toHaveBeenCalledWith(item);

    await user.click(screen.getByRole("button", {
      name: "Abrir plan de clases",
    }));
    expect(props.onVerTodos).toHaveBeenCalledTimes(1);
  });

  it("conserva los estados de carga, error con reintento y bandeja vacía", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderVista({ cargando: true });

    expect(screen.getByText("Actualizando...")).toBeInTheDocument();

    rerender(
      <NotificacionesPlaneadoresVista
        {...props}
        cargando={false}
        error="No pudimos actualizar las notificaciones."
      />,
    );
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(props.onReintentar).toHaveBeenCalledTimes(1);

    rerender(
      <NotificacionesPlaneadoresVista
        {...props}
        cargando={false}
        error=""
      />,
    );
    expect(screen.getByText("Todo está al día")).toBeInTheDocument();
    expect(screen.getByText(
      "No tienes notificaciones nuevas de planeaciones.",
    )).toBeInTheDocument();
  });
});
