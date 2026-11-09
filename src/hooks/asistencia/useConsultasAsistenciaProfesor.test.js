import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  listarHistorialMock,
  obtenerPlanillaMock,
} = vi.hoisted(() => ({
  listarHistorialMock: vi.fn(),
  obtenerPlanillaMock: vi.fn(),
}));

vi.mock("../../services/asistenciaApi", () => ({
  listarHistorialAsistencia: listarHistorialMock,
  obtenerPlanillaAsistencia: obtenerPlanillaMock,
}));

import useConsultasAsistenciaProfesor from "./useConsultasAsistenciaProfesor";

const parametrosBase = {
  asignacionId: "44",
  periodo: "2",
  habilitado: true,
};

function diferido() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  obtenerPlanillaMock.mockResolvedValue({
    data: [{ estudiante_id: 101, nombre: "Ana" }],
  });
  listarHistorialMock.mockResolvedValue([{ estudiante_id: 101, historial: [] }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useConsultasAsistenciaProfesor", () => {
  it("carga planilla e historial y expone el historial listo", async () => {
    const onClaseNoDisponible = vi.fn();
    const { result } = renderHook(() => useConsultasAsistenciaProfesor({
      ...parametrosBase,
      onClaseNoDisponible,
    }));

    await waitFor(() => expect(result.current.historialListo).toBe(true));

    expect(result.current.estudiantes).toEqual([{ estudiante_id: 101, nombre: "Ana" }]);
    // La lista de clases la carga el selector de la pantalla, no este hook.
    expect(result.current).not.toHaveProperty("clases");
    expect(result.current.historial).toEqual([{ estudiante_id: 101, historial: [] }]);
    expect(result.current.cargandoHistorial).toBe(false);
    expect(result.current.errorHistorial).toBe("");
    expect(obtenerPlanillaMock).toHaveBeenCalledWith("44", "2", {
      signal: expect.any(AbortSignal),
    });
    expect(listarHistorialMock).toHaveBeenCalledWith("44", "2", {
      signal: expect.any(AbortSignal),
    });
  });

  it("reintenta una vez el historial después de un fallo temporal", async () => {
    listarHistorialMock
      .mockRejectedValueOnce(new Error("Fallo temporal"))
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() => useConsultasAsistenciaProfesor({
      ...parametrosBase,
      onClaseNoDisponible: vi.fn(),
    }));

    await waitFor(() => expect(result.current.historialListo).toBe(true), {
      timeout: 2000,
    });

    expect(listarHistorialMock).toHaveBeenCalledTimes(2);
    expect(result.current.errorHistorial).toBe("");
  });

  it("expone el error recuperable cuando fallan ambos intentos", async () => {
    listarHistorialMock.mockRejectedValue(new Error("Sin conexión"));
    const { result } = renderHook(() => useConsultasAsistenciaProfesor({
      ...parametrosBase,
      onClaseNoDisponible: vi.fn(),
    }));

    await waitFor(() => expect(result.current.errorHistorial).toBe(
      "No se pudo cargar el historial de inasistencias. Intenta recargar.",
    ), { timeout: 2000 });

    expect(listarHistorialMock).toHaveBeenCalledTimes(2);
    expect(result.current.historial).toEqual([]);
    expect(result.current.historialListo).toBe(false);
    expect(result.current.cargandoHistorial).toBe(false);
  });

  it("delega el manejo de una clase no disponible sin convertirlo en error visual", async () => {
    const onClaseNoDisponible = vi.fn();
    listarHistorialMock.mockRejectedValue({ response: { status: 403 } });
    const { result } = renderHook(() => useConsultasAsistenciaProfesor({
      ...parametrosBase,
      onClaseNoDisponible,
    }));

    await waitFor(() => expect(onClaseNoDisponible).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });

    expect(result.current.errorHistorial).toBe("");
    expect(result.current.historialListo).toBe(false);
  });

  it("cancela solicitudes anteriores y descarta sus respuestas al cambiar de clase", async () => {
    const primeraPlanilla = diferido();
    obtenerPlanillaMock
      .mockImplementationOnce(() => primeraPlanilla.promise)
      .mockResolvedValueOnce({ data: [{ estudiante_id: 202, nombre: "Luis" }] });
    const onClaseNoDisponible = vi.fn();
    const { result, rerender } = renderHook(
      ({ asignacionId }) => useConsultasAsistenciaProfesor({
        ...parametrosBase,
        asignacionId,
        onClaseNoDisponible,
      }),
      { initialProps: { asignacionId: "44" } },
    );
    const primeraSignal = obtenerPlanillaMock.mock.calls[0][2].signal;

    rerender({ asignacionId: "45" });

    await waitFor(() => expect(result.current.estudiantes).toEqual([
      { estudiante_id: 202, nombre: "Luis" },
    ]));
    expect(primeraSignal.aborted).toBe(true);

    await act(async () => {
      primeraPlanilla.resolve({ data: [{ estudiante_id: 101, nombre: "Ana" }] });
      await primeraPlanilla.promise;
    });

    expect(result.current.estudiantes).toEqual([
      { estudiante_id: 202, nombre: "Luis" },
    ]);
  });
});
