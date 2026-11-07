import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCambiarPassword } from "./useCambiarPassword";
import { opcionesVentanaExito } from "../ventanaExito";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  cambiarPassword: vi.fn(),
  fire: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../../services/autenticacionApi", () => ({
  cambiarPassword: mocks.cambiarPassword,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: mocks.fire },
}));

function completarPasswords(result, {
  actual = "Temporal123",
  nueva = "NuevaClave123",
  confirmacion = nueva,
} = {}) {
  act(() => {
    result.current.setPasswordActual(actual);
    result.current.setPasswordNueva(nueva);
    result.current.setConfirmacion(confirmacion);
  });
}

function crearEvento() {
  return { preventDefault: vi.fn() };
}

describe("useCambiarPassword", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.navigate.mockReset();
    mocks.cambiarPassword.mockReset();
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: true });
  });

  it("expone el estado editable inicial sin transformaciones", () => {
    const { result } = renderHook(() => useCambiarPassword());

    expect(result.current).toMatchObject({
      passwordActual: "",
      passwordNueva: "",
      confirmacion: "",
      saving: false,
    });

    completarPasswords(result, {
      actual: "  Temporal  ",
      nueva: "  Nueva Clave  ",
      confirmacion: "  Confirmacion  ",
    });

    expect(result.current.passwordActual).toBe("  Temporal  ");
    expect(result.current.passwordNueva).toBe("  Nueva Clave  ");
    expect(result.current.confirmacion).toBe("  Confirmacion  ");
  });

  it.each([
    [
      "fortaleza",
      { nueva: "abc", confirmacion: "distinta" },
      {
        icon: "warning",
        title: "Password debil",
        text: "La nueva password debe incluir minimo 10 caracteres, una mayuscula, un numero.",
      },
    ],
    [
      "confirmacion",
      { confirmacion: "OtraClave123" },
      { icon: "warning", title: "Revisa la confirmacion", text: "Las passwords no coinciden." },
    ],
    [
      "reutilizacion",
      { actual: "MismaClave123", nueva: "MismaClave123", confirmacion: "MismaClave123" },
      { icon: "warning", title: "Usa una password nueva", text: "No puede ser igual a la temporal." },
    ],
  ])("conserva la precedencia de validacion para %s", async (_caso, valores, alerta) => {
    const { result } = renderHook(() => useCambiarPassword());
    completarPasswords(result, valores);
    const evento = crearEvento();

    await act(async () => {
      await result.current.guardar(evento);
    });

    expect(evento.preventDefault).toHaveBeenCalledWith();
    expect(mocks.fire).toHaveBeenCalledWith(alerta);
    expect(mocks.cambiarPassword).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it("mantiene saving mientras el request esta pendiente y envia el payload exacto", async () => {
    let resolver;
    const consulta = new Promise((resolve) => {
      resolver = resolve;
    });
    mocks.cambiarPassword.mockReturnValue(consulta);
    mocks.fire.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCambiarPassword());
    completarPasswords(result);

    let comando;
    act(() => {
      comando = result.current.guardar(crearEvento());
    });

    expect(result.current.saving).toBe(true);
    expect(mocks.cambiarPassword).toHaveBeenCalledWith({
      password_actual: "Temporal123",
      password_nueva: "NuevaClave123",
    });

    await act(async () => {
      resolver({ ok: true });
      await comando;
    });

    expect(result.current.saving).toBe(false);
  });

  it("actualiza la sesion y navega solo cuando resuelve el aviso exitoso", async () => {
    let resolverAviso;
    const aviso = new Promise((resolve) => {
      resolverAviso = resolve;
    });
    mocks.fire.mockReturnValue(aviso);
    mocks.cambiarPassword.mockResolvedValue({ ok: true });
    localStorage.setItem("usuario", JSON.stringify({
      id: 8,
      nombre: "Admin Uno",
      rol: "admin",
      tenant: { id: 5 },
      debe_cambiar_password: true,
    }));
    const { result } = renderHook(() => useCambiarPassword());
    completarPasswords(result);

    await act(async () => {
      await result.current.guardar(crearEvento());
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
    expect(result.current.saving).toBe(false);
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => {
      resolverAviso({ isConfirmed: true });
      await aviso;
    });

    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard-admin", { replace: true });
  });

  it.each([
    ["detalle string", { response: { data: { detail: "Password temporal incorrecta" } } }, "Password temporal incorrecta"],
    ["detalle no string", { response: { data: { detail: { message: "No valida" } } } }, "Revisa la password temporal e intenta nuevamente."],
  ])("conserva el mensaje de error para %s", async (_caso, error, texto) => {
    mocks.cambiarPassword.mockRejectedValue(error);
    const { result } = renderHook(() => useCambiarPassword());
    completarPasswords(result);

    await act(async () => {
      await result.current.guardar(crearEvento());
    });

    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "No se pudo cambiar",
      text: texto,
    });
    expect(result.current.saving).toBe(false);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("mantiene el parseo estricto de usuario dentro del comando", async () => {
    localStorage.setItem("usuario", "no-es-json");
    mocks.cambiarPassword.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useCambiarPassword());
    completarPasswords(result);

    await act(async () => {
      await result.current.guardar(crearEvento());
    });

    expect(localStorage.getItem("usuario")).toBe("no-es-json");
    expect(mocks.fire).toHaveBeenCalledTimes(1);
    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "No se pudo cambiar",
      text: "Revisa la password temporal e intenta nuevamente.",
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
