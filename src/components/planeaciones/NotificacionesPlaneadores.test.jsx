import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES } from "../../utils/planeaciones/notificacionesContratos";
import NotificacionesPlaneadores from "./NotificacionesPlaneadores";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("../../utils/api", () => ({
  default: apiMock,
}));

function UbicacionActual() {
  const location = useLocation();
  return (
    <output data-testid="ubicacion-actual">
      {location.pathname}{location.search}
    </output>
  );
}

function NavegacionExterna() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={() => navigate("/otra-ruta")}
    >
      Cambiar ruta externamente
    </button>
  );
}

function renderNotificaciones({ rol = "admin", onNavigate = vi.fn() } = {}) {
  return render(
    <MemoryRouter>
      <header className="relative">
        <NotificacionesPlaneadores rol={rol} onNavigate={onNavigate} />
      </header>
      <UbicacionActual />
      <NavegacionExterna />
    </MemoryRouter>,
  );
}

describe("NotificacionesPlaneadores", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.get.mockResolvedValue({
      data: {
        total_no_leidas: 0,
        total_profesores: 0,
        items: [],
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("ancla la ventana al encabezado en móvil y a la campana en escritorio", async () => {
    const user = userEvent.setup();

    renderNotificaciones();

    const campana = screen.getByRole("button", {
      name: "Notificaciones de planeadores",
    });
    await user.click(campana);

    const ventana = campana.nextElementSibling;

    expect(campana).toHaveAttribute("aria-expanded", "true");
    expect(ventana).toBeInTheDocument();
    expect(ventana).toHaveClass(
      "absolute",
      "left-3",
      "right-3",
      "top-[3.75rem]",
      "lg:right-0",
      "lg:top-12",
    );
    expect(ventana).not.toHaveClass("fixed");
    expect(campana.parentElement).toHaveClass("static");
    expect(campana.parentElement).toHaveClass("lg:relative");
    expect(campana.parentElement).not.toHaveClass("relative");
  });

  it("cierra la ventana con Escape, clic exterior y cambio de ruta", async () => {
    const user = userEvent.setup();
    renderNotificaciones();
    const campana = screen.getByRole("button", {
      name: "Notificaciones de planeadores",
    });

    await user.click(campana);
    await user.keyboard("{Escape}");
    expect(campana).toHaveAttribute("aria-expanded", "false");

    await user.click(campana);
    fireEvent.mouseDown(document.body);
    expect(campana).toHaveAttribute("aria-expanded", "false");

    await user.click(campana);
    await user.click(screen.getByRole("button", {
      name: "Cambiar ruta externamente",
    }));
    expect(campana).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("ubicacion-actual")).toHaveTextContent(
      "/otra-ruta",
    );
  });

  it("consulta veinte para admin, agrupa por profesor y abre su bandeja", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    apiMock.get.mockResolvedValue({
      data: {
        total_no_leidas: 3,
        total_profesores: 1,
        items: [
          {
            id: 1,
            plan_id: 91,
            profesor: " Ana Torres ",
            profesor_id: 7,
            cantidad: 2,
            creada_at: "2026-08-08T10:00:00Z",
          },
          {
            id: 2,
            plan_id: 92,
            profesor: "Ana Torres",
            profesor_id: 7,
            cantidad: 1,
            creada_at: "2026-08-09T10:00:00Z",
          },
        ],
      },
    });

    renderNotificaciones({ onNavigate });

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith("/notificaciones/planeadores", {
        params: { limit: 20 },
      });
    });

    await user.click(screen.getByRole("button", {
      name: "Notificaciones de planeadores: 3 sin leer",
    }));

    expect(screen.getByText("3 planeaciones")).toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: "Abrir 3 planeaciónes pendientes de Ana Torres",
    }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("ubicacion-actual")).toHaveTextContent(
      "/admin/planeadores-clases?vista=todas&estado=pendiente&profesor_id=7",
    );
  });

  it("consulta ocho para profesor y conserva la ruta exacta de la observación", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    apiMock.get.mockResolvedValue({
      data: {
        total_no_leidas: 1,
        total_profesores: 0,
        items: [
          {
            tipo: "observacion",
            id: 13,
            plan_id: 91,
            asignacion_id: 44,
            fecha: "2026-08-09",
            admin: "Coordinación",
            tema: "Fracciones",
            materia: "Matemáticas",
            curso: "5A",
            observacion: "Ajustar el propósito de la clase.",
            creada_at: "2026-08-09T10:00:00Z",
          },
        ],
      },
    });

    renderNotificaciones({ rol: "profesor", onNavigate });

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith("/notificaciones/planeadores", {
        params: { limit: 8 },
      });
    });

    await user.click(screen.getByRole("button", {
      name: "Notificaciones de planeadores: 1 sin leer",
    }));
    await user.click(screen.getByRole("button", {
      name: /Ajustar el propósito de la clase/,
    }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("ubicacion-actual")).toHaveTextContent(
      "/plan-de-clases?asignacion_id=44&fecha=2026-08-09&plan_id=91&observaciones=1",
    );
  });

  it("recarga con foco, evento local y solo con visibilidad activa", async () => {
    const visibilityState = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");

    renderNotificaciones();

    await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(1));

    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(2));

    act(() => window.dispatchEvent(
      new CustomEvent(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES),
    ));
    await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(3));

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(apiMock.get).toHaveBeenCalledTimes(3);

    visibilityState.mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(4));
  });

  it("mantiene el polling cada sesenta segundos", async () => {
    vi.useFakeTimers();
    const { unmount } = renderNotificaciones();

    await act(async () => {
      await Promise.resolve();
    });
    expect(apiMock.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(59_999);
      await Promise.resolve();
    });
    expect(apiMock.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(apiMock.get).toHaveBeenCalledTimes(2);

    unmount();
  });

  it("muestra el error inicial y permite reintentar", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiMock.get
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce({
        data: {
          total_no_leidas: 0,
          total_profesores: 0,
          items: [],
        },
      });

    renderNotificaciones();

    await user.click(screen.getByRole("button", {
      name: "Notificaciones de planeadores",
    }));
    expect(await screen.findByText(
      "No pudimos actualizar las notificaciones.",
    )).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Todo está al día")).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledTimes(2);
  });
});
