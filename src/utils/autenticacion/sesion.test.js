import { describe, expect, it } from "vitest";
import {
  CLAVES_IDENTIDAD_SESION,
  CLAVES_LIMPIEZA_401,
  CLAVES_LIMPIEZA_LOGOUT,
  CLAVES_SESION,
  construirSesionVisual,
  debeLimpiarSesionPor401,
  esSuperAdmin,
  esUsuarioAdmin,
  haySesionGeneral,
  marcarPasswordComoCambiada,
  obtenerClaveIdentidadPorRol,
  obtenerClavesIdentidadAlternas,
  obtenerRedireccionCambioPassword,
  obtenerRedireccionRutaAdmin,
  obtenerRedireccionRutaProtegida,
  obtenerRedireccionSuperAdmin,
  parsearSesionAlmacenada,
} from "./sesion";

describe("contratos puros de sesion", () => {
  it("conserva el orden y la diferencia entre limpieza por logout y por 401", () => {
    expect(CLAVES_IDENTIDAD_SESION).toEqual(["super_admin", "usuario", "profesor"]);
    expect(CLAVES_LIMPIEZA_LOGOUT).toEqual([
      "profesor",
      "usuario",
      "super_admin",
      "tenant",
      "asignacionId",
      "periodo",
    ]);
    expect(CLAVES_LIMPIEZA_401).toEqual(["super_admin", "usuario", "profesor", "tenant"]);
  });

  it("parsea el valor almacenado con el mismo contrato actual", () => {
    expect(parsearSesionAlmacenada(null)).toBeNull();
    expect(parsearSesionAlmacenada("")).toBeNull();
    expect(parsearSesionAlmacenada('{"id":7,"rol":"profesor"}')).toEqual({
      id: 7,
      rol: "profesor",
    });
    expect(() => parsearSesionAlmacenada("no-es-json")).toThrow(SyntaxError);
  });

  it("reduce la respuesta al contrato visual y normaliza solo el flag", () => {
    expect(construirSesionVisual({
      id: 3,
      nombre: "Admin",
      rol: "admin",
      tenant: { id: 9 },
      debe_cambiar_password: "false",
      token: "no-se-guarda",
    })).toEqual({
      id: 3,
      nombre: "Admin",
      rol: "admin",
      tenant: { id: 9 },
      debe_cambiar_password: true,
    });
  });

  it("marca el cambio de password sin mutar los datos visuales", () => {
    const usuario = { id: 3, rol: "admin", debe_cambiar_password: true };

    expect(marcarPasswordComoCambiada(usuario)).toEqual({
      id: 3,
      rol: "admin",
      debe_cambiar_password: false,
    });
    expect(usuario.debe_cambiar_password).toBe(true);
    expect(marcarPasswordComoCambiada(null)).toBeNull();
  });

  it.each([
    ["super_admin", CLAVES_SESION.SUPER_ADMIN, ["usuario", "profesor"]],
    ["admin", CLAVES_SESION.USUARIO, ["super_admin", "profesor"]],
    ["profesor", CLAVES_SESION.PROFESOR, ["super_admin", "usuario"]],
    ["rol_desconocido", CLAVES_SESION.PROFESOR, ["super_admin", "usuario"]],
  ])("selecciona la identidad actual para el rol %s", (rol, activa, alternas) => {
    expect(obtenerClaveIdentidadPorRol(rol)).toBe(activa);
    expect(obtenerClavesIdentidadAlternas(rol)).toEqual(alternas);
  });

  it("identifica los roles exactos sin reinterpretarlos", () => {
    expect(esUsuarioAdmin({ rol: "admin" })).toBe(true);
    expect(esUsuarioAdmin({ rol: "ADMIN" })).toBe(false);
    expect(esUsuarioAdmin(null)).toBe(false);
    expect(esSuperAdmin({ rol: "super_admin" })).toBe(true);
    expect(esSuperAdmin({ rol: "admin" })).toBe(false);
  });

  it("conserva que cualquier usuario o profesor representa una sesion general", () => {
    expect(haySesionGeneral({ rol: "auditor" }, null)).toBe(true);
    expect(haySesionGeneral(null, { rol: "profesor" })).toBe(true);
    expect(haySesionGeneral(null, null)).toBe(false);
  });
});

describe("decisiones puras de guards", () => {
  it.each([
    [{ usuario: null, profesor: null }, "/login"],
    [{ usuario: null, profesor: { rol: "profesor" } }, null],
    [{ usuario: null, profesor: { rol: "profesor", debe_cambiar_password: true } }, null],
    [{ usuario: { rol: "auditor" }, profesor: null }, null],
    [{ usuario: { rol: "auditor", debe_cambiar_password: "pendiente" }, profesor: null }, "/cambiar-password"],
    [{ usuario: { rol: "admin", debe_cambiar_password: true }, profesor: null }, "/cambiar-password"],
  ])("resuelve una ruta protegida para %#", (sesiones, esperado) => {
    expect(obtenerRedireccionRutaProtegida(sesiones)).toBe(esperado);
  });

  it.each([
    [null, "/login"],
    [{ rol: "profesor" }, "/login"],
    [{ rol: "auditor", debe_cambiar_password: true }, "/cambiar-password"],
    [{ rol: "admin", debe_cambiar_password: false }, null],
    [{ rol: "admin", debe_cambiar_password: true }, "/cambiar-password"],
  ])("resuelve una ruta admin para %#", (usuario, esperado) => {
    expect(obtenerRedireccionRutaAdmin(usuario)).toBe(esperado);
  });

  it.each([
    [null, "/login"],
    [{ rol: "profesor", debe_cambiar_password: true }, "/login"],
    [{ rol: "admin", debe_cambiar_password: false }, "/dashboard-admin"],
    [{ rol: "admin", debe_cambiar_password: true }, null],
  ])("resuelve la ruta de cambio de password para %#", (usuario, esperado) => {
    expect(obtenerRedireccionCambioPassword(usuario)).toBe(esperado);
  });

  it("exige la clave visual con rol super_admin", () => {
    expect(obtenerRedireccionSuperAdmin({ rol: "super_admin" })).toBeNull();
    expect(obtenerRedireccionSuperAdmin({ rol: "admin" })).toBe("/login");
    expect(obtenerRedireccionSuperAdmin(null)).toBe("/login");
  });

  it.each([
    [401, "/dashboard-admin", true],
    [401, "/login", false],
    [401, "/login/", true],
    [500, "/dashboard-admin", false],
    ["401", "/dashboard-admin", false],
  ])("decide la limpieza global para status %s en %s", (status, pathname, esperado) => {
    expect(debeLimpiarSesionPor401(status, pathname)).toBe(esperado);
  });
});
