import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerCursosMock, obtenerListaMock } = vi.hoisted(() => ({
  obtenerCursosMock: vi.fn(),
  obtenerListaMock: vi.fn(),
}));

vi.mock("../../services/listasSeguimientoApi", () => ({
  obtenerCursosListasSeguimiento: obtenerCursosMock,
  obtenerListaSeguimiento: obtenerListaMock,
}));

import useConsultasListasSeguimiento from "./useConsultasListasSeguimiento";

const CURSOS = [
  { id: 12, nombre: "1A" },
  { id: 13, nombre: "2B" },
];

const respuesta = (cursoId) => ({
  curso_id: cursoId,
  columnas: [{ id: 5, nombre: "Asistió a la cumbre" }],
  estudiantes: [
    {
      estudiante_id: 101,
      nombre: "Juan",
      apellido: "Pérez",
      marcas: { 5: { marcado: true, nota: "Llegó tarde" } },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  obtenerCursosMock.mockResolvedValue(CURSOS);
  obtenerListaMock.mockResolvedValue(respuesta(12));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("carga inicial", () => {
  it("pide los cursos al montar y no la lista todavía", async () => {
    const { result } = renderHook(() => useConsultasListasSeguimiento());

    await waitFor(() => expect(result.current.cursos).toEqual(CURSOS));
    expect(obtenerListaMock).not.toHaveBeenCalled();
    expect(result.current.lista.estudiantes).toEqual([]);
  });

  it("al elegir curso pide su lista y la deja normalizada", async () => {
    const { result } = renderHook(() => useConsultasListasSeguimiento());
    await waitFor(() => expect(result.current.cursos).toHaveLength(2));

    act(() => result.current.seleccionarCurso(12));

    await waitFor(() => expect(result.current.lista.cursoId).toBe(12));
    expect(obtenerListaMock).toHaveBeenCalledWith(12, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
    expect(result.current.lista.estudiantes[0]).toMatchObject({
      estudianteId: 101,
      apellido: "Pérez",
    });
  });

  it("deseleccionar el curso vacía la grilla sin pedir nada más", async () => {
    const { result } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(12));
    await waitFor(() => expect(result.current.lista.cursoId).toBe(12));

    obtenerListaMock.mockClear();
    act(() => result.current.seleccionarCurso(""));

    await waitFor(() => expect(result.current.lista.estudiantes).toEqual([]));
    expect(obtenerListaMock).not.toHaveBeenCalled();
  });
});

describe("cancelación de respuestas obsoletas", () => {
  it("cambiar de curso aborta la petición anterior", async () => {
    // La primera petición se deja colgada a propósito: una que ya respondió no
    // se aborta porque no hay nada que abortar.
    const señales = [];
    obtenerListaMock
      .mockImplementationOnce((cursoId, { signal } = {}) => {
        señales.push(signal);
        return new Promise(() => {});
      })
      .mockImplementationOnce((cursoId, { signal } = {}) => {
        señales.push(signal);
        return Promise.resolve(respuesta(cursoId));
      });

    const { result } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(12));
    await waitFor(() => expect(señales).toHaveLength(1));

    act(() => result.current.seleccionarCurso(13));
    await waitFor(() => expect(señales).toHaveLength(2));

    expect(señales[0].aborted).toBe(true);
    expect(señales[1].aborted).toBe(false);
  });

  it("la respuesta de un curso que ya se dejó atrás no pinta la grilla", async () => {
    // El fallo que esto evita: elegir 1A y enseguida 2B, y terminar viendo los
    // alumnos de 1A bajo el título de 2B, sin nada en pantalla que lo delate.
    let resolverPrimera;
    obtenerListaMock
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolverPrimera = resolve; }),
      )
      .mockImplementationOnce(() => Promise.resolve(respuesta(13)));

    const { result } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(12));
    await waitFor(() => expect(obtenerListaMock).toHaveBeenCalledTimes(1));

    act(() => result.current.seleccionarCurso(13));
    await waitFor(() => expect(result.current.lista.cursoId).toBe(13));

    await act(async () => {
      resolverPrimera(respuesta(12));
    });

    expect(result.current.lista.cursoId).toBe(13);
  });

  it("al desmontar aborta lo que estuviera en curso", async () => {
    // Sin esto, salir de la pantalla mientras carga deja la petición viva y su
    // respuesta intenta escribir en un componente que ya no existe.
    const señales = [];
    obtenerListaMock.mockImplementation((cursoId, { signal } = {}) => {
      señales.push(signal);
      return new Promise(() => {});
    });

    const { result, unmount } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(12));
    await waitFor(() => expect(señales).toHaveLength(1));

    unmount();

    expect(señales[0].aborted).toBe(true);
  });
});

describe("errores", () => {
  it("un fallo deja la grilla vacía y un mensaje del backend", async () => {
    obtenerListaMock.mockRejectedValue({
      response: { status: 404, data: { detail: "Ese curso no existe." } },
    });

    const { result } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(999));

    await waitFor(() => expect(result.current.error).toBe("Ese curso no existe."));
    expect(result.current.lista.estudiantes).toEqual([]);
    expect(result.current.cargando).toBe(false);
  });

  it("sin detalle del backend da un mensaje entendible", async () => {
    obtenerListaMock.mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(12));

    await waitFor(() => expect(result.current.error).toContain("conexión"));
  });

  it("un fallo al listar cursos no rompe la pantalla", async () => {
    obtenerCursosMock.mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useConsultasListasSeguimiento());

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(result.current.cursos).toEqual([]);
  });
});

describe("recargar", () => {
  it("vuelve a pedir la lista del curso elegido", async () => {
    const { result } = renderHook(() => useConsultasListasSeguimiento());
    act(() => result.current.seleccionarCurso(12));
    await waitFor(() => expect(result.current.lista.cursoId).toBe(12));

    obtenerListaMock.mockClear();
    await act(async () => {
      await result.current.recargar();
    });

    expect(obtenerListaMock).toHaveBeenCalledWith(12, expect.anything());
  });
});

describe("los cursos y el año lectivo", () => {
  it("sin año, los cursos se piden como siempre; con año, los de ese año", async () => {
    const { result } = renderHook(() => useConsultasListasSeguimiento());
    await waitFor(() => expect(result.current.cursos).toEqual(CURSOS));
    expect(obtenerCursosMock).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });

    const parametrosAnio = { anio_lectivo_id: 2 };
    const otro = renderHook(() => useConsultasListasSeguimiento({ parametrosAnio }));
    await waitFor(() => expect(otro.result.current.cursos).toEqual(CURSOS));
    expect(obtenerCursosMock).toHaveBeenLastCalledWith({
      signal: expect.any(AbortSignal),
      parametrosAnio,
    });
  });

  it("si cambia el año, vuelve a pedir los cursos con el año nuevo", async () => {
    const { result, rerender } = renderHook(
      ({ anio }) => useConsultasListasSeguimiento({ parametrosAnio: anio }),
      { initialProps: { anio: { anio_lectivo_id: 2 } } },
    );
    await waitFor(() => expect(result.current.cursos).toEqual(CURSOS));

    rerender({ anio: { anio_lectivo_id: 3 } });

    await waitFor(() => expect(obtenerCursosMock).toHaveBeenLastCalledWith({
      signal: expect.any(AbortSignal),
      parametrosAnio: { anio_lectivo_id: 3 },
    }));
  });
});
