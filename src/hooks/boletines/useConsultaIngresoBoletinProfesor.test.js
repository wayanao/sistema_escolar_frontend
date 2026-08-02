import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listarClasesMock, obtenerReferenciaMock } = vi.hoisted(() => ({
  listarClasesMock: vi.fn(),
  obtenerReferenciaMock: vi.fn(),
}));

vi.mock("../../services/boletinesApi", () => ({
  listarClasesProfesorBoletines: listarClasesMock,
  obtenerReferenciaBoletin: obtenerReferenciaMock,
}));

import useConsultaIngresoBoletinProfesor from "./useConsultaIngresoBoletinProfesor";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("profesor", JSON.stringify({ id: 7 }));
  localStorage.setItem("asignacionId", "55");
  localStorage.setItem("periodo_profesor_7", "1");
  listarClasesMock.mockResolvedValue([
    { id: 55, curso: "Quinto", materia: "Lenguaje" },
  ]);
  obtenerReferenciaMock.mockResolvedValue([
    {
      estudiante_id: 101,
      nombre: "Ana",
      notas: [
        {
          tipo_nota: "actividad_uno",
          tipo_evaluacion: "numerica",
          valor: 4,
          observacion_guardada: "Bien",
        },
        { tipo_nota: "mas_alto", valor: 5 },
      ],
    },
  ]);
});

describe("useConsultaIngresoBoletinProfesor", () => {
  it("carga clases y referencia, normaliza formularios y sincroniza el periodo", async () => {
    const { result } = renderHook(() => useConsultaIngresoBoletinProfesor());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    await waitFor(() => expect(result.current.estudiantes).toHaveLength(1));
    expect(listarClasesMock).toHaveBeenCalledWith(7, {
      signal: expect.any(AbortSignal),
    });
    expect(obtenerReferenciaMock).toHaveBeenCalledWith("55", "1", {
      signal: expect.any(AbortSignal),
    });
    expect(result.current.clasesUnicas).toHaveLength(1);
    expect(result.current.estudiantes[0].notas).toHaveLength(1);
    expect(result.current.datosIniciales[101].definitiva).toBe("4.00");
    expect(result.current.estadoGuardadoInicial[101].guardado).toBe(true);

    act(() => result.current.cambiarPeriodo("2"));

    await waitFor(() =>
      expect(obtenerReferenciaMock).toHaveBeenLastCalledWith("55", "2", {
        signal: expect.any(AbortSignal),
      }),
    );
    expect(localStorage.getItem("periodo")).toBe("2");
    expect(localStorage.getItem("periodo_profesor_7")).toBe("2");
  });

  it("cancela la referencia anterior cuando cambia la asignación", async () => {
    const pendientes = [];
    obtenerReferenciaMock.mockImplementation((_asignacionId, _periodo, { signal }) =>
      new Promise((resolve) => pendientes.push({ resolve, signal })),
    );
    const { result } = renderHook(() => useConsultaIngresoBoletinProfesor());
    await waitFor(() => expect(pendientes).toHaveLength(1));

    act(() => result.current.cambiarAsignacion("56"));

    await waitFor(() => expect(pendientes).toHaveLength(2));
    expect(pendientes[0].signal.aborted).toBe(true);
    expect(pendientes[1].signal.aborted).toBe(false);

    act(() => result.current.cambiarAsignacion(""));

    expect(pendientes[1].signal.aborted).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(localStorage.getItem("asignacionId")).toBe("56");
  });
});
