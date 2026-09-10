import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import {
  crearAnotacion,
  editarAnotacion,
  obtenerObservador,
} from "./observadorApi";

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.put.mockReset();
});

describe("contrato HTTP del observador del estudiante", () => {
  it("pide la bitácora completa cuando no se le da periodo", async () => {
    const bitacora = { nivel: "primaria", anotaciones: [] };
    apiMock.get.mockResolvedValue({ data: bitacora });

    await expect(obtenerObservador(42)).resolves.toBe(bitacora);

    // Sin `params`: el periodo es una etiqueta opcional y sin él el servidor
    // devuelve el año entero, que es el caso por defecto.
    expect(apiMock.get).toHaveBeenCalledWith("/observador/42", {});
  });

  it("manda el periodo como parámetro de consulta cuando se le da", async () => {
    apiMock.get.mockResolvedValue({ data: { nivel: null, anotaciones: [] } });

    await obtenerObservador(42, { periodo: 3 });

    expect(apiMock.get).toHaveBeenCalledWith("/observador/42", {
      params: { periodo: 3 },
    });
  });

  it("propaga la señal de cancelación para descartar respuestas viejas", async () => {
    const controller = new AbortController();
    apiMock.get.mockResolvedValue({ data: { nivel: null, anotaciones: [] } });

    await obtenerObservador(42, { periodo: 2, signal: controller.signal });

    expect(apiMock.get).toHaveBeenCalledWith("/observador/42", {
      params: { periodo: 2 },
      signal: controller.signal,
    });
  });

  it("crea una anotación sin mandar quién la firma", async () => {
    apiMock.post.mockResolvedValue({ data: { id: 31 } });
    const payload = {
      estudiante_id: 42,
      periodo: 3,
      positiva: false,
      conductual: "Se para mucho.",
      cognitivo: "",
      lenguaje: "",
    };

    await expect(crearAnotacion(payload)).resolves.toStrictEqual({ id: 31 });

    expect(apiMock.post).toHaveBeenCalledWith("/observador", payload);
    // El autor sale del token. Si viajara desde el cliente, un profesor podría
    // firmar una anotación con el nombre de otro.
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("profesor_id");
  });

  it("edita una anotación sin tocar el estudiante ni el periodo", async () => {
    apiMock.put.mockResolvedValue({ data: { id: 31 } });
    const payload = {
      positiva: true,
      conductual: "Ya no se para.",
      cognitivo: "",
      lenguaje: "",
    };

    await expect(editarAnotacion(31, payload)).resolves.toStrictEqual({ id: 31 });

    expect(apiMock.put).toHaveBeenCalledWith("/observador/31", payload);
    expect(apiMock.put.mock.calls[0][1]).not.toHaveProperty("periodo");
    expect(apiMock.put.mock.calls[0][1]).not.toHaveProperty("estudiante_id");
  });

  it("no expone ningún contrato de borrado", async () => {
    const modulo = await import("./observadorApi");

    // Nadie borra una anotación: no hay endpoint DELETE en el servidor y no
    // debe aparecer aquí un atajo que lo sugiera.
    expect(Object.keys(modulo).sort()).toStrictEqual([
      "crearAnotacion",
      "editarAnotacion",
      "obtenerObservador",
    ]);
    expect(apiMock).not.toHaveProperty("delete");
  });
});
