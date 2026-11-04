import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MenuLateralView from "./MenuLateralView";
import { ADMIN_DESKTOP_ITEMS } from "../../utils/autenticacion/navegacion";

// Las 19 pantallas del admin, sacadas de la misma lista que arma el menú.
const DESTINOS_ADMIN = ADMIN_DESKTOP_ITEMS.flatMap((item) =>
  item.type === "group" ? item.children : [item],
)
  .map((destino) => destino.to)
  .sort();
const GRUPOS_ADMIN = ADMIN_DESKTOP_ITEMS.filter((item) => item.type === "group").map(
  (grupo) => grupo.label,
);

function renderMenu({ modo = "abierto", ruta = "/admin/pagos", ...cambios } = {}) {
  const props = {
    items: ADMIN_DESKTOP_ITEMS,
    rutaInicio: "/dashboard-admin",
    etiqueta: "Navegación principal de administrador",
    nombre: "María Gómez",
    rol: "Administrador",
    modo,
    puedeAlternar: true,
    onAlternarMenu: vi.fn(),
    onCerrarSesion: vi.fn(),
    renderNotificaciones: vi.fn((onNavigate, opciones) => (
      <button type="button" onClick={onNavigate}>
        Campana {opciones?.tono}
      </button>
    )),
    renderSelectorAnio: vi.fn((opciones) => (
      <select aria-label="Año lectivo" data-tono={opciones?.tono} />
    )),
    ...cambios,
  };
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <MenuLateralView {...props}>
        <p>Contenido de la página</p>
      </MenuLateralView>
    </MemoryRouter>,
  );
  return props;
}

const menuPrincipal = (contenedor = screen) =>
  contenedor.getByRole("navigation", { name: "Navegación principal de administrador" });

const destinosVisibles = (menu) =>
  within(menu)
    .queryAllByRole("link")
    .map((enlace) => enlace.getAttribute("href"));

// Recorre los grupos uno por uno (en el riel solo hay un panel abierto a la
// vez) y anota todos los destinos que llegan a verse.
async function recorrerDestinos(user, menu) {
  const vistos = new Set(destinosVisibles(menu));
  for (const grupo of GRUPOS_ADMIN) {
    const boton = within(menu).getByRole("button", { name: grupo });
    if (boton.getAttribute("aria-expanded") !== "true") await user.click(boton);
    destinosVisibles(menu).forEach((destino) => vistos.add(destino));
  }
  return [...vistos].sort();
}

