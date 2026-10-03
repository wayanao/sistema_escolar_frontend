import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import { listarAniosLectivos } from "./aniosLectivosApi";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contrato HTTP de años lectivos", () => {
  it("lista los años por la ruta del backend, sin parámetros, y devuelve los datos tal cual", async () => {
    const anios = [
      { id: 2, anio: 2027, estado: "preparacion" },
      { id: 1, anio: 2026, estado: "activo" },
    ];
    apiMock.get.mockResolvedValue({ data: anios });

    await expect(listarAniosLectivos()).resolves.toBe(anios);

    expect(apiMock.get).toHaveBeenCalledWith("/anios-lectivos");
  });

  it("acepta una señal opcional sin alterar la ruta", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: [] });

    await listarAniosLectivos({ signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/anios-lectivos", {
      signal: controller.signal,
    });
  });

  it("propaga el error original sin reinterpretarlo", async () => {
    const error = { response: { status: 500, data: { detail: "Error interno" } } };
    apiMock.get.mockRejectedValue(error);

    await expect(listarAniosLectivos()).rejects.toBe(error);
  });
});
