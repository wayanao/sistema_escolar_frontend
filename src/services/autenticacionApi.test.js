import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cambiarPassword,
  cerrarSesion,
  iniciarSesion,
  obtenerEstadoTenant,
} from "./autenticacionApi";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../utils/api", () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
  },
}));

describe("autenticacionApi", () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
  });

  it("envia el payload de login y devuelve solo data", async () => {
    const payload = {
      email: "persona@auligo.test",
      password: "Password123",
      codigo_colegio: "colegio-norte",
    };
    const data = { id: 7, rol: "profesor" };
    mocks.post.mockResolvedValue({ data, status: 200 });

    await expect(iniciarSesion(payload)).resolves.toBe(data);

    expect(mocks.post).toHaveBeenCalledWith("/login", payload);
  });

  it("envia el payload de cambio de password y devuelve solo data", async () => {
    const payload = {
      password_actual: "Temporal123",
      password_nueva: "NuevaClave123",
    };
    const data = { ok: true };
    mocks.post.mockResolvedValue({ data, status: 200 });

    await expect(cambiarPassword(payload)).resolves.toBe(data);

    expect(mocks.post).toHaveBeenCalledWith("/auth/cambiar-password", payload);
  });

  it("solicita logout sin agregar payload y devuelve solo data", async () => {
    const data = { ok: true };
    mocks.post.mockResolvedValue({ data, status: 200 });

    await expect(cerrarSesion()).resolves.toBe(data);

    expect(mocks.post).toHaveBeenCalledWith("/logout");
  });

  it("consulta el estado del tenant y devuelve solo data", async () => {
    const data = { mostrar_aviso: true, estado: "en_mora" };
    mocks.get.mockResolvedValue({ data, status: 200 });

    await expect(obtenerEstadoTenant()).resolves.toBe(data);

    expect(mocks.get).toHaveBeenCalledWith("/tenant/status");
  });

  it.each([
    ["login", "post", () => iniciarSesion({ email: "a", password: "b", codigo_colegio: "c" })],
    ["cambio de password", "post", () => cambiarPassword({ password_actual: "a", password_nueva: "b" })],
    ["logout", "post", () => cerrarSesion()],
    ["estado del tenant", "get", () => obtenerEstadoTenant()],
  ])("propaga el mismo error de %s", async (_caso, metodo, ejecutar) => {
    const error = { response: { status: 503 } };
    mocks[metodo].mockRejectedValue(error);

    await expect(ejecutar()).rejects.toBe(error);
  });
});
