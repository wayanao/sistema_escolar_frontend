import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NavAdminView from "./NavAdminView";
import NavProfesorView from "./NavProfesorView";
import NavSuperAdminView from "./NavSuperAdminView";
import {
  ADMIN_DESKTOP_ITEMS,
  PROFESOR_DESKTOP_ITEMS,
} from "../../utils/autenticacion/navegacion";

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
    expect(within(desktop).getByRole("link", { name: "Estructura académica" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(within(desktop).getByRole("link", { name: "Años lectivos" })).toHaveAttribute(
      "href",
      "/admin/anios-lectivos",
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
    await user.click(screen.getByRole("button", { name: "Administración" }));
    expect(screen.getAllByRole("link", { name: "Estructura académica" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Años lectivos" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(screen.queryByRole("button", { name: "Cartera" })).not.toBeInTheDocument();
  });

  it("dibuja en la barra del admin el selector de año que recibe, y nada sin él", () => {
    const { unmount } = render(
      <MemoryRouter>
        <NavAdminView
          onCerrarSesion={vi.fn()}
          renderNotificaciones={renderNotificaciones}
          renderSelectorAnio={() => <select aria-label="Año lectivo" />}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("combobox", { name: "Año lectivo" })).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <NavAdminView onCerrarSesion={vi.fn()} renderNotificaciones={renderNotificaciones} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
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
    expect(screen.getAllByRole("link", { name: "Planilla" })).toHaveLength(2);

    // El observador viejo se oculto el 2026-09-10: no aparece en ninguno de los
    // dos menus. Su codigo sigue entero; retirarlo es la fase 4.
    expect(screen.queryAllByRole("link", { name: "Observaciones" })).toHaveLength(0);
    expect(document.querySelector('[href="/Formulario"]')).toBeNull();
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

  it("el menu movil de admin lleva las mismas entradas que el de escritorio", async () => {
    // Gemela de la de profesor, que se escribio despues de que «Observador» se
    // quedara solo en escritorio sin que nadie lo notara. Para admin no
    // existia, y el riesgo es el mismo: el menu movil de NavAdminView esta
    // escrito a mano y NO sale de ADMIN_DESKTOP_ITEMS.
    //
    // Se comparan todas las entradas, tambien las de dentro de los grupos, que
    // es donde es mas facil que se pierda una. En movil solo hay un grupo
    // abierto a la vez, asi que hay que desplegarlos uno por uno.
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NavAdminView onCerrarSesion={vi.fn()} renderNotificaciones={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir menu de administrador" }));
    const movil = screen
      .getAllByRole("navigation")
      .find((nav) => !nav.getAttribute("aria-label"));

    const enMovil = new Set();
    const anotarVisibles = () => {
      within(movil)
        .getAllByRole("link")
        .forEach((enlace) => enMovil.add(enlace.getAttribute("href")));
    };

    anotarVisibles();
    for (const grupo of ADMIN_DESKTOP_ITEMS.filter((item) => item.type === "group")) {
      await user.click(within(movil).getByRole("button", { name: grupo.label }));
      anotarVisibles();
    }

    const enEscritorio = new Set();
    ADMIN_DESKTOP_ITEMS.forEach((item) => {
      if (item.type === "group") {
        item.children.forEach((hijo) => enEscritorio.add(hijo.to));
      } else {
        enEscritorio.add(item.to);
      }
    });

    // Se comparan los **destinos**, no los textos. Hoy no coinciden en una
    // entrada: escritorio dice «Gestión de Pagos» y movil «Pagos», los dos a
    // /admin/pagos. Es anterior a esta prueba y la de arriba ya lo fija, asi
    // que igualar los textos no es cosa de esta guarda. Lo que no puede pasar
    // es que un destino exista en un menu y falte en el otro.
    expect([...enMovil].sort()).toStrictEqual([...enEscritorio].sort());
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
