import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listarClasesMock } = vi.hoisted(() => ({
  listarClasesMock: vi.fn(),
}));

vi.mock("../../services/planeacionesApi", () => ({
  listarClasesProfesor: listarClasesMock,
}));

import useClasesPlaneacionProfesor from "./useClasesPlaneacionProfesor";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useClasesPlaneacionProfesor", () => {
  it("conserva la asignación solicitada y elimina duplicados visuales", async () => {
    listarClasesMock.mockResolvedValue([
      { id: 1, materia: "Matemáticas", curso: "5A" },
      { id: 2, materia: "Matemáticas", curso: "5A" },
      { id: 3, materia: "Ciencias", curso: "6B" },
    ]);

    const { result } = renderHook(() =>
      useClasesPlaneacionProfesor({
        profesorId: 7,
        asignacionInicial: "2",
      }),
    );

    await waitFor(() => expect(result.current.cargandoClases).toBe(false));

    expect(listarClasesMock).toHaveBeenCalledWith(7);
    expect(result.current.asignacionId).toBe("2");
    expect(result.current.claseSeleccionada.id).toBe(2);
    expect(result.current.clasesUnicas.map((clase) => clase.id)).toEqual([
      2, 3,
    ]);
    expect(localStorage.getItem("asignacionId")).toBe("2");
  });

  it("selecciona la primera clase cuando la recordada ya no existe", async () => {
    listarClasesMock.mockResolvedValue([
      { id: 44, materia: "Lenguaje", curso: "4A" },
    ]);

    const { result } = renderHook(() =>
      useClasesPlaneacionProfesor({
        profesorId: 7,
        asignacionInicial: "99",
      }),
    );

    await waitFor(() => expect(result.current.cargandoClases).toBe(false));

    expect(result.current.asignacionId).toBe("44");
    expect(localStorage.getItem("asignacionId")).toBe("44");

    act(() => result.current.setAsignacionId("45"));
    expect(localStorage.getItem("asignacionId")).toBe("45");
  });

  it("comunica el error sin dejar el selector cargando", async () => {
    const onError = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    listarClasesMock.mockRejectedValue(new Error("sin conexión"));

    const { result } = renderHook(() =>
      useClasesPlaneacionProfesor({
        profesorId: 7,
        onError,
      }),
    );

    await waitFor(() => expect(result.current.cargandoClases).toBe(false));

    expect(onError).toHaveBeenCalledWith(
      "No se pudieron cargar tus clases asignadas.",
    );
    expect(result.current.clasesUnicas).toEqual([]);
    expect(result.current.claseSeleccionada).toBeUndefined();
  });
});
