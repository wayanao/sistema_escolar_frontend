import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

// El login tiene un enlace de vuelta a la landing: necesita el enrutador.
const renderLogin = () => render(<Login />, { wrapper: MemoryRouter });

const mocks = vi.hoisted(() => ({
  iniciarSesion: vi.fn(),
  fire: vi.fn(),
}));

vi.mock("../services/autenticacionApi", () => ({
  iniciarSesion: mocks.iniciarSesion,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: mocks.fire },
}));

async function completarFormulario(user, {
  codigo = "  Colegio-Norte  ",
  email = "persona@auligo.test",
  password = "Password123",
} = {}) {
  await user.type(screen.getByLabelText("Código del colegio"), codigo);
  await user.type(screen.getByLabelText("Correo electrónico"), email);
  await user.type(screen.getByLabelText("Contraseña"), password);
}

describe("Login", () => {
  let consoleError;
  let timeoutSpy;

  beforeEach(() => {
    localStorage.clear();
    mocks.iniciarSesion.mockReset();
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: true });
    const originalConsoleError = console.error;
    const originalSetTimeout = window.setTimeout.bind(window);
    consoleError = vi.spyOn(console, "error").mockImplementation((...args) => {
      if (String(args[0]).includes("Not implemented: navigation")) return;
      originalConsoleError(...args);
    });
    timeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((callback, delay, ...args) => {
      if (delay === 3000) return 0;
      return originalSetTimeout(callback, delay, ...args);
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
    timeoutSpy.mockRestore();
  });

  it("conserva el shell visual de la pagina de acceso", () => {
    const { container } = renderLogin();

    const pagina = container.firstElementChild;
    expect(pagina).toHaveClass("notranslate", "min-h-[100svh]");
    expect(pagina).toHaveAttribute("translate", "no");
    // Diseño del usuario (2026-11-05): panel de bienvenida con el dibujo del
    // aula, que bajo 1024 px se oculta para que el formulario quede arriba.
    const bienvenida = screen.getByRole("region", { name: "Bienvenida" });
    expect(bienvenida).toHaveTextContent(/tu aula, tu camino,/i);
    expect(
      screen.getByRole("img", { name: /Ilustración de un aula con tres niños/ }).closest("div.hidden"),
    ).toHaveClass("lg:flex");
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { level: 1, name: "¡Hola de nuevo!" }),
    );
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  it("pide las fuentes del diseño una sola vez", () => {
    document.getElementById("fuentes-login")?.remove();
    const { unmount } = renderLogin();
    unmount();
    renderLogin();

    const enlaces = document.head.querySelectorAll("#fuentes-login");
    expect(enlaces).toHaveLength(1);
    expect(enlaces[0]).toHaveAttribute("rel", "stylesheet");
    expect(enlaces[0].getAttribute("href")).toContain("family=Baloo+2");
  });

  it.each([
    ["  Colegio-Uno  ", "colegio-uno"],
    ["demo", ""],
  ])("precarga el ultimo codigo normalizado y descarta demo: %s", (guardado, esperado) => {
    localStorage.setItem("ultimo_codigo_colegio", guardado);

    renderLogin();

    expect(screen.getByLabelText("Código del colegio")).toHaveValue(esperado);
  });

  it("valida campos obligatorios sin hacer una peticion", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Entrar a Auligo" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Completa el código del colegio, el correo y la contraseña.",
    );
    expect(mocks.iniciarSesion).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Correo electrónico"), "a@b.co");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("alterna la visibilidad de la password con su contrato accesible", async () => {
    const user = userEvent.setup();
    renderLogin();
    const password = screen.getByLabelText("Contraseña");

    expect(password).toHaveAttribute("type", "password");
    const mostrar = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(mostrar).toHaveAttribute("aria-pressed", "false");

    await user.click(mostrar);

    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it.each([
    {
      nombreCaso: "super admin",
      respuesta: { id: 1, nombre: "soporte auligo", rol: "super_admin", tenant: null },
      bienvenida: "Soporte Auligo",
      clave: "super_admin",
      eliminadas: ["usuario", "profesor"],
    },
    {
      nombreCaso: "admin con password temporal",
      respuesta: {
        id: 2,
        nombre: "ana admin",
        rol: "admin",
        tenant: { id: 10 },
        debe_cambiar_password: true,
      },
      bienvenida: "Ana Admin",
      clave: "usuario",
      eliminadas: ["super_admin", "profesor"],
    },
    {
      nombreCaso: "profesor",
      respuesta: { id: 3, nombre: "pedro profesor", rol: "profesor", tenant: { id: 10 } },
      bienvenida: "Pedro Profesor",
      clave: "profesor",
      eliminadas: ["super_admin", "usuario"],
    },
  ])("envia el contrato y conserva una sola sesion para $nombreCaso", async ({
    respuesta,
    bienvenida,
    clave,
    eliminadas,
  }) => {
    const user = userEvent.setup();
    mocks.fire.mockReturnValue(new Promise(() => {}));
    ["super_admin", "usuario", "profesor"].forEach((item) => {
      localStorage.setItem(item, JSON.stringify({ id: "anterior" }));
    });
    mocks.iniciarSesion.mockResolvedValue(respuesta);
    renderLogin();

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Entrar a Auligo" }));

    await waitFor(() => {
      expect(mocks.iniciarSesion).toHaveBeenCalledWith({
        email: "persona@auligo.test",
        password: "Password123",
        codigo_colegio: "colegio-norte",
      });
    });
    expect(JSON.parse(localStorage.getItem(clave))).toEqual({
      id: respuesta.id,
      nombre: respuesta.nombre,
      rol: respuesta.rol,
      tenant: respuesta.tenant,
      debe_cambiar_password: Boolean(respuesta.debe_cambiar_password),
    });
    eliminadas.forEach((item) => expect(localStorage.getItem(item)).toBeNull());
    expect(localStorage.getItem("ultimo_codigo_colegio")).toBe("colegio-norte");
    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "success",
      title: "¡Éxito!",
      text: `Bienvenido ${bienvenida}`,
      timer: 1000,
      showConfirmButton: false,
    });
  });

  it.each([
    [
      "401",
      { response: { status: 401 } },
      { icon: "error", title: "Acceso no válido", text: "Revisa tus credenciales e intenta nuevamente." },
    ],
    [
      "403 con detalle objeto",
      { response: { status: 403, data: { detail: { message: "Colegio suspendido" } } } },
      { icon: "warning", title: "Servicio no disponible", text: "Colegio suspendido" },
    ],
    [
      "403 sin detalle",
      { response: { status: 403, data: {} } },
      {
        icon: "warning",
        title: "Servicio no disponible",
        text: "El servicio del colegio no se encuentra habilitado.",
      },
    ],
    [
      "error de red",
      new Error("sin red"),
      { icon: "error", title: "No pudimos conectar", text: "Comprueba tu conexión e intenta nuevamente." },
    ],
  ])("muestra el mensaje actual para %s", async (_nombre, error, alerta) => {
    const user = userEvent.setup();
    mocks.iniciarSesion.mockRejectedValue(error);
    renderLogin();

    await completarFormulario(user, { codigo: "colegio-sur" });
    await user.click(screen.getByRole("button", { name: "Entrar a Auligo" }));

    await waitFor(() => expect(mocks.fire).toHaveBeenCalledWith(alerta));
    expect(localStorage.getItem("ultimo_codigo_colegio")).toBeNull();
    expect(screen.getByRole("button", { name: "Entrar a Auligo" })).toBeEnabled();
  });
});
