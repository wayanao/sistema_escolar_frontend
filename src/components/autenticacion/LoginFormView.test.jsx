import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LoginFormView from "./LoginFormView";

function crearProps(overrides = {}) {
  return {
    email: "persona@auligo.test",
    password: "Password123",
    codigoColegio: "colegio-norte",
    formError: "",
    isSubmitting: false,
    isTakingLong: false,
    loginSucceeded: false,
    actualizarEmail: vi.fn(),
    actualizarPassword: vi.fn(),
    actualizarCodigoColegio: vi.fn(),
    iniciarSesion: vi.fn(),
    ...overrides,
  };
}

describe("LoginFormView", () => {
  it("presenta los valores y entrega acciones con el valor crudo", () => {
    const props = crearProps();
    const { container } = render(<LoginFormView {...props} />);

    expect(screen.getByLabelText("Código del colegio")).toHaveValue("colegio-norte");
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("persona@auligo.test");
    expect(screen.getByLabelText("Contraseña")).toHaveValue("Password123");

    fireEvent.change(screen.getByLabelText("Código del colegio"), {
      target: { value: " Colegio-Nuevo " },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: " Correo@Auligo.test " },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: " Clave Sin Recortar " },
    });
    fireEvent.submit(container.querySelector("form"));

    expect(props.actualizarCodigoColegio).toHaveBeenCalledWith(" Colegio-Nuevo ");
    expect(props.actualizarEmail).toHaveBeenCalledWith("Correo@Auligo.test");
    expect(props.actualizarPassword).toHaveBeenCalledWith(" Clave Sin Recortar ");
    expect(props.iniciarSesion).toHaveBeenCalledWith();
  });

  it("conserva localmente el contrato accesible del toggle de password", async () => {
    const user = userEvent.setup();
    render(<LoginFormView {...crearProps()} />);
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

  it("representa error, espera, demora y exito sin decidir el estado", () => {
    const props = crearProps({
      formError: "Credenciales incompletas",
      isSubmitting: true,
      isTakingLong: true,
    });
    const { rerender } = render(<LoginFormView {...props} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Credenciales incompletas");
    expect(screen.getByRole("button", { name: "Verificando acceso..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Verificando acceso..." })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByText("Estamos conectando con el servidor. Puede tardar un momento.")).toBeInTheDocument();

    rerender(<LoginFormView {...props} loginSucceeded />);

    expect(screen.getByRole("button", { name: "Acceso correcto" })).toBeDisabled();
    expect(screen.queryByText("Estamos conectando con el servidor. Puede tardar un momento.")).not.toBeInTheDocument();
  });

  it("«¿La olvidaste?» dice a quién pedir la contraseña, sin salir del login", async () => {
    const user = userEvent.setup();
    render(<LoginFormView {...crearProps()} />);

    const olvido = screen.getByRole("button", { name: "¿La olvidaste?" });
    const ayuda = screen.getByText("Pídele al administrador de tu colegio que te asigne una nueva.");
    expect(olvido).toHaveAttribute("aria-expanded", "false");
    expect(olvido).toHaveAttribute("aria-controls", ayuda.id);
    expect(ayuda).not.toBeVisible();

    await user.click(olvido);
    expect(olvido).toHaveAttribute("aria-expanded", "true");
    expect(ayuda).toBeVisible();

    await user.click(olvido);
    expect(ayuda).not.toBeVisible();
  });

  it("no tiene la casilla «Recordarme»: la sesión dura siempre lo mismo", () => {
    render(<LoginFormView {...crearProps()} />);

    expect(screen.getByRole("heading", { level: 1, name: "¡Hola de nuevo!" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
