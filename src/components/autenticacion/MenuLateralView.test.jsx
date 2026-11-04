import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MenuLateralView from "./MenuLateralView";
import {
  ADMIN_DESKTOP_ITEMS,
  PROFESOR_BARRA_INFERIOR,
  PROFESOR_DESKTOP_ITEMS,
  listarDestinosNavegacion,
} from "../../utils/autenticacion/navegacion";

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

// Las 7 pantallas del profesor, sacadas de la misma lista que arma el menú.
const DESTINOS_PROFESOR = listarDestinosNavegacion(PROFESOR_DESKTOP_ITEMS)
  .map((destino) => destino.to)
  .sort();

function renderMenuProfesor({ modo = "abierto", ruta = "/planilla", ...cambios } = {}) {
  const props = {
    items: PROFESOR_DESKTOP_ITEMS,
    rutaInicio: "/",
    etiqueta: "Navegación principal de profesor",
    nombre: "Ana Ruiz",
    rol: "Profesor",
    modo,
    puedeAlternar: true,
    onAlternarMenu: vi.fn(),
    onCerrarSesion: vi.fn(),
    renderNotificaciones: vi.fn((onNavigate, opciones) => (
      <button type="button" onClick={onNavigate}>
        Campana {opciones?.tono}
      </button>
    )),
    barraInferior: PROFESOR_BARRA_INFERIOR,
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

const menuProfesor = (contenedor = screen) =>
  contenedor.getByRole("navigation", { name: "Navegación principal de profesor" });

describe("MenuLateralView del profesor", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("abierto: sus dos grupos son títulos y las 7 pantallas quedan a un clic", () => {
    renderMenuProfesor({ modo: "abierto", ruta: "/planilla" });
    const menu = menuProfesor();

    expect(destinosVisibles(menu).sort()).toStrictEqual(DESTINOS_PROFESOR);
    // Nada que abrir ni cerrar: los grupos son títulos.
    expect(within(menu).queryAllByRole("button")).toHaveLength(0);
    const control = within(menu).getByRole("list", { name: "Control Académico" });
    expect(within(control).getAllByRole("link").map((enlace) => enlace.textContent)).toStrictEqual([
      "Planilla",
      "Asistencia",
    ]);
    expect(within(menu).getByRole("link", { name: "Planilla" })).toHaveAttribute("aria-current", "page");
    // El Dashboard es «/»: no queda marcado en las demás páginas.
    expect(within(menu).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");

    const ubicacion = screen.getByRole("navigation", { name: "Ubicación" });
    expect(within(ubicacion).getByText("Control Académico")).toBeInTheDocument();
    expect(within(ubicacion).getByText("Planilla")).toHaveAttribute("aria-current", "page");
    // El profesor no tiene selector de año.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("riel: las 7 pantallas a la vista, con líneas en lugar de títulos", () => {
    renderMenuProfesor({ modo: "riel" });
    const menu = menuProfesor();

    expect(destinosVisibles(menu).sort()).toStrictEqual(DESTINOS_PROFESOR);
    expect(within(menu).queryByText("Control Académico")).not.toBeInTheDocument();
    expect(within(menu).getByRole("list", { name: "Planeación Académica" })).toBeInTheDocument();
    // Más largo que el del admin y sin paneles al lado: en una pantalla baja se desplaza.
    expect(menu).toHaveClass("overflow-y-auto");
  });

  it("celular: abajo las cuatro pantallas de todos los días y «Más», sin botón de menú arriba", () => {
    const props = renderMenuProfesor({ modo: "celular", ruta: "/planilla" });
    const barra = menuProfesor();

    expect(screen.queryByRole("button", { name: "Abrir menú" })).not.toBeInTheDocument();
    expect(destinosVisibles(barra)).toStrictEqual(["/", "/planilla", "/asistencia", "/observador"]);
    expect(within(barra).getByRole("link", { name: "Planilla" })).toHaveAttribute("aria-current", "page");
    expect(within(barra).getByRole("button", { name: "Más" })).toHaveAttribute("aria-expanded", "false");
    expect(barra).toHaveClass("fixed", "bottom-0", "print:hidden");
    expect(props.renderNotificaciones).toHaveBeenCalledWith(expect.any(Function), { tono: "oscuro" });

    // La página deja libre el alto de la barra, y avisa ese alto a lo que se
    // queda pegado abajo, como «Guardar asistencia».
    const columna = screen.getByText("Contenido de la página").parentElement;
    expect(columna).toHaveClass("pb-[4.5rem]");
    expect(columna.style.getPropertyValue("--alto-barra-inferior")).toBe("4.5rem");
  });

  it("«Más» abre una hoja con las demás pantallas, el usuario y cerrar sesión", async () => {
    const user = userEvent.setup();
    const props = renderMenuProfesor({ modo: "celular" });

    await user.click(screen.getByRole("button", { name: "Más" }));
    const hoja = screen.getByRole("dialog", { name: "Más opciones" });

    expect(within(hoja).getByRole("button", { name: "Cerrar más opciones" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
    expect(destinosVisibles(hoja)).toStrictEqual(["/plan-de-clases", "/planeador-anual", "/ingreso-boletin"]);
    expect(within(hoja).getByText("Ana Ruiz")).toBeInTheDocument();

    await user.click(within(hoja).getByRole("button", { name: "Cerrar sesión" }));
    expect(props.onCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("entre la barra y «Más» llega a las 7 pantallas", async () => {
    const user = userEvent.setup();
    renderMenuProfesor({ modo: "celular" });

    const enLaBarra = destinosVisibles(menuProfesor());
    await user.click(screen.getByRole("button", { name: "Más" }));
    const enMas = destinosVisibles(screen.getByRole("dialog", { name: "Más opciones" }));

    expect([...enLaBarra, ...enMas].sort()).toStrictEqual(DESTINOS_PROFESOR);
  });

  it("la hoja se cierra al elegir, con Escape, con la X y tocando fuera, y el foco vuelve a «Más»", async () => {
    const user = userEvent.setup();
    renderMenuProfesor({ modo: "celular" });
    const mas = screen.getByRole("button", { name: "Más" });

    await user.click(mas);
    await user.click(
      within(screen.getByRole("dialog", { name: "Más opciones" })).getByRole("link", {
        name: "Plan de Clases",
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mas).toHaveFocus();
    expect(document.body.style.overflow).toBe("");

    await user.click(mas);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(mas);
    await user.click(screen.getByRole("button", { name: "Cerrar más opciones" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(mas);
    await user.click(screen.getByRole("dialog", { name: "Más opciones" }).previousElementSibling);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("«Más» se marca cuando la página actual vive ahí", () => {
    renderMenuProfesor({ modo: "celular", ruta: "/plan-de-clases" });
    const barra = menuProfesor();

    expect(within(barra).getByRole("button", { name: "Más" })).toHaveClass("text-purple-700");
    expect(within(barra).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("sin barra de abajo, el celular usa el menú que se desliza, como el admin", async () => {
    const user = userEvent.setup();
    renderMenuProfesor({ modo: "celular", barraInferior: undefined });

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));

    expect(
      destinosVisibles(menuProfesor(within(screen.getByRole("dialog", { name: "Menú" })))).sort(),
    ).toStrictEqual(DESTINOS_PROFESOR);
  });
});
