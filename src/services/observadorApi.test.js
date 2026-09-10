import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
  },
}));

vi.mock("../utils/api", () => ({
  default: apiMock,
}));

import { obtenerObservador } from "./observadorApi";

beforeEach(() => {
  apiMock.get.mockReset();
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

  it("no expone ningún contrato de borrado", async () => {
    const modulo = await import("./observadorApi");

    // Nadie borra una anotación: no hay endpoint DELETE en el servidor y no
    // debe aparecer aquí un atajo que lo sugiera.
    expect(Object.keys(modulo)).toStrictEqual(["obtenerObservador"]);
  });
});
