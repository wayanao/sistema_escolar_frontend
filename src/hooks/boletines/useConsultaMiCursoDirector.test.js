import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarCursosMock, obtenerMiCursoMock } = vi.hoisted(() => ({
  listarCursosMock: vi.fn(),
  obtenerMiCursoMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  listarCursosDirigidos: listarCursosMock,
  obtenerMiCursoDirector: obtenerMiCursoMock,
}));

import useConsultaMiCursoDirector from "./useConsultaMiCursoDirector";

const RANKING = {
  curso: { id: 5, nombre: "QUINTO A" },
  periodo: 1,
  total_rankeados: 1,
  materias: [],
  estudiantes: [{ estudiante_id: 101, nombre: "Ana", apellido: "Pérez", puesto: 1, promedio: 4.5, notas: {}, inasistencias: {} }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  listarCursosMock.mockResolvedValue([{ id: 5, nombre: "QUINTO A" }, { id: 8, nombre: "SEXTO B" }]);
  obtenerMiCursoMock.mockResolvedValue(RANKING);
});

describe("useConsultaMiCursoDirector", () => {
  it("sabe si el profesor dirige algún curso y elige el primero, sin pedir el ranking todavía", async () => {
    const { result } = renderHook(() => useConsultaMiCursoDirector({ periodo: "1" }));

    await waitFor(() => expect(result.current.disponible).toBe(true));
    expect(result.current.cursos.map((c) => c.id)).toEqual([5, 8]);
    expect(result.current.cursoId).toBe(5);
    expect(result.current.vistaMiCurso).toBe(false);
    expect(obtenerMiCursoMock).not.toHaveBeenCalled();
  });

  it("si no dirige ninguno, o si la consulta falla, no hay pestaña", async () => {
    listarCursosMock.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useConsultaMiCursoDirector({ periodo: "1" }));
    await waitFor(() => expect(listarCursosMock).toHaveBeenCalledTimes(1));
    act(() => result.current.mostrarMiCurso());
    expect(result.current.disponible).toBe(false);
    expect(result.current.vistaMiCurso).toBe(false);

    listarCursosMock.mockRejectedValueOnce(new Error("sin red"));
    const otro = renderHook(() => useConsultaMiCursoDirector({ periodo: "1" }));
    await waitFor(() => expect(listarCursosMock).toHaveBeenCalledTimes(2));
    expect(otro.result.current.disponible).toBe(false);
  });

  it("al abrir la pestaña pide el ranking del curso y del periodo, y lo vuelve a pedir al cambiarlos", async () => {
    const { result, rerender } = renderHook((props) => useConsultaMiCursoDirector(props), {
      initialProps: { periodo: "1" },
    });
    await waitFor(() => expect(result.current.disponible).toBe(true));

    act(() => result.current.mostrarMiCurso());
    await waitFor(() => expect(result.current.datos).not.toBeNull());
    expect(obtenerMiCursoMock).toHaveBeenLastCalledWith(5, "1", { signal: expect.any(AbortSignal) });
    expect(result.current.datos.estudiantes[0].nombre).toBe("Pérez Ana");
    expect(result.current.cargando).toBe(false);

    rerender({ periodo: "2" });
    await waitFor(() => expect(obtenerMiCursoMock).toHaveBeenLastCalledWith(5, "2", expect.anything()));

    act(() => result.current.cambiarCurso("8"));
    await waitFor(() => expect(obtenerMiCursoMock).toHaveBeenLastCalledWith("8", "2", expect.anything()));
  });

  it("descarta la respuesta de un periodo anterior", async () => {
    const pendientes = [];
    obtenerMiCursoMock.mockImplementation((_curso, periodo, { signal }) =>
      new Promise((resolve) => pendientes.push({ periodo, resolve, signal })),
    );
    const { result, rerender } = renderHook((props) => useConsultaMiCursoDirector(props), {
      initialProps: { periodo: "1" },
    });
    await waitFor(() => expect(result.current.disponible).toBe(true));
    act(() => result.current.mostrarMiCurso());
    await waitFor(() => expect(pendientes).toHaveLength(1));

    rerender({ periodo: "2" });
    await waitFor(() => expect(pendientes).toHaveLength(2));
    expect(pendientes[0].signal.aborted).toBe(true);

    await act(async () => {
      pendientes[0].resolve({ ...RANKING, periodo: 1 });
      pendientes[1].resolve({ ...RANKING, periodo: 2 });
    });
    await waitFor(() => expect(result.current.datos?.periodo).toBe(2));
  });

  it("si falla el ranking lo dice, y Reintentar lo vuelve a pedir", async () => {
    obtenerMiCursoMock.mockRejectedValueOnce(new Error("sin red"));
    const { result } = renderHook(() => useConsultaMiCursoDirector({ periodo: "1" }));
    await waitFor(() => expect(result.current.disponible).toBe(true));

    act(() => result.current.mostrarMiCurso());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.datos).toBeNull();

    act(() => result.current.reintentar());
    await waitFor(() => expect(result.current.datos).not.toBeNull());
    expect(result.current.error).toBeNull();
  });

  it("al volver a Mis materias no pide nada más", async () => {
    const { result } = renderHook(() => useConsultaMiCursoDirector({ periodo: "1" }));
    await waitFor(() => expect(result.current.disponible).toBe(true));
    act(() => result.current.mostrarMiCurso());
    await waitFor(() => expect(obtenerMiCursoMock).toHaveBeenCalledTimes(1));

    act(() => result.current.mostrarMisMaterias());
    expect(result.current.vistaMiCurso).toBe(false);
    expect(obtenerMiCursoMock).toHaveBeenCalledTimes(1);
  });
});
