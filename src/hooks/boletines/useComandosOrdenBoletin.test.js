import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { guardarOrdenMock } = vi.hoisted(() => ({
  guardarOrdenMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  guardarOrdenBoletin: guardarOrdenMock,
}));

import useComandosOrdenBoletin from "./useComandosOrdenBoletin";

const materiasIniciales = [
  { materia_id: 10, materia_nombre: "Biología", orden_boletin: 1 },
  { materia_id: 20, materia_nombre: "Matemáticas", orden_boletin: 2 },
  { materia_id: 30, materia_nombre: "Arte", orden_boletin: 3 },
];

beforeEach(() => {
  vi.clearAllMocks();
  guardarOrdenMock.mockImplementation((_cursoId, payload) =>
    Promise.resolve({
      items: payload.materias.map(({ materia_id }, index) => ({
        ...materiasIniciales.find((materia) => materia.materia_id === materia_id),
        orden_boletin: index + 1,
      })),
    }),
  );
});

describe("useComandosOrdenBoletin", () => {
  it("mueve por botones, posición y orden alfabético sin mutar la consulta", () => {
    const { result } = renderHook(() =>
      useComandosOrdenBoletin({
        cursoId: "4",
        materiasIniciales,
        mensajeConsulta: "",
      }),
    );

    act(() => result.current.moverMateria(0, 1));
    expect(result.current.materias.map((materia) => materia.materia_id)).toEqual([
      20,
      10,
      30,
    ]);

    act(() => result.current.moverAPosicion(2, "1"));
    expect(result.current.materias.map((materia) => materia.materia_id)).toEqual([
      30,
      20,
      10,
    ]);

    act(() => result.current.ordenarAlfabetico());
    expect(result.current.materias.map((materia) => materia.materia_nombre)).toEqual([
      "Arte",
      "Biología",
      "Matemáticas",
    ]);
    expect(materiasIniciales[0].materia_id).toBe(10);
  });

  it("persiste el orden visible y actualiza mensaje y estado", async () => {
    const { result } = renderHook(() =>
      useComandosOrdenBoletin({
        cursoId: "4",
        materiasIniciales,
        mensajeConsulta: "",
      }),
    );
    act(() => result.current.moverMateria(0, 1));

    await act(async () => {
      await result.current.guardarOrden();
    });

    expect(guardarOrdenMock).toHaveBeenCalledWith("4", {
      materias: [{ materia_id: 20 }, { materia_id: 10 }, { materia_id: 30 }],
    });
    expect(result.current.mensaje).toBe("Orden guardado correctamente.");
    expect(result.current.guardando).toBe(false);
  });

  it("conserva el detalle del backend cuando falla el guardado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    guardarOrdenMock.mockRejectedValue({
      response: { data: { detail: "No se pudo actualizar" } },
    });
    const { result } = renderHook(() =>
      useComandosOrdenBoletin({
        cursoId: "4",
        materiasIniciales,
        mensajeConsulta: "",
      }),
    );

    await act(async () => {
      await result.current.guardarOrden();
    });

    await waitFor(() => expect(result.current.guardando).toBe(false));
    expect(result.current.mensaje).toBe("No se pudo actualizar");
  });
});
