import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificacionesPlaneadores from "./NotificacionesPlaneadores";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("../../utils/api", () => ({
  default: apiMock,
}));

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

  it("ancla la ventana al encabezado en móvil y a la campana en escritorio", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <header className="relative">
          <NotificacionesPlaneadores rol="admin" />
        </header>
      </MemoryRouter>,
    );

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
});
