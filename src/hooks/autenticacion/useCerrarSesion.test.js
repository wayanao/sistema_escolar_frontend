import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCerrarSesion } from "./useCerrarSesion";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  cerrarSesion: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../../services/autenticacionApi", () => ({
  cerrarSesion: mocks.cerrarSesion,
}));

const clavesEliminadas = [
  "profesor",
  "usuario",
  "super_admin",
  "tenant",
  "asignacionId",
  "periodo",
];

const preservadas = {
  fechaAsistencia: "2026-08-08",
  planillaTipoEvaluacion: "desarrollo",
  periodo_profesor_77: "3",
  ultimo_codigo_colegio: "colegio-uno",
};

function prepararAlmacenamiento() {
  clavesEliminadas.forEach((clave) => localStorage.setItem(clave, `valor-${clave}`));
  Object.entries(preservadas).forEach(([clave, valor]) => localStorage.setItem(clave, valor));
  document.cookie = "token=visible; path=/";
}

function esperarLimpieza() {
  clavesEliminadas.forEach((clave) => expect(localStorage.getItem(clave)).toBeNull());
  Object.entries(preservadas).forEach(([clave, valor]) => {
    expect(localStorage.getItem(clave)).toBe(valor);
  });
  expect(document.cookie).not.toContain("token=");
  expect(mocks.navigate).toHaveBeenCalledWith("/login");
}

describe("useCerrarSesion", () => {
  let consoleError;

  beforeEach(() => {
    localStorage.clear();
    mocks.navigate.mockReset();
    mocks.cerrarSesion.mockReset();
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("limpia la sesion y preserva preferencias despues de un logout exitoso", async () => {
    prepararAlmacenamiento();
    mocks.cerrarSesion.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useCerrarSesion());

    await act(async () => {
      await result.current();
    });

    expect(mocks.cerrarSesion).toHaveBeenCalledWith();
    esperarLimpieza();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("registra el error y realiza la misma limpieza cuando falla el logout", async () => {
    const error = new Error("sin conexion");
    prepararAlmacenamiento();
    mocks.cerrarSesion.mockRejectedValue(error);
    const { result } = renderHook(() => useCerrarSesion());

    await act(async () => {
      await result.current();
    });

    expect(consoleError).toHaveBeenCalledWith("Error cerrando sesión", error);
    esperarLimpieza();
  });

  it("espera a que termine el request antes de limpiar y navegar", async () => {
    let resolver;
    const consulta = new Promise((resolve) => {
      resolver = resolve;
    });
    prepararAlmacenamiento();
    mocks.cerrarSesion.mockReturnValue(consulta);
    const { result } = renderHook(() => useCerrarSesion());

    let comando;
    act(() => {
      comando = result.current();
    });

    clavesEliminadas.forEach((clave) => {
      expect(localStorage.getItem(clave)).toBe(`valor-${clave}`);
    });
    expect(document.cookie).toContain("token=visible");
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => {
      resolver({ ok: true });
      await comando;
    });

    esperarLimpieza();
  });

  it("borra los borradores de texto, de todos los profesores, y nada más", async () => {
    prepararAlmacenamiento();
    localStorage.setItem("borrador_boletin:tenant_2005:7:55:1", "{}");
    localStorage.setItem("borrador_boletin:tenant_2005:8:60:2", "{}");
    mocks.cerrarSesion.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useCerrarSesion());

    await act(async () => {
      await result.current();
    });

    expect(localStorage.getItem("borrador_boletin:tenant_2005:7:55:1")).toBeNull();
    expect(localStorage.getItem("borrador_boletin:tenant_2005:8:60:2")).toBeNull();
    esperarLimpieza();
  });
});
