import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEstadoSesionGeneral,
  useRedireccionCambioPassword,
  useRedireccionRutaAdmin,
  useRedireccionRutaProtegida,
  useRedireccionSuperAdmin,
  useSesionSuperAdmin,
} from "./useSesion";

function guardarSesion(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

describe("useSesion", () => {
  let getItemSpy;

  beforeEach(() => {
    localStorage.clear();
    getItemSpy = vi.spyOn(Storage.prototype, "getItem");
  });

  afterEach(() => {
    getItemSpy.mockRestore();
  });

  it("lee la sesion general en cada render sin reaccionar por si sola", () => {
    guardarSesion("usuario", { id: 3, rol: "admin" });
    guardarSesion("profesor", { id: 7, rol: "profesor" });

    const { result, rerender } = renderHook(() => useEstadoSesionGeneral());

    expect(result.current).toEqual({ haySesion: true, esAdmin: true });
    expect(getItemSpy.mock.calls.map(([clave]) => clave)).toEqual([
      "usuario",
      "profesor",
    ]);

    guardarSesion("usuario", { id: 3, rol: "auditor" });
    expect(result.current).toEqual({ haySesion: true, esAdmin: true });

    getItemSpy.mockClear();
    rerender();

    expect(result.current).toEqual({ haySesion: true, esAdmin: false });
    expect(getItemSpy.mock.calls.map(([clave]) => clave)).toEqual([
      "usuario",
      "profesor",
    ]);
  });

  it.each([
    {
      caso: "ruta protegida",
      hook: useRedireccionRutaProtegida,
      sesiones: {
        usuario: { rol: "admin", debe_cambiar_password: true },
        profesor: { rol: "profesor" },
      },
      esperado: "/cambiar-password",
      claves: ["usuario", "profesor"],
    },
    {
      caso: "ruta admin",
      hook: useRedireccionRutaAdmin,
      sesiones: { usuario: { rol: "auditor", debe_cambiar_password: true } },
      esperado: "/cambiar-password",
      claves: ["usuario"],
    },
    {
      caso: "cambio de password",
      hook: useRedireccionCambioPassword,
      sesiones: { usuario: { rol: "admin", debe_cambiar_password: false } },
      esperado: "/dashboard-admin",
      claves: ["usuario"],
    },
    {
      caso: "guard de super admin",
      hook: useRedireccionSuperAdmin,
      sesiones: { super_admin: { rol: "super_admin" } },
      esperado: null,
      claves: ["super_admin"],
    },
    {
      caso: "identidad visual de super admin",
      hook: useSesionSuperAdmin,
      sesiones: { super_admin: { rol: "super_admin", nombre: "Soporte" } },
      esperado: { rol: "super_admin", nombre: "Soporte" },
      claves: ["super_admin"],
    },
  ])("lee solo las claves actuales para $caso", ({ hook, sesiones, esperado, claves }) => {
    Object.entries(sesiones).forEach(([clave, datos]) => guardarSesion(clave, datos));

    const { result } = renderHook(() => hook());

    expect(result.current).toEqual(esperado);
    expect(getItemSpy.mock.calls.map(([clave]) => clave)).toEqual(claves);
  });

  it("propaga el SyntaxError de una sesion corrupta", () => {
    localStorage.setItem("usuario", "no-es-json");

    expect(() => renderHook(() => useRedireccionRutaAdmin())).toThrow(SyntaxError);
  });
});
