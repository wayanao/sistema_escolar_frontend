import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CambiarPassword from "./CambiarPassword";
import { opcionesVentanaExito } from "../hooks/ventanaExito";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  cambiarPassword: vi.fn(),
  fire: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock("../services/autenticacionApi", () => ({
  cambiarPassword: mocks.cambiarPassword,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: mocks.fire },
}));

async function completarPasswords(user, {
  actual = "Temporal123",
  nueva = "NuevaClave123",
  confirmacion = nueva,
} = {}) {
  await user.type(screen.getByLabelText("Password temporal"), actual);
  await user.type(screen.getByLabelText("Nueva password"), nueva);
  await user.type(screen.getByLabelText("Confirmar nueva password"), confirmacion);
}

describe("CambiarPassword", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.navigate.mockReset();
    mocks.cambiarPassword.mockReset();
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: true });
  });

  it("aplica las reglas actuales de fortaleza antes de llamar al backend", async () => {
    const user = userEvent.setup();
    render(<CambiarPassword />);

    await completarPasswords(user, { nueva: "abc", confirmacion: "abc" });
    await user.click(screen.getByRole("button", { name: "Guardar password" }));

    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "warning",
      title: "Password debil",
      text: "La nueva password debe incluir minimo 10 caracteres, una mayuscula, un numero.",
    });
    expect(mocks.cambiarPassword).not.toHaveBeenCalled();
  });

  it("valida la confirmacion despues de validar la fortaleza", async () => {
    const user = userEvent.setup();
    render(<CambiarPassword />);

    await completarPasswords(user, { confirmacion: "OtraClave123" });
    await user.click(screen.getByRole("button", { name: "Guardar password" }));

    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "warning",
      title: "Revisa la confirmacion",
      text: "Las passwords no coinciden.",
    });
    expect(mocks.cambiarPassword).not.toHaveBeenCalled();
  });

  it("impide reutilizar la password temporal", async () => {
    const user = userEvent.setup();
    render(<CambiarPassword />);

    await completarPasswords(user, {
      actual: "MismaClave123",
      nueva: "MismaClave123",
      confirmacion: "MismaClave123",
    });
    await user.click(screen.getByRole("button", { name: "Guardar password" }));

    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "warning",
      title: "Usa una password nueva",
      text: "No puede ser igual a la temporal.",
    });
    expect(mocks.cambiarPassword).not.toHaveBeenCalled();
  });

  it("envia el payload exacto, actualiza la sesion visual y navega al dashboard", async () => {
    const user = userEvent.setup();
    localStorage.setItem("usuario", JSON.stringify({
      id: 8,
      nombre: "Admin Uno",
      rol: "admin",
      tenant: { id: 5 },
      debe_cambiar_password: true,
    }));
    mocks.cambiarPassword.mockResolvedValue({ ok: true });
    render(<CambiarPassword />);

    await completarPasswords(user);
    await user.click(screen.getByRole("button", { name: "Guardar password" }));

    await waitFor(() => {
      expect(mocks.cambiarPassword).toHaveBeenCalledWith({
        password_actual: "Temporal123",
        password_nueva: "NuevaClave123",
      });
    });
    expect(JSON.parse(localStorage.getItem("usuario"))).toEqual({
      id: 8,
      nombre: "Admin Uno",
      rol: "admin",
      tenant: { id: 5 },
      debe_cambiar_password: false,
    });
    expect(mocks.fire).toHaveBeenCalledWith(
      opcionesVentanaExito({ title: "Password actualizada" }),
    );
    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/dashboard-admin", { replace: true });
    });
  });

  it("mantiene el contrato de error del backend y vuelve a habilitar el envio", async () => {
    const user = userEvent.setup();
    mocks.cambiarPassword.mockRejectedValue({
      response: { data: { detail: "Password temporal incorrecta" } },
    });
    render(<CambiarPassword />);

    await completarPasswords(user);
    await user.click(screen.getByRole("button", { name: "Guardar password" }));

    await waitFor(() => {
      expect(mocks.fire).toHaveBeenCalledWith({
        icon: "error",
        title: "No se pudo cambiar",
        text: "Password temporal incorrecta",
      });
    });
    expect(screen.getByRole("button", { name: "Guardar password" })).toBeEnabled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