describe("MenuLateralView", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  describe("abierto", () => {
    it("llega a las 19 pantallas, con el grupo de la página actual ya abierto", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "abierto", ruta: "/admin/pagos" });
      const menu = menuPrincipal();

      expect(within(menu).getByRole("button", { name: "Cartera" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(within(menu).getByRole("button", { name: "Gestión Académica" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(within(menu).getByRole("link", { name: "Gestión de Pagos" })).toHaveAttribute(
        "aria-current",
        "page",
      );

      expect(await recorrerDestinos(user, menu)).toStrictEqual(DESTINOS_ADMIN);
      expect(within(menu).getByRole("link", { name: "Nómina" })).toHaveAttribute("translate", "no");
      expect(within(menu).getByRole("link", { name: "Estructura académica" })).toHaveAttribute(
        "href",
        "/admin",
      );
    });

    it("cierra el grupo de la página actual si se le pide", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "abierto", ruta: "/admin/pagos" });
      const menu = menuPrincipal();

      await user.click(within(menu).getByRole("button", { name: "Cartera" }));

      expect(within(menu).getByRole("button", { name: "Cartera" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(within(menu).queryByRole("link", { name: "Gestión de Pagos" })).not.toBeInTheDocument();
    });

    it("pone arriba la ubicación, el año, la campana y el botón para encoger", async () => {
      const user = userEvent.setup();
      const props = renderMenu({ modo: "abierto", ruta: "/admin/pagos" });

      const ubicacion = screen.getByRole("navigation", { name: "Ubicación" });
      expect(within(ubicacion).getByText("Cartera")).toBeInTheDocument();
      expect(within(ubicacion).getByText("Gestión de Pagos")).toHaveAttribute("aria-current", "page");
      expect(props.renderSelectorAnio).toHaveBeenCalledWith({ tono: "claro" });
      expect(props.renderNotificaciones).toHaveBeenCalledWith(expect.any(Function), { tono: "claro" });
      expect(screen.getByText("Contenido de la página")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Encoger menú" }));
      expect(props.onAlternarMenu).toHaveBeenCalledTimes(1);
    });

    it("no muestra ubicación en una ruta que no está en el menú", () => {
      renderMenu({ modo: "abierto", ruta: "/admin/desconocida" });

      expect(screen.queryByRole("navigation", { name: "Ubicación" })).not.toBeInTheDocument();
    });

    it("cierra sesión desde el menú de la tarjeta del usuario", async () => {
      const user = userEvent.setup();
      const props = renderMenu({ modo: "abierto" });
      const tarjeta = screen.getByRole("button", {
        name: "María Gómez, Administrador. Opciones de la cuenta",
      });

      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
      await user.click(tarjeta);
      expect(tarjeta).toHaveAttribute("aria-expanded", "true");
      await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

      expect(props.onCerrarSesion).toHaveBeenCalledTimes(1);
    });

    it("sin nombre en la sesión, la tarjeta muestra el rol", () => {
      renderMenu({ modo: "abierto", nombre: undefined });

      expect(
        screen.getByRole("button", { name: "Administrador. Opciones de la cuenta" }),
      ).toBeInTheDocument();
    });

    it("no sale en el papel al imprimir", () => {
      renderMenu({ modo: "abierto" });

      expect(menuPrincipal().closest("aside")).toHaveClass("print:hidden");
      expect(screen.getByRole("banner")).toHaveClass("print:hidden");
    });
  });

  describe("riel", () => {
    it("muestra cada ícono con su nombre, y abre las páginas de un grupo en un panel al lado", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "riel", ruta: "/admin/pagos" });
      const menu = menuPrincipal();

      // Las páginas de un grupo no se ven hasta tocarlo, ni siquiera la actual.
      expect(within(menu).queryByRole("link", { name: "Gestión de Pagos" })).not.toBeInTheDocument();
      expect(within(menu).getByRole("link", { name: "Estudiantes" })).toHaveAttribute(
        "href",
        "/admin/estudiantes",
      );

      expect(await recorrerDestinos(user, menu)).toStrictEqual(DESTINOS_ADMIN);
    });

    it("cierra el panel al elegir una página, con Escape o al tocar fuera", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "riel", ruta: "/admin/pagos" });
      const menu = menuPrincipal();
      const cartera = within(menu).getByRole("button", { name: "Cartera" });

      await user.click(cartera);
      await user.click(within(menu).getByRole("link", { name: "Tipos de Pago" }));
      expect(cartera).toHaveAttribute("aria-expanded", "false");

      await user.click(cartera);
      await user.keyboard("{Escape}");
      expect(cartera).toHaveAttribute("aria-expanded", "false");

      await user.click(cartera);
      await user.click(screen.getByText("Contenido de la página"));
      expect(cartera).toHaveAttribute("aria-expanded", "false");
    });

    it("en tablet vertical no ofrece abrir el menú completo", () => {
      renderMenu({ modo: "riel", puedeAlternar: false });

      expect(screen.queryByRole("button", { name: "Abrir menú" })).not.toBeInTheDocument();
    });

    it("desde portátil ofrece abrir el menú completo", async () => {
      const user = userEvent.setup();
      const props = renderMenu({ modo: "riel", puedeAlternar: true });

      await user.click(screen.getByRole("button", { name: "Abrir menú" }));

      expect(props.onAlternarMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe("celular", () => {
    it("usa una barra oscura y un menú que se desliza con las 19 pantallas", async () => {
      const user = userEvent.setup();
      const props = renderMenu({ modo: "celular", ruta: "/admin/pagos" });

      expect(
        screen.queryByRole("navigation", { name: "Navegación principal de administrador" }),
      ).not.toBeInTheDocument();
      expect(props.renderSelectorAnio).toHaveBeenCalledWith({ tono: "oscuro" });
      expect(props.renderNotificaciones).toHaveBeenCalledWith(expect.any(Function), { tono: "oscuro" });

      await user.click(screen.getByRole("button", { name: "Abrir menú" }));
      const dialogo = screen.getByRole("dialog", { name: "Menú" });

      expect(within(dialogo).getByRole("button", { name: "Cerrar menú" })).toHaveFocus();
      expect(document.body.style.overflow).toBe("hidden");
      expect(await recorrerDestinos(user, menuPrincipal(within(dialogo)))).toStrictEqual(
        DESTINOS_ADMIN,
      );
    });

    it("se cierra al elegir una página y devuelve el foco al botón del menú", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "celular", ruta: "/admin/pagos" });
      const abrir = screen.getByRole("button", { name: "Abrir menú" });

      await user.click(abrir);
      await user.click(
        within(screen.getByRole("dialog", { name: "Menú" })).getByRole("link", { name: "Estudiantes" }),
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(abrir).toHaveFocus();
      expect(document.body.style.overflow).toBe("");
    });

    it("se cierra con Escape, con la X y al abrir una notificación", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "celular" });
      const abrir = screen.getByRole("button", { name: "Abrir menú" });

      await user.click(abrir);
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(abrir);
      await user.click(screen.getByRole("button", { name: "Cerrar menú" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(abrir);
      await user.click(screen.getByRole("button", { name: "Campana oscuro" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("cierra sesión desde el menú, a la vista sin pasos extra", async () => {
      const user = userEvent.setup();
      const props = renderMenu({ modo: "celular" });

      await user.click(screen.getByRole("button", { name: "Abrir menú" }));
      const dialogo = screen.getByRole("dialog", { name: "Menú" });
      expect(within(dialogo).getByText("María Gómez")).toBeInTheDocument();
      await user.click(within(dialogo).getByRole("button", { name: "Cerrar sesión" }));

      expect(props.onCerrarSesion).toHaveBeenCalledTimes(1);
    });

    it("no sale en el papel al imprimir", async () => {
      const user = userEvent.setup();
      renderMenu({ modo: "celular" });

      expect(screen.getByRole("banner")).toHaveClass("print:hidden");
      await user.click(screen.getByRole("button", { name: "Abrir menú" }));
      expect(screen.getByRole("dialog", { name: "Menú" }).parentElement).toHaveClass("print:hidden");
    });
  });
});
