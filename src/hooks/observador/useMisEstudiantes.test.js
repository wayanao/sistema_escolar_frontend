import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarMisEstudiantesMock } = vi.hoisted(() => ({
  listarMisEstudiantesMock: vi.fn(),
}));

vi.mock("../../services/observadorApi", () => ({
  listarMisEstudiantes: listarMisEstudiantesMock,
}));

import useMisEstudiantes, {
  ERROR_CONSULTA_LISTA,
  ERROR_SIN_LISTA,
} from "./useMisEstudiantes";

const ALUMNOS = [
  { estudiante_id: 11, nombre: "Ana", apellido: "Rojas", curso: "PRIMERO-A" },
  { estudiante_id: 21, nombre: "Sofía", apellido: "Ruiz", curso: "SEGUNDO" },
];

beforeEach(() => {
  listarMisEstudiantesMock.mockReset().mockResolvedValue(ALUMNOS);
});

describe("useMisEstudiantes", () => {
  it("trae los alumnos de todos los cursos con una sola petición", async () => {
    const { result } = renderHook(() => useMisEstudiantes());

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.estudiantes).toHaveLength(2);
    expect(result.current.error).toBeNull();
    // Pedir sus clases y luego los alumnos de cada una serían siete peticiones
    // para un profesor con seis cursos.
    expect(listarMisEstudiantesMock).toHaveBeenCalledTimes(1);
  });

  it("no necesita ninguna asignación elegida", async () => {
    localStorage.removeItem("asignacionId");
    const { result } = renderHook(() => useMisEstudiantes());

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.estudiantes).toHaveLength(2);
    // El hook no recibe ni un solo argumento: no hay clase de la que depender.
    expect(listarMisEstudiantesMock.mock.calls[0][0]).toStrictEqual({
      signal: expect.any(AbortSignal),
    });
  });

  it("arranca cargando, para no enseñar «no tienes estudiantes» antes de tiempo", () => {
    const { result } = renderHook(() => useMisEstudiantes());

    expect(result.current.cargando).toBe(true);
  });

  it("distingue «esto no es para ti» de un fallo de la consulta", async () => {
    listarMisEstudiantesMock.mockRejectedValueOnce({ response: { status: 403 } });
    const { result } = renderHook(() => useMisEstudiantes());

    await waitFor(() => expect(result.current.error).toBe(ERROR_SIN_LISTA));
    expect(result.current.estudiantes).toStrictEqual([]);

    listarMisEstudiantesMock.mockRejectedValueOnce({ response: { status: 500 } });
    act(() => result.current.recargar());

    await waitFor(() => expect(result.current.error).toBe(ERROR_CONSULTA_LISTA));
  });

  it("recargar vuelve a preguntar", async () => {
    listarMisEstudiantesMock.mockRejectedValueOnce({ response: { status: 500 } });
    const { result } = renderHook(() => useMisEstudiantes());

    await waitFor(() => expect(result.current.error).toBe(ERROR_CONSULTA_LISTA));

    act(() => result.current.recargar());

    await waitFor(() => expect(result.current.estudiantes).toHaveLength(2));
    expect(listarMisEstudiantesMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it("aguanta que el servidor devuelva algo que no es una lista", async () => {
    listarMisEstudiantesMock.mockResolvedValue(null);
    const { result } = renderHook(() => useMisEstudiantes());

    await waitFor(() => expect(result.current.cargando).toBe(false));

    expect(result.current.estudiantes).toStrictEqual([]);
  });
});
