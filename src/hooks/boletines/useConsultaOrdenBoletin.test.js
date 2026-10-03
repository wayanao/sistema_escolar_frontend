import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarCursosMock, obtenerOrdenMock } = vi.hoisted(() => ({
  listarCursosMock: vi.fn(),
  obtenerOrdenMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  listarCursosBoletines: listarCursosMock,
  obtenerOrdenBoletin: obtenerOrdenMock,
}));

import useConsultaOrdenBoletin from "./useConsultaOrdenBoletin";

beforeEach(() => {
  vi.clearAllMocks();
  listarCursosMock.mockResolvedValue([
    { id: 4, nombre: "Sexto", jornada: "Tarde" },
    { id: 5, nombre: "Séptimo", jornada: "Mañana" },
  ]);
  obtenerOrdenMock.mockResolvedValue({
    items: [
      { materia_id: 20, materia_nombre: "Matemáticas", orden_boletin: 2 },
      { materia_id: 10, materia_nombre: "Biología", orden_boletin: 1 },
    ],
  });
});

describe("useConsultaOrdenBoletin", () => {
  it("selecciona el primer curso y normaliza el orden recibido", async () => {
    const { result } = renderHook(() => useConsultaOrdenBoletin());

    await waitFor(() => expect(result.current.cargandoCursos).toBe(false));
    await waitFor(() => expect(result.current.cargandoOrden).toBe(false));
    expect(result.current.cursoId).toBe("4");
    expect(result.current.cursoSeleccionado.nombre).toBe("Sexto");
    expect(result.current.materias.map((materia) => materia.materia_id)).toEqual([
      10,
      20,
    ]);
    expect(listarCursosMock).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
    expect(obtenerOrdenMock).toHaveBeenCalledWith("4", {
      signal: expect.any(AbortSignal),
    });
  });

  it("cancela el orden anterior al cambiar de curso", async () => {
    const pendientes = [];
    obtenerOrdenMock.mockImplementation((_cursoId, { signal }) =>
      new Promise((resolve) => pendientes.push({ resolve, signal })),
    );
    const { result } = renderHook(() => useConsultaOrdenBoletin());
    await waitFor(() => expect(pendientes).toHaveLength(1));

    act(() => result.current.cambiarCurso("5"));

    await waitFor(() => expect(pendientes).toHaveLength(2));
    expect(pendientes[0].signal.aborted).toBe(true);
    expect(pendientes[1].signal.aborted).toBe(false);

    await act(async () => {
      pendientes[1].resolve({ items: [] });
    });
    await waitFor(() => expect(result.current.cargandoOrden).toBe(false));
    expect(result.current.cursoSeleccionado.nombre).toBe("Séptimo");
  });

  it("conserva el detalle del backend cuando falla el orden", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    obtenerOrdenMock.mockRejectedValue({
      response: { data: { detail: "Curso sin asignaciones" } },
    });
    const { result } = renderHook(() => useConsultaOrdenBoletin());

    await waitFor(() =>
      expect(result.current.mensaje).toBe("Curso sin asignaciones"),
    );
    expect(result.current.materias).toEqual([]);
  });
});

describe("useConsultaOrdenBoletin con un año elegido", () => {
  it("pide los cursos de ese año; el orden de cada curso parte de su id", async () => {
    const parametrosAnio = { anio_lectivo_id: 2 };
    const { result } = renderHook(() => useConsultaOrdenBoletin({ parametrosAnio }));

    await waitFor(() => expect(result.current.cargandoCursos).toBe(false));
    await waitFor(() => expect(obtenerOrdenMock).toHaveBeenCalled());
    await waitFor(() => expect(result.current.cargandoOrden).toBe(false));
    expect(listarCursosMock).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
      parametrosAnio,
    });
  });
});
