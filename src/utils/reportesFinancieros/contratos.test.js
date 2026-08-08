import { describe, expect, it } from "vitest";
import { normalizarLista } from "./contratos";

// normalizarLista tolera tanto la forma actual (arreglo plano, cuando el
// frontend no envía limit/offset) como la forma paginada que el backend
// devuelve si se enviaran esos parámetros (`{ total, limit, offset, items }`),
// documentada en reportes_controller.py.

describe("normalizarLista", () => {
  it("devuelve el mismo arreglo cuando la respuesta ya es un arreglo", () => {
    const respuesta = [{ id: 1 }, { id: 2 }];
    expect(normalizarLista(respuesta)).toBe(respuesta);
  });

  it("extrae items cuando la respuesta viene paginada", () => {
    const respuesta = { total: 2, limit: 10, offset: 0, items: [{ id: 1 }] };
    expect(normalizarLista(respuesta)).toEqual([{ id: 1 }]);
  });

  it("devuelve un arreglo vacío cuando la respuesta no tiene items", () => {
    expect(normalizarLista({})).toEqual([]);
  });

  it("devuelve un arreglo vacío ante null o undefined", () => {
    expect(normalizarLista(null)).toEqual([]);
    expect(normalizarLista(undefined)).toEqual([]);
  });
});
