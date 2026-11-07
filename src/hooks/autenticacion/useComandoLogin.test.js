import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useComandoLogin } from "./useComandoLogin";
import { opcionesVentanaExito } from "../ventanaExito";

const mocks = vi.hoisted(() => ({
  iniciarSesion: vi.fn(),
  fire: vi.fn(),
}));

vi.mock("../../services/autenticacionApi", () => ({
  iniciarSesion: mocks.iniciarSesion,
}));

vi.mock("sweetalert2", () => ({
  default: { fire: mocks.fire },
}));

function completarFormulario(result, {
  codigo = "  Colegio-Norte  ",
  email = "persona@auligo.test",
  password = "Password123",
} = {}) {
  act(() => {
    result.current.actualizarCodigoColegio(codigo);
    result.current.actualizarEmail(email);
    result.current.actualizarPassword(password);
  });
}

describe("useComandoLogin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mocks.iniciarSesion.mockReset();
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each([
    ["  Colegio-Uno  ", "colegio-uno"],
    ["demo", ""],
  ])("inicializa el codigo recordado conservando el contrato %s", (guardado, esperado) => {
    localStorage.setItem("ultimo_codigo_colegio", guardado);

    const { result } = renderHook(() => useComandoLogin());

    expect(result.current.codigoColegio).toBe(esperado);
  });

  it("valida antes de crear el timer y limpia el error al editar", async () => {
    const { result } = renderHook(() => useComandoLogin());
    const timeoutSpy = vi.spyOn(window, "setTimeout");

    await act(async () => {
      await result.current.iniciarSesion();
    });

    expect(result.current.formError).toBe(
      "Completa el código del colegio, el correo y la contraseña.",
    );
    expect(mocks.iniciarSesion).not.toHaveBeenCalled();
    expect(
      timeoutSpy.mock.calls.some(([, delay]) => delay === 3000),
    ).toBe(false);

    act(() => {
      result.current.actualizarCodigoColegio("COLEGIO-DOS");
      result.current.actualizarEmail(" Persona@Auligo.test ");
      result.current.actualizarPassword(" Clave Sin Recortar ");
    });

    expect(result.current.codigoColegio).toBe("colegio-dos");
    expect(result.current.email).toBe(" Persona@Auligo.test ");
    expect(result.current.password).toBe(" Clave Sin Recortar ");
    expect(result.current.formError).toBe("");
  });

  it("bloquea otro envio tras renderizar y activa el aviso exactamente a los 3 segundos", async () => {
    let rechazar;
    const consulta = new Promise((_resolve, reject) => {
      rechazar = reject;
    });
    mocks.iniciarSesion.mockReturnValue(consulta);
    const { result } = renderHook(() => useComandoLogin());
    completarFormulario(result);

    let comando;
    act(() => {
      comando = result.current.iniciarSesion();
    });

    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.isTakingLong).toBe(false);
    expect(mocks.iniciarSesion).toHaveBeenCalledWith({
      email: "persona@auligo.test",
      password: "Password123",
      codigo_colegio: "colegio-norte",
    });

    await act(async () => {
      await result.current.iniciarSesion();
    });
    expect(mocks.iniciarSesion).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.isTakingLong).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.isTakingLong).toBe(true);

    await act(async () => {
      rechazar(new Error("sin red"));
      await comando;
    });

    expect(mocks.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "No pudimos conectar",
      text: "Comprueba tu conexión e intenta nuevamente.",
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isTakingLong).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    {
      caso: "super admin",
      data: { id: 1, nombre: "soporte auligo", rol: "super_admin", tenant: null },
      clave: "super_admin",
      alternas: ["usuario", "profesor"],
      bienvenida: "Soporte Auligo",
    },
    {
      caso: "admin",
      data: {
        id: 2,
        nombre: "ana admin",
        rol: "admin",
        tenant: { id: 10 },
        debe_cambiar_password: true,
      },
      clave: "usuario",
      alternas: ["super_admin", "profesor"],
      bienvenida: "Ana Admin",
    },
    {
      caso: "profesor",
      data: { id: 3, nombre: "pedro profesor", rol: "profesor", tenant: { id: 10 } },
      clave: "profesor",
      alternas: ["super_admin", "usuario"],
      bienvenida: "Pedro Profesor",
    },
  ])("persiste una sola identidad y espera el aviso para $caso", async ({
    data,
    clave,
    alternas,
    bienvenida,
  }) => {
    ["super_admin", "usuario", "profesor"].forEach((item) => {
      localStorage.setItem(item, JSON.stringify({ id: "anterior" }));
    });
    mocks.iniciarSesion.mockResolvedValue(data);
    mocks.fire.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useComandoLogin());
    completarFormulario(result);

    act(() => {
      result.current.iniciarSesion();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(JSON.parse(localStorage.getItem(clave))).toEqual({
      id: data.id,
      nombre: data.nombre,
      rol: data.rol,
      tenant: data.tenant,
      debe_cambiar_password: Boolean(data.debe_cambiar_password),
    });
    alternas.forEach((item) => expect(localStorage.getItem(item)).toBeNull());
    expect(localStorage.getItem("ultimo_codigo_colegio")).toBe("colegio-norte");
    // La ventana de éxito común (tarjeta blanca), que se cierra sola.
    expect(mocks.fire).toHaveBeenCalledWith(
      opcionesVentanaExito({
        title: "¡Éxito!",
        text: `Bienvenido ${bienvenida}`,
        timer: 1000,
      }),
    );
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.loginSucceeded).toBe(true);
    expect(result.current.isTakingLong).toBe(false);
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
  ])("restaura el formulario y conserva el mensaje para %s", async (_caso, error, alerta) => {
    mocks.iniciarSesion.mockRejectedValue(error);
    const { result } = renderHook(() => useComandoLogin());
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    completarFormulario(result, { codigo: "colegio-sur" });

    await act(async () => {
      await result.current.iniciarSesion();
    });

    expect(mocks.fire).toHaveBeenCalledWith(alerta);
    expect(localStorage.getItem("ultimo_codigo_colegio")).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isTakingLong).toBe(false);
    expect(result.current.loginSucceeded).toBe(false);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});
