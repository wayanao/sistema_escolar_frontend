import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  copiarConfiguracionAnio,
  crearAnioLectivo,
  listarAniosLectivos,
} from "./aniosLectivosApi";

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

  it("crea el siguiente año sin enviar cuerpo", async () => {
    const creado = { id: 3, anio: 2027, estado: "preparacion" };
    apiMock.post.mockResolvedValue({ data: creado });

    await expect(crearAnioLectivo()).resolves.toBe(creado);

    expect(apiMock.post).toHaveBeenCalledWith("/anios-lectivos");
  });

  it("copia la configuración con las opciones elegidas", async () => {
    const opciones = {
      copiar_precios: true,
      copiar_carga_academica: false,
      copiar_directores: true,
    };
    const respuesta = { anio_destino_id: 3, copiados: { cursos: 12 } };
    apiMock.post.mockResolvedValue({ data: respuesta });

    await expect(copiarConfiguracionAnio(3, opciones)).resolves.toBe(respuesta);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/anios-lectivos/3/copiar-configuracion",
      opciones,
    );
  });
});
