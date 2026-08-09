import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const requestUse = vi.fn();
  const responseUse = vi.fn();
  const client = {
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
  };

  return {
    client,
    create: vi.fn(() => client),
    cookieGet: vi.fn(),
    cookieRemove: vi.fn(),
    requestUse,
    responseUse,
  };
});

vi.mock("axios", () => ({
  default: { create: mocks.create },
}));

vi.mock("js-cookie", () => ({
  default: {
    get: mocks.cookieGet,
    remove: mocks.cookieRemove,
  },
}));

vi.mock("../config/env", () => ({
  API_BASE_URL: "https://api.auligo.test",
}));

import api from "./api";

const configuracionCreacion = mocks.create.mock.calls[0][0];
const [procesarPeticion, rechazarPeticion] = mocks.requestUse.mock.calls[0];
const [procesarRespuesta, rechazarRespuesta] = mocks.responseUse.mock.calls[0];

describe("cliente HTTP compartido de sesion", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.cookieGet.mockReset();
    mocks.cookieRemove.mockReset();
    window.history.replaceState(null, "", "/");
  });

  it("configura la URL base, las credenciales y la cabecera JSON", () => {
    expect(api).toBe(mocks.client);
    expect(configuracionCreacion).toEqual({
      baseURL: "https://api.auligo.test",
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
  });

  it("agrega Authorization solo cuando la cookie token es legible", () => {
    mocks.cookieGet.mockReturnValueOnce("token-visible").mockReturnValueOnce(undefined);

    expect(procesarPeticion({ headers: {} })).toEqual({
      headers: { Authorization: "Bearer token-visible" },
    });
    expect(procesarPeticion({ headers: {} })).toEqual({ headers: {} });
    expect(mocks.cookieGet).toHaveBeenNthCalledWith(1, "token");
    expect(mocks.cookieGet).toHaveBeenNthCalledWith(2, "token");
  });

  it("propaga los errores de preparacion de la peticion", async () => {
    const error = new Error("fallo de configuracion");

    await expect(rechazarPeticion(error)).rejects.toBe(error);
  });

  it("devuelve las respuestas exitosas sin transformarlas", () => {
    const respuesta = { data: { ok: true } };

    expect(procesarRespuesta(respuesta)).toBe(respuesta);
  });

  it("ante 401 fuera de /login limpia solo identidad y tenant", async () => {
    window.history.replaceState(null, "", "/dashboard-admin");
    ["super_admin", "usuario", "profesor", "tenant"].forEach((clave) => {
      localStorage.setItem(clave, `valor-${clave}`);
    });
    localStorage.setItem("asignacionId", "44");
    localStorage.setItem("periodo", "3");
    localStorage.setItem("ultimo_codigo_colegio", "colegio-uno");
    const error = { response: { status: 401 } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(rechazarRespuesta(error)).rejects.toBe(error);

    expect(mocks.cookieRemove).toHaveBeenCalledWith("token");
    expect(localStorage.getItem("super_admin")).toBeNull();
    expect(localStorage.getItem("usuario")).toBeNull();
    expect(localStorage.getItem("profesor")).toBeNull();
    expect(localStorage.getItem("tenant")).toBeNull();
    expect(localStorage.getItem("asignacionId")).toBe("44");
    expect(localStorage.getItem("periodo")).toBe("3");
    expect(localStorage.getItem("ultimo_codigo_colegio")).toBe("colegio-uno");
    consoleError.mockRestore();
  });

  it("ante 401 en /login no limpia ni vuelve a redirigir", async () => {
    window.history.replaceState(null, "", "/login");
    localStorage.setItem("usuario", "sesion-existente");
    const error = { response: { status: 401 } };

    await expect(rechazarRespuesta(error)).rejects.toBe(error);

    expect(mocks.cookieRemove).not.toHaveBeenCalled();
    expect(localStorage.getItem("usuario")).toBe("sesion-existente");
    expect(window.location.pathname).toBe("/login");
  });

  it("propaga otros errores sin alterar la sesion", async () => {
    localStorage.setItem("usuario", "sesion-existente");
    const error = { response: { status: 500 } };

    await expect(rechazarRespuesta(error)).rejects.toBe(error);

    expect(mocks.cookieRemove).not.toHaveBeenCalled();
    expect(localStorage.getItem("usuario")).toBe("sesion-existente");
  });
});
