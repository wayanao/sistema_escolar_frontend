import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerObservadorMock } = vi.hoisted(() => ({
  obtenerObservadorMock: vi.fn(),
}));

vi.mock("../../services/observadorApi", () => ({
  obtenerObservador: obtenerObservadorMock,
}));

import useObservadorEstudiante, {
  ERROR_CONSULTA,
  ERROR_ESTUDIANTE_NO_EXISTE,
} from "./useObservadorEstudiante";

const BITACORA = {
  nivel: "primaria",
  anotaciones: [
    { id: 12, profesor_id: 7, profesor: "Ana Gómez", conductual: "Se para mucho." },
  ],
};

function diferido() {
  let resolver;
  const promesa = new Promise((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
}

beforeEach(() => {
  obtenerObservadorMock.mockReset();
  obtenerObservadorMock.mockResolvedValue(BITACORA);
});

describe("useObservadorEstudiante", () => {
  it("pide la bitácora una sola vez y expone nivel y anotaciones", async () => {
    const { result } = renderHook(() =>
      useObservadorEstudiante({ estudianteId: 42, periodo: "todos" }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.nivel).toBe("primaria");
    expect(result.current.anotaciones).toHaveLength(1);
    expect(result.current.error).toBeNull();
    // Es el motivo de existir de la funcionalidad: una petición pinta la
    // pantalla entera, en vez de una por alumno como la pantalla vieja.
    expect(obtenerObservadorMock).toHaveBeenCalledTimes(1);
  });

  it("con «Todos» no manda periodo, así que el servidor devuelve el año entero", async () => {
    const { result } = renderHook(() =>
      useObservadorEstudiante({ estudianteId: 42, periodo: "todos" }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(obtenerObservadorMock.mock.calls[0][1].periodo).toBeNull();
  });

  it("manda el periodo elegido y vuelve a preguntar al cambiarlo", async () => {
    const { result, rerender } = renderHook(
      ({ periodo }) => useObservadorEstudiante({ estudianteId: 42, periodo }),
      { initialProps: { periodo: "2" } },
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerObservadorMock.mock.calls[0][1].periodo).toBe(2);

    rerender({ periodo: "3" });
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));
    expect(obtenerObservadorMock.mock.calls[1][1].periodo).toBe(3);
  });

  it("no consulta nada mientras no haya un estudiante abierto", async () => {
    const { result } = renderHook(() =>
      useObservadorEstudiante({ estudianteId: undefined, periodo: "todos" }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(obtenerObservadorMock).not.toHaveBeenCalled();
    expect(result.current.anotaciones).toStrictEqual([]);
  });

  it("descarta la respuesta vieja cuando el periodo cambia antes de que llegue", async () => {
    const primera = diferido();
    const segunda = diferido();
    obtenerObservadorMock
      .mockReturnValueOnce(primera.promesa)
      .mockReturnValueOnce(segunda.promesa);

    const { result, rerender } = renderHook(
      ({ periodo }) => useObservadorEstudiante({ estudianteId: 42, periodo }),
      { initialProps: { periodo: "1" } },
    );

    rerender({ periodo: "2" });
    await waitFor(() => expect(obtenerObservadorMock).toHaveBeenCalledTimes(2));

    segunda.resolver({ nivel: "preescolar", anotaciones: [] });
    await waitFor(() => expect(result.current.nivel).toBe("preescolar"));

    // La respuesta de la consulta anterior llega tarde y no debe pisar nada.
    primera.resolver(BITACORA);
    await waitFor(() => expect(result.current.nivel).toBe("preescolar"));
    expect(result.current.anotaciones).toStrictEqual([]);
  });

  it("al abrir otro alumno no enseña el nivel del anterior mientras carga", async () => {
    const segunda = diferido();
    obtenerObservadorMock
      .mockResolvedValueOnce({ nivel: "primaria", anotaciones: [] })
      .mockReturnValueOnce(segunda.promesa);

    const { result, rerender } = renderHook(
      ({ estudianteId }) => useObservadorEstudiante({ estudianteId, periodo: "todos" }),
      { initialProps: { estudianteId: 42 } },
    );

    await waitFor(() => expect(result.current.nivel).toBe("primaria"));

    rerender({ estudianteId: 43 });

    // El título diría "Luis · Primaria" cuando Luis es de preescolar.
    expect(result.current.nivel).toBeNull();
    expect(result.current.anotaciones).toStrictEqual([]);

    segunda.resolver({ nivel: "preescolar", anotaciones: [] });
    await waitFor(() => expect(result.current.nivel).toBe("preescolar"));
  });

  it("distingue «el estudiante no existe» de cualquier otro fallo", async () => {
    obtenerObservadorMock.mockRejectedValueOnce({ response: { status: 404 } });

    const { result, rerender } = renderHook(
      ({ estudianteId }) => useObservadorEstudiante({ estudianteId, periodo: "todos" }),
      { initialProps: { estudianteId: 42 } },
    );

    await waitFor(() => expect(result.current.error).toBe(ERROR_ESTUDIANTE_NO_EXISTE));

    obtenerObservadorMock.mockRejectedValueOnce({ response: { status: 500 } });
    rerender({ estudianteId: 43 });

    await waitFor(() => expect(result.current.error).toBe(ERROR_CONSULTA));
  });

  it("una lista vacía no es un error: es que todavía nadie le escribió nada", async () => {
    obtenerObservadorMock.mockResolvedValue({ nivel: "preescolar", anotaciones: [] });

    const { result } = renderHook(() =>
      useObservadorEstudiante({ estudianteId: 42, periodo: "todos" }),
    );

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.nivel).toBe("preescolar");
    expect(result.current.anotaciones).toStrictEqual([]);
  });

  it("recargar vuelve a preguntar y limpia el error anterior", async () => {
    obtenerObservadorMock.mockRejectedValueOnce({ response: { status: 500 } });

    const { result } = renderHook(() =>
      useObservadorEstudiante({ estudianteId: 42, periodo: "todos" }),
    );

    await waitFor(() => expect(result.current.error).toBe(ERROR_CONSULTA));

    act(() => result.current.recargar());

    // Se espera a la bitácora y no al error: el error se limpia al arrancar la
    // consulta, así que esperarlo a él daría por buena una respuesta que
    // todavía no ha llegado.
    await waitFor(() => expect(result.current.anotaciones).toHaveLength(1));
    expect(obtenerObservadorMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });
});
