import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../utils/api";
import {
  guardarPlaneadoresAnuales,
  obtenerAsignacionesProfesor,
  obtenerPlaneadoresAnuales,
} from "./mallaCurricularApi";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("mallaCurricularApi", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.put.mockReset();
  });

  it("consulta y devuelve las asignaciones del profesor", async () => {
    const asignaciones = [{ id: 42, curso: "6A", materia: "Ciencias" }];
    api.get.mockResolvedValue({ data: asignaciones });

    await expect(obtenerAsignacionesProfesor(7)).resolves.toBe(asignaciones);
    expect(api.get).toHaveBeenCalledWith("/mis-clases/7");
  });

  it("consulta y devuelve la malla de una asignación y periodo", async () => {
    const respuesta = { planeadores: [{ slot: 3, contenido: "Ecosistemas" }] };
    api.get.mockResolvedValue({ data: respuesta });

    await expect(obtenerPlaneadoresAnuales("42", "2")).resolves.toBe(respuesta);
    expect(api.get).toHaveBeenCalledWith("/planeador-anual/42/2");
  });

  it("envía sin alterar el arreglo posicional de ocho filas", async () => {
    const payload = Array.from({ length: 8 }, () => ({
      unidad_tematica: "",
      estandar_competencia: "",
      contenido: "",
      actividades_recursos: "",
      fecha: null,
    }));
    const respuesta = { status: 200, data: { ok: true } };
    api.put.mockResolvedValue(respuesta);

    await expect(guardarPlaneadoresAnuales("42", "2", payload)).resolves.toBe(respuesta);
    expect(api.put).toHaveBeenCalledWith("/planeador-anual/42/2", payload);
  });

  it("propaga los errores HTTP sin decidir mensajes visuales", async () => {
    const error = new Error("sin conexión");
    api.get.mockRejectedValue(error);

    await expect(obtenerPlaneadoresAnuales("42", "2")).rejects.toBe(error);
  });
});
