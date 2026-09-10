import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NavAdminView from "./NavAdminView";
import NavProfesorView from "./NavProfesorView";
import NavSuperAdminView from "./NavSuperAdminView";
import { PROFESOR_DESKTOP_ITEMS } from "../../utils/autenticacion/navegacion";

vi.mock("./DesktopAnimatedNav", () => ({
  default: ({ items, variant, ariaLabel }) => (
    <nav aria-label={ariaLabel} data-variant={variant}>
      {items.map((item) =>
        item.type === "group" ? (
          <div key={item.id}>
            <span>{item.label}</span>
            {item.children.map((child) => (
              <a key={child.id} href={child.to} translate={child.translate}>
                {child.label}
              </a>
            ))}
          </div>
        ) : (
          <a key={item.id} href={item.to} translate={item.translate}>
            {item.label}
          </a>
        ),
      )}
    </nav>
  ),
}));

function renderNotificaciones(onNavigate) {
  return (
    <button type="button" onClick={onNavigate}>
      Notificaciones
    </button>
  );
}

describe("vistas de navegacion", () => {
  it("conserva contratos y estado responsive de admin", async () => {
    const user = userEvent.setup();
    const onCerrarSesion = vi.fn();
    render(
      <MemoryRouter>
        <NavAdminView
          onCerrarSesion={onCerrarSesion}
          renderNotificaciones={renderNotificaciones}
        />
      </MemoryRouter>,
    );
    const desktop = screen.getByRole("navigation", {
      name: "Navegación principal de administrador",
    });

    expect(desktop).toHaveAttribute("data-variant", "admin");
    expect(desktop.parentElement).toHaveClass("hidden", "lg:flex");
    expect(within(desktop).getByRole("link", { name: "Gestión de Pagos" })).toHaveAttribute(
      "href",
      "/admin/pagos",
    );
    expect(within(desktop).getByRole("link", { name: "Nómina" })).toHaveAttribute(
      "translate",
      "no",
    );

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(onCerrarSesion).toHaveBeenCalledTimes(1);

    const menu = screen.getByRole("button", { name: "Abrir menu de administrador" });
    expect(menu).toHaveClass("lg:hidden");
    await user.click(menu);
    await user.click(screen.getByRole("button", { name: "Gestión Académica" }));
    expect(screen.getAllByRole("link", { name: "Horarios Asignados" })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Cartera" }));
    expect(screen.queryAllByRole("link", { name: "Horarios Asignados" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Pagos" })).toHaveAttribute("href", "/admin/pagos");

    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(screen.queryByRole("button", { name: "Cartera" })).not.toBeInTheDocument();
  });

  it("conserva contratos y callbacks de profesor", async () => {
    const user = userEvent.setup();
    const onCerrarSesion = vi.fn();
    render(
      <MemoryRouter>
        <NavProfesorView
          onCerrarSesion={onCerrarSesion}
          renderNotificaciones={renderNotificaciones}
        />
      </MemoryRouter>,
    );
    const desktop = screen.getByRole("navigation", {
      name: "Navegación principal de profesor",
    });

    expect(desktop).toHaveAttribute("data-variant", "profesor");
    expect(within(desktop).getByRole("link", { name: "Observaciones" })).toHaveAttribute(
      "href",
      "/Formulario",
    );
    expect(screen.getByRole("button", { name: "Cerrar sesion" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sesion" }));
    expect(onCerrarSesion).toHaveBeenCalledTimes(1);

    // El Observador es una pestana suelta, no un hijo de Control Academico.
    expect(within(desktop).getByRole("link", { name: "Observador" })).toHaveAttribute(
      "href",
      "/observador",
    );

    await user.click(screen.getByRole("button", { name: "Abrir menu de profesor" }));
    // En movil tambien va suelto: se ve sin desplegar ningun grupo. El menu
    // movil esta escrito a mano, aparte de PROFESOR_DESKTOP_ITEMS, asi que un
    // elemento nuevo puede quedarse solo en escritorio sin que nadie lo note.
    expect(screen.getAllByRole("link", { name: "Observador" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Control Académico" }));
    expect(screen.getAllByRole("link", { name: "Observaciones" })).toHaveLength(2);
  });

  it("el menu movil de profesor lleva el mismo orden que el de escritorio", async () => {
    // El menu movil esta escrito a mano en NavProfesorView.jsx y no sale de
    // PROFESOR_DESKTOP_ITEMS. Ya paso una vez -«Observador» se quedo solo en
    // escritorio-, asi que esta prueba ata los dos ordenes.
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NavProfesorView onCerrarSesion={vi.fn()} renderNotificaciones={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir menu de profesor" }));

    const movil = screen
      .getAllByRole("navigation")
      .find((nav) => !nav.getAttribute("aria-label"));
    const primerNivel = Array.from(movil.children)
      .map((hijo) => hijo.textContent.trim())
      .filter((texto) => texto && texto !== "Cerrar sesion");

    expect(primerNivel).toStrictEqual(
      PROFESOR_DESKTOP_ITEMS.map((item) => item.label),
    );
  });

  it("presenta identidad, ruta y callback de super admin", async () => {
    const user = userEvent.setup();
    const onCerrarSesion = vi.fn();
    render(
      <MemoryRouter initialEntries={["/super-admin"]}>
        <NavSuperAdminView
          nombre="Soporte Auligo"
          onCerrarSesion={onCerrarSesion}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Plataforma: Soporte Auligo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tenants" })).toHaveAttribute(
      "href",
      "/super-admin",
    );
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
